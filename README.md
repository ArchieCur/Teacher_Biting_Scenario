# Teacher_Biting_Scenario

Interactive, branching practice scenarios for early learning teachers. The first module puts a novice preschool teacher through one day after a biting incident: the moment it happens, nap time (the reporting form) and pickup (talking with both families).

Each scenario is a small, self-contained web page. It runs in any modern browser, on a phone or a computer, with no internet connection and no server. Articulate Storyline embeds it, and the scenario tells Storyline when the learner has finished.

> The feedback in these scenarios is scripted. It does not use AI. The center, the policy and the people are fictional.

**Status:** prototype. All three scenes are written and pass the automatic checks. Next: showing the Parent Notice as a document, shuffling option order, and timing tests with volunteers (see `Handoffs/`).

---

## Try it

- **On GitHub Pages** (after Pages is turned on, see below): open the site and choose the scenario.
- **On your computer:** download the repository (green **Code** button > **Download ZIP**), unzip it, and double-click `docs/biting-incident/index.html`.

## Put it in Storyline

1. Download the repository as a ZIP (green **Code** button > **Download ZIP**) and unzip it.
2. The scenario is the folder **`docs/biting-incident/`**. Everything it needs is inside that folder.
3. In Storyline, create a **True/False variable** named exactly **`ScenarioComplete`**, set to False. The scenario sets it to True when the learner reaches the end. If the variable does not exist, nothing happens and there is no error, so check the spelling.
4. Insert > Web Object > choose the `biting-incident` folder. Set it to display **in the slide** (not in a new window).
5. Add a trigger: when `ScenarioComplete` changes, if it is True, complete the course (or go to the next slide).
6. Also add this **Execute JavaScript** trigger, when the timeline starts on the slide with the web object. It is the backup route for when the scenario is hosted somewhere else (for example Review 360):

   ```js
   if (!window.__scenarioListener) {
     window.__scenarioListener = true;
     window.addEventListener('message', function (e) {
       // Optional: once you know where the scenario is hosted, uncomment the next line
       // and put that address in, so only that site can mark the scenario complete.
       // if (e.origin !== 'https://YOUR-HOST.example') return;
       if (e.data && e.data.source === 'scenario-engine' && e.data.type === 'complete') {
         GetPlayer().SetVar('ScenarioComplete', true);
       }
     });
   }
   ```

7. Test from **published output**, not Storyline's preview. Preview does not always run web objects.

**Using a different variable name:** add `?sv=YourName` after `index.html` in the web object address, or change `storyline: variable:` in `modules/biting-incident/module.yaml` and build again.

**What the scenario sends:** only "complete" and the module name. No learner data, no answers, no score.

### Not yet known (to be tested)

- How the LMS packages the course (SCORM 1.2, SCORM 2004 or xAPI), and whether it opens in a frame or a pop-up.
- Whether the LMS allows content from another web address inside a frame.
- Review 360 serves from its own address, so there the backup route (step 6) is the one that works.
- Whether saved progress survives inside the LMS. The scenario works without it, and the Pause button tells the learner honestly whether their progress was saved.

## Test without Storyline

`docs/storyline-harness.html` pretends to be the Storyline player. It shows when each completion route arrives. You can choose the route, add frames in between (like an LMS does), pick a screen width, simulate blocked storage and turn on the timing log.

Open it from a folder and route B works. Route A needs a local web server, because browsers treat local files as separate sites: run `npm run serve` (see below) and open the address it prints.

## Timing log

Add `?timing=1` to the scenario address (or tick **Timing log** in the harness). At the end, a table shows how long each step took. It stays on that device. Select the text box to copy it.

---

## One-time setup (to build or check the scenario)

You only need this to change the scenario. To use it, the `docs/` folder is enough.

