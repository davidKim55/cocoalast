"""Generate narration per scene with ElevenLabs (with character timestamps).

The API key is injected by the session's network proxy, so no key is read here.
Outputs: public/audio/<scene>.mp3 and content/alignment/<scene>.json
Re-runs skip scenes whose text did not change.
"""
import base64
import hashlib
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
script_path = "content/script.json"
if args and args[0].endswith(".json"):
    script_path = args.pop(0)
script = json.load(open(os.path.join(ROOT, script_path), encoding="utf-8"))
os.makedirs(os.path.join(ROOT, "content/alignment"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)

voice = script["voice_id"]
model = script["model_id"]
scenes = script["scenes"]
only = set(args)

for i, s in enumerate(scenes):
    if only and s["id"] not in only:
        continue
    h = hashlib.sha1((model + voice + s["text"]).encode()).hexdigest()
    align_path = os.path.join(ROOT, f"content/alignment/{s['id']}.json")
    mp3_path = os.path.join(ROOT, f"public/audio/{s['id']}.mp3")
    if os.path.exists(align_path) and os.path.exists(mp3_path):
        if json.load(open(align_path)).get("hash") == h:
            print("skip", s["id"])
            continue
    body = {
        "text": s["text"],
        "model_id": model,
        "language_code": "ko",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2, "speed": 1.05},
    }
    if i > 0:
        body["previous_text"] = scenes[i - 1]["text"]
    if i < len(scenes) - 1:
        body["next_text"] = scenes[i + 1]["text"]
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_192",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    import time
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            if e.code >= 500 and attempt < 3:
                print("retry", s["id"], e.code, flush=True)
                time.sleep(20 * (attempt + 1))
                continue
            print("ERROR", s["id"], e.code, e.read()[:500])
            sys.exit(1)
    open(mp3_path, "wb").write(base64.b64decode(d["audio_base64"]))
    a = d["alignment"]
    json.dump({
        "hash": h,
        "text": s["text"],
        "chars": a["characters"],
        "start": a["character_start_times_seconds"],
        "end": a["character_end_times_seconds"],
    }, open(align_path, "w", encoding="utf-8"), ensure_ascii=False)
    print("ok", s["id"], round(a["character_end_times_seconds"][-1], 2), "s")
