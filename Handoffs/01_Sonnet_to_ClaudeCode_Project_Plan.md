# Handoff 01: Project plan for the Teacher Track biting-incident scenario (prototype)

| | |
|---|---|
| **From** | Claude Sonnet 5.5, working with ArchieCur |
| **To** | Claude Code |
| **Date** | 2026-10-21 |
| **Status** | Draft for your review. Nothing has been built yet. |
| **Reply expected** | `Handoffs/02_ClaudeCode_Review.md` (format in section 1) |

> **Public-safe notice.** This file will live in a public repository. It must not contain organization names, brand-guide text, logos, real people, or real center names. If you notice any, flag it in your review and do not repeat it.

---

## 1. What we are asking you to do

Please review this plan before any code is written. We want you to push back, not just approve. Write your reply as `Handoffs/02_ClaudeCode_Review.md` with these headings:

1. **Agreements**: what you would keep as is.
2. **Concerns**: ranked, most serious first, each with a reason and a proposed fix.
3. **Answers**: your answers to the questions in section 14.
4. **Proposed changes**: edits to scope, structure or sequence.
5. **Questions for ArchieCur**: anything only a human can decide.

Record who decided what. ArchieCur and Sonnet will answer in `03_...`, and so on. The trail is the point: someone taking over this project later should be able to see why we did what we did.

## 2. Context and goal

ArchieCur is an instructional designer introducing AI-assisted learning development at an organization with a growing facilitator workforce and low AI literacy. There is no API access yet. The prototype's job is to **show stakeholders that a web-based, interactive, role-based scenario can be designed and built quickly with AI and a coding agent**, and to give them a feel for the experience by letting them try it.

Key points:

- The learner-facing module is **not about AI**. It teaches a preschool teacher how to handle a child biting incident. AI is used behind the scenes to build it, and that is the story being demonstrated.
- A separate, live AI email-practice simulation already exists (a three-turn email exchange with an upset parent). This module hands off to it at the end. That is where learners see live AI.
- Any feedback in this module is **scripted**. The module must state that clearly (see section 8).
- The long-term goal is a **library of composable role-based modules**. The prototype should prove the pattern, not just a one-off page.
- The final destination is an **Articulate Storyline** course delivered through the organization's **LMS**. Storyline's built-in branching is too limiting for this work, so the scenario lives in a web page that Storyline embeds. Storyline only needs to know when the whole scenario is complete.

## 3. Decision log

| # | Decision | Decided by | Date |
|---|---|---|---|
| D1 | New repository for this work. The earlier HR repo is a reference only. | ArchieCur, with Sonnet's recommendation | 2026-10-21 |
| D2 | Fictional center: **Juniper Valley Early Learning Center** (Sonnet's first proposal turned out to be a real center's name) | ArchieCur | 2026-10-21 |
| D3 | The brand guide stays out of the repo. A **neutral palette that resembles it** is used instead. | ArchieCur and supervisor | 2026-10-21 |
| D4 | No logos, photos or stickers. Typography, color and fields only. | ArchieCur and Sonnet | 2026-10-21 |
| D5 | No AI inside the learner experience. Feedback is scripted and disclosed as such. | ArchieCur | 2026-10-21 |
| D6 | Three scenes in one day: the moment, nap time, pickup. Scene order changed so the form is completed in two parts. | ArchieCur approved Sonnet's proposal | 2026-10-21 |
| D7 | Mock policy gets three tweaks (see Appendix A). | ArchieCur approved; final wording to be confirmed | 2026-10-21 |
| D8 | Storyline completion only (not per scene) for the prototype. Bridge details are in section 10. | ArchieCur | 2026-10-21 |
| D9 | Mobile-first, responsive layout. The old fixed 1440x900 scaled canvas is **not** reused. | Sonnet (pending Claude Code review) | 2026-10-21 |
| D10 | Keep two open-source typefaces (Anybody for headings, Inter for body), self-hosted. | Sonnet (pending ArchieCur confirmation) | 2026-10-21 |
| D11 | Module length is Sonnet's call. Target is roughly 10 to 13 minutes, to be measured in testing. | Sonnet, delegated by ArchieCur | 2026-10-21 |

