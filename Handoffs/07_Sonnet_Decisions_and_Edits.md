# Handoff 07: Decisions on Handoff 06, three line edits, noreply address

| | |
|---|---|
| **From** | Claude Sonnet 5.5, with ArchieCur's input |
| **To** | Claude Code (Claude Opus 5.5), and ArchieCur |
| **Date** | 2026-10-21 |
| **Status** | Decisions recorded. Three small content edits for Code to apply. |
| **Replies to** | `06_ClaudeCode_Content_Integrated.md` |
| **Reply expected** | `08_...` from Claude Code: edits applied and re-checked, noreply fix, R3 and R4 built |

> Public-safe: no organization names, brand material or real people.

## Plain-English summary (for ArchieCur)

- **What this is:** the answers to Code's three questions in Handoff 06, so the decision trail stays whole.
- **What changes in the module:** three sentences get simpler wording. No scenes are cut yet.
- **What you do:** nothing new. Please read section 2 once and tell Code and me if you disagree with anything. The timing test is yours to arrange when the build is stable.

---

## 1. Decisions

| # | Decision | Decided by |
|---|---|---|
| D33 | **R3 confirmed.** Declare each document once under `documents:` in `module.yaml`, and show one named section per node with `document: { id, section }`. Node 3.1 shows "Notice for the family of the child who was bitten". Node 3.3 shows "Notice for the family of the child who bit". Variants allowed. | Sonnet 5.5 (shape proposed by Code). ArchieCur to confirm. |
| D34 | **R4 confirmed.** Per-learner seeded shuffle, saved with progress. Preview and dev builds keep the authored order. `fixedOrder: true` is available, and no current node needs it. Add a lint warning when the `held` option is the longest in more than half of the decisions. | Sonnet 5.5 (design proposed by Code). ArchieCur to confirm. |
| D35 | **No cuts for length yet.** Code's word count (about 17.5 min at 180 wpm, about 13 min at 240 wpm) is accepted as the stricter count, replacing Sonnet's 13.4 to 14.6 min estimate. Run the volunteer timing test first (D18). If the median of 3 volunteers is over 15 minutes, apply the Handoff 03 cut order: shorten labels, fold 1.4, merge 2.3 into 2.2, and only then touch 1.3. If it is 15 or under, change nothing. | Sonnet 5.5, as the owner of the module length (D18) |
| D36 | **Reading-level edits applied** to the three flagged lines (section 3). | Sonnet 5.5 |
| D37 | **Commit identity address:** `215921416+ArchieCur@users.noreply.github.com`. Replaces the shorter address in Handoff 06 section 6. | ArchieCur |

## 2. Notes for the record

- **Banned strings:** the list matches inside words. Sonnet checked all current content for banned substrings, including inside longer words. There are no matches. Future content will avoid those words.
- **Handoff wording:** Sonnet refers to the learning management system only as "the LMS" and never names real centers or organizations, even as rejected examples. This follows Handoff 06 section 5. Sonnet had already sent cleaned copies of Handoffs 01 and 03. Code's edits to Handoffs 01 to 04 and the README already cover the same text.
- **Timing method:** the 17 to 18 minute figure counts every option label, consequence, "Why", "Say this", debrief, Monday card and day-at-a-glance. The earlier 13.4 to 14.6 minute figure left some of these out. Use the stricter count when judging the test.

## 3. Content edits for Code (apply, then rerun lint and the quote check)

Each replacement keeps every quoted policy phrase word for word. Line numbers in Code's files may differ slightly from Sonnet's copies, so find each by its text.

| # | File, node, field | Replace with |
|---|---|---|
| E1 | `nap-time.yaml`, node 2.3, choice a (leave sections 4 and 5 blank), `consequence` | You clip a sticky note to the form: "Finish 4 and 5 after pickup." Then you tuck it under your lesson plan, where you will find it. |
| E2 | `pickup.yaml`, node 3.1, choice a, `why` | Step 4 says to talk "gently and privately." Give her the Parent Notice. The internal form has the other child's name on it. |
| E3 | `pickup.yaml`, node 3.d, last sentence of `body` | The confidentiality rule runs both ways: neither child's name goes home with the other family. |

E1 keeps "Finish 4 and 5 after pickup." as the sticky-note text, inside quotation marks in a consequence, as before. E2 and E3 add no new quoted policy text.

## 4. Requests for Claude Code

| # | Request |
|---|---|
| R9 | Apply E1 to E3, then run lint, unit tests, build and browser tests. Report any reading-level warnings that remain, with file and line. |
| R10 | Update the commit identity to the address in D37 and rewrite the author of the unpushed first commit. Do not push until ArchieCur says so. |
| R11 | Build R3 and R4 as in D33 and D34. Add a unit test for each: a document section that does not exist fails lint, and a shuffled order keeps every option and stays the same on resume. |
| R12 | Add a short "how to run the timing test" note to the README for volunteers and ArchieCur: how to turn timing on, what to record (minutes per scene, where they paused), and where the log is saved. Volunteers must not need to install anything. |

## 5. Open items

| Item | Owner | Blocks? |
|---|---|---|
| Confirm D33 and D34 | ArchieCur | Phase 4 |
| Apply E1 to E3 and rerun checks (R9) | Claude Code | The next review |
| Commit identity fix (R10) | Claude Code | The first push |
| Volunteer timing test, then any cuts (D35) | ArchieCur and Sonnet | Phase 5 |
| Realism review (Handoff 05 section 7) | ArchieCur | No |
| LMS admin's answers | ArchieCur | No |
