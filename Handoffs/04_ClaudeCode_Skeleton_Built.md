# Handoff 04: Skeleton built (phase 2 complete)

| | |
|---|---|
| **From** | Claude Code (Claude Opus 5.5) |
| **To** | ArchieCur and Claude Sonnet 5.5 |
| **Date** | 2026-10-21 |
| **Status** | Phase 2 done and tested. Nothing committed yet (see section 6). Ready for the Sonnet content pass. |
| **Replies to** | `03_Sonnet_and_ArchieCur_Reply_to_Review.md` |
| **Reply expected** | ArchieCur: the four items in section 6. Sonnet: content pass, then `05_...` |

> Public-safe: no organization names, brand material or real people.

---

## 1. Final folder names

```
Teacher_Biting_Scenario/
├── README.md, LICENSE (MIT), package.json, playwright.config.js
├── .gitignore, .gitattributes, .github/workflows/ci.yml
├── Handoffs/
├── engine/
│   ├── src/              main.js, state.js, conditions.js, storage.js, bridge.js,
│   │                     components.js, dom.js, icons.js, timing.js, dev.js
│   ├── styles/           tokens.css, fonts.css, base.css, components.css, app.css
│   ├── strings/en.yaml   all engine text (buttons, labels, screen-reader text)
│   ├── schema/           module.schema.json, scene.schema.json
│   └── index.html        page template
├── modules/
│   ├── README.md         how to write a module (the content guide for Sonnet)
│   └── biting-incident/
│       ├── module.yaml   settings, characters, flags, Storyline variable, form layout
│       ├── scenes/       placeholder.yaml (to be replaced by the three real scenes)
│       └── source/       Biting_Policy_v1.1.md, Biting_Incident_Reporting_Form_v1.1.md
├── scripts/              build, lint, public-safety check, docs freshness, local server,
│   ├── lib/              hook installer, and their helpers
│   ├── lint/allowed-capitalized-words.txt
│   ├── hooks/            pre-commit, commit-msg
│   └── contrast-pairs.json
├── tests/
│   ├── engine/           unit tests (Node's built-in runner)
│   ├── browser/          Playwright tests
│   ├── fixtures/         a deliberately broken module that proves each lint rule fires
│   ├── storyline-harness.html, harness-relay.html
└── docs/                 built output (committed; GitHub Pages serves it)
    ├── biting-incident/  the self-contained module folder for Storyline
    ├── previews/biting-incident.html   content preview
    ├── storyline-harness.html, harness-relay.html
    └── index.html        landing page
```

`Sources/` is gone. Its two `.md` files moved to `modules/biting-incident/source/` (P1).

## 2. What was built (Handoff 03 section 6, items 1 to 8)

| # | Item | State |
|---|---|---|
| 1 | git init plus public-safety hooks | Done. `pre-commit` checks staged files; `commit-msg` checks the message. Both fail closed when the list is missing. Verified: blocks with no list, blocks on a match and reports file and line only, passes on a clean list. **See section 6: ArchieCur's terminal needs one git setting before the hook can run.** |
| 2 | Folder layout | Done (section 1). Engine and modules are separate; a second module is a new folder. |
| 3 | Build | Done. esbuild, YAML compiled to JSON, schema-validated with file and line errors. One classic script, works from `file://`. |
| 4 | Engine with a placeholder scene | Done. Exercises every node type, a flag, text variants, a conditional choice, a conditional `next`, form fills and the completion event. |
| 5 | Storyline harness | Done. Route choice, 0 to 2 frames in between, frame widths, blocked storage, timing log, custom variable name, `file://` note. |
| 6 | Lint and CI | Done. Graph, flags both ways, language, child names, form labels against the source form, contrast, no Office or image files, size limits, no absolute or external URLs, module size budget, `docs/` freshness, hook active. |
| 7 | Content preview and dev jump-to-step | Done. |
| 8 | Stop and hand back | This file. No scenario content was written. |

Also done: README for a non-coder, `modules/README.md` content guide, MIT license, the pause control with honest save messages (D15), the two-step choice (D17), the form sheet as a document region (D20), versioned resume (C6), and the Answer 9 bridge changes.

### Test results (all on 2026-10-21)

- `npm run lint`: all sections pass.
- `npm test`: 32 of 32 pass (engine, storage fallbacks, bridge frame walking, timing, every lint rule against the broken fixture).
- `npm run fresh`: `docs/` matches a fresh build.
- `npm run test:browser`: 15 of 15 pass. Keyboard-only play-through at 320, 375, 768 and 1280 px; axe (WCAG 2.1 A and AA) on every step at 320 and 1280 px and on the policy drawer, with no violations; no horizontal overflow; lock-in without a choice; flag and variant behavior; form fill announced; pause with real save and resume after reload; pause with blocked storage; policy drawer with Escape and focus return; runs from `file://` with fonts loaded and no console errors; no network requests leave the page; harness route A through two frames, route B through one frame, both routes direct, custom variable name.
- Built module folder: about 106 KB in total, including fonts (budget 250 KB).

**Not tested:** Safari, Firefox and real phones (CI runs Chromium only), real Storyline, Review 360 and the LMS. Those are phase 5.

## 3. Deviations from Handoffs 01 to 03

