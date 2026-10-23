# The tell catalog

The AI tells for the scrub in [SKILL.md](../SKILL.md). Each entry names the pattern, gives words to watch, and gives the fix. Most entries map to a section of Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing); read it there for examples. New tells land in this file and nowhere else.

## How to run it

- **Judge passages, not words.** One tell alone usually means nothing. Several in one passage is what to fix. Three tells fire alone: fabrication, a leftover placeholder, and chatbot wrapper text.
- **Redraft the passage, not the word.** Swapping "leverage" for "use" leaves the AI sentence standing. Rewrite the passage whole and keep its facts and its ask.
- **A voice sample outranks every pattern.** When the real author uses a listed pattern, match their frequency.
- **No fabrication.** The rewrite adds no fact, name, number, or anecdote that the source did not carry.
- **Patterns over word lists.** The overused words drift with each model generation. The shapes below drift slower. A word list is a hint; the shape is the tell.

## Content

1. **Inflated significance.** "marks a pivotal moment", "a testament to", "plays a vital role", "setting the stage for", "reflects broader trends", "evolving landscape". Importance asserted, never shown. State what happened and let the reader judge.
2. **Generic over specific.** The specific fact gets smoothed into a flattering generality: "inventor of a train-coupling device" becomes "a titan of industry". Put the specific fact back. This is the root of most other tells.
3. **Hollow -ing tails.** A clause tacked on the end: "..., highlighting its commitment to quality", "..., ensuring a seamless experience", "..., fostering collaboration". Delete it, or turn it into a real claim with evidence.
4. **Promotional adjectives.** "seamless", "robust", "cutting-edge", "groundbreaking", "vibrant", "stunning", "world-class", "comprehensive". Adjectives doing a claim's job. Replace with the fact that would justify the adjective.
5. **Vague attribution.** "Experts say", "Industry reports suggest", "Many customers feel". Name the source or delete. One source is not "many".
6. **Vague association.** "associated with", "in connection with", "involved in" where a direct relation exists. Say the relation: "led", "built", "paid for".
7. **Coverage name-dropping.** "featured in leading publications", "widely covered by national media". Name one outlet and what it said, or cut.
8. **Challenges-and-outlook formula.** "Despite these challenges, X continues to thrive." "The future looks bright." State the actual plan or the actual problem, or stop.

## Language

9. **AI vocabulary.** Earlier generations: delve, tapestry, testament, pivotal, crucial, intricate, interplay, underscore, showcase, vibrant, garner, boast, bolster, enduring, Additionally (opening a sentence). Later generations: align with, enhance, foster, leverage, highlight, emphasize, multifaceted, prioritize, dependable, steady, quietly, "matters". Replace with the plain word, and check that the sentence still says something.
10. **Avoiding "is".** "serves as", "stands as", "functions as", "represents", "boasts", "features", "offers". Write "is" or "has".
11. **Negative parallelisms.** "It's not just X, it's Y." "Not X, but Y." "No X, no Y, just Z." "Y rather than X." Make the point directly.
12. **Forced triples.** "fast, simple, and powerful" when only two things are true. Use the real number of items.
13. **Synonym cycling.** "the team", "the group", "the squad" for one thing in one paragraph. Pick one name and repeat it.
14. **False ranges.** "from startups to enterprises" where the two ends are not on one scale. List the actual cases.
15. **Abstract metaphor nouns.** north star, flywheel, unlock (abstract), journey (abstract), landscape, ecosystem, paradigm, synergy, game-changer. Use the concrete word.

## Rhythm and punctuation

16. **Em dashes.** A handful per page at most. Density alone fires the tell. Fix by restructuring: split the sentence or cut the aside. Swapping in parentheses, an en dash, or a hyphen keeps the rhythm and only changes the costume.
17. **Uniform rhythm.** Every sentence the same length and shape. This includes the newer over-correction: every sentence 8 to 20 words, no dashes, no long sentence anywhere. Vary the length. Let one sentence run when the thought needs it.
18. **Colon as a crutch.** "Here's the thing: ..." or "The result: ..." as a mid-sentence drumroll. Colons belong before a list or an example.
19. **Empty transitions.** Moreover, Furthermore, Additionally, Ultimately, In conclusion, opening paragraph after paragraph. Cut them. Let the content connect.
20. **Filler and hedge stacks.** "It is important to note that", "in order to", "due to the fact that", "could potentially". Cut, or use one hedge where one belongs.

## Formatting

21. **Formatting for a document when the medium is a message.** Headings, bold labels, and bullet lists in an email or a chat reply that a person would write as three sentences.
22. **Inline-header lists.** "**Speed:** Speed improved by..." where the bold label restates the line. Write it as prose.
23. **Bold and emoji litter.** Bold on every key phrase, emoji as bullet markers or heading decoration. Keep bold for the one thing the reader must not miss.
24. **Title Case Headings.** Use sentence case.
25. **Markdown that does not render.** Asterisks, `#` headings, or `[text](url)` pasted into a medium that shows them raw (most email clients, LinkedIn, plain-text forms). Format for the medium.
26. **Curly quotes mixed with straight quotes.** Pick the style of the medium and keep it.

## Chatbot residue

These fire alone. One instance means the text was pasted unread.

27. **Wrapper text.** "Certainly!", "Great question!", "I hope this helps", "Let me know if you'd like...", "Here is a draft...", "Would you like me to...".
28. **Placeholders.** "[Your Name]", "[Company]", "[insert date]", "{{name}}" left in the text.
29. **Citation artifacts.** `oaicite`, `turn0search0`, `contentReference`, `[cite: 1]`, `:contentReference[...]`, stray `†` markers, and `utm_source=chatgpt.com` in links.
30. **Process narration.** "I've kept the original tone while...", "This version preserves...", "avoiding jargon to ensure clarity". The reader gets the text, not a report on how it was made.
31. **Stock openers and closers.** "I hope this message finds you well." "Thank you for your time and consideration." "Looking forward to hearing from you." in a note that needs none of them. Open with the point; close with the ask.
32. **Knowledge-cutoff hedges.** "As of my last update...", "While specific details are limited...". Find the fact or drop the sentence.
