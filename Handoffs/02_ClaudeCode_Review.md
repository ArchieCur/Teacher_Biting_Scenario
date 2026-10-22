# Handoff 02: Claude Code review of the project plan

| | |
|---|---|
| **From** | Claude Code (Claude Opus 5.5) |
| **To** | ArchieCur and Claude Sonnet 5.5 |
| **Date** | 2026-10-21 |
| **Status** | Review of `01_Sonnet_to_ClaudeCode_Project_Plan.md` and `01a_Sonnet_Addendum_Corrections.md`. Nothing has been built yet. |
| **Reply expected** | `03_...` from ArchieCur and Sonnet |

> Public-safe: no organization names, brand material or real people.

**What I reviewed:** both handoffs, plus `Sources/Biting_Policy_v1.1` and `Sources/Biting_Incident_Reporting_Form_v1.1` (both `.md` and `.docx`). I re-ran the contrast math and looked inside the `.docx` files.

**Folder names as they are now:** `Handoffs/` and `Sources/`. The repo is not a git repository yet. I treat Handoff 01's layout (section 5) as the target, so `Sources/` becomes `modules/biting-incident/source/` when the skeleton is built (see Proposed changes, P1).

---

## 1. Agreements

I would keep these as they are:

- **Content as data, with a spine and carried flags (D6, section 6).** This is the right shape for a library. Branches that converge keep the writing manageable, and flags make earlier choices matter.
- **No AI inside the module, with a plain disclosure (D5, section 8).** It is honest, simple and cheap.
- **No score, no back button, every path completes.** This fits the "capable learner" framing.
- **Mobile-first fluid layout instead of the scaled 1440x900 canvas (D9).** I agree. A scaled canvas makes text tiny on phones and fights the browser's own zoom, which is an accessibility failure.
- **Hard build requirements (section 5):** works from `file://`, relative paths only, no CDN, no outbound calls, small bundle. All of these are achievable (see Answers 1 and 2).
- **Feedback format and language rules (sections 7.3 and 8).** The tone set (`held`, `partial`, `risk`), always shown as an icon plus words, is good.
- **Palette.** I recomputed all 14 ratios in section 9 and every one matches to two decimal places. The 50% sky write-in fill (effective `#D4EFF8`) gives ink text 8.97:1.
- **Two Storyline routes plus a harness page (section 10).** Building both is the right call when we cannot test inside the real LMS yet.
- **Banned-strings list kept out of the repo (section 12).** Good thinking. Answer 6 explains how it can still run in CI.
- **Handoff conventions (Appendix E).** I will follow them.

---

## 2. Concerns (most serious first)

### C1. The `.docx` source files contain a real person's name in their metadata

Both `Sources/*.docx` files have a real name in the document properties (Author and Last Modified By). The text is clean, but the files break the public-safety notice the moment they are committed. Once something is pushed to a public GitHub repository, it stays in the history even after deletion.

**Fix:** before the first commit, either (a) strip the properties (in Word: File > Info > Check for Issues > Inspect Document > Document Properties > Remove All), or (b) keep the `.docx` files out of the repo and commit only the `.md` versions, which are already marked as matching word for word. I recommend (b) plus a lint rule that fails on any `.docx`, `.pptx` or `.pdf` in the repo, since every Office file carries this risk. **ArchieCur to decide** (Q1).

### C2. The 24-hour window is stronger in the scenario than in the policy

The bite happens at 10:20 AM. Policy step 5 says the form must reach the Director "within 24 hours of the incident occurring," so the deadline is 10:20 AM the next day. That means:

- 3.3 "Do it first thing tomorrow" (`partial`) **follows the policy**. Its risk is accuracy and the Director's time, not a missed deadline.
- 2.3 "Leave the whole form for tomorrow" (`risk`) is also within the policy as written.
- The 3.3 next-day screen says "the 24-hour window is the issue." That is only true if the form arrives after 10:20 AM.

Addendum 01a section 3 says not to paraphrase the policy into stronger requirements. As drafted, the scenario does exactly that.

**Fix (for the Sonnet content pass):** frame the next-day consequence as "the Director asks for the form at 9:45 and you have 35 minutes and a fuzzy memory," which teaches the same lesson truthfully. Keep "wait for the Director to ask" as the option that actually breaks the window: the Director doesn't ask until the afternoon. Add a lint note so that "Why" text quoting a deadline must use the policy's own words.

