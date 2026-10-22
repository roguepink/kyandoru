// キャンドルの顔ぶれ(20)。寸法は cm(大きさ「中」のとき)。
// 色は見た目の色(#rrggbb)。描くときに光の計算用の色に直す。
// 2026-10-23: キャンドルの専門家の案(いま欧米で実際に売られ、使われているもの)。並びは「静か → 光の遊び → 小さく終わる」。
//
// 書き方:
//   body   … H 高さ, Rt 上の半径, Rb 下の半径, flare 形(1 まっすぐ / -1 球: Rb が球の半径、H は上を平らに切った高さ)
//   deco   … 0 なし / 2 巻いた蜜ろう(六角) / 3 ねじれ / 5 まだら
//   type   … 0 キャンドル / 1 アルミの器(ティーライト)
//   wick   … len 長さ, w 太さ, curl 曲がり, kind 0 綿 / 2 木(平たい)
//   flame  … h 高さ, w 半幅, tint 0 黄色〜1 だいだい
//   holder … kind 0なし(H だけ上げる) 1燭台(鉄・木) 2金属の燭台 3皿 4ワインのびん 5手持ちの燭台, H 高さ, R 台座の半径, gloss つや, color, color2
//   cover  … kind 1北欧のランタン 3ガラスの風よけ 4モロッコの透かし 5ガラスの器 6ガラスの鉢, R 半径, y0 下, y1 上, color, frame 枠,
//             frost くもり(0〜1), tint 色の濃さ(0〜1), water 水の高さ
//   calm   … 風の当たりにくさ(ガラスの中は 揺れが小さい) / multi … 芯が3本 / crackle … 木の芯のパチパチ(明るさだけ)
//   room   … 「おまかせ」のときの部屋

const COTTON = { len: 1.0, w: 0.08, curl: 0.18, kind: 0 };
const WEST = { h: 3.0, w: 0.42, tint: 0.05 };
const STILL = { amp: 0.025, freq: 0.17 };
const BRASS = { kind: 2, H: 15, R: 5.5, gloss: 0.85, color: '#7a5e2a' };

