import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/public/articles/articles.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)

print(f"Total articles: {len(articles)}")

RUSSIAN_RE = re.compile(r'[\u0400-\u04FF]')
BAD_TITLE_ENDINGS = (' of', ' to', ' the', ' in', ' and', ' a', ' for', ' with', ' from', ' at', ' on', ' by', ' as', ' stole', ' so', ' ri$')

issues = []

for idx, a in enumerate(articles, 1):
    art_issues = []
    title = a.get('title', '')
    pnum = a.get('pageNumber')
    wc = a.get('wordCount', 0)
    content = a.get('content', [])
    content_str = " ".join(content)
    
    # 1. Russian characters
    if RUSSIAN_RE.search(title):
        art_issues.append(f"Russian characters in TITLE: '{title}'")
    if RUSSIAN_RE.search(content_str):
        rus_matches = RUSSIAN_RE.findall(content_str)
        art_issues.append(f"Russian characters in CONTENT ({len(rus_matches)} chars)")
        
    # 2. Watermarks
    if '@mindless' in content_str.lower() or 'top-tier preparation' in content_str.lower():
        art_issues.append("Watermark in content (@MINDLESS)")
    if 'vkcom' in content_str.lower() or 'vk.com' in content_str.lower() or 'wsnws' in content_str.lower():
        art_issues.append("VK watermark in content")
        
    # 3. Title quality
    if title.lower().endswith(BAD_TITLE_ENDINGS):
        art_issues.append(f"Incomplete title ending: '{title}'")
    if len(title.split()) <= 2 and len(title) < 18:
        art_issues.append(f"Very short title ({len(title.split())} words): '{title}'")
    if any(k in title for k in ['Scientific Article #', 'Scientific Infographic', 'Cambridge Research Study']):
        art_issues.append(f"Generic fallback title: '{title}'")
    if any(k in title for k in ['COVFR', 'THIS WFFK', 'PEnH3', 'PEfM3']):
        art_issues.append(f"Garbled header in title: '{title}'")
        
    # 4. Content length
    if wc < 250:
        art_issues.append(f"Low word count: {wc} words")
    if len(content) < 3:
        art_issues.append(f"Few paragraphs: {len(content)} paras")
        
    if art_issues:
        issues.append((idx, pnum, title, art_issues))

print(f"Articles with flagged issues: {len(issues)} / {len(articles)}")
print("\n" + "="*80)
for idx, pnum, title, art_issues in issues:
    print(f"Article #{idx} (Page {pnum}): '{title}'")
    for iss in art_issues:
        print(f"   ❌ {iss}")
