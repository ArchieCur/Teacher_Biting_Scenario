## 5. Questions for ArchieCur

1. **`.docx` files:** keep them out of the repo (only the `.md` versions go in), or scrub the metadata and commit both? (C1, C8) My recommendation: keep them out. 
**Approved**
2. **Repository name and license:** confirm `role-based-scenarios` (or another name) and MIT. Repository 
**Name is:  Teacher_Biting_Scenario and MIT is the correct license**
3. **Is the `.md` version the single source of truth** for the policy and form from now on? 
**Yes the .md policy and form files will be the source of truth.**
4. **The 24-hour framing (C2):** do you agree that "first thing tomorrow" follows the policy and should be framed as a quality risk, not a deadline miss? Or should policy v1.2 tighten the requirement to "before the end of your shift"? Either is fine, but the scenario and the policy must say the same thing. 
**Can we keep the policy as written, and reframe the scenario?**
5. **Banned-strings list in CI:** are you comfortable storing it as an encrypted GitHub Actions secret, in addition to keeping your local file?
**Yes. A local pre-commit hook is the real protection, and the encrypted CI secret is a backup.**
6. **Exit and pause:** should learners be able to leave mid-scenario from inside the module, or does Storyline's own exit cover it?
**Yes, a small pause control, with the honest messaging above"" 
7. **Storyline setup you can test:** which Storyline version, and will the course be published to the LMS as SCORM 1.2, SCORM 2004 or xAPI? This affects frame depth and resume (Answers 4 and 9), but it doesn't block the skeleton.
** I have Storyline 360 version v3.128.38292.0**