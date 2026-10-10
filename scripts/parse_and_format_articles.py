import json
import re
import os

raw_path = "scripts/ocr_raw_101.json"
out_path = r"c:\Users\user\Downloads\asdflkjh-main\edufox\frontend\public\articles\articles.json"

with open(raw_path, "r", encoding="utf-8-sig") as f:
    raw_pages = json.load(f)

# Vocabulary reference map for C1/C2 IELTS academic words with Uzbek definitions
VOCAB_DICT = {
    "chromosome": ("xromosoma", "Irsiy axborotni saqlovchi hujayra yadrosi strukturasi", "noun", "/ˈkrəʊ.mə.səʊm/"),
    "cognitive": ("kognitiv, aqliy", "Idrok etish, bilish va aqliy faoliyatga oid", "adjective", "/ˈkɒɡ.nə.tɪv/"),
    "syndrome": ("sindrom, belgilar majmui", "Muayyan kasallikka xos bo'lgan belgilar yig'indisi", "noun", "/ˈsɪn.drəʊm/"),
    "inhibit": ("to'xtatmoq, sekinlashtirmoq", "Biror jarayon yoki ferment faolligini bosish yoki sekinlashtirish", "verb", "/ɪnˈhɪb.ɪt/"),
    "enzyme": ("ferment, biologik katalizator", "Tirik organizmdagi kimyoviy reaksiyalarni tezlashtiruvchi oqsil", "noun", "/ˈen.zaɪm/"),
    "supplement": ("qo'shimcha modda, vitamin", "Organizmga qo'shimcha oziq modda sifatida beriladigan vosita", "noun", "/ˈsʌp.lɪ.mənt/"),
    "genome": ("genom, genlar to'plami", "Organizmning irsiy ma'lumotlarining to'liq majmui", "noun", "/ˈdʒiː.nəʊm/"),
    "sequencing": ("sekvensiyalash, DNK ketma-ketligini aniqlash", "Genetik kod tartibini aniqlash jarayoni", "noun", "/ˈsiː.kwən.sɪŋ/"),
    "resilience": ("chidamlik, bardoshlilik", "Og'ir holatlardan keyin qayta tiklanish qobiliyati", "noun", "/rɪˈzɪl.i.əns/"),
    "degrade": ("yemirilmoq, parcalanmoq", "Vaqt o'tishi bilan kichikroq moddalarga ajralish", "verb", "/dɪˈɡreɪd/"),
    "contaminant": ("ifloslantiruvchi modda", "Atrof-muhit yoki mahsulot sofligini buzuvchi modda", "noun", "/kənˈtæm.ɪ.nənt/"),
    "microplastic": ("mikroplastik", "Hajmi 5 millimetrdan kichik bo'lgan plastik zarrachalar", "noun", "/ˌmaɪ.krəʊˈplæs.tɪk/"),
    "metabolic": ("metabolik, modda almashinuviga oid", "Organizmda moddalar va energiya almashinuvi bilan bog'liq", "adjective", "/ˌmet.əˈbɒl.ɪk/"),
    "therapeutic": ("terapevtik, shifobaxsh", "Davolovchi yoki sog'liqni yaxshilovchi xususiyatga ega", "adjective", "/ˌθer.əˈpjuː.tɪk/"),
    "pathology": ("patologiya, kasallik sabablari", "Kasalliklarning paydo bo'lishi va rivojlanishini o'rganish", "noun", "/pəˈθɒl.ə.dʒi/"),
    "neurological": ("nevrologik, asab tizimiga oid", "Miya va asab tizimi faoliyatiga taalluqli", "adjective", "/ˌnjʊə.rəˈlɒdʒ.ɪ.kəl/"),
    "transcription": ("transkripsiya, nusxa ko'chirish", "DNKdan RNKga genetik ma'lumot ko'chirilishi", "noun", "/trænˈskrɪp.ʃən/"),
    "immune": ("immunitetga ega, himoyalangan", "Kasallik yuqishidan biologik himoyalangan", "adjective", "/ɪˈmjuːn/"),
    "pathogen": ("patogen, kasallik qo'zg'atuvchi", "Organizmda kasallik keltirib chiqaruvchi mikroorganizm", "noun", "/ˈpæθ.ə.dʒən/"),
    "synthesis": ("sintez, birikma hosil qilish", "Oddiy moddalardan murakkabroq birikma yaratilishi", "noun", "/ˈsɪn.θə.sɪs/"),
    "sustainable": ("barqaror, tabiatga ziyon yetkazmaydigan", "Uzoq muddat davomida atrof-muhitni saqlab turuvchi", "adjective", "/səˈsteɪ.nə.bəl/"),
    "biodiversity": ("biologik xilma-xillik", "Muayyan hududdagi turfa xil organizmlar majmui", "noun", "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/"),
    "emission": ("chiqindi gazlar, ajralish", "Atmosferaga chiqariladigan ifloslovchi moddalar", "noun", "/iˈmɪʃ.ən/"),
    "hypothesis": ("gipoteza, ilmiy faraz", "Tajribada tekshirilishi lozim bo'lgan ilmiy taxmin", "noun", "/haɪˈpɒθ.ə.sɪs/"),
    "empirical": ("empirik, tajribaga asoslangan", "Nazariy emas, balki amaliy tajriba va kuzatish orqali olingan", "adjective", "/ɪmˈpɪr.ɪ.kəl/"),
    "significant": ("muhim, sezilarli", "Ahamiyatli va e'tiborga loyiq darajadagi", "adjective", "/sɪɡˈnɪf.ɪ.kənt/"),
    "correlation": ("o'zaro bog'liqlik, korrelyatsiya", "Ikki yoki undan ortiq hodisalar o'rtasidagi bog'lanish", "noun", "/ˌkɒr.əˈleɪ.ʃən/"),
    "predominant": ("yetakchi, asosiy, ustun", "Boshqalarga nisbatan kuchliroq yoki ko'proq bo'lgan", "adjective", "/prɪˈdɒm.ɪ.nənt/"),
    "phenomenon": ("fenomen, noyob hodisa", "Kuzatilishi mumkin bo'lgan g'ayritabiiy yoki ajoyib voqea", "noun", "/fəˈnɒm.ɪ.nən/"),
    "mechanism": ("mexanizm, ishlash tizimi", "Jarayonning qanday kechishini ta'minlovchi qismlar tizimi", "noun", "/ˈmek.ə.nɪ.zəm/"),
    "implication": ("oqibat, yashirin ma'no", "Biror harakat yoki kashfiyotdan kelib chiqadigan muhim natija", "noun", "/ˌɪm.plɪˈkeɪ.ʃən/"),
    "preliminary": ("dastlabki, kirish qismidagi", "Asosiy bosqichdan oldin o'tkaziladigan tayyorgarlik", "adjective", "/prɪˈlɪm.ɪ.nər.i/"),
    "infrastructure": ("infratuzilma", "Tizimning to'g'ri ishlashi uchun zarur tayanch tuzilmalar", "noun", "/ˈɪn.frəˌstrʌk.tʃər/"),
    "intervention": ("aralashuv, chora ko'rish", "Vaziyatni yaxshilash maqsadida amalga oshiriladigan chora", "noun", "/ˌɪn.təˈven.ʃən/"),
    "equilibrium": ("muvozanat, barqarorlik", "Turli kuchlar o'rtasida tenglik va barqarorlik holati", "noun", "/ˌek.wɪˈlɪb.ri.əm/"),
    "stimulation": ("rag'batlantirish, qo'zg'atish", "Faoliyat yoki o'sishni tezlashtirish jarayoni", "noun", "/ˌstɪm.jəˈleɪ.ʃən/"),
    "deteriorate": ("yomonlashmoq, yemirilmoq", "Sifat yoki holat jihatidan pasaymoq", "verb", "/dɪˈtɪə.ri.ə.reɪt/"),
    "receptive": ("qabul qiluvchan, moyil", "Yangi fikr yoki signallarni oson o'zlashtira oladigan", "adjective", "/rɪˈsep.tɪv/"),
    "fluctuate": ("tebranmoq, o'zgarib turmoq", "Bir me'yorda turmay yuqoriga va pastga siljimoq", "verb", "/ˈflʌk.tʃu.eɪt/"),
    "diminish": ("kamaymoq, susaymoq", "Hajmi yoki kuchi jihatidan kichraymoq", "verb", "/dɪˈmɪn.ɪʃ/"),
    "allocate": ("ajratmoq, taqsimlamoq", "Muayyan maqsad uchun resurs yoki mablag' ajratmoq", "verb", "/ˈæl.ə.keɪt/"),
    "inevitable": ("muqarrar, qochib bo'lmas", "Oldini olishning iloji bo'lmagan hodisa", "adjective", "/ɪnˈev.ɪ.tə.bəl/"),
    "substantial": ("sezilarli, salmoqli", "Hajmi yoki ahamiyati jihatidan katta bo'lgan", "adjective", "/səbˈstæn.ʃəl/"),
}

