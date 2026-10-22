# Handoff 10: Shorter notice card, public-log safety, push

| | |
|---|---|
| **From** | Claude Code (Claude Opus 5.5) |
| **To** | ArchieCur and Claude Sonnet 5.5 |
| **Date** | 2026-10-22 |
| **Status** | R13 and R15 done, all checks pass, committed locally. History scanned clean before the push (section 4). Pushed; Pages live; first automatic check hung on the browser install and was fixed (section 5). |
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

## 4. Pre-push check of the whole history (Sonnet's final request)

Before the first push, every commit on `main` (what a push uploads) was scanned against ArchieCur's banned-strings list (12 entries), reporting locations only:

- every commit message, and every author and committer name and email;
- every file path that has ever existed;
- the contents of every version of every file, including all of `docs/` (fonts skipped, as binary).

**Result: no matches.** The check was also proven to work: run with a test word known to be in the content, it reported each location (including `docs/`).

The author fix in Handoff 08 left one old copy of the first commit on this computer, with the earlier short noreply address. It is not part of `main`, so a push never sends it. Its author, committer and message were checked anyway: no matches.

## 5. R14: push and Pages

**Pushed** on 2026-10-22 with ArchieCur's go (D43): four commits on `main` to https://github.com/ArchieCur/Teacher_Biting_Scenario.

**Pages** (Settings > Pages > `main`, folder `/docs`):

| Page | Address |
|---|---|
| Landing page | https://archiecur.github.io/Teacher_Biting_Scenario/ |
| The scenario | https://archiecur.github.io/Teacher_Biting_Scenario/biting-incident/index.html |
| For volunteers | the scenario address with `?timing=1` added |
| Content preview | https://archiecur.github.io/Teacher_Biting_Scenario/previews/biting-incident.html |
| Storyline harness | https://archiecur.github.io/Teacher_Biting_Scenario/storyline-harness.html |

Pages was first set to the root folder, which published the README. Switching to `/docs` fixed it. ArchieCur played the scenario through on the live site.

**First automatic check: cancelled, not failed.** On GitHub's computer, every check of the scenario passed: hiding the banned strings in the log, the full lint (including public safety against the `BANNED_STRINGS` secret), the unit tests, and `docs/` matching a fresh build (so a Linux build is byte-for-byte the same as the Windows one). Then "Install browser for tests" hung until GitHub's 6-hour limit cancelled the run, so the browser tests never ran. GitHub's notes on the run say the standard `ubuntu-latest` computer is moving to a new Ubuntu version this month; the browser installer most likely stopped at a system prompt on that version. A further note said the checkout and setup-node actions (v4) are deprecated.

**Fix (D45):** the workflow now runs on `ubuntu-24.04` (a version the installer supports), answers system prompts automatically, uses `actions/checkout@v5` and `actions/setup-node@v5`, and has time limits: 10 minutes each for the browser install and the browser tests, 30 minutes for the whole run. A stuck step now stops in minutes, not hours. The result of the next run will be reported in the next Handoff.

## 6. Decisions recorded

| # | Decision | Decided by | Date |
|---|---|---|---|
| D44 | The GitHub check hides every banned-strings entry in its logs (as written, lower case, upper case) | Claude Code, for R15 | 2026-10-22 |
| D45 | The GitHub check runs on a fixed Ubuntu version (24.04) with time limits and current action versions | Claude Code, after the first run hung | 2026-10-22 |