1. Install **Node.js** (the "LTS" version) from nodejs.org. Accept the defaults.
2. Open the repository folder in VS Code, then open a terminal (**Terminal > New Terminal**).
3. Type `npm install` and press Enter. This downloads the build tools into `node_modules/` and turns on the public-safety check for commits. It should say **"Public-safety commit hook is active."** If it warns instead, and the folder is on a USB or external drive, git may not trust the drive. Run the line below once (with your folder's path), then `npm run hooks`:

   ```
   git config --global --add safe.directory E:/Teacher_Biting_Scenario
   ```
4. Create your banned-strings list (see **Public safety** below).

## Everyday commands

Type these in the terminal, in the repository folder.

| Command | What it does |
|---|---|
| `npm run build` | Builds the scenario into `docs/`. Run it after any change, then commit `docs/` too. |
| `npm run dev` | Builds a test version into `.dev/` with a **Dev** panel (jump to any step, set flags) and keeps rebuilding as you save. Open `.dev/biting-incident/index.html`. Ctrl+C stops it. |
| `npm run lint` | Checks the content, colors, built files and public safety. Tells you the file and line of any problem. |
| `npm test` | Tests the engine and the checks. |
| `npm run test:browser` | Plays the scenario in a real browser: accessibility, keyboard, saving, the harness. First time only: `npx playwright install chromium`. |
| `npm run check` | Lint, tests, build, and confirms `docs/` is up to date. Run before you commit. |
| `npm run serve` | Serves `docs/` at http://localhost:8080 (only on this computer), so route A can be tested in the harness. Ctrl+C stops it. |

**Content preview:** after a build, open `docs/previews/biting-incident.html` to read every step, option and variant on one page.

## Where things are

```
Handoffs/                  Planning and decision trail. Never deleted; newest last.
engine/                    Shared by every module
  src/                     The scenario engine (plain JavaScript)
  styles/                  Colors (tokens.css), fonts, layout
  strings/en.yaml          Button labels and other engine text
  schema/                  Rules the content files must follow
  index.html               Page template
modules/
  biting-incident/
    module.yaml            Settings, characters, flags, the reporting form layout
    scenes/                One file per scene (the scenario text)
    source/                The fictional policy and form (source of truth)
  README.md                How to write a module
scripts/                   Build, checks, local server, commit hooks
tests/                     Engine tests, browser tests, the Storyline harness
docs/                      Built output (GitHub Pages serves this). Do not edit by hand.
```

## Adding a module

Copy `modules/biting-incident/` to a new folder, change `id` in `module.yaml`, write the scenes, and build. The engine does not change. See `modules/README.md`.

---

## Public safety

This repository is public. It must not contain organization names, brand material, logos, photos, real people or real center names.

- **Banned-strings list.** Create a file named `.banned-strings.txt` in the repository folder, with one word or phrase per line. It is never committed (git ignores it). Every commit is checked against it, and so is every commit message. The check reports only the file and line, never the matched words.
- **On GitHub:** add the same lines as a repository secret named `BANNED_STRINGS` (Settings > Secrets and variables > Actions > New repository secret). The automatic checks use it. Until it exists, the checks on GitHub fail on purpose.
- **No Office, PDF or image files.** Word files carry the author's name in their properties, so only Markdown versions are committed. Images are not used (no logos, photos or stickers).
- **Commit author.** Every commit records a name and email. Use your GitHub handle and GitHub's private "noreply" email for this repository, not a personal address.

## GitHub Pages

Settings > Pages > **Deploy from a branch** > branch `main`, folder `/docs` > Save. The site appears a minute later at the address GitHub shows.

## Automatic checks

`.github/workflows/ci.yml` runs on every push: lint, tests, a check that `docs/` matches a fresh build, and the browser tests. They are free for public repositories.

---

## Contributors

- **ArchieCur:** instructional designer and domain expert. Final decisions, vocabulary and realism review.
- **Claude Sonnet 5.5:** planning, content drafting, Handoff files.
- **Claude Code (Claude Opus 5.5):** plan review, implementation, repository maintenance.

The model used for each change is recorded in its commit message.

## License

MIT. See `LICENSE`. The fonts (Anybody and Inter) are under the SIL Open Font License; their license files ship in each module's `fonts/` folder.