## 4. Scope

**In scope for the prototype**

- One module, three scenes, ten decision nodes, scripted consequences and debriefs.
- A scenario engine driven by content files, so the next module is mostly writing.
- An in-scenario version of the incident reporting form and a slide-up policy reference.
- A Storyline completion bridge with a local test harness.
- Accessibility, content-lint and public-safety checks.

**Out of scope for the prototype**

- Live AI inside the module (see Appendix B for the upgrade path).
- Translation (but keep strings out of components so it is possible later).
- Learner tracking beyond the completion signal.
- Photos, stickers, logos, audio, video.

## 5. Repository and build requirements

**Name:** to be chosen with ArchieCur. Suggested: `role-based-scenarios`, with each module in its own folder so the library can grow.

**Suggested layout** (change it if you have a better one):

```
/
├── README.md              Purpose, how to run, contributor disclosure
├── LICENSE                MIT (ArchieCur to confirm)
├── Handoffs/              Numbered markdown files, newest last
├── engine/                Shared scenario engine and components
├── modules/
│   └── biting-incident/
│       ├── module.json    Metadata, scenes, settings
│       ├── scenes/        One content file per scene
│       └── source/        Mock policy and mock form (fictional)
├── scripts/               Content lint, contrast check, graph validation
├── tests/                 Engine tests and a Storyline test harness page
└── docs/                  Built output served by GitHub Pages
```

**Hard requirements for the build output**

- Runs when **opened from `file://`** and when served over http(s). Avoid ES-module loading that fails from `file://`; produce a bundled classic script if needed.
- **Relative paths only**, so the whole output folder can be dropped into a Storyline package.
- **No runtime CDN dependencies.** Self-host fonts and scripts. The LMS may block external requests, and offline reliability matters.
- Small and fast on a mid-range phone. The earlier HR repo loaded a development React build and an in-browser Babel compiler from a CDN, which is slow on phones. Please do not repeat that.
- **No secrets, no analytics, no outbound network calls.**
- Reproducible build with a documented one-command setup. ArchieCur is not a developer, so the README must be written for a non-coder.

**Framework choice is yours.** Sonnet leans toward either vanilla JavaScript or a very small framework with a build step. The engine is a state machine that renders cards, which does not need much. Tell us what you would pick and why.

## 6. Engine design (content as data)

**Principle:** components contain no scenario text. Every string comes from content files, so a new module (or a translation) is a new folder, not a code change.

**Node types**

| Type | Purpose |
|---|---|
| `story` | Narrative card, optional choices |
| `form` | The incident form, filled in through choices |
| `dialogue` | A face-to-face exchange with exact wording options |
| `debrief` | Reflective summary, "Monday card", carry-forward |
| `wrap` | End screen: day at a glance, handoff link, completion event |

**Choice object (example shape, adjust as needed)**

```json
{
  "id": "1.1-b",
  "label": "Step between them, keep the whole room in view, and call the office for backup.",
  "tone": "held",
  "outcomeLabel": "This held up",
  "consequence": "Within two minutes Ms. Lee from the front office is at your door...",
  "why": "Policy step 1: separate calmly and focus on the child who was bitten...",
  "setFlags": { "calledForHelp": true },
  "next": "1.2"
}
```

**Tones** (always shown as an icon plus a short phrase, never as color alone):

- `held`: the decision protected the children and the process.
- `partial`: it worked for now but left a gap.
- `risk`: it opened a problem that shows up later.

**State**

