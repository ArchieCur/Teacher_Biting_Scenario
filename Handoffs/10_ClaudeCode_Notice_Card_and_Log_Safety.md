# Handoff 10: Shorter notice card, public-log safety, push

| | |
|---|---|
| **From** | Claude Code (Claude Opus 5.5) |
| **To** | ArchieCur and Claude Sonnet 5.5 |
| **Date** | 2026-10-22 |
| **Status** | R13 and R15 done, all checks pass, committed locally. R14 (push) waits for ArchieCur's go; section 4 will be filled in after the push. |
| **Replies to** | `09_Sonnet_Confirmations_and_Notice_Card.md` |
| **Reply expected** | ArchieCur: "push" when ready |

> Public-safe: no organization names, brand material or real people.

## Plain-English summary (for ArchieCur)

- **Done:** the Parent Notice card now shows only the completed copy and fits on one phone screen. GitHub will also hide your banned words in its public logs, as an extra safeguard.
- **Next:** say "push". Then turn on Pages, and the timing test can begin.

---

## 1. R13: shorter Parent Notice card (D40)

- `source/Parent_Notice_v1.0.md` is now `source/Parent_Notice_v1.1.md`, renamed with git so its history is kept. Both "Training example" headings now read "Completed notice"; version 1.1, date 2026-10-22, and the change log row from Handoff 09 are added. No other wording changed.
- `module.yaml` points at the v1.1 file. Nodes 3.1 and 3.3 use the nested sections from Handoff 09 section 2.
- `modules/README.md`'s example now uses "Completed notice".
- **Card height at 375 px wide: 560 px**, on an 800 px screen (it was about 1,100 px). A browser test now fails if the card is taller than the screen.
- axe reports no violations on that screen.
- Checks: lint passes (the two accepted warnings remain, D41 and D42); 44 of 44 unit tests; 18 of 18 browser tests; `docs/` up to date.

One small note: the card now reads "Parent Notice", then "Completed notice". It no longer says which family it is for. Nodes 3.1 and 3.3 make that clear in their text, so no change is needed unless Sonnet prefers a heading such as "Completed notice (A.K.'s family)" in the source file.

## 2. R15: can the GitHub check run without printing banned words in the public log?

**Yes.** Three layers:

1. **The banned-strings check never prints a match.** It reports only file and line ("matches an entry in the banned-strings list"). Unit tests check this.
2. **New: GitHub hides every entry.** The first step of the automatic check now registers each entry of the `BANNED_STRINGS` secret as hidden text, as written, in lower case and in upper case. GitHub then replaces those words with `***` anywhere in that run's logs, including output from other steps. This closes a gap: other checks quote text when they report a problem (for example, the child-name check prints the word it suspects), so a banned name that reached GitHub could otherwise be echoed by a different check. GitHub never prints the registration commands themselves.
3. **The secret value is hidden too.** GitHub hides the secret in logs automatically, and pull requests from other people's copies of the repository (forks) never receive it.

**Limits, for the record:**

- Hiding matches the exact text in those three forms. A mixed-case variant (for example "aBc") would not be hidden, but the banned-strings check still fails the run, so it cannot pass unnoticed.
- The local commit check is the real protection (Handoff 03). GitHub's check only runs after something is already public. **Editing files directly on github.com skips the local check**, so make changes on your computer and let Claude Code commit them.

## 3. Other review notes on Handoff 09

- **Phone shuffle check (Handoff 09 section 4, step 3):** with three options, a learner's shuffled order matches the written order about one time in six. If the first two decisions look the same with `?order=authored`, check two or three more before concluding anything is wrong.
- **Deleting v1.0:** done as asked. The first commit still holds v1.0, so nothing is lost.

## 4. R14: push and Pages

*Waiting for ArchieCur's go. To be filled in after the push: the repository address, the Pages address, and the result of the first automatic check.*

## 5. Decisions recorded

| # | Decision | Decided by | Date |
|---|---|---|---|
| D44 | The GitHub check hides every banned-strings entry in its logs (as written, lower case, upper case) | Claude Code, for R15 | 2026-10-22 |
