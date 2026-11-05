"""Download the images listed in content/images.json from Wikimedia Commons.

Only freely licensed files are kept. Writes public/images/<id>.jpg (max 1920px wide)
and content/credits.json with author/license/source for on-screen credits.
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from search_commons import API, FREE, UA, clean, get  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, "content/images.json"), encoding="utf-8"))
credits_path = os.path.join(ROOT, "content/credits.json")
credits = json.load(open(credits_path, encoding="utf-8")) if os.path.exists(credits_path) else {}
out_dir = os.path.join(ROOT, "public/images")
os.makedirs(out_dir, exist_ok=True)

todo = {k: v for k, v in manifest.items()
        if not (os.path.exists(f"{out_dir}/{k}.jpg") and k in credits and credits[k]["title"] == v)}
if not todo:
    print("nothing to do")
    sys.exit(0)

params = {
    "action": "query", "format": "json", "prop": "imageinfo",
    "iiprop": "url|size|extmetadata", "iiurlwidth": "1280",
    "titles": "|".join(todo.values()),
}
data = json.loads(get(API + "?" + urllib.parse.urlencode(params), tries=10))
by_title = {}
for p in data["query"]["pages"].values():
    by_title[p["title"]] = p
for frm_to in data["query"].get("normalized", []):
    by_title[frm_to["from"]] = by_title.get(frm_to["to"])

for key, title in todo.items():
    p = by_title.get(title)
    if not p or "imageinfo" not in p:
        print("MISSING", key, title)
        continue
    ii = p["imageinfo"][0]
    m = ii.get("extmetadata", {})
    lic = clean(m.get("LicenseShortName", {}).get("value", ""))
    if not FREE.match(lic):
        print("NOT FREE, skipped", key, lic)
        continue
    artist = clean(m.get("Artist", {}).get("value", "")) or "Unknown"
    url = ii.get("thumburl") or ii["url"]
    tmp = f"{out_dir}/{key}.download"
    for attempt in range(6):
        try:
            blob = get(url, tries=1)
            if not (blob[:3] == b"\xff\xd8\xff" or blob[:8] == b"\x89PNG\r\n\x1a\n"):
                raise ValueError("not an image (rate-limit page)")
            open(tmp, "wb").write(blob)
            break
        except Exception as e:  # rate limited: back off
            print("retry", key, e)
            time.sleep(20 * (attempt + 1))
    else:
        print("FAILED", key)
        continue
    # normalise to an RGB jpeg no wider than 1920px
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-vf", "scale='min(1920,iw)':-2",
                    "-q:v", "3", f"{out_dir}/{key}.jpg"], check=True)
    os.remove(tmp)
    credits[key] = {
        "title": title,
        "artist": re.sub(r"\s*\(talk\)", "", artist)[:60],
        "license": lic,
        "source": ii.get("descriptionurl"),
    }
    json.dump(credits, open(credits_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("ok", key, lic, "|", credits[key]["artist"])
    time.sleep(10)