- Spine with carried flags. Branches converge back to a shared path, and flags change later wording. This keeps content manageable while making earlier choices matter.
- No back button after a decision. Consequences are shown before moving on.
- No score. Every path completes. Only the final completion event leaves the module.
- Save progress so a teacher can pause at the end of nap time and resume. Use `localStorage` inside try/catch, fall back to `sessionStorage`, then to memory. Storage is often blocked inside embedded frames, so the module must work without it.

**Events** (see section 10): `sceneStart`, `sceneComplete`, `complete`. The prototype only needs `complete` outside the module.

**Accessibility behaviors in the engine:** focus moves to the new card's heading on each step, `aria-live` announces consequences, keyboard operation for everything, honor `prefers-reduced-motion`.

## 7. Content outline

### 7.1 Persona and setting

- **Nina Rodriguez**, novice lead teacher, eight months in the classroom, working in Room 4 with 18 children and **no assistant** today. A floater is due later in the morning.
- **Learner needs:** exact words and actions ("What to do on Monday"), immediate non-judgmental feedback that explains why, phone-friendly, short.
- **Children appear by initials only:** **D.M.** (a young three, bites) and **A.K.** (bitten). Adults get placeholder names: Ms. Whitfield (A.K.'s parent), Mr. Delgado (D.M.'s parent), Director Okonkwo, Ms. Lee (front office/floater). Final names are for the content pass.
- **Fictional center and policy:** Juniper Valley Early Learning Center. Do not cite real regulations as requirements. Include a visible note that the learner's own program policy may differ.

### 7.2 Scene and decision map

Branches converge on one spine. Flags in the last column change later wording.

**Scene 1: The moment (10:20 AM, Room 4)**

D.M. and A.K. both reach for the same toy fire truck. D.M. bites A.K. on the left forearm, leaving a red mark. The skin is **not** broken. The room goes quiet, then loud.

| Node | Decision | Options (tone) | Flags set |
|---|---|---|---|
| 1.1 | First move | Carry A.K. to the sink and leave the class (`risk`) · Separate calmly, keep the room in view, call the office for backup (`held`) · Separate and comfort, keep the room in view, call no one (`partial`) · Put D.M. in a chair and talk to him first (`risk`) | `calledForHelp` |
| 1.2 | Care for A.K. | Ice straight on skin, "you're fine" (`partial`) · Wash with mild soap and warm water, look closely in good light, wrapped cold pack (`held`) · Wash and ice but don't look closely (`partial`) | `checkedSkin` |
| 1.3 | The child who bit | Label him and give a long talk (`risk`) · Use the policy line ("Biting hurts. We keep our teeth to ourselves."), name the feeling, redirect, stay close (`held`) · Say nothing, he'll move on (`partial`) | `shadowedDM` |
| 1.4 | The 20-second note | Jot time, place and what you saw (`held`) · Trust memory, write it later (`partial`) | `jottedNote` |

Debrief: what this scene was really about (supervision, comfort, observation), a Monday card, carry-forward.

**Scene 2: Nap time (12:40 PM)**

The in-scenario form appears, using the mock reporting form. Nina completes sections 1 to 3 now. Sections 4 and 5 depend on events that have not happened yet.

| Node | Decision | Options (tone) | Notes |
|---|---|---|---|
| 2.1 | Incident details wording | Objective, observable ("D.M. bit A.K. on the left forearm, leaving a red mark. They had both reached for the same toy fire truck.") (`held`) · Judgmental ("D.M. viciously attacked A.K.") (`risk`) · Vague ("A bite happened during play") (`partial`) | Without `jottedNote`, the objective option carries an uncertain time and detail ("around 10:20, I think"). |
| 2.2 | Skin and first aid section | If `checkedSkin`: tick the facts confidently (`held`). If not: tick "No" to keep it tidy (`risk`) or tell the Director you are not sure and ask them to look before pickup (`held`) | Branch wording depends on `checkedSkin`. |
| 2.3 | Before nap time ends | Finish sections 1 to 3 now, leave 4 and 5 until after pickup (`held`) · Leave the whole form for tomorrow (`risk`) · Fill in section 4 now with the expected notification (`risk`) | `formPrefilled` if third option chosen. |

