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
    def synth(text, prev_text, next_text):
        body = {
            "text": text,
            "model_id": model,
            "language_code": "ko",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2, "speed": 1.05},
        }
        if prev_text:
            body["previous_text"] = prev_text[-500:]
        if next_text:
            body["next_text"] = next_text[:500]
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_192",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
        import time
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    return json.loads(r.read())
            except urllib.error.HTTPError as e:
                if e.code >= 500 and attempt < 3:
                    print("retry", s["id"], e.code, flush=True)
                    time.sleep(20 * (attempt + 1))
                    continue
                print("ERROR", s["id"], e.code, e.read()[:500])
                sys.exit(1)

    # Long sections are generated in two halves (split at a sentence end) and joined.
    text = s["text"]
    parts = [text]
    if len(text) > 900:
        mid = len(text) // 2
        cut = min((k for k in range(mid, len(text)) if text[k] in ".?!" and text[k + 1:k + 2] == " "), default=None)
        if cut:
            parts = [text[:cut + 1], text[cut + 2:]]
    prev_scene = scenes[i - 1]["text"] if i > 0 else ""
    next_scene = scenes[i + 1]["text"] if i < len(scenes) - 1 else ""
    chars, starts, ends, offset, mp3s = [], [], [], 0.0, []
    import subprocess, tempfile
    for pi, part in enumerate(parts):
        d = synth(part, prev_scene if pi == 0 else parts[pi - 1], next_scene if pi == len(parts) - 1 else parts[pi + 1])
        a = d["alignment"]
        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
        open(tmp, "wb").write(base64.b64decode(d["audio_base64"]))
        mp3s.append(tmp)
        if pi > 0:  # the space that separated the halves
            chars.append(" "); starts.append(offset); ends.append(offset)
        chars += a["characters"]
        starts += [t + offset for t in a["character_start_times_seconds"]]
        ends += [t + offset for t in a["character_end_times_seconds"]]
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp],
                                   capture_output=True, text=True).stdout.strip())
        offset += dur
    if len(mp3s) == 1:
        os.replace(mp3s[0], mp3_path)
    else:
        lst = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
        lst.write("".join(f"file '{m}'\n" for m in mp3s)); lst.close()
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst.name,
                        "-c:a", "libmp3lame", "-b:a", "192k", mp3_path], check=True)
    assert "".join(chars) == text, "alignment does not match text"
    json.dump({"hash": h, "text": text, "chars": chars, "start": starts, "end": ends},
              open(align_path, "w", encoding="utf-8"), ensure_ascii=False)
    a = {"character_end_times_seconds": ends}
    print("ok", s["id"], round(a["character_end_times_seconds"][-1], 2), "s")
