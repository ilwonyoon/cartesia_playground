"""
나중에 실행: python3 run-extract.py
FIGMA_ACCESS_TOKEN 환경변수 필요: export FIGMA_ACCESS_TOKEN=figd_...
"""
import json
import urllib.request
import os

FIGMA_TOKEN = os.environ.get("FIGMA_ACCESS_TOKEN")
if not FIGMA_TOKEN:
    raise SystemExit("FIGMA_ACCESS_TOKEN 환경변수를 설정하세요.\nexport FIGMA_ACCESS_TOKEN=figd_...")

FILE_KEY = "1YGgTyZ9Y9qQEGQALikC2p"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")

with open(os.path.join(BASE_DIR, "pending-frames.json")) as f:
    state = json.load(f)

pending_ids = [f["id"] for f in state["pending"]]
ids_param = ",".join(pending_ids)

print(f"Fetching {len(pending_ids)} frames...")
req = urllib.request.Request(
    f"https://api.figma.com/v1/images/{FILE_KEY}?ids={ids_param}&format=png&scale=1",
    headers={"X-Figma-Token": FIGMA_TOKEN}
)
with urllib.request.urlopen(req) as r:
    images = json.load(r).get("images", {})

print(f"Got {len(images)} image URLs. Downloading...")
for frame in state["pending"]:
    node_id = frame["id"]
    context = frame["context"]
    url = images.get(node_id)
    if not url:
        print(f"  SKIP (no url): {node_id}")
        continue
    slug = node_id.replace(":", "-") + "_" + context.split("/")[-1].replace("?", "_").replace("=", "_")[:30]
    out_path = os.path.join(SCREENSHOTS_DIR, f"{slug}.png")
    urllib.request.urlretrieve(url, out_path)
    print(f"  ✓ {slug}.png")

print("\nDone. Now run the design system extraction.")
