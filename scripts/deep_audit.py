import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/public/articles/articles.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)

print(f"Auditing {len(articles)} articles microscopically...")

# 1. Check for Cyrillic or non-ASCII characters
CYRILLIC_RE = re.compile(r'[\u0400-\u04FF]')
ODD_PUNCT_RE = re.compile(r'[•«»§©®_~^{}|<>=+*]')
BROKEN_OCR_RE = re.compile(r'\b[a-zA-Z]*[0-9]+[a-zA-Z]+\b|\b[a-zA-Z]+[0-9]+[a-zA-Z]*\b') # alphanumeric mixes like th2, 7cx, etc.
GLUED_WORDS_RE = re.compile(r'\b(the|and|that|with|from|this|have|been|were|when|which|will|would|into|more|some|their|there|about|other|these|could|after|before)[a-z]{4,}\b', re.IGNORECASE)

issues = []

# Known legitimate alphanumeric tokens (e.g., EGCG, Cas9, 15th, 1970s, CO2, etc.)
LEGIT_ALPHANUM = {'cas9', 'egcg', '15th', '14th', '1970s', '1980s', '1990s', '2010s', '2020s', 'dyrk1a', 'bmNPV', 'bmnpv', 'covid19', 'h1n1', 'apoe', 'cas13a', 'co2', 'o2', 'b12', 'd3', 'ch4', 'hs2', 'vr'}

for a in articles:
    p = a['pageNumber']
    title = a['title']
    content = a['content']
    vocabs = a.get('keyVocabulary', [])
    
    # Check title
    if CYRILLIC_RE.search(title):
        issues.append((p, f"Cyrillic in title: '{title}'"))
    if ODD_PUNCT_RE.search(title):
        issues.append((p, f"Odd symbol in title: '{title}'"))
        
    for p_idx, para in enumerate(content, 1):
        # Check Cyrillic
        if CYRILLIC_RE.search(para):
            found_cyr = CYRILLIC_RE.findall(para)
            issues.append((p, f"P{p_idx}: Cyrillic character(s) {found_cyr} in text"))
            
        # Check odd punct
        odd_matches = ODD_PUNCT_RE.findall(para)
        if odd_matches:
            # Filter out legitimate asterisks or underscores if any
            issues.append((p, f"P{p_idx}: Odd characters {set(odd_matches)} in text"))
            
        # Check for garbled alphanumeric tokens
        words = re.findall(r'\b\S+\b', para)
        for w in words:
            clean_w = w.lower().strip(".,;:?!'\"()[]{}")
            if any(c.isdigit() for c in clean_w) and any(c.isalpha() for c in clean_w):
                if clean_w not in LEGIT_ALPHANUM and not re.match(r'^\d+(st|nd|rd|th|s|m|k|kg|mg|g|km|cm|mm|nm|hz|khz|mhz|ghz|v|w|kw|lux)$', clean_w):
                    issues.append((p, f"P{p_idx}: Suspicious alphanumeric OCR token: '{w}'"))
                    
        # Check for weird double punctuation like ' .' or ' ,' or '..'
        if re.search(r'\s[,\.:;?!]', para):
            issues.append((p, f"P{p_idx}: Space before punctuation: '{re.findall(r'.{0,10}\s[,\.:;?!].{0,10}', para)}'"))
        if re.search(r'\.\.[^\.]', para):
            issues.append((p, f"P{p_idx}: Double period in text"))

print(f"\nTotal potential issues flagged: {len(issues)}")
for p, iss in issues[:40]:
    print(f"Page {p:2d}: {iss}")
if len(issues) > 40:
    print(f"... and {len(issues) - 40} more.")