**Scene 3: Pickup (4:45 PM)**

| Node | Decision | Options (tone) | Notes |
|---|---|---|---|
| 3.1 | Ms. Whitfield asks, "Who did this?" | Step 1 is where and how you start: private spot, lead with A.K.'s wellbeing (`held`) vs. in the pickup line (`risk`). Step 2 is the answer: name D.M. (`risk`), decline kindly and explain why while giving the facts (`held`), "It's in the report, ask the Director" (`partial`), "Kids bite, don't worry" (`risk`). | Show exact wording for each option. |
| 3.2 | Mr. Delgado at pickup | Label D.M. ("he's a biter") (`risk`) · Share facts, what you did, ask to work together, do not name A.K. (`held`) · Tell him A.K.'s parent was upset (`risk`) | `protectedConfidentiality` false if any option names or identifies the other child. |
| 3.3 | Close the loop | Complete sections 4 and 5 and hand to the Director before leaving (`held`) · Do it first thing tomorrow (`partial`) · Wait for the Director to ask (`risk`) | If `formPrefilled`, she must correct section 4 first. If not completed, show a next-day screen: the Director asks for the form and the 24-hour window is the issue. |

Final screen (`wrap`): "Your day at a glance" lists each decision with its outcome phrase, with no score. A Monday card with three actions and sample language. A link to the live email-practice simulation (URL set in config). The `complete` event fires here.

### 7.3 Feedback format for every decision

1. The consequence, told as a short story beat.
2. An outcome phrase with icon (tone).
3. "Why": one or two sentences tied to the mock policy or to child development, written to teach, not to judge.
4. Where it applies, "Say this": the exact words.

## 8. Feedback language rules

- No "Correct", "Wrong", "Mistake", "Good job", "Great choice", or exclamation-driven praise in outcome labels or debriefs. Use phrases like "This held up", "This left a gap", "This opened a risk."
- The learner is capable. Frame situations as hard, not as failures.
- Sentence case. No emoji. No italics or underlines (emphasis is semibold).
- Children by initials only, in content and in form examples.
- Plain language at about a grade 6 to 8 reading level.
- **Disclosure:** a visible, plain note near the start and end: "The feedback in this module is scripted. It does not use AI. Your own program's policy may differ from this fictional center's."

## 9. Visual system (neutral)

A private brand guide exists outside this repo. It informed the tokens below but **must not be requested, copied or referenced in the repo.** The palette is a close-but-neutral stand-in. Contrast was calculated on 2026-10-21; please re-verify in `scripts/` and adjust if anything fails.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#243A78` | All text, meaningful icons |
| `--paper` | `#F8F4EE` | Page ground |
| `--sun` | `#FFDE59` | Icon chips, general-point outlines |
| `--leaf` | `#35C27C` | Positive outlines (decorative only) |
| `--cobalt` | `#4560D2` | Banners, key outlines, activity badge |
| `--sky` | `#A8DFF0` | Form write-in fill (at 50%), activity ground |
| `--coral` | `#EE5A47` | Caution outlines and icons only |
| `--leaf-tint` | `#EAF8F1` | `held` outcome field fill |
| `--sun-tint` | `#FFF1B8` | `partial` outcome field fill |
| `--coral-tint` | `#FDE7E3` | `risk` outcome field fill |

Measured contrast (WCAG 2.1 ratios):

