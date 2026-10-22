#!/usr/bin/env python3
"""全部のキャンドル(おまかせの部屋で)と 全部の部屋を 1枚に並べて撮る。
  ~/.local/venvs/ryokoshi/bin/python tools/grid.py [candles|rooms] [--size 390x844] [--b 2]
"""
import argparse, functools, http.server, socketserver, threading, time, io, re
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass
ap = argparse.ArgumentParser(); ap.add_argument("what", default="candles", nargs="?"); ap.add_argument("--size", default="390x844")
ap.add_argument("--b", default="2"); ap.add_argument("--only", default=""); ap.add_argument("--room", default="")
a = ap.parse_args()
from playwright.sync_api import sync_playwright
socketserver.TCPServer.allow_reuse_address = True
w, h = (int(x) for x in a.size.split("x"))
with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(H, directory=str(ROOT))) as srv:
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
        pg = br.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/tools/view.html?b={a.b}&sway=0"); time.sleep(2)
        n = 20 if a.what == "candles" else 10
        idx = [int(x) for x in a.only.split(",")] if a.only else range(n)
        ims = []
        for i in idx:
            if a.what == "candles":
                js = f"""(async () => {{ const {{ CANDLES }} = await import('../js/candles.js'); const {{ ROOMS }} = await import('../js/rooms.js');
                  const r = {a.room or -1} >= 0 ? {a.room or -1} : ROOMS.findIndex(x => x.id === CANDLES[{i}].room); __s.set({{ candle: {i}, room: r }}); }})()"""
            else:
                js = f"__s.set({{ candle: 0, room: {i} }})"
            pg.evaluate(js); time.sleep(1.3)
            ims.append(Image.open(io.BytesIO(pg.screenshot())).convert("RGB"))
        cols = 5 if len(ims) > 4 else len(ims)
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w, rows * h))
        for k, im in enumerate(ims): sheet.paste(im, ((k % cols) * w, (k // cols) * h))
        out = ROOT / f"_check/grid-{a.what}.jpg"
        sheet.save(out, quality=85); print("saved", out)
        for e in errs[:5]: print(e)
        br.close()