export const CANDLES = [
  {
    id: 'pillar', name: 'ピラーキャンドル', short: 'ピラー', room: 'hygge',
    body: { H: 10, Rt: 3.75, Rb: 3.75, flare: 1 },
    wax: '#efe6d3', trans: 0.85, pool: 0.78, depth: 0.7, deco: 0,
    wick: COTTON, flame: { h: 2.8, w: 0.45, tint: 0.05 }, breath: STILL,
    holder: { kind: 3, H: 0.8, R: 5.0, gloss: 0.5, color: '#7d8083' },
  },
  {
    id: 'glow', name: '内から光るピラー', short: '内から光る', room: 'winter',
    body: { H: 12, Rt: 5.0, Rb: 5.0, flare: 1 },
    wax: '#f2ebdc', trans: 1.3, pool: 0.88, depth: 3.0, deco: 0,
    wick: { len: 1.0, w: 0.08, curl: 0.16, kind: 0 }, flame: { h: 2.5, w: 0.45, tint: 0.05 }, breath: STILL,
    holder: { kind: 3, H: 0.6, R: 6.2, gloss: 0.3, color: '#cdc5b8' },
    calm: 0.6,
  },
  {
    id: 'hurricane', name: 'ガラスの風よけ', short: '風よけ', room: 'cabin',
    body: { H: 10, Rt: 3.5, Rb: 3.5, flare: 1 },
    wax: '#efe6d3', trans: 0.85, pool: 0.78, depth: 0.6, deco: 0,
    wick: COTTON, flame: { h: 2.8, w: 0.45, tint: 0.05 }, breath: STILL,
    holder: { kind: 3, H: 1.5, R: 5.6, gloss: 0.3, color: '#4f3624' },
    cover: { kind: 3, R: 6.2, y0: 1.5, y1: 23, color: '#e6ece8', frame: '#000000', frost: 0, tint: 0 },
    calm: 0.35,
  },
  {
    id: 'taper', name: '真鍮の燭台', short: '真鍮', room: 'library',
    body: { H: 25, Rt: 1.0, Rb: 1.1, flare: 1 },
    wax: '#efe6cf', trans: 0.6, pool: 0.7, depth: 0.12, deco: 0,
    wick: { len: 0.95, w: 0.07, curl: 0.16, kind: 0 }, flame: WEST, breath: STILL,
    holder: BRASS,
  },
  {
    id: 'dinner', name: '銀の燭台', short: '銀', room: 'paris',
    body: { H: 30, Rt: 1.1, Rb: 1.1, flare: 1 },
    wax: '#f4f2ec', trans: 0.6, pool: 0.7, depth: 0.12, deco: 0,
    wick: { len: 0.95, w: 0.07, curl: -0.16, kind: 0 }, flame: WEST, breath: STILL,
    holder: { kind: 2, H: 18, R: 6.0, gloss: 0.9, color: '#9a9ea3' },
  },
  {
    id: 'chamber', name: '手持ちの燭台', short: '手持ち', room: 'hanok',
    body: { H: 12, Rt: 1.1, Rb: 1.1, flare: 1 },
    wax: '#f4f2ec', trans: 0.6, pool: 0.7, depth: 0.12, deco: 0,
    wick: { len: 0.95, w: 0.07, curl: 0.15, kind: 0 }, flame: { h: 2.8, w: 0.42, tint: 0.05 }, breath: STILL,
    holder: { kind: 5, H: 3.5, R: 7.0, gloss: 0.6, color: '#e2ddd3', color2: '#1f2a44' },
  },
  {
    id: 'rolled', name: '巻いたみつろう', short: 'みつろう', room: 'winter',
    body: { H: 20, Rt: 1.25, Rb: 1.25, flare: 1 },
    wax: '#d9a441', trans: 0.6, pool: 0.7, depth: 0.15, deco: 2,
    wick: { len: 1.1, w: 0.1, curl: 0.2, kind: 0 }, flame: { h: 3.5, w: 0.5, tint: 0.15 }, breath: { amp: 0.03, freq: 0.16 },
    holder: { kind: 1, H: 4.0, R: 3.2, gloss: 0.3, color: '#5e4128' },
  },
  {
    id: 'dipped', name: '手づくりのみつろう', short: '手づくり', room: 'cabin',
    body: { H: 25, Rt: 0.85, Rb: 1.2, flare: 1 },
    wax: '#c9963a', trans: 0.6, pool: 0.7, depth: 0.12, deco: 0,
    wick: { len: 1.1, w: 0.09, curl: -0.2, kind: 0 }, flame: { h: 3.5, w: 0.5, tint: 0.15 }, breath: { amp: 0.03, freq: 0.16 },
    holder: { kind: 1, H: 6.0, R: 3.0, gloss: 0.5, color: '#2b2622' },
  },
  {
    id: 'twist', name: 'ねじりキャンドル', short: 'Twist', room: 'toscana',
    body: { H: 25, Rt: 1.1, Rb: 1.1, flare: 1 },
    wax: '#6e1a26', trans: 0.45, pool: 0.7, depth: 0.12, deco: 3,
    wick: { len: 0.95, w: 0.07, curl: 0.16, kind: 0 }, flame: WEST, breath: STILL,
    holder: { kind: 2, H: 12, R: 5.0, gloss: 0.6, color: '#76797c' },
  },
  {
    id: 'ball', name: 'ボールキャンドル', short: 'Ball', room: 'paris',
    body: { H: 7.4, Rt: 2.1, Rb: 4.0, flare: -1 },
    wax: '#ede4cf', trans: 0.8, pool: 0.8, depth: 0.45, deco: 5,
    wick: COTTON, flame: { h: 2.5, w: 0.42, tint: 0.05 }, breath: STILL,
    holder: { kind: 3, H: 0.6, R: 4.6, gloss: 0.4, color: '#b8b0a2' },
  },
  {
    id: 'altar', name: '祭壇のろうそく', short: '祭壇', room: 'chapel',
    body: { H: 35, Rt: 3.0, Rb: 3.0, flare: 1 },
    wax: '#f4eedd', trans: 0.9, pool: 0.72, depth: 0.5, deco: 0,
    wick: { len: 1.2, w: 0.12, curl: 0.2, kind: 0 }, flame: { h: 3.5, w: 0.55, tint: 0.08 }, breath: STILL,
    holder: { kind: 2, H: 30, R: 9.0, gloss: 0.85, color: '#7a5e2a' },
  },
  {
    id: 'tall', name: '背の高いグラス', short: '高いグラス', room: 'indigo',
    body: { H: 16, Rt: 2.75, Rb: 2.75, flare: 1 },
    wax: '#f6f3ec', trans: 1.0, pool: 0.95, depth: 0.3, deco: 0,
    wick: COTTON, flame: { h: 2.5, w: 0.4, tint: 0.05 }, breath: STILL,
    holder: { kind: 0, H: 0.7, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 5, R: 3.05, y0: 0, y1: 20, color: '#dfe6e2', frame: '#000000', frost: 0.15, tint: 0 },
    calm: 0.4,
  },
  {
    id: 'votive', name: 'こはく色のグラス', short: 'こはく色', room: 'indigo',
    body: { H: 5.2, Rt: 2.0, Rb: 2.0, flare: 1 },
    wax: '#f3efe6', trans: 1.0, pool: 0.92, depth: 0.5, deco: 0,
    wick: { len: 0.9, w: 0.07, curl: 0.15, kind: 0 }, flame: { h: 2.2, w: 0.38, tint: 0.05 }, breath: STILL,
    holder: { kind: 0, H: 0.6, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 5, R: 2.4, y0: 0, y1: 7, color: '#c98b3a', frame: '#000000', frost: 0, tint: 0.6 },
    calm: 0.45,
  },
  {
    id: 'lykta', name: '北欧のランタン', short: 'ランタン', room: 'hygge',
    body: { H: 8, Rt: 3.0, Rb: 3.0, flare: 1 },
    wax: '#f1ece2', trans: 0.85, pool: 0.78, depth: 0.5, deco: 0,
    wick: COTTON, flame: { h: 2.5, w: 0.42, tint: 0.05 }, breath: STILL,
    holder: { kind: 0, H: 1.2, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 1, R: 5.0, y0: 1.2, y1: 22, color: '#e8eeee', frame: '#1e1e1e', frost: 0, tint: 0 },
    calm: 0.4,
  },
  {
    id: 'morocco', name: 'モロッコのランタン', short: 'モロッコ', room: 'riad', type: 1,
    body: { H: 1.6, Rt: 1.9, Rb: 1.9, flare: 1 },
    wax: '#f2ede2', trans: 1.0, pool: 0.94, depth: 0.32, deco: 0,
    wick: { len: 0.7, w: 0.06, curl: 0.12, kind: 0 }, flame: { h: 1.7, w: 0.32, tint: 0.0 }, breath: { amp: 0.02, freq: 0.25 },
    holder: { kind: 0, H: 1.0, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 4, R: 6.0, y0: 0.6, y1: 16, color: '#7a5a28', frame: '#000000', frost: 0, tint: 0 },
    calm: 0.5,
  },
  {
    id: 'woodwick', name: '木の芯のキャンドル', short: '木の芯', room: 'cabin', crackle: true,
    body: { H: 8, Rt: 4.2, Rb: 4.2, flare: 1 },
    wax: '#efe6d6', trans: 0.8, pool: 0.95, depth: 0.8, deco: 0,
    wick: { len: 0.55, w: 1.6, curl: 0, kind: 2 }, flame: { h: 2.1, w: 0.95, tint: 0.3 }, breath: { amp: 0.03, freq: 0.2 },
    holder: { kind: 0, H: 0.7, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 5, R: 4.5, y0: 0, y1: 10, color: '#8a5a2b', frame: '#000000', frost: 0, tint: 0.55 },
    calm: 0.6,
  },
  {
    id: 'threewick', name: '3つの炎のジャー', short: '3つの炎', room: 'library',
    body: { H: 8, Rt: 4.7, Rb: 4.7, flare: 1 },
    wax: '#f2eee6', trans: 0.8, pool: 0.95, depth: 1.0, deco: 0,
    wick: COTTON, flame: { h: 2.5, w: 0.4, tint: 0.05 }, breath: STILL,
    holder: { kind: 0, H: 0.7, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 5, R: 5.0, y0: 0, y1: 10, color: '#e8e2d8', frame: '#000000', frost: 0.75, tint: 0 },
    multi: { n: 3, dx: 1.7, back: 0.28, front: 0.36 },
    calm: 0.7,
  },
  {
    id: 'chianti', name: 'ワインのびん', short: 'ワインのびん', room: 'toscana',
    body: { H: 18, Rt: 1.1, Rb: 1.1, flare: 1 },
    wax: '#f2eee6', trans: 0.6, pool: 0.7, depth: 0.12, deco: 0,
    wick: { len: 0.95, w: 0.07, curl: 0.16, kind: 0 }, flame: WEST, breath: STILL,
    holder: { kind: 4, H: 24, R: 6.5, gloss: 0.9, color: '#1f3a1e', color2: '#b8955a' },
  },
  {
    id: 'float', name: '水にうかぶキャンドル', short: '水にうかぶ', room: 'hanok',
    body: { H: 2.5, Rt: 3.0, Rb: 2.7, flare: 1 },
    wax: '#f7f5f0', trans: 0.9, pool: 0.85, depth: 0.3, deco: 0,
    wick: { len: 0.9, w: 0.07, curl: 0.12, kind: 0 }, flame: { h: 2.0, w: 0.38, tint: 0.05 }, breath: STILL,
    holder: { kind: 0, H: 4.0, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 6, R: 9.0, y0: 0, y1: 7.5, color: '#dfe8e6', frame: '#000000', frost: 0, tint: 0, water: 5.0 },
    calm: 0.6,
  },
  {
    id: 'tealight', name: 'ガラスのティーライト', short: 'ティーライト', room: 'riad', type: 1,
    body: { H: 1.6, Rt: 1.9, Rb: 1.9, flare: 1 },
    wax: '#f2ede2', trans: 1.0, pool: 0.94, depth: 0.32, deco: 0,
    wick: { len: 0.7, w: 0.06, curl: 0.12, kind: 0 }, flame: { h: 1.6, w: 0.3, tint: 0.0 }, breath: { amp: 0.02, freq: 0.25 },
    holder: { kind: 0, H: 0.8, R: 0, gloss: 0, color: '#000000' },
    cover: { kind: 5, R: 2.3, y0: 0, y1: 5, color: '#e4ebe8', frame: '#000000', frost: 0, tint: 0 },
    calm: 0.5,
  },
];

