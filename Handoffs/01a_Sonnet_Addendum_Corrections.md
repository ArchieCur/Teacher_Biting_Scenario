# Handoff 01a: Addendum to Handoff 01 (corrections and confirmations)

| | |
|---|---|
| **From** | Claude Sonnet 5.5, with ArchieCur |
| **To** | Claude Code |
| **Date** | 2026-10-21 |
| **Status** | Supplements `01_Sonnet_to_ClaudeCode_Project_Plan.md`. Where the two disagree, this file wins. |
| **Reply expected** | Fold these changes into `02_ClaudeCode_Review.md`. No separate reply needed. |

> Public-safe: no organization names, brand material or real people.

## 1. Correction: the email simulation is a separate follow-up, not part of this module

Handoff 01 treated the existing email-practice simulation as the next step after scene 3. That was a misunderstanding. The facts:

- The email simulation is a **reinforcement activity delivered about 10 days after the course is completed**.
- It covers a **different incident**: a bite that was *not* reported to the teacher during the day, which the child then mentions to the parent at home.
- It is delivered separately and is **not linked from this module**.

**What changes in Handoff 01**

| Where | Change |
|---|---|
| Section 2, third bullet | Delete the sentence saying this module hands off to the email simulation. The simulation is outside this module's scope. |
| Section 7.2, final `wrap` screen | Remove the link to the email simulation and the configurable URL. The wrap screen shows the "day at a glance" recap, the Monday card, and fires the `complete` event. |
| Section 13 and Appendix B | No dependency on the email simulation. Appendix B (phase 2 upgrade path) is unchanged. |
| Section 5 (`module.json`) | No `nextStepUrl` field is needed for the prototype. |

**What stays the same.** The stakeholder story for the overall project is still "AI and a coding agent built this quickly, and a separate email exercise shows live AI practice," but that story is told outside the module. Nothing in the learner experience should mention the email simulation or the 10-day follow-up. If the course team wants to announce a follow-up, they do it in the Storyline course.

**Design note.** The two pieces make a useful spaced pair: this module teaches the notification and reporting sequence, and the follow-up tests whether it transfers when the teacher *didn't* know about the bite. No engine work is required for that. The only requirement is that the **mock policy stays consistent** across both, so ArchieCur will check the email simulation against policy v1.1 (see section 3).

## 2. Confirmations from ArchieCur

| # | Item | Status |
|---|---|---|
| D7 | Mock policy edits (Appendix A of Handoff 01) | **Approved.** The revised document is Policy v1.1 and goes into `modules/biting-incident/source/`. |
| D11 | Module length | **Delegated to Sonnet and confirmed.** Keep ten decision nodes. Target about 11 to 13 minutes. If timing tests show more than 13 minutes, cut 1.3 and 1.4 first. |
| D10 | Fonts (Anybody for headings, Inter for body) | **Approved**. |

## 3. Policy v1.1 is final for the prototype

The file is `Biting_Policy_v1.1.docx`. It contains exactly three changes, all from Appendix A of Handoff 01:

1. Step 1: added the "only adult in the room" sentence.
2. Step 4: clarified the broken-skin notification order (Director first, then phone the bitten child's parent, with the other parent notified the same day).
3. Footer: version line and the first aid training note.

Please use this wording as the source of truth for all "Why" text in the content files. Do not paraphrase the policy into stronger or weaker requirements.

## 4. Open question for ArchieCur (not for Claude Code)

The mock reporting form says it is "for internal administrative use only," and the policy never says what, if anything, a parent receives in writing. A realistic pickup conversation will raise it ("Can I get that in writing?"). ArchieCur to decide whether the fictional center gives parents a short notice with no other child named, and if so, what it contains. This does not block the engine or the build. It affects scene 3 content only.

## 5. Where scene 3 realism material goes

Content-realism material (what parents actually say at pickup, how pickup works at the fictional center) goes to **Sonnet for the content pass**, not to Claude Code. Claude Code's role there is limited to presentation questions, for example how the dialogue component displays exact wording on a phone.