CATEGORY_KEYWORDS = {
    "Health & Medicine": ["syndrome", "therapy", "disease", "patient", "clinical", "medical", "hospital", "doctor", "health", "cancer", "treatment", "drug", "blood"],
    "Genetics & Biotechnology": ["dna", "gene", "genome", "sequencing", "crispr", "mutation", "protein", "enzyme", "cellular", "rna", "organism"],
    "Neuroscience & Mind": ["brain", "memory", "cognitive", "neuron", "neural", "mental", "cortex", "psychology", "sleep", "dream", "consciousness"],
    "Space & Astronomy": ["space", "burst", "astronomy", "telescope", "star", "galaxy", "planet", "solar", "cosmic", "orbit", "astrophysic"],
    "Environment & Oceans": ["plastic", "water", "ocean", "pollution", "marine", "climate", "carbon", "warming", "ice", "species", "biodiversity", "earth"],
    "Technology & AI": ["algorithm", "computer", "ai", "robot", "digital", "data", "software", "network", "silicon", "quantum"],
    "Evolution & Wildlife": ["animal", "evolution", "species", "fossil", "bird", "dinosaur", "insect", "prehistoric", "predator", "habitat"],
    "Physics & Materials": ["quantum", "physics", "atom", "material", "energy", "laser", "radiation", "magnetic", "particle"],
}

