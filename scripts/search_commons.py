"""Search Wikimedia Commons for freely licensed images (or videos).

Usage: python3 scripts/search_commons.py "query" [bitmap|video] [limit]
Prints candidates that carry a free license (CC0, public domain, CC BY, CC BY-SA).
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

UA = "cocoalast-video-builder/1.0 (https://github.com/davidKim55/cocoalast)"
API = "https://commons.wikimedia.org/w/api.php"
FREE = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+|CC BY(-SA)?$|No restrictions)", re.I)


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                time.sleep(min(90, 15 * (i + 1)))
                continue
            raise


def clean(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def search(query, kind="bitmap", limit=12, width=1920):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrnamespace": "6", "gsrsearch": f"{query} filetype:{kind}",
        "gsrlimit": str(limit), "prop": "imageinfo",
        "iiprop": "url|size|extmetadata|mime", "iiurlwidth": str(width),
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    out = []
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    for p in pages:
        ii = p["imageinfo"][0]
        m = ii.get("extmetadata", {})
        lic = clean(m.get("LicenseShortName", {}).get("value", ""))
        if not FREE.match(lic):
            continue
        out.append({
            "title": p["title"],
            "width": ii["width"], "height": ii["height"],
            "license": lic,
            "artist": clean(m.get("Artist", {}).get("value", ""))[:80],
            "thumb": ii.get("thumburl") or ii["url"],
            "url": ii["url"],
            "page": ii.get("descriptionurl"),
            "mime": ii.get("mime"),
            "duration": ii.get("duration"),
        })
    return out


if __name__ == "__main__":
    q = sys.argv[1]
    kind = sys.argv[2] if len(sys.argv) > 2 else "bitmap"
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    for r in search(q, kind, limit):
        print(json.dumps(r, ensure_ascii=False))