### C3. Single-tap choices with no back button will cause mis-taps on phones

On a 375px screen, three or four long option labels sit close together. Scrolling with a thumb often registers a tap. With no back button, a mis-tap locks in a choice the learner didn't make, and the "Why" then feels unfair.

**Fix:** two-step selection. Tapping an option selects it (a radio group), and a "Lock in my choice" button commits it. This is also the better accessible pattern (a `fieldset` with a `legend`, real radio inputs, one submit). It adds a second or two per node, so count it in the timing.

### C4. The module will probably run over 13 minutes

A rough estimate: each node means reading the setup, three or four options of 15 to 30 words each, the consequence, the outcome, the "Why" and sometimes "Say this." That is about 60 to 80 seconds per node on a phone. Ten nodes come to 10 to 13 minutes **before** three debriefs, the form sheet reading, the policy drawer and the wrap. Node 3.1 is really two decisions (where to talk, then what to say), so the true count is eleven. My estimate is 14 to 17 minutes.

**Fix:** see Answer 8. In short: cap option labels at about 25 words, keep each debrief to one screen, put a timing logger into a dev build so the volunteer tests measure real numbers, and pick a cut order now so cutting is quick.

### C5. Some flags are set but never used

`calledForHelp` and `shadowedDM` are set in scene 1 but nothing in sections 7.2 or 7.3 reads them. `protectedConfidentiality` is set in 3.2 but no later effect is described. A flag that never changes anything is a promise the learner never sees kept.

**Fix:** give each one a payoff, or drop it. Suggestions for the content pass:

