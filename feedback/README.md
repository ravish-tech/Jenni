# Feedback

Design feedback written in the playground. It is the to-do list for humans and agents.

## Files

| File | What | Edit? |
|---|---|---|
| `notes.json` | Source of truth. All notes. | Yes (agents mark items done here) |
| `TODO.md` | Generated readable view. Open items first. | **No.** Regenerated on every change. |

## Note shape (`notes.json`)

```json
{
  "notes": [
    {
      "id": "n_m1abc2de3f",
      "component": "Button",
      "section": "Variants",
      "type": "feel",
      "rating": 3,
      "text": "Soft variant feels too faint in dark mode.",
      "status": "open",
      "resolution": null,
      "createdAt": "2026-11-10T18:00:00.000Z",
      "updatedAt": "2026-11-10T18:00:00.000Z"
    }
  ]
}
```

- `component` — demo `meta.name` (e.g. `Button`), or a planned item name.
- `section` — `DemoSection` title, or `null` for a general note.
- `type` — `feel` (taste/motion/weight) · `bug` · `idea` · `todo`.
- `rating` — optional 1–5 "feel" score, or `null`.
- `status` — `open` | `done`. `resolution` — short text, set when done.

## Workflow

1. Run `npm run dev`. Open a component. Use it. Tune the token knobs.
2. Write notes: the right panel (whole component) or the note button on a section.
3. Ask the agent: **"work on feedback"**.
4. The agent:
   - reads `feedback/TODO.md` (open items, grouped by component, each ends with its `id`);
   - fixes the issue in `packages/core` (visuals) and the wrappers / demos;
   - in `notes.json`, sets that note `"status": "done"`, a short `"resolution"`, and a new `"updatedAt"`;
   - keeps valid JSON. Does not edit `TODO.md`.
5. The playground watches `notes.json`. The UI and `TODO.md` update within ~1 s.
6. Review in the playground. Reopen a note if it is not right.

## API (dev server only)

```
GET    /__jenni/feedback        → { notes }
POST   /__jenni/feedback        { component, section?, type, rating?, text } → note
PATCH  /__jenni/feedback/:id    { status?, resolution?, text?, type?, rating?, section? } → note
DELETE /__jenni/feedback/:id    → deleted note
```

Writes are atomic (temp file + rename). Implementation: `apps/playground/feedback-plugin.ts`.