export const SIZES = [
  { id: 's', name: '小', body: 0.8, flame: 0.9 },
  { id: 'm', name: '中', body: 1.0, flame: 1.0 },
  { id: 'l', name: '大', body: 1.22, flame: 1.1 },
];

// ゆれの3段階。lean = 炎の傾き(高さに対する横ずれの割合)。洋ろうそくは 和ろうそくより しずか
export const SWAYS = [
  { id: 'calm',   name: 'しずか', lean: 0.03, height: 0.03, gustEvery: [60, 180], gust: 0.07, flick: 0.0 },
  { id: 'yuragi', name: 'ゆらぎ', lean: 0.08, height: 0.06, gustEvery: [15, 45],  gust: 0.22, flick: 0.2 },
  { id: 'soyo',   name: 'そよ風', lean: 0.16, height: 0.14, gustEvery: [5, 14],   gust: 0.3,  flick: 0.6 },
];

// 明るさ5段階: 露出と、部屋のうす明かり
export const BRIGHT = [
  { exp: 0.42, amb: 0.0002 },
  { exp: 0.68, amb: 0.0005 },
  { exp: 0.80, amb: 0.0007 },
  { exp: 1.00, amb: 0.0011 },
  { exp: 1.25, amb: 0.0016 },
];

export const WARMTH = [
  { id: 'cool', name: '白っぽく', v: 0.0 },
  { id: 'mid',  name: 'ふつう',   v: 0.5 },
  { id: 'warm', name: 'あたたかく', v: 1.0 },
];

export function hexToLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2));
}