- `calledForHelp`: the form's "Staff Members Present" field in 2.1 or 2.3. This is also a good teaching point, because Ms. Lee arrived *after* the bite, so only Nina was present.
- `shadowedDM`: a short 3:10 PM beat where D.M. grabs at a toy again and Nina is close enough to step in (or isn't).
- `protectedConfidentiality`: the confidentiality checkbox in form section 4 during 3.3. The learner either can tick it honestly or has to face that they can't. That is a strong ending.

Add a lint rule: **every flag that is set must be read somewhere** (the plan only checks the reverse).

### C6. Saved progress can break when content changes

If a learner pauses at nap time and the content files change before they come back, the saved node ID may no longer exist, or the saved flags may not match the new graph. Also, a module bundled inside Storyline shares `localStorage` with everything else on the LMS domain.

**Fix:** use a storage key namespaced as `scenario:<moduleId>:<contentVersion>`. Save `{ node, flags, history }` only at commit points. If the saved node is missing or the version differs, resume at the start of that scene, or start over with a one-line notice. Answer 4 covers the frame restrictions.

### C7. The content lint rules will misfire on legitimate text

- **Banned words:** "correct" is a banned word, but 3.3 needs the verb ("she must correct section 4"). Scope the banned-word check to `outcomeLabel` and debrief fields, and match whole phrases ("Correct!", "That's correct"), not every use of the word.
- **No italics:** the policy and form sources use italics (*both*, the form name, the instructions). Apply the rule to scene content files only. When the policy drawer renders source text, it turns emphasis into semibold.
- **Child names:** detecting a child named by anything other than initials can't be done reliably. Make it practical: a `characters` list in `module.json` (children by initials, adults by name), and lint fails on any capitalized name-like word in content that isn't in the list or in a small allowlist of common words. Call it a heuristic in the docs.

### C8. "Word for word" isn't quite true

The `.md` files add a "Fictional policy/form for training purposes" note that the `.docx` files don't have, and they add the change log. That's fine, but say it, and name **one** source of truth. I suggest the `.md` versions, since they are diffable and will be in the repo.

### C9. Small content consistency points (for the Sonnet content pass, not blockers)

- Ms. Lee is described as both "front office" and "floater." Choose one. If she is the floater who is "due later," her arriving within two minutes needs a reason.
- 1.1 "call no one" (`partial`): policy v1.1 now says to call the office when you are the only adult. `partial` is defensible because the room stayed in view, but the "Why" should quote the new sentence.
- 2.2: at nap time A.K. is asleep a few feet away, so the obvious real-world option is "look at the arm myself now." Consider including it, or explain why it isn't possible.
- Four Monday cards (three debriefs and the wrap) may feel repetitive. Consider making the wrap card a roll-up of the three.
- A.K.'s pronoun isn't given. Settle it in the content pass so the scenes stay consistent.

---

## 3. Answers to section 14

### 1. Framework and build tool

**Vanilla JavaScript and esbuild**, with no UI framework.

- The engine is a state machine that renders one card at a time, and plain DOM code does this in a few hundred lines.
- esbuild produces a single classic (IIFE) script that works from `file://`. It is one dependency, a single binary with no plugin tree, and builds in well under a second.
- Content files are compiled into the bundle at build time (see Answer 2), so there is no runtime loading.
- Expected output: one HTML file, one JS file (target under 60 KB before fonts), one CSS file, and two subsetted `woff2` fonts (Latin only, about 20 to 40 KB each).

I would use JSDoc type comments plus a JSON Schema for content instead of TypeScript. That keeps the source readable for future maintainers and avoids a compile step that adds nothing for this size of project. If the library grows to many modules with shared components, Preact (about 4 KB) is an easy upgrade later.

### 2. `file://` and iframe without a server: yes, with these traps

1. **`fetch()` of JSON fails from `file://` in Chrome and Edge.** Fix: build all content into the JS bundle. No runtime fetches at all.
2. **`<script type="module">` fails from `file://`.** Fix: classic IIFE bundle, loaded with a plain `<script defer>`.
3. **Fonts from `file://`:** Firefox blocks fonts whose path goes outside the page's folder (its "same directory" rule). Fix: fonts sit in a folder below `index.html` and are referenced relatively, with full fallback stacks.
4. **Every `file://` page is its own origin in Chrome.** So the harness page loading the module from `file://` can't reach `GetPlayer()` (route A always fails there), and `postMessage` arrives with origin `"null"`. Fix: the harness explains this and offers a one-line local server (`npx serve docs` or a bundled `npm run harness`). Route B works under `file://` if the listener doesn't check the origin.
5. **Storage under `file://` is unreliable** (Firefox scopes it per file, and some browsers turn it off). This is already covered by the fallback chain.
6. **Absolute paths** (`/fonts/...`) break in every one of these settings. The plan already requires relative paths. I'll add a build check that fails on any `src` or `href` that starts with `/` or `http`.

### 3. Content schema for flags, variants and translation

- **Write content in YAML, compile it to JSON at build time, and validate it against a JSON Schema.** JSON is hard to write and review by hand: no comments, quote escaping, trailing-comma errors. YAML reads almost like prose, which matters because Sonnet writes these files and ArchieCur reviews them. The build turns YAML into JSON and fails with a readable message that names the file and line.
- **One file per scene** (`scenes/1-the-moment.yaml`), plus `module.json` for metadata, characters, flags (declared with a default and a description) and settings.
- **Conditions stay simple:** a `when` holds flag equality only (`when: { checkedSkin: false }`), with several keys meaning AND. No expressions and no OR. If a branch needs more, that is a sign to add a flag.
- **Variants:** every variable text is a list of `{ when, text }`, tried in order, and the **last entry must have no `when`** (the default). Lint enforces the default. Choices can carry `showIf` in the same format.
- **Translation:** every learner-visible string, including engine chrome ("Lock in my choice", "Why", "Say this", "Continue", screen-reader labels), lives in content or in `engine/strings/en.yaml`. A later translation is a parallel file keyed by the same IDs. Stable IDs on every node and choice (already in the plan) make this work.

### 4. Is the `localStorage` to `sessionStorage` to memory fallback enough?

It is enough to keep the module from **crashing**. It is not enough to make resume **reliable**. Inside an LMS, the Storyline package is often in a frame whose storage is partitioned (Safari, Firefox and Chrome's third-party storage partitioning), cleared between sessions, or blocked. Same-origin bundling (route A) is the best case.

Recommendations:

- Keep the fallback chain, wrapped in try/catch as planned, with versioned keys (C6).
- Save at every commit, and show resume as "Pick up at nap time?" with a "Start over" option. Never resume silently.
- Make the experience fine without resume: each scene is short, and the nap-time break is a natural restart point.
- **Later, not in the prototype:** route A can write a small progress code into a Storyline variable, so Storyline's own resume data (which the LMS does keep) carries it. Worth knowing for phase 2.

### 5. Accessible pattern for the form sheet

- Show the form as a **document region**, not as disabled inputs. Read-only inputs look interactive, confuse screen readers ("edit text, dimmed") and fail the "don't look clickable if you aren't" principle.
- Structure: a heading for each form section (`h3`), each field as a label and value pair in a `<dl>`, and checkboxes drawn as an icon plus visually hidden text ("checked" or "not checked"), with the visible box hidden from assistive technology.
- The decision itself sits next to the form as the normal choice `fieldset` (C3). After commit, the matching field fills in, the new value is announced through the existing `aria-live` region ("Section 2, incident details, filled in"), and the filled field gets a brief highlight (left alone under `prefers-reduced-motion`).
- Sections 4 and 5 are visibly "not yet" during nap time (a muted label with the words "Complete after pickup"), not just greyed out.
- On phones, the form gets the full width and the decision sits below it, with a "Back to the form" skip link.

### 6. Free CI checks on GitHub

GitHub Actions is free for public repositories. All of these can run on every push:

- Content schema validation and graph lint (next targets, reachability, dead ends, flags in both directions, variant defaults).
- Language lint (scoped as in C7) and a reading-level warning, such as Flesch-Kincaid grade per field, as a warning, not a failure.
- Contrast check from the token file.
- Build, plus checks on the built output: relative paths only, no external URLs, a size budget.
- Accessibility: Playwright with `@axe-core/playwright` on every node at 320 and 1280 widths, plus a scripted keyboard walk through one full path.
- A harness test: load `tests/storyline-harness.html` and confirm the completion message arrives.
- **Banned strings in CI:** store the list as an **encrypted Actions secret** (not a file) and have the script read it from an environment variable. GitHub hides secrets from logs and from pull requests opened by forks. The script must report only the file and line, never the matched term. Also install the same check as a local pre-commit hook, because CI only runs **after** a push, and by then the string is public. The pre-commit hook is the real protection.

### 7. GitHub Pages configuration

**Commit the build to `/docs` and serve Pages from `/docs` on `main`.** Reasons:

- ArchieCur needs the built folder to drop into Storyline. With `/docs` committed, that is a plain "Download ZIP" from GitHub, with no Node, no Actions artifacts and no login.
- CI adds a "build is fresh" check, which fails if `docs/` doesn't match a fresh build of the source, so the committed output can't drift.
- No root `index.html` (this avoids the duplicate noted in Appendix C), and the README points to `docs/`.

The workflow approach is cleaner for engineers, but it hides the output, which works against the non-coder handoff.

### 8. Are ten nodes too many?

Probably, for 11 to 13 minutes (see C4). Before cutting anything, I'd measure with a timing log. My view on the cut order is different from the plan's:

- **1.3 covers policy step 3** (name the feeling, redirect, shadow). It is the only node that teaches it. Cutting it removes a whole policy step.
- **1.4 feeds 2.1** (`jottedNote` changes the incident wording). If 1.4 is cut, keep the lesson by folding the note into the 1.1 or 1.2 consequence ("You grab a sticky note..."), so the wording in 2.1 can still differ.
- **Suggested cut order:** (1) shorten labels and debriefs first, (2) fold 1.4 into a consequence beat, (3) merge 2.3 into 2.2's consequence, (4) only then consider 1.3.
- Cheaper wins: let the learner collapse "Say this" after reading it, and keep "Why" to two sentences, as the plan already says.

### 9. Fragile points in the Storyline bridge

- **`window.parent` may not be the window that has `GetPlayer`.** Depending on the Storyline version and player, a web object can be nested more than one frame deep, and the LMS adds its own frames. Fix: walk up the `parent` chain (stop at `top`), call `GetPlayer` on the first window that has it, wrap each step in try/catch, and fall back to route B.
- **The Storyline variable must already exist** as a True/False variable in the project. `SetVar` on an unknown name does nothing and gives no error. Document it in the README with the exact variable name.
- **Web objects set to "open in a new browser window"** have no parent. Use `window.opener` as another fallback, or document "display in slide" as required.
- **The listener doesn't check `e.origin`.** That is acceptable because the message carries no data, but anyone who can frame the course could fake completion. When the hosting origin is known, check it, and keep the check configurable.
- **Fire `complete` again** each time the wrap screen is shown, including after resume. It is idempotent on the Storyline side, and it covers a lost first message.
- **Review 360 and published output behave differently** (Review 360 serves from its own domain, so route A becomes cross-origin there). The plan already lists this as a known unknown. Route B should be the primary route for Review 360 testing.
- **Storyline's preview** doesn't run web objects in all versions. Test from published output.

### 10. What did we miss?

- **The public-safety check needs to run before the first commit, not just in CI** (C1 and Answer 6). Run `git init` with the pre-commit hook in place before anything else is added.
- **Office-file metadata** in general (C1). Add a lint rule.
- **Content versioning against saved progress** (C6).
- **Engine strings for translation** (Answer 3). The plan covers scenario text but not button labels or screen-reader text.
- **A dev "jump to node" mode** (dev builds only), so ArchieCur and Sonnet can review a single node without replaying the scenario. This will save a lot of review time.
- **A content preview**: a generated, read-only page that lists every node, option, consequence and variant on one scroll. This is the easiest way for ArchieCur to review vocabulary and realism.
- **A pause or exit control.** On a phone inside Storyline, learners need to know how to stop and that their progress is saved. "Pause at nap time" is a stated goal, but there is no UI for it yet.
- **The `.md` and `.docx` source-of-truth question** (C8).
- **Font licenses:** both fonts are SIL OFL 1.1. Ship each `OFL.txt` alongside the font files. Anybody is a variable font with a width axis, so subset it to the Bold weight at normal width to keep it small.
- **Contrast inside the tone fields:** the leaf, sun and coral outlines on their own tints are 2.10, 1.17 and 2.86, all below 3:1. That's fine while they are decorative, but **outcome icons must be ink** on the tint fields, never leaf, sun or coral. Section 9 also lists "white on coral" as usable for large text and icons, while the rules say coral never carries text. Choose one. I suggest deleting the white-on-coral row.

---

## 4. Proposed changes

| # | Change | Why |
|---|---|---|
| P1 | Move `Sources/*.md` to `modules/biting-incident/source/`. Keep the `.docx` files out of the repo, or scrub them (C1). | Matches the planned layout and removes the metadata risk. |
| P2 | Content files in YAML, compiled and schema-validated at build time (Answer 3). | Easier to write and review than JSON, with readable errors. |
| P3 | Two-step "select, then lock in" choices (C3). | Prevents mis-taps and is the better accessible pattern. |
| P4 | Lint additions: set-but-unused flags, variant defaults, scoped banned words, no Office files, no absolute or external URLs in the build (C5, C7, Answer 2). | Catches the specific failures found in this review. |
| P5 | Versioned storage keys, scene-level resume prompt, "Start over" (C6, Answer 4). | Resume that fails safely. |
| P6 | Walk up the frame chain for `GetPlayer`, fall back to `opener` and then route B, and re-fire `complete` on the wrap (Answer 9). | Survives more Storyline and LMS frame setups. |
| P7 | Commit the build to `/docs` with a "build is fresh" CI check (Answer 7). | Download ZIP is the non-coder handoff. |
| P8 | Add a dev jump-to-node mode and a content preview page to phase 2 (skeleton) (Answer 10). | Makes the phase 3 content review fast. |
| P9 | Sequence: step 0 is `git init` with the pre-commit public-safety hook, before any file is committed. | A public repo's history can't be cleaned after the fact. |
| P10 | Fix the 24-hour framing in 2.3 and 3.3 during the content pass (C2). | Stays faithful to policy v1.1, as 01a requires. |

**Revised phase 2 (skeleton) order:** git init with the hook → folder layout → build (esbuild, YAML to JSON) → engine with one placeholder scene of three nodes that exercises a flag and a variant → harness page → lint and CI → content preview page. Then hand back for the content pass.

---

## 5. Questions for ArchieCur

1. **`.docx` files:** keep them out of the repo (only the `.md` versions go in), or scrub the metadata and commit both? (C1, C8) My recommendation: keep them out.
2. **Repository name and license:** confirm `role-based-scenarios` (or another name) and MIT.
3. **Is the `.md` version the single source of truth** for the policy and form from now on?
4. **The 24-hour framing (C2):** do you agree that "first thing tomorrow" follows the policy and should be framed as a quality risk, not a deadline miss? Or should policy v1.2 tighten the requirement to "before the end of your shift"? Either is fine, but the scenario and the policy must say the same thing.
5. **Banned-strings list in CI:** are you comfortable storing it as an encrypted GitHub Actions secret, in addition to keeping your local file?
6. **Exit and pause:** should learners be able to leave mid-scenario from inside the module, or does Storyline's own exit cover it?
7. **Storyline setup you can test:** which Storyline version, and will the course be published to the LMS as SCORM 1.2, SCORM 2004 or xAPI? This affects frame depth and resume (Answers 4 and 9), but it doesn't block the skeleton.