| Pair | Ratio | Use |
|---|---|---|
| ink on white | 10.76 | Text |
| ink on paper | 9.82 | Text |
| ink on sun | 8.12 | Text |
| ink on sky | 7.42 | Text |
| ink on leaf-tint | 9.84 | Text |
| ink on sun-tint | 9.49 | Text |
| ink on coral-tint | 9.08 | Text |
| white on ink | 10.76 | Text |
| white on cobalt | 5.44 | Text |
| white on coral | 3.39 | Large text and icons only |
| ink on leaf | 4.69 | Icons only, not text |
| leaf on white | 2.29 | Decorative only |
| sun on white | 1.33 | Decorative only |
| ink on cobalt | 1.98 | Never |

**Rules**

- All text is `--ink`, except white on `--ink` or `--cobalt`. Never black.
- `--leaf` and `--coral` never carry text. Words sit in ink on the tints.
- Color is decoration unless it carries meaning, and meaning always has an icon and a word.
- Anything a learner must see to use the page (icons, checkboxes, focus rings) needs 3:1 or better against its background.
- **Components:** content sits in white **fields** (12px corners, soft navy-tinted shadow, a small node dot on the left edge) rather than heavy boxes. Banners are pills. Soft shadows only, never gray or black.
- **Form sheet:** write-in areas use a pale sky fill with ink text, key answers are white with a cobalt outline, checkboxes are white squares with a 1.5pt ink outline.
- **Type:** Anybody Bold for headings, Inter for everything else, self-hosted. Verify each font's license file when bundling.
- **Components list:** SceneHeader (clock, place), StoryCard, ChoiceField, OutcomePill, ConsequenceCard, FormSheet, PolicyDrawer, StatusChips, MondayCard, ProgressDots.

## 10. Storyline bridge

**Two routes. Build both and let ArchieCur test which one works.**

*Route A: same origin.* Bundle the built module inside the Storyline package. The module can then call:

```js
try { window.parent.GetPlayer().SetVar(cfg.variable, true); } catch (e) { /* not same origin */ }
```

*Route B: externally hosted.* Browsers block a cross-origin frame from reaching its parent's objects, so use a message:

```js
window.parent.postMessage({ source: 'scenario-engine', type: 'complete', moduleId: cfg.moduleId }, cfg.targetOrigin || '*');
```

On the Storyline side, an "Execute JavaScript" trigger on slide start (**untested, for ArchieCur to verify**):

```js
if (!window.__scenarioListener) {
  window.__scenarioListener = true;
  window.addEventListener('message', function (e) {
    if (e.data && e.data.source === 'scenario-engine' && e.data.type === 'complete') {
      GetPlayer().SetVar('ScenarioComplete', true);
    }
  });
}
```

**Requirements**

- The variable name, module id and target origin come from configuration (module config plus optional query parameters such as `?sv=ScenarioComplete`), never hard-coded.
- The completion message carries no learner data.
- Ship `tests/storyline-harness.html`: a page that embeds the built module in an iframe, provides a stub `GetPlayer()` and a message listener, and shows when completion arrives. This lets us test without Storyline.
- Document known unknowns: embedding behavior inside the LMS, whether the host page allows framing, local-folder bundling in the Storyline version in use, and Review 360 versus published output. ArchieCur will test after the build.
- Layout must work from about 320px wide up to a 16:9 frame. No dependence on window size beyond fluid layout.

## 11. Accessibility and quality gates

- WCAG 2.1 AA as the target. Automated checks (for example axe) plus a manual keyboard pass.
- Body text 16px or larger on phones. Touch targets 44px or larger.
- Visible focus indicators with 3:1 contrast.
- Logical reading order, real headings, labelled form controls, alt text where needed, decorative graphics hidden from assistive technology.
- Test at 320, 375, 768 and 1280 widths, inside an iframe, and with storage disabled.

## 12. Content lint and public-safety checks

Add scripts that fail the build on:

