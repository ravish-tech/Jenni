/**
 * Jenni feedback plugin (dev only).
 *
 * REST endpoints (Vite dev middleware):
 *   GET    /__jenni/feedback       → { notes }
 *   POST   /__jenni/feedback       → create   (body: { component, section?, type, rating?, text })
 *   PATCH  /__jenni/feedback/:id   → update   (body: any of { text, type, rating, status, resolution, section })
 *   DELETE /__jenni/feedback/:id   → delete
 *
 * Storage: <repo>/feedback/notes.json (source of truth) + generated <repo>/feedback/TODO.md.
 * External edits to notes.json (e.g. by an AI agent) are picked up by a file watcher,
 * TODO.md is regenerated and the UI is notified via the HMR custom event `jenni:feedback`.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

export type NoteType = 'feel' | 'bug' | 'idea' | 'todo';
export type NoteStatus = 'open' | 'done';

export interface Note {
  id: string;
  component: string;
  section: string | null;
  type: NoteType;
  rating: number | null;
  text: string;
  status: NoteStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPES: NoteType[] = ['feel', 'bug', 'idea', 'todo'];
const STATUSES: NoteStatus[] = ['open', 'done'];

export interface FeedbackPluginOptions {
  /** Directory holding notes.json + TODO.md. */
  dir: string;
}

export function jenniFeedback(options: FeedbackPluginOptions): Plugin {
  const dir = path.resolve(options.dir);
  const notesFile = path.join(dir, 'notes.json');
  const todoFile = path.join(dir, 'TODO.md');
  let lastRaw = '';

  function writeAtomic(file: string, content: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, file);
  }

  function read(): Note[] {
    try {
      const raw = fs.readFileSync(notesFile, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data?.notes) ? (data.notes as Note[]) : [];
    } catch (err: any) {
      if (err?.code !== 'ENOENT') console.warn('[jenni-feedback] could not read notes.json:', err?.message);
      return [];
    }
  }

  function write(notes: Note[]) {
    const raw = JSON.stringify({ notes }, null, 2) + '\n';
    lastRaw = raw;
    writeAtomic(notesFile, raw);
    writeAtomic(todoFile, renderTodo(notes));
  }

  function newId() {
    return 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function clean(body: any, partial: boolean): Partial<Note> | string {
    const out: Partial<Note> = {};
    if (!partial || 'component' in body) {
      if (typeof body.component !== 'string' || !body.component.trim()) return 'component is required';
      out.component = body.component.trim();
    }
    if (!partial || 'text' in body) {
      if (typeof body.text !== 'string' || !body.text.trim()) return 'text is required';
      out.text = body.text.trim();
    }
    if (!partial || 'type' in body) {
      const t = body.type ?? 'todo';
      if (!TYPES.includes(t)) return `type must be one of ${TYPES.join(', ')}`;
      out.type = t;
    }
    if ('section' in body || !partial) {
      out.section = typeof body.section === 'string' && body.section.trim() ? body.section.trim() : null;
    }
    if ('rating' in body || !partial) {
      const r = body.rating;
      if (r === null || r === undefined || r === '') out.rating = null;
      else if (Number.isInteger(Number(r)) && Number(r) >= 1 && Number(r) <= 5) out.rating = Number(r);
      else return 'rating must be 1–5 or null';
    }
    if ('status' in body) {
      if (!STATUSES.includes(body.status)) return 'status must be open or done';
      out.status = body.status;
    }
    if ('resolution' in body) {
      out.resolution = typeof body.resolution === 'string' && body.resolution.trim() ? body.resolution.trim() : null;
    }
    return out;
  }

  function send(res: ServerResponse, code: number, data: unknown) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(data));
  }

  function body(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        if (!data) return resolve({});
        try { resolve(JSON.parse(data)); } catch { reject(new Error('invalid JSON')); }
      });
      req.on('error', reject);
    });
  }

  return {
    name: 'jenni-feedback',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // Make sure files exist and TODO.md is in sync on startup.
      const initial = read();
      if (!fs.existsSync(notesFile)) write(initial);
      else {
        lastRaw = fs.readFileSync(notesFile, 'utf8');
        writeAtomic(todoFile, renderTodo(initial));
      }

      const broadcast = () => server.ws.send({ type: 'custom', event: 'jenni:feedback', data: { notes: read() } });

      // Watch for external edits (agents editing notes.json by hand).
      const onChange = () => {
        let raw = '';
        try { raw = fs.readFileSync(notesFile, 'utf8'); } catch { return; }
        if (raw === lastRaw) return;
        lastRaw = raw;
        try { JSON.parse(raw); } catch { return; } // mid-edit / invalid — wait for next change
        writeAtomic(todoFile, renderTodo(read()));
        broadcast();
      };
      fs.watchFile(notesFile, { interval: 800 }, onChange);
      // Remove only OUR listener (on config restart a new server registers its own first).
      server.httpServer?.once('close', () => fs.unwatchFile(notesFile, onChange));

      server.middlewares.use('/__jenni/feedback', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://x');
          const id = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, ''));
          const method = req.method ?? 'GET';
          const notes = read();

          if (method === 'GET' && !id) return send(res, 200, { notes });

          if (method === 'POST' && !id) {
            const fields = clean(await body(req), false);
            if (typeof fields === 'string') return send(res, 400, { error: fields });
            const now = new Date().toISOString();
            const note: Note = {
              id: newId(),
              component: fields.component!,
              section: fields.section ?? null,
              type: fields.type!,
              rating: fields.rating ?? null,
              text: fields.text!,
              status: 'open',
              resolution: null,
              createdAt: now,
              updatedAt: now,
            };
            notes.push(note);
            write(notes);
            broadcast();
            return send(res, 201, note);
          }

          if (id && (method === 'PATCH' || method === 'DELETE')) {
            const idx = notes.findIndex((n) => n.id === id);
            if (idx === -1) return send(res, 404, { error: `note ${id} not found` });
            if (method === 'DELETE') {
              const [removed] = notes.splice(idx, 1);
              write(notes);
              broadcast();
              return send(res, 200, removed);
            }
            const fields = clean(await body(req), true);
            if (typeof fields === 'string') return send(res, 400, { error: fields });
            // Re-opening clears the resolution unless a new one is given.
            if (fields.status === 'open' && !('resolution' in fields)) fields.resolution = null;
            notes[idx] = { ...notes[idx], ...fields, updatedAt: new Date().toISOString() };
            write(notes);
            broadcast();
            return send(res, 200, notes[idx]);
          }

          send(res, 405, { error: `${method} not allowed` });
        } catch (err: any) {
          send(res, 500, { error: err?.message ?? String(err) });
        }
      });
    },
  };
}

