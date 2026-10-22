#!/usr/bin/env python3
"""アイコン・キャンドルと部屋の見本画像・共有用の画像を作る。
  ~/.local/venvs/ryokoshi/bin/python tools/assets.py
見本は 実際の画面より 1段明るくする(小さくても形が分かるように。UI/UX の専門家の案)。
"""
import functools, http.server, socketserver, threading, time, io, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
def lift(im, k):
    # 暗いところを 持ち上げる(小さな見本で 何の部屋か分かるように)
    im = im.point(lambda v: int(255 * (v / 255) ** 0.72))
    return ImageEnhance.Brightness(im).enhance(k)
ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
from playwright.sync_api import sync_playwright
ids = re.findall(r"id: '([^']+)', name", (ROOT / "js/candles.js").read_text())[:20]
rooms = re.findall(r"\{ id: '([^']+)',\s+name:", (ROOT / "js/rooms.js").read_text())
BOX = """(() => { const s = __s, cv = s.canvas, f = s.framing(cv.width, cv.height), d = s.candleDims(), c = d.c;
  let top = c.holder.H + d.H - c.depth + d.wl*0.55 + d.fh*1.05; if (c.cover) top = Math.max(top, c.cover.y1 + 0.6);
  return { top: 1 - (f.oy + top * f.S) / cv.height, base: 1 - f.oy / cv.height, fy: 1 - (f.oy + (c.holder.H + d.H - c.depth + d.wl*0.55 + d.fh*0.45) * f.S) / cv.height, s: f.S / cv.height, fh: d.fh }; })()"""
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(H, directory=str(ROOT))) as srv:
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
        def view(pg, c, r, b):
            pg.goto(f"{base}/tools/view.html?c={c}&r={r}&sway=0&b={b}"); time.sleep(2.2)
        # アイコン: ピラーキャンドル(北欧の家)の 炎のまわり
        pg = br.new_page(viewport={"width": 600, "height": 900}, device_scale_factor=2)
        view(pg, 0, 0, 3)
        pos = pg.evaluate(BOX)
        full = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
        W, Hh = full.size
        side = int(Hh * 0.42)
        cx, cy = W // 2, int(pos["fy"] * Hh + side * 0.22)
        sq = full.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))
        for name, size in [("icon-512", 512), ("icon-192", 192), ("apple-touch-icon", 180)]:
            sq.resize((size, size), Image.LANCZOS).save(ROOT / f"icons/{name}.png"); print(name)
        bg = sq.resize((512, 512), Image.LANCZOS).filter(ImageFilter.GaussianBlur(30)); bg.paste(sq.resize((372, 372), Image.LANCZOS), (70, 70))
        bg.save(ROOT / "icons/maskable-512.png"); print("maskable")
        # キャンドルの見本(3:4)。おまかせの部屋で
        pg = br.new_page(viewport={"width": 360, "height": 640}, device_scale_factor=1)
        src = (ROOT / "js/candles.js").read_text()
        for i, cid in enumerate(ids):
            rid = re.search(rf"id: '{cid}',.*?room: '([^']+)'", src, re.S).group(1)
            view(pg, i, rooms.index(rid), 3)
            box = pg.evaluate(BOX)
            im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
            W, Hh = im.size
            t, bse = box["top"] * Hh, box["base"] * Hh
            h = (bse - t) / 0.80
            y0 = t - h * 0.10; w = h * 3 / 4
            if w > W: cy = y0 + h / 2; w = W; h = w * 4 / 3; y0 = cy - h / 2
            im = im.crop((int(W / 2 - w / 2), int(y0), int(W / 2 + w / 2), int(y0 + h))).resize((180, 240), Image.LANCZOS)
            im = lift(im, 1.05)
            im.save(ROOT / f"icons/thumb-{cid}.jpg", quality=84); print("thumb", cid)
        # 部屋の見本(4:3)。どの部屋も 同じ小さなキャンドル(ガラスのティーライト)
        pg = br.new_page(viewport={"width": 640, "height": 480}, device_scale_factor=1)
        tl = ids.index("tealight")
        for r, rid in enumerate(rooms):
            view(pg, tl, r, 4)
            im = lift(Image.open(io.BytesIO(pg.screenshot())).convert("RGB").resize((320, 240), Image.LANCZOS), 1.15)
            im.save(ROOT / f"icons/room-{rid}.jpg", quality=84); print("room", rid)
        # 共有用(LINE などに貼ったとき)
        pg = br.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        view(pg, 0, 0, 3)
        im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
        d = ImageDraw.Draw(im)
        try: f = ImageFont.truetype("/System/Library/Fonts/Supplemental/Baskerville.ttc", 52)
        except Exception: f = ImageFont.truetype("/System/Library/Fonts/Times.ttc", 52)
        d.text((830, 250), "one candle", font=f, fill=(203, 184, 154))
        f2 = ImageFont.truetype("/System/Library/Fonts/ヒラギノ明朝 ProN.ttc", 22)
        d.text((830, 330), "電気を消して、キャンドルをひとつ。", font=f2, fill=(170, 150, 120))
        im.save(ROOT / "icons/ogp.jpg", quality=86); print("ogp")
        br.close()