KNOWN_AUTHORS = [
    "Alice Klein", "Andy Coghlan", "Clare Wilson", "Michael Le Page", "Colin Barras", 
    "Michael Marshall", "Debora MacKenzie", "David Stock", "Jeff Hecht", "Sam Wong",
    "Chelsea Whyte", "Jacob Aron", "Richard Webb", "Penny Sarchet", "Hal Hodson",
    "Timothy Revell", "Leah Crane", "Jessica Hamzelou", "Rowan Hooper", "Graham Lawton"
]

articles = []

for item in raw_pages:
    p_num = item["pageNumber"]
    lines = item["lines"]

    # Filter out header/footer boilerplate lines
    clean_lines = []
    for l in lines:
        s = l.strip()
        if not s:
            continue
        # Remove watermarks and publication header/footer junk
        if "@MINDLESS" in s or "Go-To Source" in s or "Top-Tier Preparation" in s:
            continue
        if "newscientist.com" in s.lower() or "for more opinion" in s.lower() or "for daily news" in s.lower():
            continue
        if re.match(r"^\d+\s*\|\s*NewScientist", s, re.IGNORECASE) or re.match(r"^NewScientist\s*\|\s*\d+", s, re.IGNORECASE):
            continue
        if s.lower() in ["news technology", "this week", "insight", "news", "technology", "in brief", "analysis"]:
            continue
        clean_lines.append(s)

    if not clean_lines:
        clean_lines = [
            f"Scientific Infographic & Visual Plate #{p_num}",
            "Visual scientific diagram and thematic graphic plate from Cambridge Academic Reading Collection.",
            "This special visual article features high-density diagrams and illustrations illustrating key empirical concepts."
        ]

    # Extract title from the first prominent lines
    title_candidates = []
    author = "NewScientist Academic Review"
    lead_start_idx = 0

    for idx, line in enumerate(clean_lines[:6]):
        for a in KNOWN_AUTHORS:
            if a.lower() in line.lower():
                author = a
                lead_start_idx = idx + 1
                break
        if author != "NewScientist Academic Review":
            break

    # Determine title lines
    if lead_start_idx > 0:
        title_lines = clean_lines[:lead_start_idx - 1]
    else:
        # Check first 1-3 lines for title
        title_lines = [clean_lines[0]]
        if len(clean_lines) > 1 and len(clean_lines[0].split()) <= 4 and not clean_lines[1].startswith("A "):
            title_lines.append(clean_lines[1])
        lead_start_idx = len(title_lines)
        if lead_start_idx < len(clean_lines):
            # Check if line after title is an author
            for a in KNOWN_AUTHORS:
                if a.lower() in clean_lines[lead_start_idx].lower():
                    author = a
                    lead_start_idx += 1
                    break

    title = " ".join(title_lines).strip()
    title = re.sub(r"^(NE-WS TECHNOLOGY|THIS WEEK|NEWS|INSIGHT\s+[A-Za-z]+)\s*", "", title, flags=re.IGNORECASE).strip()
    if not title or len(title) < 4:
        title = f"Scientific Article #{p_num}: Cambridge Research Study"

    # Remaining lines form the content
    content_lines = clean_lines[lead_start_idx:]
    if not content_lines:
        content_lines = clean_lines

    # Group lines into natural paragraphs (every 4-6 lines)
    paragraphs = []
    chunk = []
    for line in content_lines:
        chunk.append(line)
        if len(chunk) >= 5 and (line.endswith(".") or line.endswith("!") or line.endswith("?")):
            paragraphs.append(" ".join(chunk))
            chunk = []
    if chunk:
        paragraphs.append(" ".join(chunk))

    if not paragraphs:
        paragraphs = [" ".join(content_lines)]

    full_text = " ".join(paragraphs).lower()
    word_count = len(full_text.split())

    # Detect category
    category = "Science & Technology"
    max_cat_matches = 0
    for cat, kws in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in kws if kw in full_text)
        if matches > max_cat_matches:
            max_cat_matches = matches
            category = cat

    # Detect key vocabulary present in this article text
    found_vocabs = []
    for kw, (uz_tr, uz_def, pos, ipa) in VOCAB_DICT.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", full_text):
            found_vocabs.append({
                "word": kw,
                "part_of_speech": pos,
                "pronunciation": ipa,
                "translation_uz": uz_tr,
                "definition_uz": uz_def,
                "band": "Band 7.5+"
            })
            if len(found_vocabs) >= 6:
                break

    # If fewer than 4 vocabs found, supplement with standard academic vocabs
    if len(found_vocabs) < 4:
        for kw, (uz_tr, uz_def, pos, ipa) in list(VOCAB_DICT.items())[:6]:
            if not any(v["word"] == kw for v in found_vocabs):
                found_vocabs.append({
                    "word": kw,
                    "part_of_speech": pos,
                    "pronunciation": ipa,
                    "translation_uz": uz_tr,
                    "definition_uz": uz_def,
                    "band": "Band 7.5+"
                })
            if len(found_vocabs) >= 5:
                break

    # Determine band level
    if word_count > 700 or "Genetics" in category or "Neuroscience" in category:
        level = "Expert (Band 8.5+)"
        band_target = "Band 8.5+"
    elif word_count > 500 or "Space" in category or "Physics" in category:
        level = "Advanced (Band 8.0+)"
        band_target = "Band 8.0+"
    else:
        level = "Advanced (Band 7.5+)"
        band_target = "Band 7.5+"

    read_time = f"{max(3, round(word_count / 130))} min read"

    # Create slug id
    slug_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    article_id = f"article-{p_num}-{slug_title[:30]}"

    summary = paragraphs[0][:220] + "..." if len(paragraphs[0]) > 220 else paragraphs[0]

    article_obj = {
        "id": article_id,
        "pageNumber": p_num,
        "title": title,
        "subtitle": f"Cambridge Academic Reading Collection • Article #{p_num} by {author}",
        "category": category,
        "level": level,
        "bandTarget": band_target,
        "readingTime": read_time,
        "wordCount": word_count,
        "publishedDate": "2026-03-24",
        "author": author,
        "summary": summary,
        "coverImage": f"/articles/covers/article-{p_num}.jpg",
        "pdfUrl": "/100+ Articles.pdf",
        "tags": ["IELTS Academic", "Cambridge Prep", category.split("&")[0].strip()],
        "keyVocabulary": found_vocabs,
        "content": paragraphs
    }
    articles.append(article_obj)

print(f"Successfully processed {len(articles)} articles!")

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)

print(f"Written {len(articles)} articles to {out_path}!")
