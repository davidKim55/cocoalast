"""Turn content/script.json + TTS alignment into src/timeline.json (in frames).

Screen grammar (from the reference video's 1-second breakdown):
- visuals: one at a time — full-bleed bg (photo/video), photo card, rank board, rank title.
  Each starts when its "at" phrase is spoken and lasts until the next one.
- texts: one at a time — centre callout, quote, or number card. Each starts at its
  "at" phrase and lasts to the end of that sentence (or until the next text).
- bottom subtitles: short narration chunks, shown only when no text / board / rank title is up.
"""
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
LEAD_IN = 0.3
GAP = 1.0
TAIL = 3.6
MAX_CHUNK = 15
MIN_CHUNK = 6

script = json.load(open(os.path.join(ROOT, "content/script.json"), encoding="utf-8"))
videos = json.load(open(os.path.join(ROOT, "content/videos.json"), encoding="utf-8"))
cpath = os.path.join(ROOT, "content/credits.json")
credits = json.load(open(cpath, encoding="utf-8")) if os.path.exists(cpath) else {}


def f(t):
    return int(round(t * FPS))


def aspect(image_id):
    if image_id in videos:
        return 16 / 9
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0",
                          os.path.join(ROOT, f"public/images/{image_id}.jpg")],
                         capture_output=True, text=True).stdout.strip().split(",")
    return round(int(out[0]) / int(out[1]), 3)


def chunk_text(text):
    words, i = [], 0
    for w in text.split(" "):
        if w:
            words.append((i, i + len(w)))
        i += len(w) + 1
    chunks, cur = [], None
    for (a, b) in words:
        if cur is None:
            cur = [a, b]
            continue
        prev = text[cur[0]:cur[1]]
        sentence_end = prev[-1] in ".?!" or prev.endswith(('."', '?"', '!"'))
        soft = prev[-1] == ","
        if b - cur[0] > MAX_CHUNK or sentence_end or (soft and cur[1] - cur[0] >= MIN_CHUNK):
            chunks.append(tuple(cur))
            cur = [a, b]
        else:
            cur[1] = b
    chunks.append(tuple(cur))
    merged = []
    for c in chunks:
        if merged and (c[1] - c[0]) <= 4 and (c[1] - merged[-1][0]) <= MAX_CHUNK + 4 \
                and text[merged[-1][1] - 1] not in '.?!"':
            merged[-1] = (merged[-1][0], c[1])
        else:
            merged.append(c)
    return merged


def clean(s):
    s = s.replace('"', "").strip()
    while s and s[-1] in ".,":
        s = s[:-1]
    return s.strip()


def sentence_end(text, k):
    """Index just past the sentence that contains position k (quotes kept together)."""
    in_quote = text[:k].count('"') % 2 == 1
    j = k
    while j < len(text):
        ch = text[j]
        if ch == '"':
            if j == k and not in_quote:
                in_quote = True
            elif in_quote:
                in_quote = False
                if text[j - 1] in ".?!":
                    return j + 1
            else:
                in_quote = True
        elif ch in ".?!" and not in_quote:
            return j + 1
        j += 1
    return len(text)


scenes_out, t = [], LEAD_IN
for idx, s in enumerate(script["scenes"]):
    al = json.load(open(os.path.join(ROOT, f"content/alignment/{s['id']}.json"), encoding="utf-8"))
    text, st, en = s["text"], al["start"], al["end"]
    assert al["text"] == text, f"alignment out of date for {s['id']} — run scripts/tts.py"
    is_last = idx == len(script["scenes"]) - 1
    offset = LEAD_IN if idx == 0 else 0.0
    dur = en[-1] + offset + (TAIL if is_last else GAP)
    end_f = f(dur)

    def when(phrase, after=0):
        k = text.find(phrase, after)
        if k == -1:
            raise SystemExit(f"phrase not found in {s['id']}: {phrase!r}")
        first = k
        while first < len(text) and text[first] in ' "':
            first += 1
        return k, st[first] + offset

    visuals, pos = [], 0
    for v in s["visuals"]:
        k, start = when(v["at"], pos)
        pos = k
        v2 = dict(v)
        v2["from"] = 0 if not visuals else f(start - 0.1)
        if v.get("image"):
            v2["kind"] = "video" if v["image"] in videos else "image"
            v2["aspect"] = aspect(v["image"])
        visuals.append(v2)
    for i, v in enumerate(visuals):
        v["to"] = visuals[i + 1]["from"] if i + 1 < len(visuals) else end_f

    texts, pos = [], 0
    for tx in s.get("texts", []):
        k, start = when(tx["at"], pos)
        pos = k
        e = sentence_end(text, k)
        t2 = dict(tx)
        t2["from"] = max(0, f(start - 0.1))
        t2["to"] = min(end_f, f(en[e - 1] + offset + 0.35))
        texts.append(t2)
    for tx in texts:
        tx["to"] = max(tx["to"], tx["from"] + f(1.6))
    for i in range(len(texts) - 1):
        texts[i]["to"] = min(texts[i]["to"], texts[i + 1]["from"])

    captions = []
    chunks = chunk_text(text)
    for ci, (a, b) in enumerate(chunks):
        start = st[a] + offset
        stop = (st[chunks[ci + 1][0]] + offset) if ci + 1 < len(chunks) else en[b - 1] + offset + 0.4
        captions.append({"from": f(start), "to": f(stop), "text": clean(text[a:b])})

    scenes_out.append({"id": s["id"], "from": f(t), "duration": end_f, "audioOffset": f(offset),
                       "visuals": visuals, "texts": texts, "captions": captions})
    t += dur

music_plan = {"s1_hook": "a", "s2_intro": "a", "s3_blockbuster": "b", "s4_nokia": "a",
              "s5_kodak": "b", "s6_outro": "a"}
music = []
for sc in scenes_out:
    tr = music_plan.get(sc["id"], "a")
    if music and music[-1]["track"] == tr:
        music[-1]["to"] = sc["from"] + sc["duration"]
    else:
        music.append({"track": tr, "from": sc["from"], "to": sc["from"] + sc["duration"]})

used = {v["image"] for sc in scenes_out for v in sc["visuals"] if v.get("image")}
missing = [u for u in sorted(used) if u not in credits]
if missing:
    print("WARNING: no credits for", missing)

json.dump({"fps": FPS, "width": 1920, "height": 1080, "durationInFrames": f(t),
           "board": script["board"], "scenes": scenes_out, "music": music,
           "credits": {k: v for k, v in credits.items() if k in used}},
          open(os.path.join(ROOT, "src/timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"total {t:.1f}s, {f(t)} frames")
for sc in scenes_out:
    print(f"  {sc['id']}: {sc['duration'] / FPS:.1f}s, {len(sc['visuals'])} visuals, "
          f"{len(sc['texts'])} texts, {len(sc['captions'])} subtitle lines")
