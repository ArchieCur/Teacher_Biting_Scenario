# Handoff 05: Content pass (three scenes), policy v1.2 and the Parent Notice

| | |
|---|---|
| **From** | Claude Sonnet 5.5, with ArchieCur's decisions |
| **To** | Claude Code (Claude Opus 5.5), and ArchieCur |
| **Date** | 2026-10-21 |
| **Status** | Content drafted and checked with a separate script. Not yet run through the repo's own lint or build. |
| **Replies to** | `04_ClaudeCode_Skeleton_Built.md` |
| **Reply expected** | `06_...` from Claude Code: lint and build results, answers to section 5 |

> Public-safe: no organization names, brand material or real people.

## Plain-English summary (for ArchieCur)

- **What changed:** all three scenes are written, the module settings are updated, the policy is now v1.2 (one new line), and there is a new Parent Notice source file.
- **What it means for you:** once Code builds, you can read every screen on the content preview page and play it on your phone. The Parent Notice appears only as text for now; showing it as a document needs a small engine addition (R3 below).
- **What you decide:** nothing is blocking. When you review the preview, the questions in section 7 are the ones only you can answer.

---

## 1. Files delivered and where they go

| File | Goes to | Action |
|---|---|---|
| `module.yaml` | `modules/biting-incident/module.yaml` | Replace |
| `the-moment.yaml`, `nap-time.yaml`, `pickup.yaml` | `modules/biting-incident/scenes/` | Add; delete `placeholder.yaml` |
| `Biting_Policy_v1.2.md` | `modules/biting-incident/source/` | Add; delete `Biting_Policy_v1.1.md` (nothing is committed yet; the v1.2 change log keeps the history) |
| `Parent_Notice_v1.0.md` | `modules/biting-incident/source/` | Add |
| This file | `Handoffs/` | Add |

The form source stays at v1.1. No form changes were needed.

## 2. Decisions made in this pass

| # | Decision | Decided by |
|---|---|---|
| D22 | Add a Parent Notice as a source file, and one new line in policy Step 4 (policy v1.2). Both families get a notice, each describing only their own child. | ArchieCur |
| D23 | Drop the `StatusChips` component. Visible tracking of choices would feel like scoring. | Sonnet 5.5 |
| D24 | Scene 3 uses ArchieCur's notes: 5:00 PM, front lobby, a loud line at the sign-out desk, the Director on a call with the door closed, the block center, and the five parent reactions. The reactions are spread through the scene by flag variants rather than a fixed chain. | Sonnet 5.5, from ArchieCur's notes |
| D25 | Flags are final at seven: `calledForHelp`, `checkedSkin`, `shadowedDM`, `jottedNote`, `formPrefilled`, `privateTalk`, `confidentialityBroken`. `protectedConfidentiality` from Handoff 03 became `confidentialityBroken` (default false, set on a breach), which reads more naturally in conditions. | Sonnet 5.5 |
| D26 | Incident details: 10:15 AM (was 10:20), right forearm (was left), toy fire truck in the block center. The next-day example in Handoff 03 becomes "the Director asks at 9:45 and you have thirty minutes," with the deadline at 10:15. | Sonnet 5.5, adopting ArchieCur's details |
| D27 | Working title "A bite in Room 4" is kept as the final title. | Sonnet 5.5 |

## 3. What the scenes contain

18 nodes: 11 decisions, 3 narrative cards (1.0, 2.0, 3.0), 3 debriefs and 1 wrap.

| Scene | Nodes | Policy steps taught |
|---|---|---|
| The moment (10:15 AM) | 1.0 setup · 1.1 first move · 1.2 care for A.K. · 1.3 the child who bit · 1.4 the quick note · 1.d debrief | 1, 2, 3 |
| Nap time (12:40 PM) | 2.0 setup · 2.1 incident wording · 2.2 skin and first aid · 2.3 sections 4 and 5 · 2.d debrief | 5 |
| Pickup (5:00 PM) | 3.0 close call · 3.1 where and which paper · 3.2 "Who did this?" · 3.3 D.M.'s family · 3.4 closing the loop · 3.d debrief · end wrap | 4, 5 |

**Changes from the earlier plans**

