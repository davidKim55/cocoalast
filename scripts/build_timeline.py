"""Turn script.json + TTS alignment into src/timeline.json (frames) for Remotion.

- Captions: narration split into short phrases, timed from character timestamps,
  with highlight words marked red (like the reference video's centre captions).
- Graphics: each graphic starts when its "at" phrase is spoken.
- Backgrounds: the scene's images share the scene's duration.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
LEAD_IN = 0.4      # silence before the first line
GAP = 0.55         # pause between scenes
TAIL = 2.5         # hold after the last line
MAX_CHUNK = 15     # max characters per caption line
MIN_CHUNK = 7

script = json.load(open(os.path.join(ROOT, "content/script.json"), encoding="utf-8"))
credits = json.load(open(os.path.join(ROOT, "content/credits.json"), encoding="utf-8")) \
    if os.path.exists(os.path.join(ROOT, "content/credits.json")) else {}


videos = json.load(open(os.path.join(ROOT, "content/videos.json"), encoding="utf-8"))


def aspect(image_id):
    import subprocess
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0",
                          os.path.join(ROOT, f"public/images/{image_id}.jpg")],
                         capture_output=True, text=True).stdout.strip().split(",")
    return round(int(out[0]) / int(out[1]), 3)


def f(t):
    return int(round(t * FPS))


def chunk_text(text, red):
    """Split into phrase ranges (start, end) at spaces, preferring punctuation breaks.
    Never breaks inside a highlighted phrase."""
    words, i = [], 0
    for w in text.split(" "):
        if w:
            if words and red[i] and i > 0 and red[i - 2]:
                words[-1] = (words[-1][0], i + len(w))   # keep highlight together
            else:
                words.append((i, i + len(w)))
        i += len(w) + 1
    chunks, cur = [], None
    for (a, b) in words:
        if cur is None:
            cur = [a, b]
            continue
        length = b - cur[0]
        prev_word = text[cur[0]:cur[1]]
        sentence_end = prev_word[-1] in ".?!" or prev_word.endswith(('."', '?"', '!"'))
        soft_break = prev_word[-1] in ","
        if length > MAX_CHUNK or sentence_end or (soft_break and cur[1] - cur[0] >= MIN_CHUNK):
            chunks.append(tuple(cur))
            cur = [a, b]
        else:
            cur[1] = b
    if cur:
        chunks.append(tuple(cur))
    # merge very short tails into the previous chunk when it still fits
    merged = []
    for c in chunks:
        if merged and (c[1] - c[0]) <= 4 and (c[1] - merged[-1][0]) <= MAX_CHUNK + 5 \
                and text[merged[-1][1] - 1] not in ".?!\"":
            merged[-1] = (merged[-1][0], c[1])
        else:
            merged.append(c)
    return merged


def display(s):
    s = s.strip()
    while s and s[-1] in ".,":
        s = s[:-1]
    while s and s[0] in ",":
        s = s[1:]
    return s.strip()


scenes_out, t = [], LEAD_IN
for idx, s in enumerate(script["scenes"]):
    al = json.load(open(os.path.join(ROOT, f"content/alignment/{s['id']}.json"), encoding="utf-8"))
    text, st, en = s["text"], al["start"], al["end"]
    speech = en[-1]
    is_last = idx == len(script["scenes"]) - 1
    dur = speech + (TAIL if is_last else GAP)
    if idx == 0:
        dur += LEAD_IN
    offset = LEAD_IN if idx == 0 else 0.0   # audio offset inside the scene

    red = [False] * len(text)
    for h in s.get("highlights", []):
        k = text.find(h)
        while k != -1:
            for j in range(k, k + len(h)):
                red[j] = True
            k = text.find(h, k + len(h))

    captions = []
    chunks = chunk_text(text, red)
    for ci, (a, b) in enumerate(chunks):
        start = st[a] + offset
        end = (st[chunks[ci + 1][0]] + offset) if ci + 1 < len(chunks) else en[b - 1] + offset + 0.5
        raw = text[a:b]
        disp = display(raw)
        lead = raw.find(disp)
        segs, cur = [], None
        for j, ch in enumerate(disp):
            r = red[a + lead + j]
            if cur and cur["red"] == r:
                cur["t"] += ch
            else:
                cur = {"t": ch, "red": r}
                segs.append(cur)
        # Emphasis lines (red keyword or a quote) go big in the centre; the rest sit at the bottom.
        emph = any(sg["red"] for sg in segs) or '"' in raw
        captions.append({"from": f(start), "to": f(end), "segs": segs, "emph": emph})

    def when(phrase, after=0):
        k = text.find(phrase, after)
        if k == -1:
            raise SystemExit(f"phrase not found in {s['id']}: {phrase}")
        return k, st[k] + offset

    graphics, pos = [], 0
    for g in s.get("graphics", []):
        k, start = when(g["at"], pos)
        pos = k
        g2 = dict(g)
        g2["from"] = max(0, f(start - 0.15))
        if g.get("until") == "END":
            g2["to"] = f(dur)
        elif "until" in g:
            g2["to"] = f(when(g["until"], k)[1] - 0.1)
        else:
            g2["to"] = None
        graphics.append(g2)
    for i, g in enumerate(graphics):
        if g["to"] is None:
            nxt = graphics[i + 1]["from"] if i + 1 < len(graphics) else f(dur)
            g["to"] = nxt
        g["to"] = min(g["to"], f(dur))
    for c in captions:
        c["center"] = c.pop("emph") and not any(g["from"] < c["to"] and g["to"] > c["from"] for g in graphics)

    bgs = s["bg"]
    seg = dur / len(bgs)
    backgrounds = [{"image": b, "from": f(i * seg), "to": f((i + 1) * seg),
                    "kind": "video" if b in videos else "image",
                    "aspect": 16 / 9 if b in videos else aspect(b)} for i, b in enumerate(bgs)]

    scenes_out.append({
        "id": s["id"], "from": f(t), "duration": f(dur), "audioOffset": f(offset),
        "chapter": s.get("chapter"), "captions": captions, "graphics": graphics,
        "backgrounds": backgrounds,
    })
    t += dur

# Background music: two tracks alternate, switching at chapter boundaries.
music_plan = {"s1_hook": "a", "s2_intro": "a", "s3_blockbuster": "b", "s4_nokia": "a",
              "s5_kodak": "b", "s6_outro": "a"}
music = []
for sc in scenes_out:
    track = music_plan.get(sc["id"], "a")
    if music and music[-1]["track"] == track:
        music[-1]["to"] = sc["from"] + sc["duration"]
    else:
        music.append({"track": track, "from": sc["from"], "to": sc["from"] + sc["duration"]})

used = sorted({b["image"] for sc in scenes_out for b in sc["backgrounds"]} |
              {g["image"] for sc in scenes_out for g in sc["graphics"] if "image" in g} |
              {it["image"] for sc in scenes_out for g in sc["graphics"] for it in g.get("items", [])})
missing = [u for u in used if u not in credits]
if missing:
    print("WARNING: images without credits/files:", missing)

timeline = {
    "fps": FPS, "width": 1920, "height": 1080,
    "durationInFrames": f(t), "scenes": scenes_out, "music": music,
    "credits": {k: v for k, v in credits.items() if k in used},
}
json.dump(timeline, open(os.path.join(ROOT, "src/timeline.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"total {t:.1f}s, {f(t)} frames")
for sc in scenes_out:
    print(sc["id"], sc["duration"] / FPS, "s", len(sc["captions"]), "captions")
