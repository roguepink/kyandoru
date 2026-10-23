#!/usr/bin/env python3
"""Higgsfield で作った 動画・静止画を、アプリで使う形にそろえる(2026-10-24)。
  ~/.local/venvs/ryokoshi/bin/python tools/media.py
  _check/hf/raw/<id>.mp4 / <id>-lit.png / <id>-unlit.png を読んで:
    media/v/<id>.mp4   炎の動画。最後の1秒を 最初の1秒に ゆっくり重ねて、くり返しても つなぎ目が見えないようにする(9秒)
    media/s/<id>.jpg   火がついた静止画(動画が出るまでの絵)
    media/u/<id>.jpg   火が消えた静止画(灯る前・消えたあと)
    icons/thumb-<id>.jpg  キャンドルを選ぶ画面の見本
    js/candles.js の tip(芯の先の位置)
  一灯で「動画の最初と最後を同じ絵にする」指定をしたら 炎がほとんど動かなかった。今回は 最初の絵だけ決めて作り、つなぎ目は ここで重ねる。
"""
import re, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "_check/hf/raw"
W, H = 720, 1280
X = 1.0                                  # 重ねる長さ(秒)
COVERED = {"morocco"}                    # 炎が見えない灯り: 煙は出さない

def tip_of(lit, unlit, cid):
    L = np.asarray(lit.convert("L"), dtype=np.float32)
    L[int(L.shape[0] * 0.92):] = 0
    thr = max(200, np.percentile(L, 99.8))
    ys, xs = np.where(L >= thr)
    # いちばん上の 明るい かたまり = 炎(下にあるのは 台への映り込み)
    keep = ys <= ys.min() + 0.06 * L.shape[0]
    ys, xs = ys[keep], xs[keep]
    cx, cy = float(np.median(xs)), float(np.median(ys))
    if cid in COVERED: return cx / L.shape[1], cy / L.shape[0]
    bottom = float(np.percentile(ys, 97))
    return cx / L.shape[1], bottom / L.shape[0]

def main():
    ids = re.findall(r"id: '([^']+)', name", (ROOT / "js/candles.js").read_text())[:21]
    for d in ("media/v", "media/s", "media/u"): (ROOT / d).mkdir(parents=True, exist_ok=True)
    tips = {}
    for cid in ids:
        v = RAW / f"{cid}.mp4"
        dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", subprocess.run(["ffmpeg", "-i", str(v)], capture_output=True, text=True).stderr).group(3))
        fc = (f"[0:v]trim={X}:{dur},setpts=PTS-STARTPTS,scale={W}:{H},fps=24,format=yuv420p[a];"
              f"[1:v]trim=0:{X},setpts=PTS-STARTPTS,scale={W}:{H},fps=24,format=yuv420p[b];"
              f"[a][b]xfade=transition=fade:duration={X}:offset={dur - 2 * X:.3f},format=yuv420p[o]")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(v), "-i", str(v), "-filter_complex", fc, "-map", "[o]", "-an",
                        "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-profile:v", "main", "-movflags", "+faststart",
                        str(ROOT / f"media/v/{cid}.mp4")], check=True)
        lit = Image.open(RAW / f"{cid}-lit.png").convert("RGB").resize((W, H), Image.LANCZOS)
        unl = Image.open(RAW / f"{cid}-unlit.png").convert("RGB").resize((W, H), Image.LANCZOS)
        lit.save(ROOT / f"media/s/{cid}.jpg", quality=84)
        unl.save(ROOT / f"media/u/{cid}.jpg", quality=84)
        tx, ty = tip_of(lit, unl, cid)
        tips[cid] = (round(tx, 4), round(ty, 4))
        # 見本(3:4): 灯りのまわり
        ch = int(H * 0.6); cw = ch * 3 // 4
        cy = int(min(max(ty * H + ch * 0.12, ch / 2), H - ch / 2)); cx = int(min(max(tx * W, cw / 2), W - cw / 2))
        lit.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2)).resize((180, 240), Image.LANCZOS).save(ROOT / f"icons/thumb-{cid}.jpg", quality=86)
        print(cid, tips[cid], f"{(ROOT / f'media/v/{cid}.mp4').stat().st_size // 1024}KB")
    src = (ROOT / "js/candles.js").read_text()
    for cid, (tx, ty) in tips.items():
        src = re.sub(rf"(id: '{cid}',[^\n]*?tip: )\[[^\]]*\]", rf"\g<1>[{tx}, {ty}]", src)
    (ROOT / "js/candles.js").write_text(src)
main()
