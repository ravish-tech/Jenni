/**
 * Benchmark Vite Plugin (Dev Middleware + Static Build Emitter)
 *
 * In `vite` dev mode:
 *   GET  /__jenni/benchmark/metrics(.json)  → returns latest 3-level static-metrics.json
 *   POST /__jenni/benchmark/analyze         → re-runs `apps/benchmark/scripts/analyze.mjs`
 *   GET  /__jenni/benchmark/sandbox.html    → isolated benchmark & parity sandbox
 *   GET  /__jenni/benchmark/sandboxes/:file → compiled isolated CSS/JS/fixture bundles
 *
 * In `vite build` (e.g. GitHub Pages):
 *   Copies `metrics.json`, `sandbox.html`, `sandboxes/*`, and `.nojekyll` into `dist/`
 *   so live iframe benchmarks work 100% statically on any static host.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import type { ServerResponse } from 'node:http';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

export interface BenchmarkPluginOptions {
  benchDir: string;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export function jenniBenchmark(options: BenchmarkPluginOptions): Plugin {
  const benchDir = path.resolve(options.benchDir);
  const publicDir = path.join(benchDir, 'public');
  const scriptPath = path.join(benchDir, 'scripts/analyze.mjs');
  const metricsPath = path.join(benchDir, 'src/generated/static-metrics.json');

  let resolvedConfig: ResolvedConfig | null = null;
  let inflightAnalyze: Promise<void> | null = null;

  function runAnalyze(): Promise<void> {
    if (inflightAnalyze) return inflightAnalyze;
    inflightAnalyze = new Promise<void>((resolve, reject) => {
      execFile(
        process.execPath,
        [scriptPath],
        { cwd: benchDir, maxBuffer: 10 * 1024 * 1024 },
        (err, _stdout, stderr) => {
          inflightAnalyze = null;
          if (err) {
            reject(new Error(stderr?.trim() || err.message));
            return;
          }
          resolve();
        },
      );
    });
    return inflightAnalyze;
  }

  function sendJson(res: ServerResponse, code: number, payload: unknown) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
  }

  return {
    name: 'jenni-benchmark',
    configResolved(config) {
      resolvedConfig = config;
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__jenni/benchmark', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const relPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
          const method = req.method ?? 'GET';

          if ((relPath === 'metrics' || relPath === 'metrics.json') && method === 'GET') {
            if (!fs.existsSync(metricsPath)) {
              await runAnalyze();
            }
            const raw = fs.readFileSync(metricsPath, 'utf8');
            return sendJson(res, 200, JSON.parse(raw));
          }

          if (relPath === 'analyze' && method === 'POST') {
            await runAnalyze();
            const raw = fs.readFileSync(metricsPath, 'utf8');
            return sendJson(res, 200, JSON.parse(raw));
          }

          if (
            method === 'GET' &&
            (relPath === 'sandbox.html' || relPath.startsWith('sandboxes/'))
          ) {
            const safeTarget = path.resolve(publicDir, relPath);
            if (!safeTarget.startsWith(publicDir + path.sep)) {
              return sendJson(res, 403, { error: 'Forbidden' });
            }
            if (!fs.existsSync(safeTarget)) {
              await runAnalyze();
            }
            if (!fs.existsSync(safeTarget)) {
              return sendJson(res, 404, { error: `Asset not found: ${relPath}` });
            }
            const ext = path.extname(safeTarget);
            res.statusCode = 200;
            res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-store');
            res.end(fs.readFileSync(safeTarget));
            return;
          }

          sendJson(res, 404, { error: `Unknown benchmark route: ${relPath}` });
        } catch (err: any) {
          sendJson(res, 500, { error: err?.message ?? String(err) });
        }
      });
    },
    closeBundle() {
      if (!resolvedConfig || resolvedConfig.command !== 'build') return;
      const outRoot = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      if (!fs.existsSync(outRoot)) return;

      // Ensure GitHub Pages serves underscore-prefixed `__jenni/` paths cleanly
      fs.writeFileSync(path.join(outRoot, '.nojekyll'), '', 'utf8');

      const outBenchDir = path.join(outRoot, '__jenni/benchmark');
      fs.mkdirSync(outBenchDir, { recursive: true });

      if (fs.existsSync(metricsPath)) {
        fs.copyFileSync(metricsPath, path.join(outBenchDir, 'metrics.json'));
      }
      const sandboxHtml = path.join(publicDir, 'sandbox.html');
      if (fs.existsSync(sandboxHtml)) {
        fs.copyFileSync(sandboxHtml, path.join(outBenchDir, 'sandbox.html'));
      }
      const sandboxesDir = path.join(publicDir, 'sandboxes');
      if (fs.existsSync(sandboxesDir)) {
        fs.cpSync(sandboxesDir, path.join(outBenchDir, 'sandboxes'), { recursive: true });
      }
    },
  };
}
