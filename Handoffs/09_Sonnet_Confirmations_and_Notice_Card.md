# Handoff 09: D33 and D34 confirmed, shorter Parent Notice card, push cleared

| | |
|---|---|
| **From** | Claude Sonnet 5.5, with ArchieCur's confirmations |
| **To** | Claude Code (Claude Opus 5.5), and ArchieCur |
| **Date** | 2026-10-22 |
| **Status** | Decisions recorded. One small source change for Code. |
| **Replies to** | `08_ClaudeCode_Edits_Notice_Shuffle.md` |
| **Reply expected** | `10_...` from Claude Code: push done, Pages address, notice-card change applied |

> Public-safe: no organization names, brand material or real people.

## Plain-English summary (for ArchieCur)

- **What this is:** your confirmations of D33 and D34, and my answers to Code's three content questions.
- **What changes in the module:** the Parent Notice card gets shorter. It will show only the completed example, not the blank template as well.
- **What you do:** nothing new. The repository and the `BANNED_STRINGS` secret are in place. Tell Code to push, then turn on Pages. After that, the volunteer timing test can start.

---

## 1. Decisions

| # | Decision | Decided by |
|---|---|---|
| D33 | **Confirmed:** Parent Notice shown as a document card, declared once under `documents:` and shown per node with `document: { id, section }`. | ArchieCur |
| D34 | **Confirmed:** per-learner seeded shuffle, `fixedOrder`, and the length warning. | ArchieCur |
| D40 | **Shorter notice card.** Each Parent Notice card shows only the completed example. In `source/Parent_Notice_v1.0.md`, rename both "Training example" headings to "Completed notice" and raise the version to 1.1 (change log entry below). Nodes 3.1 and 3.3 name the nested section (section 2). | Sonnet 5.5 |
| D41 | **Option length is balanced after the timing test, not before.** Cuts from the test may change labels, and one balancing pass is cheaper than two. The lint warning stays on in the meantime. | Sonnet 5.5 |
| D42 | **Node 3.d reading grade 9.1 is accepted.** It is a warning, not a failure. | Sonnet 5.5 |
| D43 | **Push is cleared.** The repository and `BANNED_STRINGS` secret are in place. ArchieCur tells Code to push, then turns on Pages. | ArchieCur |

D38 and D39 from Handoff 08 are noted and accepted as written.

## 2. Source and content change for Code

**Parent Notice source file.** Rename the two "Training example" headings (under each family's notice) to "Completed notice". Raise the front matter `version` to "1.1" and the date to 2026-10-22. Add this row to the change log:

| Version | Date | Change | Decided by |
|---|---|---|---|
| 1.1 | 2026-10-22 | Renamed both "Training example" headings to "Completed notice" so a module card can show the filled copy alone. No wording changes. | Sonnet 5.5, with ArchieCur's confirmation of D33 |

Update the `file:` path in `module.yaml` to the new version name if the file name carries the version (`Parent_Notice_v1.1.md`), and delete v1.0, because nothing relies on it yet.

**Nodes.** Use the nested section form that Handoff 08 section 3 describes:

| Node | `document.section` |
|---|---|
| 3.1 | `Notice for the family of the child who was bitten > Completed notice` |
| 3.3 | `Notice for the family of the child who bit > Completed notice` |

No scene wording changes. The `why` text in 3.1 already says to give her the Parent Notice, and the card is the same document.

## 3. Requests for Claude Code

| # | Request |
|---|---|
| R13 | Apply section 2. Rerun lint, unit tests, build and browser tests. Confirm the card is about one screen at 375 px and that axe still reports no violations on that screen. |
| R14 | Once ArchieCur says go, push `main`. Report the Pages address and the result of the first automatic check on GitHub. |
| R15 | In `10_...`, say whether the GitHub check can run the banned-strings test without printing a matched string in the public log (file and line only). If it cannot, say how to change it. |

## 4. Next steps in order

1. Claude Code applies R13.
2. ArchieCur tells Code to push, then turns on Pages (Settings > Pages > `main`, folder `/docs`).
3. ArchieCur checks the shuffle on a phone: note the first two decisions' order, reload and confirm it is unchanged, then open with `?order=authored` and confirm it differs.
4. Volunteer timing test (three volunteers, one sitting each, as the README describes). If the median is over 15 minutes, apply the Handoff 03 cut order (D35).
5. Sonnet makes one option-length balancing pass (D41), then ArchieCur does the realism review (Handoff 05 section 7).

## 5. Open items

| Item | Owner | Blocks? |
|---|---|---|
| Notice card change (R13) | Claude Code | The push |
| Push and Pages (R14, D43) | ArchieCur and Claude Code | The timing test |
| Public log safety (R15) | Claude Code | No |
| Volunteer timing test, then any cuts (D35) | ArchieCur and Sonnet | Phase 5 |
| Option-length balancing pass (D41) | Sonnet | After the timing test |
| Realism review (Handoff 05 section 7) | ArchieCur | No |
| LMS admin's answers | ArchieCur | No |
