---
name: writing-for-humans
description: "Write or revise outgoing communication for a non-engineering reader: an email, a Slack or chat message, an announcement, a status update, a proposal, a post, a letter, customer-facing copy. Use when drafting such text, when a draft sounds AI-generated, generic, or stiff, or when asked to scrub text for signs of AI writing."
---

# Writing for humans

The reader is a person with other things to do. They decide in the first two lines whether to keep reading, and they notice when text sounds machine-made. Write so that a busy person gets the point at once, and so that the text sounds like a specific person wrote it.

For technical docs an engineer reads, use `writing:writing-for-engineers`. For documents an agent reads, use `writing:writing-for-agents`.

## 1. Before writing

Answer three questions. A missing answer means you are not ready to write.

1. **Who reads it?** A name or a role, and what they already know.
2. **What is the one point?** One sentence. If it takes two, the text may be two messages.
3. **What should they do next?** Reply, decide, approve, click, or nothing (stated plainly when nothing is needed).

## 2. Shape

- **Point first.** The first sentence carries the point or the ask. Context follows for the reader who wants it.
- **Fit the medium.** A chat message is a few sentences with no headings. An email is short paragraphs, with a list only for real parallel items. An announcement or post can carry structure. Match what renders: Markdown only where the medium displays it.
- **Length follows content.** Stop when the reader has what they need. Skip the recap of what they just read.
- **One ask, easy to find.** Put the request where the eye lands: the first or last line, with a date when timing matters.

## 3. Plain and specific

- **Specific over generic.** The specific fact is the cure for most AI tells. "Signups rose from 40 to 65 a week" over "significant growth". "Ana fixed the export bug" over "the team made improvements".
- **Plain words.** "Use", "help", "start", "show" over "leverage", "facilitate", "embark", "showcase".
- **Concrete actors.** Say who did what. "We moved the launch to May 12" over "the launch has been rescheduled".
- **Claims you can back.** Every claim gives the reader a way to check it: a link, a sourced number, or something they can see. A claim without one gets cut or softened to what is known.

## 4. Sound like a person

- **Take a position** where the text calls for one. "I'd pick option B" over a neutral list of pros and cons.
- **Admit limits and uncertainty** plainly. "I don't know yet; I'll have numbers Friday" builds more trust than polish.
- **Vary the rhythm.** Short sentences next to longer ones. A one-line paragraph when a point needs to land.
- **Use first person, contractions, and the reader's name** where a person would.
- **Match the voice sample.** When the author's own writing is available (earlier emails, posts), match its length, tone, punctuation, and greetings. The sample outranks every rule in this skill except the fact rules below.

## 5. Facts are fixed

- Never invent a person, quote, anecdote, number, or result to make the text sound better. Where a fact is missing, leave a visible `[TODO: ...]` and ask for it.
- Keep names, dates, prices, and commitments exactly as the source gives them.
- Name a person or company only with a fact you can support, and only in a way you would say to their face.

## 6. Scrub

Run the scrub last, after the content and voice are right. Scrubbing an empty draft produces clean nothing: tidy, tell-free, and saying nothing.

1. Check the draft against [references/tell-catalog.md](references/tell-catalog.md). Mark passages where tells cluster, and every instance of the chatbot-residue tells, which fire alone.
2. Redraft each marked passage whole, keeping its facts and its ask.
3. Read the result once as the recipient. Check that the rhythm varies, that no two paragraphs open the same way, and that the text still sounds like its author.

The scrub can over-correct. Every sentence 8 to 20 words with no dashes and no flourish is a newer AI tell of its own. A natural long sentence stays.

## Done when (checkable: verify each line before reporting complete)

- The reader, the one point, and the next action are each nameable, and the point or ask is in the first two sentences.
- The format matches the medium, and no Markdown is left where it will not render.
- Every claim is backed or cut, and nothing was invented.
- No placeholder, wrapper text, citation artifact, or process narration is left.
- Every cluster of tells was redrafted whole, and the dash count is a handful at most.
- Sentence length varies, and the text has at least one sign of a specific author: a position, an admitted limit, or a detail only they would know.

## Sources

The tell catalog follows Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (patterns paraphrased, not copied) and Tim Harris's [`plainspoken`](https://github.com/timharris707/skills/tree/0b04f1c02c7a962588ac5d2aa68bd0cbd03a2cc0/skills/author/plainspoken) catalog (MIT), which builds on [blader/humanizer](https://github.com/blader/humanizer) (MIT). The scrub method (clusters over single words, redraft whole, voice sample outranks the rules) and the *clean nothing* failure come from Harris's [`writing-for-humans`](https://github.com/timharris707/skills/tree/0b04f1c02c7a962588ac5d2aa68bd0cbd03a2cc0/skills/author/writing-for-humans) (MIT).
