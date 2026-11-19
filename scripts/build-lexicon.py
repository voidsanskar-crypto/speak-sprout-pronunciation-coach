"""Build the bundled US English lexicon from the licensed upstream CMUdict file.

Source: https://github.com/cmusphinx/cmudict/blob/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict
Run from the repository: python scripts/build-lexicon.py /path/to/cmudict.dict
"""

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

SOURCE_FILES = (
    "src/lib/phrases.ts",
    "src/lib/assessment.ts",
    "src/routes/minimal-pairs.tsx",
)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("cmudict", type=Path)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]

target_words = set()
for path in SOURCE_FILES:
    source = (repo / path).read_text(encoding="utf-8")
    for literal in re.findall(r"""["]([A-Za-z0-9 ,.!?&;’'–—/-]+)["]""", source):
        target_words.update(re.findall(r"[a-z]+(?:['’][a-z]+)*", literal.lower()))

unstressed = {"AH0": "AX", "ER0": "AXR"}
pronunciations = defaultdict(list)
for row in args.cmudict.read_text(encoding="utf-8").splitlines():
    parts = row.partition("#")[0].split()
    if len(parts) < 2:
        continue
    spelling, *raw_phones = parts
    word = re.sub(r"\(\d+\)$", "", spelling)
    if not re.fullmatch(r"[a-z]+(?:'[a-z]+)*", word):
        continue
    key = word.replace("'", "")
    phones = tuple(unstressed.get(phone, phone.rstrip("012")) for phone in raw_phones)
    if phones not in pronunciations[key]:
        pronunciations[key].append(phones)

target_words = {word.replace("'", "").replace("’", "") for word in target_words}
target_phones = {phones for word in target_words for phones in pronunciations.get(word, [])}
shorter = {phones[:i] + phones[i + 1:] for phones in target_phones for i in range(len(phones))}
wildcards = {
    phones[:i] + ("*",) + phones[i + 1:]
    for phones in target_phones
    for i in range(len(phones))
}


def close_to_target(phones):
    if phones in target_phones or phones in shorter:
        return True
    return any(
        (phones[:i] + phones[i + 1:]) in target_phones
        or (phones[:i] + ("*",) + phones[i + 1:]) in wildcards
        for i in range(len(phones))
    )


lexicon = {
    word: "|".join(" ".join(phones) for phones in variants)
    for word, variants in sorted(pronunciations.items())
    if word in target_words or any(close_to_target(phones) for phones in variants)
}

output = repo / "src/lib/data/cmu-english.json"
output.write_text(json.dumps(lexicon, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{len(lexicon):,} words, {output.stat().st_size:,} bytes")
