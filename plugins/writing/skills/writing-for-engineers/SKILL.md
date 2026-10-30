---
name: writing-for-engineers
description: "Write or revise technical documentation a human engineer reads: architecture and reference docs, runbooks, decision records, write-ups and reports. Use when drafting or editing such a document, or when a technical text reads as dense, vague, or hard to scan."
---

# Writing for engineers

Write in **STE-lite**: about 80% of the way to ASD-STE100, the controlled language of aerospace maintenance manuals. Keep its sentence, verb, and term rules. Relax its dictionary, so the normal technical vocabulary of the subject is available. Aim for a text that a tired engineer at 2 AM understands on the first read. So must a reader with English as a second language.

The reader is a human. When an agent consumes the document (a SKILL.md, an AGENTS.md, a rules file), use the `writing-for-agents` skill when available. Resolve its name through the host's skill list; plugin installs may add a namespace.

## 1. Classify each part

Each section is one of two types. Keep the types in separate paragraphs or lists.

- **Procedure**: tells the reader to do something. Numbered steps, imperative verbs, one action per step, 20 words or fewer per sentence.
- **Description**: gives information. Present tense, active voice, 25 words or fewer per sentence, one topic per paragraph, 6 sentences or fewer per paragraph.

## 2. Sentences

- Use the active voice. Name the actor: "The authorizer rejects the token", not "the token is rejected".
- Write one instruction or one fact per sentence. Split at a semicolon or at a second "and".
- Put a condition before the command: "If the deploy fails, roll back the stack."
- Keep articles and "that". They cost a word and remove ambiguity.
- Use "must" for a requirement, "can" for a capability, "will" for a future result.
- Turn a sentence with three or more parallel items into a list.

## 3. Words

- **One term per concept.** Choose a name, define it at first use, and keep it to the end. A synonym makes the reader think that there are two things.
- **Exact names.** Write code identifiers, commands, paths, stack names, and SSM parameters exactly, in backticks.
- **Specific over vague.** Replace "fast", "large", "soon", "some", "properly" with a number, a name, or an observable result: "p95 under 200 ms", "the three `dev*` stacks".
- **Short noun clusters.** Three nouns or fewer: "the client-api auth token refresh failure path" becomes "the failure path for a token refresh in client-api".
- **Plain verbs.** "Use", "start", "stop", "remove", "check" over "leverage", "spin up", "tear down", "sanity-check".

## 4. Precision and uncertainty

STE-lite never trades accuracy for simplicity. Keep the technical term when the plain word loses meaning.

- State the confidence of each claim. "Verified", "according to the code", "probably", "not checked" are facts about the claim, and they stay.
- Stamp a volatile fact (a count, a version, a deploy order, a current state) with an "as of" date and its source of truth.
- Link to the source of truth instead of copying it. Copy a value only when the lookup is expensive, and then stamp it.

## 5. Document shapes

Start every document with one or two sentences: what it is and who needs it. Then use the shape that fits:

| Document | Shape |
| --- | --- |
| Architecture or reference | What it is → how it connects → details. Tables for repeated facts. |
| Runbook or how-to | Prerequisites → numbered steps → expected result after each risky step → rollback. |
| Decision record | Context → decision → alternatives rejected and why → consequences. |
| Solution or incident write-up | Symptom → cause → fix → how to detect it next time. |

Put a **WARNING** (risk to data, security, or production) or **CAUTION** (risk to a dev environment or local state) immediately before the step it applies to. Start it with the command, then give the risk.

## 6. Relaxations

These STE rules do not apply here:

- The approved-word dictionary. Use the normal vocabulary of the field.
- The ban on "-ing" forms and on "should", "may", "might". Use them when they carry meaning, mostly for uncertainty.
- STE-lite applies to prose only. Code blocks, command output, quoted errors, and official names stay as they are.

## 7. Check

With Python 3 and shell access, run `python3 <skill-directory>/scripts/prose_check.py <file>` and fix every error. Resolve `<skill-directory>` from this installed skill's location, and `<file>` from the document's location. Add `--steps` when the text is a procedure. Errors: a sentence over the word limit, a paragraph over six sentences, an em dash, a banned word. Fix each warning (semicolon, passive with "by", watched word) unless the sentence needs it.

Without Python or shell access, check those rules manually and state that the automated check was unavailable.

## Done when (checkable: verify each line before reporting complete)

- The first one or two sentences say what the document is and who needs it.
- Every procedure is a numbered list with one action per step, and every WARNING or CAUTION is before its step.
- No sentence is longer than 25 words, and no procedure sentence is longer than 20, except where a code span makes it longer.
- Each concept has one name from start to end, and each identifier is in backticks and spelled exactly.
- No vague quantity is left where a number or a name is available.
- Every volatile fact has an "as of" date and a source, and every uncertain claim says so.
- `scripts/prose_check.py` reports 0 errors, or the manual check is complete and the unavailable automated check is disclosed.
