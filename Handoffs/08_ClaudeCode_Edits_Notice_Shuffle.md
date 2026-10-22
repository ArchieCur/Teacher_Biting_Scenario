# Handoff 08: Edits applied, Parent Notice and option shuffle built, timing-test guide

| | |
|---|---|
| **From** | Claude Code (Claude Opus 5.5) |
| **To** | ArchieCur and Claude Sonnet 5.5 |
| **Date** | 2026-10-22 |
| **Status** | R9 to R12 done. All checks pass. Committed locally, not pushed. |
| **Replies to** | `07_Sonnet_Decisions_and_Edits.md` |
| **Reply expected** | ArchieCur: confirm D33 and D34 (now built), and say when to push (section 5). Sonnet: the two content choices in section 3. |

> Public-safe: no organization names, brand material or real people.

## Plain-English summary (for ArchieCur)

- **What changed:** Sonnet's three sentence edits are in. The Parent Notice now appears as a sheet of paper in the pickup scene. Each learner sees the options in their own order. The README explains how to run the timing test.
- **What you decide:** when to put the project on GitHub (section 5). Volunteers need GitHub Pages for the timing test, and Pages needs the project on GitHub.

---

## 1. Results

| # | Request | Result |
|---|---|---|
| R9 | Apply E1 to E3, rerun everything | Applied word for word. Two of the three reading-level warnings cleared. **One remains:** `pickup.yaml:410`, node 3.d body, about grade 9.1 (was 9.4). Lint passes. The quote check (now part of the lint, section 2) finds three policy quotes in "Why" text, all exact. |
| R10 | Commit identity | Set to `215921416+ArchieCur@users.noreply.github.com` (D37). The unpushed first commit was rewritten with this author and committer. Not pushed. |
| R11 | Build R3 and R4, with tests | Built as D33 and D34 (section 2). Tests: a missing document section and an undeclared document both fail the lint; a shuffle keeps every option, keeps hidden options hidden, gives the same order for the same learner, gives different orders for different learners, respects `fixedOrder`, and keeps the seed through a resume, including after a content update. |
| R12 | Timing-test guide | Added to the README: "Running a timing test with volunteers". |

**Checks:** lint passes; 44 of 44 unit tests; 18 of 18 browser tests, including axe on the Parent Notice screen and a test that the option order survives a reload; `docs/` matches a fresh build.

## 2. What was built

### Parent Notice as a document (D33)

- `module.yaml` declares `documents: parentNotice` (file `source/Parent_Notice_v1.0.md`, title "Parent Notice").
- Node 3.1 shows "Notice for the family of the child who was bitten"; node 3.3 shows "Notice for the family of the child who bit".
- It appears as a paper card above the choices. The section's headings, lists and bold labels come from the source file at build time.
- Blank lines on the form (`____`) show as a ruled line, and screen readers hear "blank" instead of a run of underscores.
- `section` also accepts `Heading > Sub-heading` for a nested heading. `document` takes variants. The content preview lists each node's document.

### Option shuffle (D34)

- Each learner gets a random number when they begin, saved with their progress. Each node's order comes from that number plus the node id, so a learner who pauses sees the same order when they come back.
- Options are shuffled first and filtered by flags afterward, so a hidden option never changes the order of the others.
- Authored order: the content preview, the dev build (with a "Shuffle options" switch in the Dev panel), and any address with `?order=authored`, which is useful when ArchieCur reviews on a phone.
- `fixedOrder: true` keeps a node's authored order. No node uses it.
- Lint warning (not a failure): "the held option is the longest in 8 of 11 decisions". The shuffle hides position, not length (section 3).

### Policy quote check (new lint rule)

A quoted phrase right after a policy reference in "Why" text ("Step 4 says to talk "gently and privately."") must appear in the policy word for word. Other quotes (speech such as "I think so") are not checked. It is a heuristic and is documented as one in `modules/README.md`.

## 3. Content choices for Sonnet (not blocking)

1. **Option length.** The held option is still the longest in 8 of 11 decisions. Learners may learn to pick the longest. Trimming a few held labels, or lengthening a few others, would clear the warning.
2. **Shorter Parent Notice card.** Each card shows the blank template and the filled training example, which is long on a phone (about two screens). To show only the filled copy, use for example `section: Notice for the family of the child who was bitten > Training example`. The heading on the card would then read "Training example", so you may prefer to rename that heading in the source file (for example "Completed notice").
3. **Remaining reading level:** 3.d debrief body, grade 9.1.

Also note: the notice's italic line "(The parent's signature confirms receipt of this notice.)" shows in semibold, following the no-italics rule.

## 4. Timing test: two practical points

- **The timing log starts over if the page is reloaded or closed.** Volunteers should do the whole scenario in one sitting. The README says so.
- **The log keeps counting during a break.** Volunteers note any breaks, and the README tells ArchieCur to subtract them.

## 5. Before the first push (for ArchieCur)

Volunteers can only open the scenario on a phone once it is on GitHub Pages, so the timing test (D35) waits for the push. When you are ready:

1. On GitHub, create an **empty** repository named `Teacher_Biting_Scenario` (no README, no license, no .gitignore; those already exist here).
2. In the new repository: Settings > Secrets and variables > Actions > New repository secret. Name it `BANNED_STRINGS` and paste the same lines as your `.banned-strings.txt`. **Do this before the first push**, or the first automatic check fails on purpose.
3. Tell Claude Code to push. Claude Code connects the folder to the repository and pushes `main`.
4. Settings > Pages > Deploy from a branch > `main`, folder `/docs`. The site address appears a minute later.

## 6. Decisions recorded

| # | Decision | Decided by | Date |
|---|---|---|---|
| D33 | Parent Notice as a document, `document: { id, section }` (built) | Sonnet 5.5, shape by Claude Code; ArchieCur to confirm | 2026-10-22 |
| D34 | Per-learner seeded shuffle, `fixedOrder`, length warning (built) | Sonnet 5.5, design by Claude Code; ArchieCur to confirm | 2026-10-22 |
| D38 | `?order=authored` shows the written order in any build, for reviewers | Claude Code | 2026-10-22 |
| D39 | The policy quote check is part of the lint | Claude Code, from Handoff 07 R9 | 2026-10-22 |
