"""Download the clips in content/videos.json from Wikimedia Commons (free licenses only),
trim them and convert to silent 1080p H.264 for Remotion. Credits go to content/credits.json."""
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from search_commons import API, FREE, clean, get  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, "content/videos.json"), encoding="utf-8"))
credits_path = os.path.join(ROOT, "content/credits.json")
credits = json.load(open(credits_path, encoding="utf-8")) if os.path.exists(credits_path) else {}
out_dir = os.path.join(ROOT, "public/videos")
os.makedirs(out_dir, exist_ok=True)

todo = {k: v for k, v in manifest.items() if not os.path.exists(f"{out_dir}/{k}.mp4")}
if not todo:
    print("nothing to do")
    sys.exit(0)

params = {"action": "query", "format": "json", "prop": "imageinfo",
          "iiprop": "url|size|extmetadata", "titles": "|".join(v["title"] for v in todo.values())}
data = json.loads(get(API + "?" + urllib.parse.urlencode(params), tries=10))
by_title = {p["title"]: p for p in data["query"]["pages"].values()}
for n in data["query"].get("normalized", []):
    by_title[n["from"]] = by_title.get(n["to"])

for key, spec in todo.items():
    p = by_title.get(spec["title"])
    if not p or "imageinfo" not in p:
        print("MISSING", key)
        continue
    ii = p["imageinfo"][0]
    m = ii.get("extmetadata", {})
    lic = clean(m.get("LicenseShortName", {}).get("value", ""))
    if not FREE.match(lic):
        print("NOT FREE, skipped", key, lic)
        continue
    src = f"{out_dir}/{key}.src"
    for attempt in range(6):
        try:
            open(src, "wb").write(get(ii["url"], tries=1))
            break
        except Exception as e:
            print("retry", key, e)
            time.sleep(20 * (attempt + 1))
    else:
        print("FAILED", key)
        continue
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-ss", str(spec["start"]), "-t", str(spec["length"]), "-i", src,
        "-an", "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        f"{out_dir}/{key}.mp4"], check=True)
    os.remove(src)
    artist = clean(m.get("Artist", {}).get("value", "")) or "Unknown"
    credits[key] = {"title": spec["title"], "artist": re.sub(r"\s*\(talk\)", "", artist)[:60],
                    "license": lic, "source": ii.get("descriptionurl"), "kind": "video"}
    json.dump(credits, open(credits_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("ok", key, lic, "|", credits[key]["artist"])
    time.sleep(10)