| # | Deviation | Why | Decided by |
|---|---|---|---|
| X1 | `module.yaml`, not `module.json` | D16 made authored content YAML. One format for writers. | Claude Code |
| X2 | Storage key is `scenario:<moduleId>:v1`; the content version is stored **inside** the saved data, not in the key | With the version in the key, a new version could not find the old save, so "resume at the start of the saved scene" (C6) would be impossible. | Claude Code |
| X3 | After "Lock in", focus moves to the "What happened" heading; `aria-live` is used for form updates and errors, not for consequences | Doing both makes screen readers read the consequence twice. Moving focus is the more reliable of the two. | Claude Code |
| X4 | The timing log works in the production build with `?timing=1` (and in dev builds always). Jump-to-step is dev-only | Volunteers will test from GitHub Pages, which serves the production build. The log stays on the device. | Claude Code |
| X5 | Both completion routes fire every time, and the message goes to every ancestor frame and the opener | Either route alone can fail in an unknown LMS frame setup; firing both is harmless. | Claude Code |
| X6 | Placeholder scene has five nodes (three decisions, a debrief, a wrap), not three | So every node type and the completion event are exercised. | Claude Code |
| X7 | Form fields can have a `group` | Section 4 of the source form repeats "Parent Name", "Time Notified" and "Method" under two sub-headings. | Claude Code |
| X8 | Fonts come from the `@fontsource` npm packages, copied in at build time: Anybody 700, Inter 400 and 600, Latin subset, OFL files alongside | Reproducible, no binaries in the source folders. Inter 600 is the semibold used for emphasis. | Claude Code |
| X9 | A Content-Security-Policy meta tag blocks all network connections from the page | A second guard for "no outbound calls", besides the lint. It does not affect `file://`. | Claude Code |
| X10 | Playwright 1.56.1 (not 1.49) | 1.49 hung on load under Node 24. | Claude Code |
| X11 | `StatusChips` from the component list was not built | Its purpose was not specified. See question 5. | Open |
| X12 | Module title "A bite in Room 4" is a working title | For Sonnet to replace in the content pass. | Open |

## 4. For Sonnet: the content pass

Read `modules/README.md` first. It covers the file format, node types, choices, flags, variants and the text rules. Then:

1. Replace `scenes/placeholder.yaml` with three scene files (for example `the-moment.yaml`, `nap-time.yaml`, `pickup.yaml`) and list them in `module.yaml` under `scenes:`. Set `start:` to the first node id.
2. In `module.yaml`, delete `placeholderFlag` and declare the real flags (`calledForHelp`, `checkedSkin`, `shadowedDM`, `jottedNote`, `formPrefilled`, `protectedConfidentiality`, and any others), each with a default and a description. The lint fails on any flag that is set but never read, or read but never set.
3. Replace `intro:` and `title:`. The characters list already reflects D21. Add anyone new there.
4. Form fills use the field ids in `module.yaml` (for example `staffPresent`, `before`, `after`, `brokeSkin`, `firstAid`, `confidentiality`). Option values must match the form's options exactly; the lint checks this.
5. Node ids are global across scenes, so `1.1`, `2.1` and so on work well. A node with choices needs a `summary` (two to four words) for "Your day at a glance".
6. Feedback defaults: if a choice has no `outcomeLabel`, the engine shows "This held up", "This left a gap" or "This opened a risk" according to `tone`.
7. Check your work: `npm run lint` (file and line for every problem), `npm run dev` with the Dev panel to jump to any step with any flags, and `docs/previews/biting-incident.html` after a build to review everything on one page.

**Presentation notes from the build** (addendum 01a section 5):
- Dialogue options show in quotation marks, so write them as the exact words, without quotes.
- On a phone, a choice of about 25 words wraps to four or five lines. Four such options plus the prompt fill a screen, which is fine but is the upper limit.
- The form sheet is long on a phone. On form nodes, keep `body` short; the sheet itself carries the context.

## 5. Things I noticed

- Handoff file `02_ClaudeCode_review_Questions_for_ArchieCur.md` holds ArchieCur's original answers and does not follow the `NN_Author_Topic` pattern exactly. Left as is, since Handoffs are never renamed or deleted; its content is carried into `03`.
- The README names Storyline and Review 360, because the setup steps need them. Any name that matches the banned-strings list is replaced with a generic term such as "the LMS" (done in Handoff 06).

## 6. Questions for ArchieCur (needed before the first commit)

1. **Git trust setting for drive E:.** Git refuses to run in this folder ("dubious ownership") because drive E: does not record file owners. Until this is fixed, git, and so the commit hook, cannot work. The standard fix is this one line, which changes your global git settings to trust only this folder:
   `git config --global --add safe.directory E:/Teacher_Biting_Scenario`
   May Claude Code run it, or would you like to run it yourself?
2. **Commit identity.** Every commit publishes an author name and email. This computer's global git email is a personal address. Recommendation: set a repo-only identity of `ArchieCur` with your GitHub "noreply" address (GitHub > Settings > Emails shows it). What name and email should this repository use?
3. **Banned-strings list.** Please create `.banned-strings.txt` in the repo folder (one entry per line). It is git-ignored, and the hook refuses to commit it. Claude Code has not seen it and does not need to.
4. **First commit.** After 1 to 3, may Claude Code make the first commit (and run `npm run check` first)? Pushing to GitHub is a separate step, for you to approve when the repository exists.
5. **StatusChips** (not blocking): Handoff 01 listed a StatusChips component without a purpose. If it was meant to show carried state (for example "Office called", "Note taken"), Sonnet can say so in `05` and it goes into phase 4.
