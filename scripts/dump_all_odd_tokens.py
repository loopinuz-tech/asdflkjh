import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/public/articles/articles.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)

# Collect all tokens that contain non-ascii or digits mixed with letters or weird symbols
odd_tokens = set()

for a in articles:
    for para in a['content']:
        for t in para.split():
            clean = t.strip('.,;:?!"()[]{}')
            if not clean:
                continue
            # check if odd
            if any(c in clean for c in '•«»§©®_~^{}|<>=+*\\/'):
                odd_tokens.add(clean)
            elif any(c.isdigit() for c in clean) and any(c.isalpha() for c in clean):
                if not re.match(r'^\d+(st|nd|rd|th|s|m|k|kg|mg|g|km|cm|mm|nm|hz|khz|mhz|ghz|v|w|kw|lux)$', clean.lower()):
                    odd_tokens.add(clean)
            elif re.search(r'[\u0400-\u04FF]', clean):
                odd_tokens.add(clean)
            elif 'cx' in clean or 'kx' in clean or 'rx»' in clean or 'tx»' in clean:
                odd_tokens.add(clean)

with open('scripts/all_nonstandard_tokens.txt', 'w', encoding='utf-8') as out:
    for t in sorted(odd_tokens):
        out.write(f"{t}\n")

print(f"Total distinct non-standard tokens: {len(odd_tokens)}")