- **2.3 no longer has "leave the whole form for tomorrow."** Sections 1 to 3 are already filled in at 2.1 and 2.2, so that option no longer made sense. The 24-hour lesson moved to 3.4, framed as Handoff 03 (C2) requires: "first thing tomorrow" is `partial` (accuracy and the Director's time), and only "wait for the Director to ask" breaks the window.
- **2.2 has two new options** from your C9 note: quietly check A.K.'s arm now, and ask the Director to look.
- **3.1 combines two choices in one node:** where to talk, and which paper to hand over. The internal reporting form names both children, so handing it over is the realistic confidentiality breach. This keeps the count at eleven decisions.
- **Flag payoffs (C5):** `calledForHelp` appears in "Staff Members Present" and in the room's mood; `shadowedDM` decides the 3:10 close call; `confidentialityBroken` decides which options appear in 3.2 and 3.4, and whether the confidentiality box can be ticked honestly.

**The five parent reactions in scene 3**

| Reaction | Where it appears |
|---|---|
| Anxious focus ("Did it break the skin?") | The opening line of 3.2 |
| Demand for identity ("Who did it?") | The opening line of 3.2 |
| Accountability ("Where were you?") | After the best answer in 3.2 |
| Safety ("Is he going to be kicked out?") | After a name is shared, or after "don't worry," in 3.2 |
| Escalation ("I want the Director right now") | After "I can't say, ask the Director" in 3.2 |

## 4. How the content was checked

A separate Python script (not the repo's lint) parsed the YAML with `js-yaml` (the same family your build uses) and checked:

- Both schemas: no errors.
- Graph: no dead ends, every node reachable, every `next` exists.
- State walk: 800 flag combinations explored; every decision shows at least two options in every reachable state.
- Flags: all seven declared, set somewhere and read somewhere.
- Variants: every variant list ends with a default.
- Form fills: every field id exists and every choice or checkbox value matches the form's options exactly.
- Language: no "correct", "wrong", "mistake" or "good job" in outcome labels, debriefs or the wrap; no exclamation marks there; no emoji; no italics markup; no quotation marks in dialogue options.
- Policy quotes in "Why" text: each quoted phrase of three words or more was found verbatim in policy v1.2.
- Label length: all options are 25 words or fewer.

**Result:** 0 errors, 10 warnings. Eight are reading grades of 9 to 10 on a few lines. Two are false alarms where initials ("A.K.", "D.M.") were counted as sentence ends. The script's blind spots: your child-name check and reading-level formula may differ from mine.

**Reading time** (at 180 words per minute plus a few seconds per tap, flags at defaults): scene 1 about 4.5 minutes, scene 2 about 3.7, scene 3 about 6. Total about 13.4 to 14.6 minutes, inside the 12 to 15 minute budget (D18). Scene 3 is above the 4 to 5 minute target. Please run your timing log before we cut anything. If testing runs over, the cut order in Handoff 03 still applies.

## 5. Requests for Claude Code

| # | Request |
|---|---|
| R1 | Add three words to `scripts/lint/allowed-capitalized-words.txt`: `Room`, `Parent`, `Notice`. My check flagged only these. |
| R2 | Replace the policy v1.1 source with v1.2 (section 1). Make the policy drawer show only the policy text: skip the front matter and everything from `## Change log` onward. |
| R3 | **Display the Parent Notice as a document (phase 4).** Proposed optional node field, for example `document: { source: source/Parent_Notice_v1.0.md, section: "Training example" }`, rendered as a styled card above the choices in nodes 3.1 and 3.3. Until then the notice is mentioned in text only. Please say whether this is practical, and propose a better shape if there is one. |
| R4 | **Shuffle option order per learner session** (seeded, so it stays stable on resume; preview and dev keep the authored order). In the authored files the best option is usually first or second and tends to be the longest, which teaches learners to guess by position and length. Consider also a lint warning when the longest option is the `held` one in most nodes. |
| R5 | Bodies use `>-` with a blank line for paragraph breaks, per `modules/README.md`. Please confirm they render as separate paragraphs in the preview. |
| R6 | Confirm the engine supports choice labels, consequences and `why` as variants (the schema allows it, and I use it for `label` in 2.1), and that `fill` values accumulate across form nodes (2.1 then 2.2). Confirm that sections 4 and 5 show "Complete after pickup" in scene 2 and become active in 3.4. |
| R7 | Run `npm run lint`, `npm test`, `npm run build` and the browser tests against the new content. Report every lint error with file and line in `06_...`. |
| R8 | Play it through once with the timing log on and report minutes per scene. |

## 6. Flags

| Flag | Set in | Read in |
|---|---|---|
| `calledForHelp` | 1.1-b | 1.2 (body), 2.1 (staff present) |
| `checkedSkin` | 1.2-b, 2.2-e | 2.2 (body and which options appear) |
| `shadowedDM` | 1.3-b | 3.0 (the close call) |
| `jottedNote` | 1.4-a | 2.0 (body), 2.1 (label, consequence, time) |
| `formPrefilled` | 2.3-b | 3.4 (body, consequence) |
| `privateTalk` | 3.1-a, 3.1-c | 3.2 (setting) |
| `confidentialityBroken` | 3.1-c, 3.2-b, 3.3-b | 3.2 (line and options), 3.3 (body), 3.4 (body and options) |

## 7. For ArchieCur: what to check when you read the preview

These are vocabulary and realism questions. They don't need technical knowledge.

1. Does pressing an "office button" and Ms. Lee arriving within two minutes sound like how a real center works?
2. Is a sticky note a realistic tool, or would a teacher use a phone or a clipboard?
3. Do the parent lines in scene 3 sound like real parents? Are any too polished or too angry?
4. Is Ms. Whitfield's "I read the form" moment believable, and is the Director's closed door the right kind of pressure?
5. Does "I can't share the other child's name. We protect every family's privacy." sound like something a teacher would actually say?
6. Is anything in Nina's voice ("you") too stiff or too chatty?

## 8. Open items

| Item | Owner | Blocks? |
|---|---|---|
| Lint, build and timing results (R7, R8) | Claude Code | The next review |
| Parent Notice display and option shuffle (R3, R4) | Claude Code | No; phase 4 |
| LMS admin's answers (packaging type, external content, sandbox) | ArchieCur | No |
| Volunteer timing test | ArchieCur and Sonnet | After the build is stable |
