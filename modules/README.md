# How to write a module

A module is a folder in `modules/` with a `module.yaml` and one YAML file per scene in `scenes/`. The engine reads these files at build time; no code changes are needed for new content. `npm run lint` checks everything below and reports the file and line of any problem.

YAML tips: indent with spaces, never tabs. Put text in quotes if it starts with a special character or contains `: ` (colon and space). Long text can use `>-` and continue on indented lines; a blank line inside makes a new paragraph.

## module.yaml

| Field | What it is |
|---|---|
| `id` | Folder-safe name, lowercase with hyphens. Becomes the output folder name. |
| `title` | Shown in the browser tab and on the intro screen. |
| `start` | Id of the first node. |
| `scenes` | Scene file names in playing order, without `.yaml`. |
| `intro` | `heading` and `body` for the first screen. |
| `disclosure` | The scripted-feedback note. Shown on the intro and the wrap. |
| `characters` | `children` by initials (with pronouns) and `adults` by name. The name check uses this list. |
| `flags` | Every flag, with `default` and a one-line `description`. |
| `storyline` | `variable` (the Storyline True/False variable) and `targetOrigin`. |
| `policy` | `file` (the policy in `source/`) and `buttonLabel`. Shown in the slide-up policy panel. |
| `documents` | Source documents a node can show as a paper card, each with an id, a `file` in `source/` and a `title`. |
| `form` | The reporting form layout: sections and fields. Labels must match the source form word for word. |

Form fields have an `id`, a `label`, an optional `group` (a shared sub-heading such as "Child Bitten - Parent Notified"), and a `kind`:

- `text`: a write-in line.
- `choice`: one of `options` (for example Yes or No).
- `checks`: any of `options` (check all that apply).

## Scene files

```yaml
id: nap-time            # scene id
title: Nap time         # shown in the scene header
clock: "12:40 PM"
place: Room 4
nodes:
  - ...                 # one entry per screen, in any order
```

### Node types

| Type | Use | Needs |
|---|---|---|
| `story` | A narrative card, with or without choices | `heading`; `choices` or `next` |
| `dialogue` | Someone speaks; the options are the exact words the learner says | `speaker`, `line`, `choices` |
| `form` | The reporting form appears; choices fill it in | `sections`, `choices` |
| `debrief` | End-of-scene reflection with an optional Monday card | `heading`, `next` |
| `wrap` | The end: day at a glance, Monday card, completion event | `heading` |

Every node has an `id` (unique across the whole module), a `type` and a `heading`, and may have a `body`. A node with choices also needs a `prompt` (the question above the options) and a `summary` (two to four words, used in "Your day at a glance").

A node can show one section of a declared document above its choices:

```yaml
document:
  id: parentNotice
  section: Notice for the family of the child who was bitten
```

`section` is a heading in the document, spelled exactly. Use `Heading > Sub-heading` for a nested one, for example `Notice for the family of the child who was bitten > Training example` to show only the filled-in example. `document` can have variants (a list of `{ when, id, section }`, the last one without `when`). The lint fails if the document or the section does not exist.

`form` nodes list which form sections are worked on now and which come later:

```yaml
sections:
  active: ["1", "2", "3"]
  later: ["4", "5"]
  laterNote: Complete these after pickup.
```

### Choices

```yaml
choices:
  - id: 1.1-b                      # unique across the module
    label: Step between them, keep the whole room in view, and call the office.
    tone: held                     # held | partial | risk
    outcomeLabel: This held up     # optional; defaults come from engine/strings/en.yaml
    consequence: Within two minutes...
    why: Policy step 1 says...     # two sentences or fewer
    say: Biting hurts. We keep our teeth to ourselves.   # optional
    setFlags: { calledForHelp: true }                     # optional
    fill: { staffPresent: "Nina Rodriguez" }              # optional, form nodes
    showIf: { checkedSkin: false }                        # optional
    next: "1.2"
```

Each learner sees the options in their own shuffled order, kept on resume. Write every option so it makes sense in any position (no "both of the above"). If a node's order matters, add `fixedOrder: true` to the node. The lint warns when the held option is the longest in most decisions, because length can give the answer away even when position does not.

The learner picks an option, then presses "Lock in my choice". There is no going back. The engine then shows the locked choice, the outcome (icon plus words), the consequence, "Why" and, if present, "Say this".

### Flags, variants and conditions

A condition is a list of flags with `true` or `false`, and all of them must match: `{ checkedSkin: false, jottedNote: true }`. There is no "or". If you need one, add a flag.

Any text can have variants. They are tried in order, and the **last one has no `when`** (it is the default):

```yaml
body:
  - when: { jottedNote: true }
    text: You check your sticky note. 10:20, left forearm, a red mark.
  - text: You try to remember. Around 10:20, you think.
```

`next` can have variants too, with `to` instead of `text`. Form `fill` values use `value`.

Conditions inside a choice see the flags **after** that choice's own `setFlags`.

Every flag must be set by at least one choice and read somewhere (a variant, a `showIf` or a conditional `next`). A flag that changes nothing fails the lint.

### Text rules (from Handoff 01 section 8)

- Sentence case. No emoji. No italics or underline: use `**double asterisks**` for semibold.
- Outcome labels, debriefs and the wrap: no "correct", "wrong", "mistake", "good job" or exclamation marks.
- Children by initials only, as declared in `module.yaml`. The lint flags capitalized words that look like names. If a word is not a name, add it to `scripts/lint/allowed-capitalized-words.txt`.
- Plain language, about grade 6 to 8. The lint warns (but does not fail) above grade 9.
- Quote the policy's own words in "Why" text. Do not make requirements stronger or weaker than the policy. The lint checks that a quote right after a policy reference (for example, Step 4 says to talk "gently and privately.") matches the policy word for word.

## Checking your work

- `npm run dev`, then open `.dev/<module>/index.html`: the **Dev** panel jumps to any node with any flags. In the address bar: `?node=2.1&flags=checkedSkin,jottedNote`.
- `npm run build`, then open `docs/previews/<module>.html` to read every node and option on one page.
- `npm run lint` before committing.
