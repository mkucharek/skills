#!/usr/bin/env python3
"""Check a prose draft (PR body, doc, commit body) against the checkable writing limits.

Usage: prose_check.py [--steps] FILE...   (or text on stdin)

Errors (exit 1): a sentence over 25 words (over 20 with --steps), a paragraph
over six sentences, an em dash, a banned word. Warnings: a sentence of 21 to 25
words, passive voice with "by", a semicolon, a watched word. Code, links, URLs,
quotes, headings, tables and the Flag/Order lines are skipped.

Adapted from ste_check.py in https://github.com/0xpili/simplified-technical-english:
the markdown stripping, word counting and sentence splitting are its code; the
STE vocabulary, modal, "-ing" and contraction rules are dropped.

MIT License. Copyright (c) 2026 0xpili. Permission is hereby granted, free of
charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the
following conditions: The above copyright notice and this permission notice
shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""
import argparse
import re
import sys
from pathlib import Path

BANNED = {"comprehensive", "robust"}
WATCHED = {"seamless", "seamlessly", "leverage", "leverages", "utilize", "utilizes",
           "delve", "streamline", "streamlines", "crucial", "powerful", "elegant"}

PASSIVE_BY = re.compile(
    r"\b(?:is|are|was|were|be|been|being)\s+(?:\w+\s+)?\w+(?:ed|en)\s+by\b",
    re.IGNORECASE,
)
SENT_SPLIT = re.compile(r"(?<=[.!?:])\s+")   # a colon ends a sentence for length
FULL_STOP = re.compile(r"(?<=[.!?])\s+")       # but not for paragraph size
WORDISH = re.compile(r"[A-Za-z0-9'&/’-]+")
BULLET = re.compile(r"\s*(?:[-*+]|\d+\.)\s+")
SKIP_LINE = re.compile(r"^\s*(?:[-*]\s+)?(?:\*\*)?(?:Flag|Order):", re.IGNORECASE)


def strip_markdown(text):
    text = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.DOTALL)   # frontmatter
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)          # code blocks
    text = re.sub(r"^(?: {4}|\t).*$", " ", text, flags=re.MULTILINE)  # indented code
    text = re.sub(r"`[^`\n]+`", " CODE ", text)                      # inline code
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)             # links
    text = re.sub(r"https?://\S+", " URL ", text)                    # bare URLs
    text = re.sub(r"^>.*$", " ", text, flags=re.MULTILINE)           # block quotes
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.DOTALL)         # comments
    return re.sub(r"\"[^\"\n]*\"|“[^”\n]*”", " QUOTED ", text)       # quotes


def count_words(sentence):
    s = re.sub(r"\([^)]*\)", " PAREN ", sentence)   # a parenthesis counts as one word
    s = re.sub(r"\*\*|\*|__|_|#+", " ", s)
    return len(WORDISH.findall(s))


def sentences(block):
    for part in SENT_SPLIT.split(block):
        part = part.strip()
        if part and WORDISH.search(part):
            yield part


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []


def check_sentence(sent, limit, report, loc):
    n = count_words(sent)
    head = sent if len(sent) <= 60 else sent[:57] + "..."
    if n > limit:
        report.errors.append((loc, f"{n} words (max {limit}): \"{head}\""))
    elif n > 20:
        report.warnings.append((loc, f"{n} words (max 20 in steps): \"{head}\""))
    if ";" in sent:
        report.warnings.append((loc, f"semicolon: two sentences may read better: \"{head}\""))
    m = PASSIVE_BY.search(sent)
    if m:
        report.warnings.append((loc, f"passive \"{m.group(0)}\": make the actor the subject"))


def check_words(text, report, loc):
    if "—" in text:
        report.errors.append((loc, "em dash: use a period, comma or colon"))
    for word in re.findall(r"[A-Za-z]+", text):
        lw = word.lower()
        if lw in BANNED:
            report.errors.append((loc, f"banned word \"{word}\""))
        elif lw in WATCHED:
            report.warnings.append((loc, f"\"{word}\": say what it does instead"))


def check_text(raw, limit, report, name):
    text = strip_markdown(raw)
    for i, par in enumerate(re.split(r"\n\s*\n", text), 1):
        lines = [l for l in par.strip().splitlines() if not SKIP_LINE.match(l)]
        lines = [l for l in lines if not l.lstrip().startswith(("#", "|"))]
        if not lines:
            continue
        loc = f"{name}:par{i}"
        check_words("\n".join(lines), report, loc)
        prose = [l for l in lines if not BULLET.match(l)]
        for item in (l for l in lines if BULLET.match(l)):
            for s in sentences(BULLET.sub("", item, count=1)):
                check_sentence(s, limit, report, f"{loc}:list")
        joined = " ".join(prose)
        full = [p for p in FULL_STOP.split(joined) if WORDISH.search(p)]
        if len(full) > 6:
            report.errors.append((loc, f"paragraph has {len(full)} sentences (max 6)"))
        for s in sentences(joined):
            check_sentence(s, limit, report, loc)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="*")
    ap.add_argument("--steps", action="store_true", help="instructions: max 20 words")
    args = ap.parse_args()
    limit = 20 if args.steps else 25

    report = Report()
    if args.files:
        for f in args.files:
            check_text(Path(f).read_text(encoding="utf-8"), limit, report, f)
    else:
        check_text(sys.stdin.read(), limit, report, "stdin")

    for loc, msg in report.errors:
        print(f"ERROR   {loc} {msg}")
    for loc, msg in report.warnings:
        print(f"WARNING {loc} {msg}")
    print(f"{len(report.errors)} errors, {len(report.warnings)} warnings.")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