- **Graph problems:** a `next` that points nowhere, unreachable nodes, dead ends, a flag used but never set.
- **Language problems:** banned words from section 8, emoji, italics or underline markup, exclamation marks in outcome labels.
- **Child-name problems:** a child referred to by anything other than initials.
- **Contrast problems:** any token pair below its required ratio.
- **Public-safety problems:** a **banned-strings check** that reads its list from a **local file that is not committed** (ArchieCur will keep it). Never commit that list, because the list itself would reveal what it protects. Also fail if any file other than the built output exceeds a size limit or any image file appears.

## 13. Phases

1. **Plan review** (this handoff and your reply).
2. **Skeleton:** repo, build, engine with one placeholder scene, harness page, CI checks.
3. **Content pass:** Sonnet drafts all three scenes as content files. ArchieCur reviews vocabulary and realism.
4. **Build and polish:** components, form sheet, policy drawer, accessibility pass.
5. **Test:** timing with a few volunteers, Storyline and LMS trials.
6. **Documentation:** README for non-coders, contributor disclosure, lessons learned.

## 14. Questions for you

1. Framework and build tool: what would you choose for this engine, and why?
2. Can we produce a build that works from `file://` and in an iframe without a server? What are the traps?
3. How should we structure the content schema so flags, variants and translation stay manageable?
4. Is the `localStorage` to `sessionStorage` to memory fallback enough for resume, given embedded-frame restrictions?
5. What is the best accessible pattern for the form sheet (write-in areas filled by choices)?
6. Which CI checks can run on GitHub for this repo at no cost?
7. How do you want GitHub Pages configured (`/docs` or a workflow)?
8. Are ten decision nodes too many for a phone session of about 10 to 13 minutes? Sonnet's first candidates to cut are 1.3 and 1.4.
9. Anything in the Storyline bridge that you know to be wrong or fragile?
10. What did we miss?

---

## Appendix A: Proposed edits to the mock policy (v1.1)

*Wording below is proposed. ArchieCur to confirm before it goes into `modules/biting-incident/source/`.*

1. **Step 1, add:** "If you are the only adult in the room, keep the rest of the class in view and call the office for support. Do not leave the group unsupervised."
2. **Step 4, replace the parenthetical** "(If the bite broke the skin, contact the parents via phone immediately)" with: "(If the bite broke the skin, notify the Center Director first, then phone the bitten child's parent immediately. The other child's parent is notified the same day.)"
3. **Footer note:** "First aid steps in this mock policy are for training purposes. A real program's first aid guidance should be reviewed by a qualified health professional."

## Appendix B: Phase 2 upgrade path (not in this prototype)

- **Report coach:** the learner types the incident description and a model flags judgmental wording. Needs a small server-side proxy to protect the API key, because GitHub Pages is static.
- **Parent role-play:** a live face-to-face conversation for scene 3.
- Both would produce usable per-learner cost estimates from the API console for the stakeholder story.

## Appendix C: Lessons from the earlier HR repo (for a later cleanup handoff)

- README points to `lesson/`, but the files are served from `docs/`.
- Duplicate `index.html` at the repo root and in `docs/`.
- Copy conflicts with the repo's own principle of no "Correct" or "Wrong" messaging ("See what you got right", "Good call", "That is exactly right").
- Each unit file repeats the same window components, taskbar and debrief logic (about 1,000 lines each), so any change has to be made three times.
- A development React build and an in-browser Babel compiler are loaded from a CDN.
- The last button says "Back to Unit 1" but links to the landing page.
- Emoji used as icons.

## Appendix D: Contributor disclosure for the README

- **ArchieCur:** instructional designer and domain expert. Final decisions, vocabulary and realism review.
- **Claude Sonnet 5.5:** planning, content drafting, Handoff files.
- **Claude Code:** plan review, implementation, repository maintenance.

(Record the specific model version for each commit in commit messages.)

## Appendix E: Handoff conventions

- File name: `NN_Author_Topic.md`, numbered in order.
- Every file starts with a table of From, To, Date, Status.
- Decisions are logged with who made them and the date.
- Never delete a Handoff. Supersede it with a new one and say so at the top.
