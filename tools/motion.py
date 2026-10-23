#!/usr/bin/env python3
"""動画の炎が どれくらい動いているかを数字で測る(2026-10-24)。
  ~/.local/venvs/ryokoshi/bin/python tools/motion.py 動画.mp4 [...]
  炎(いちばん明るい所)のまわりの 1コマごとの変化(diff)と、明るさの ゆらぎ(flick)、部屋全体の明るさのゆらぎ(room)。
  一灯で「止まって見えた」動画の数字と くらべる。"""
import subprocess, sys
import numpy as np
def frames(path, w=180, h=320):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
for p in sys.argv[1:]:
    F = frames(p)
    m = F.mean(0)
    y, x = np.unravel_index(np.argmax(m[:int(m.shape[0] * 0.8)]), m.shape)
    box = F[:, max(0, y - 30):y + 15, max(0, x - 15):x + 15]
    diff = np.abs(np.diff(box, axis=0)).mean()
    flick = box.mean((1, 2)).std() / max(box.mean(), 1) * 100
    room = F.mean((1, 2)); roomf = room.std() / room.mean() * 100
    print(f"{p.split('/')[-1]:40s} frames={len(F):4d}  diff={diff:5.2f}  flick={flick:5.2f}%  room={roomf:5.2f}%")