/** Human + agent readable mirror of notes.json. */
export function renderTodo(notes: Note[]): string {
  const open = notes.filter((n) => n.status === 'open');
  const done = notes.filter((n) => n.status === 'done');
  const lines: string[] = [
    '# Jenni — Feedback TODO',
    '',
    '<!-- GENERATED from feedback/notes.json by the playground. Do not edit by hand. -->',
    '<!-- To resolve an item: set status "done" + a short "resolution" in notes.json. See feedback/README.md. -->',
    '',
    `**${open.length} open** · ${done.length} done · updated ${new Date().toISOString()}`,
    '',
  ];
  if (!notes.length) {
    lines.push('_No feedback yet. Add notes in the playground (`npm run dev`)._', '');
    return lines.join('\n');
  }

  const byComponent = new Map<string, Note[]>();
  for (const n of notes) {
    if (!byComponent.has(n.component)) byComponent.set(n.component, []);
    byComponent.get(n.component)!.push(n);
  }
  // Components with open items first, then alphabetical.
  const components = [...byComponent.keys()].sort((a, b) => {
    const oa = byComponent.get(a)!.some((n) => n.status === 'open') ? 0 : 1;
    const ob = byComponent.get(b)!.some((n) => n.status === 'open') ? 0 : 1;
    return oa - ob || a.localeCompare(b);
  });

  const fmt = (n: Note) => {
    const check = n.status === 'done' ? 'x' : ' ';
    const sec = n.section ? ` (${n.section})` : '';
    const rating = n.rating ? ` ${'★'.repeat(n.rating)}${'☆'.repeat(5 - n.rating)}` : '';
    const text = n.text.replace(/\s*\n\s*/g, ' ⏎ ');
    let line = `- [${check}] [${n.type}]${sec}${rating} ${text} — ${n.id}`;
    if (n.status === 'done') line += `\n  - ✅ ${n.resolution ?? '_no resolution given_'}`;
    return line;
  };

  for (const c of components) {
    const items = byComponent.get(c)!;
    const o = items.filter((n) => n.status === 'open').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const d = items.filter((n) => n.status === 'done').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    lines.push(`## ${c} — ${o.length} open`, '');
    for (const n of o) lines.push(fmt(n));
    if (d.length) {
      if (o.length) lines.push('');
      lines.push('<details><summary>Done (' + d.length + ')</summary>', '');
      for (const n of d) lines.push(fmt(n));
      lines.push('', '</details>');
    }
    lines.push('');
  }
  return lines.join('\n');
}
