import os
import sys
import json
import re
import pymupdf

pdf_path = r"c:\Users\user\Downloads\asdflkjh-main\edufox\frontend\public\100+ Articles.pdf"
covers_dir = r"c:\Users\user\Downloads\asdflkjh-main\edufox\frontend\public\articles\covers"
os.makedirs(covers_dir, exist_ok=True)

print("Opening PDF:", pdf_path)
doc = pymupdf.open(pdf_path)
total_pages = len(doc)
print(f"Total pages in PDF: {total_pages}")

# Render each page to JPG in covers directory
for i in range(total_pages):
    page = doc[i]
    pix = page.get_pixmap(dpi=135)
    img_name = f"article-{i+1}.jpg"
    out_path = os.path.join(covers_dir, img_name)
    pix.save(out_path)
    if (i + 1) % 10 == 0 or (i + 1) == total_pages:
        print(f"Rendered {i+1}/{total_pages} covers...")

print("All 101 covers rendered successfully!")
