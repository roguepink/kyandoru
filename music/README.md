# 曲の入れ方(10曲くらい)

1. 曲のファイル(mp3 がおすすめ)を、この `music` フォルダに入れる。名前は英数字にする(例: `01-hygge-night.mp3`)。
2. `tracks.json` に 1曲 1行で書く。上から順番が「順番に」のときの並び。

```json
[
  { "file": "01-hygge-night.mp3", "title": "冬の夜" },
  { "file": "02-paris.mp3", "title": "Paris", "gain": 0.7 }
]
```

- 曲が1つもないとき(`[]` のとき)は、画面に「Music」のボタンは出ない。いまは `[]`(ノブさんの曲待ち)。
- 曲の終わり 8秒は自動で小さくなり、3秒しずかにしてから次の曲へ。
- 音の大きさは そろえる(一灯と同じ目安 -19.8 LUFS)。gain = 10^((-19.8 - その曲の値)/20)。
  はかり方: `ffmpeg -i 曲.mp3 -af ebur128=framelog=quiet -f null -` の Integrated loudness。
- 1曲 3〜5MB くらいにしておくと、スマホで流しやすい。
