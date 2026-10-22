// 部屋(10)。キャンドルを置く「世界の部屋の一角」。人や生き物は入れない。
// 2026-10-23: インテリアの専門家の案。ろうそく20に対して 部屋は10(多すぎると選ぶ画面が散らかる)。
//
// 絵は 2048×1024 のキャンバスに描く。単位: 横 u は キャンドルの真ん中が 0(スマホのたて画面の幅 = 1)、
// たて v は 台の奥のふちが 0(上へ 1.6 まで)。スマホのたて画面に見えるのは だいたい u -0.5〜0.5, v 0〜1.5。
// 描くのは「照らされる前の色」。明るさは シェーダーが 炎の光で つける。
//   A … 色
//   B … r 自分で光る(夜の窓・紙ごしの月あかり) / g 鏡・ガラス(炎が映る) / b 光の届きやすさ(奥・くぼみは小さく)
//
// 部屋のデータ:
//   surf  … 台の面: kind 0木 1ぬった木 2大理石 3石 4真鍮 5みがいた黒い石 6油紙, col, col2, refl 映り込み, grain もくめ, gloss つや
//   light … gain 壁の明るさ, pool 光のたまり(cm), win 夜の窓の明るさ, blur ぼかし, amb うす明かりの色

export const ROOMS = [
  { id: 'hygge',   name: '北欧の家',     country: 'デンマーク',
    surf: { kind: 0, col: '#6b4a30', col2: '#4a3220', refl: 0.15, grain: 1.0, gloss: 0.25 },
    light: { gain: 1.0, pool: 36, win: 0.10, blur: 1.6, amb: '#ffd9b0' } },
  { id: 'winter',  name: '冬の窓',       country: 'スウェーデン',
    surf: { kind: 1, col: '#b9b4aa', col2: '#b9b4aa', refl: 0.25, grain: 1.0, gloss: 0.5 },
    light: { gain: 0.95, pool: 32, win: 0.16, blur: 1.5, amb: '#c8d4e0' } },
  { id: 'paris',   name: 'Paris',        country: 'フランス',
    surf: { kind: 2, col: '#c6beb0', col2: '#8a8478', refl: 0.5, grain: 1.0, gloss: 0.8 },
    light: { gain: 0.95, pool: 34, win: 0.0, blur: 1.6, amb: '#ffe0c0' } },
  { id: 'library', name: '書斎',         country: 'イギリス',
    surf: { kind: 0, col: '#4a2e1e', col2: '#2e1a10', refl: 0.35, grain: 1.4, gloss: 0.6 },
    light: { gain: 1.0, pool: 30, win: 0.0, blur: 1.5, amb: '#ffd6a8' } },
  { id: 'chapel',  name: '石の礼拝堂',   country: 'ドイツ',
    surf: { kind: 3, col: '#6a655c', col2: '#4a463e', refl: 0.0, grain: 1.0, gloss: 0.05 },
    light: { gain: 0.9, pool: 39, win: 0.12, blur: 1.7, amb: '#d0d4dc' } },
  { id: 'toscana', name: 'トスカーナ',   country: 'イタリア',
    surf: { kind: 3, col: '#9c8a72', col2: '#7c6a52', refl: 0.08, grain: 0.6, gloss: 0.15 },
    light: { gain: 1.0, pool: 33, win: 0.0, blur: 1.5, amb: '#ffd2a0' } },
  { id: 'riad',    name: 'タイルの部屋', country: 'モロッコ',
    surf: { kind: 4, col: '#8a6a34', col2: '#8a6a34', refl: 0.6, grain: 1.0, gloss: 0.85 },
    light: { gain: 0.95, pool: 33, win: 0.0, blur: 1.5, amb: '#ffd6b0' } },
  { id: 'indigo',  name: '藍の部屋',     country: 'インド',
    surf: { kind: 5, col: '#1c1a18', col2: '#4a4640', refl: 0.6, grain: 1.0, gloss: 0.85 },
    light: { gain: 1.1, pool: 34, win: 0.08, blur: 1.6, amb: '#c8ccdc' } },
  { id: 'hanok',   name: 'ハノク',       country: '韓国',
    surf: { kind: 6, col: '#8a6a3a', col2: '#6e5228', refl: 0.25, grain: 1.0, gloss: 0.45 },
    light: { gain: 0.9, pool: 43, win: 0.05, blur: 1.5, amb: '#e8dcc0' } },
  { id: 'cabin',   name: 'Log House',    country: 'アメリカ',
    surf: { kind: 0, col: '#6a4e32', col2: '#4c3420', refl: 0.08, grain: 0.8, gloss: 0.2 },
    light: { gain: 1.0, pool: 33, win: 0.0, blur: 1.5, amb: '#ffd2a0' } },
];

export const TEX_W = 2048, TEX_H = 1024, PPU = 640;   // 1単位 = 640 ピクセル

// ---------- 道具 ----------
let NOISE = null;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function makeNoise() {
  // くり返しても つなぎ目が出ない ざらざら(256×256)
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  const r = rng(7), grid = [];
  for (let o = 0; o < 5; o++) { const n = 4 << o, a = []; for (let i = 0; i < n * n; i++) a.push(r()); grid.push({ n, a }); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0, amp = 0.5, tot = 0;
    for (const { n, a } of grid) {
      const fx = x / N * n, fy = y / N * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const at = (i, j) => a[((j % n + n) % n) * n + ((i % n + n) % n)];
      v += amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy);
      tot += amp; amp *= 0.55;
    }
    const k = Math.round(v / tot * 255), p = (y * N + x) * 4;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = k; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

class Painter {
  constructor(seed) {
    this.A = document.createElement('canvas'); this.B = document.createElement('canvas');
    for (const c of [this.A, this.B]) { c.width = TEX_W; c.height = TEX_H; }
    this.a = this.A.getContext('2d'); this.b = this.B.getContext('2d');
    // 単位で描けるように(y は上が +)
    for (const g of [this.a, this.b]) g.setTransform(PPU, 0, 0, -PPU, 1.6 * PPU, 1.6 * PPU);
    this.b.fillStyle = 'rgb(0,0,255)'; this.b.fillRect(-1.6, 0, 3.2, 1.6);
    this.r = rng(seed);
    if (!NOISE) NOISE = makeNoise();
  }
  fill(color, path) { const g = this.a; g.fillStyle = color; g.beginPath(); path(g); g.fill(); }
  rect(color, u0, v0, u1, v1) { this.a.fillStyle = color; this.a.fillRect(u0, v0, u1 - u0, v1 - v0); }
  // B に書く: r 光る, g 映る, b 届きやすさ(0〜1)
  brect(r, g, b, u0, v0, u1, v1) { this.b.fillStyle = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`; this.b.fillRect(u0, v0, u1 - u0, v1 - v0); }
  bfill(r, g, b, path) { const c = this.b; c.fillStyle = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`; c.beginPath(); path(c); c.fill(); }
  // ざらざらを重ねる(scale は 1枚の大きさ(単位)、amt は 強さ)
  grain(u0, v0, u1, v1, scale, amt, op = 'overlay', clip) {
    const g = this.a;
    g.save();
    if (clip) { g.beginPath(); clip(g); g.clip(); } else { g.beginPath(); g.rect(u0, v0, u1 - u0, v1 - v0); g.clip(); }
    g.globalCompositeOperation = op; g.globalAlpha = amt;
    const ox = this.r() * scale, oy = this.r() * scale;
    for (let u = u0 - ox; u < u1; u += scale) for (let v = v0 - oy; v < v1; v += scale) g.drawImage(NOISE, u, v, scale, scale);
    g.restore();
  }
  // すじ(木目など): 横長に のばした ざらざら
  streak(u0, v0, u1, v1, sx, sy, amt, op = 'overlay') {
    const g = this.a;
    g.save(); g.beginPath(); g.rect(u0, v0, u1 - u0, v1 - v0); g.clip();
    g.globalCompositeOperation = op; g.globalAlpha = amt;
    const ox = this.r() * sx, oy = this.r() * sy;
    for (let u = u0 - ox; u < u1; u += sx) for (let v = v0 - oy; v < v1; v += sy) g.drawImage(NOISE, u, v, sx, sy);
    g.restore();
  }
  line(color, w, pts) { const g = this.a; g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.stroke(); }
  // 下の方を暗く(床ちかく・奥のすみ)
  shade(u0, v0, u1, v1, from, to, dir = 'v') {
    const g = this.a, gr = dir === 'v' ? g.createLinearGradient(0, v0, 0, v1) : g.createLinearGradient(u0, 0, u1, 0);
    gr.addColorStop(0, from); gr.addColorStop(1, to);
    g.fillStyle = gr; g.fillRect(u0, v0, u1 - u0, v1 - v0);
  }
  // つやのある丸いもの(つぼ・びん)の 明暗
  roundShade(cx, w, v0, v1, amt = 0.5) {
    const g = this.a, gr = g.createLinearGradient(cx - w, 0, cx + w, 0);
    gr.addColorStop(0, `rgba(0,0,0,${amt})`); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(255,240,220,0.08)'); gr.addColorStop(1, `rgba(0,0,0,${amt * 0.9})`);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(cx - w, v0, 2 * w, v1 - v0); g.restore();
  }
}
const lerp = (a, b, t) => a + (b - a) * t;
function hexMix(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function jitter(hex, r, amt) { return hexMix(hex, r() < 0.5 ? '#000000' : '#ffffff', r() * amt); }

// 窓(十字の桟)。glass は夜の色。panes = [横, たて]
function windowAt(P, u0, v0, u1, v1, frame, glass, panes, fw, emit, mirror, snow) {
  P.rect(frame, u0 - fw, v0 - fw, u1 + fw, v1 + fw);
  P.rect(glass, u0, v0, u1, v1);
  // ガラス: 上は少し明るい夜空、下は暗い
  P.shade(u0, v0, u1, v1, 'rgba(0,0,0,0.25)', 'rgba(40,60,90,0.18)');
  if (snow) {
    // 外の雪(窓の下のほうに うっすら)
    P.fill('rgba(150,165,185,0.55)', (g) => { g.moveTo(u0, v0); for (let i = 0; i <= 20; i++) { const u = lerp(u0, u1, i / 20); g.lineTo(u, v0 + 0.05 + 0.03 * Math.sin(i * 1.7) + 0.02 * Math.sin(i * 4.1)); } g.lineTo(u1, v0); g.closePath(); });
  }
  P.brect(emit, mirror, 0.3, u0, v0, u1, v1);
  const [nx, ny] = panes, mw = fw * 0.45;
  for (let i = 1; i < nx; i++) { const u = lerp(u0, u1, i / nx); P.rect(frame, u - mw, v0, u + mw, v1); P.brect(0, 0.0, 1, u - mw, v0, u + mw, v1); }
  for (let j = 1; j < ny; j++) { const v = lerp(v0, v1, j / ny); P.rect(frame, u0, v - mw, u1, v + mw); P.brect(0, 0.0, 1, u0, v - mw, u1, v + mw); }
  // 枠の内側の影
  P.line('rgba(0,0,0,0.35)', fw * 0.25, [[u0, v0], [u0, v1], [u1, v1]]);
}

// ---------- 部屋ごと ----------
const PAINT = {
  hygge(P) {
    const r = P.r;
    // 白く塗った松の板張り(たての目地)
    P.rect('#8c857a', -1.6, 0, 1.6, 1.6);
    for (let u = -1.6; u < 1.6; u += 0.13) {
      P.rect(jitter('#8c857a', r, 0.03), u, 0, u + 0.13, 1.6);
      P.rect('rgba(40,30,20,0.22)', u, 0, u + 0.006, 1.6);
    }
    P.streak(-1.6, 0, 1.6, 1.6, 0.05, 0.9, 0.18);
    P.grain(-1.6, 0, 1.6, 1.6, 0.6, 0.25);
    // 腰の高さの 横板
    P.rect('#8a8376', -1.6, 0.0, 1.6, 0.05); P.rect('rgba(0,0,0,0.25)', -1.6, 0.05, 1.6, 0.058);
    // 右上の窓
    windowAt(P, 0.24, 0.42, 0.62, 1.3, '#9a9488', '#0e1318', [2, 2], 0.035, 0.55, 0.55, false);
    // 左: 陶器の花びんと 枯れ枝
    P.fill('#b3a894', (g) => { g.moveTo(-0.33, 0.0); g.bezierCurveTo(-0.39, 0.12, -0.38, 0.26, -0.31, 0.33); g.lineTo(-0.30, 0.42); g.lineTo(-0.26, 0.42); g.lineTo(-0.25, 0.33); g.bezierCurveTo(-0.18, 0.26, -0.17, 0.12, -0.23, 0.0); g.closePath(); });
    P.roundShade(-0.28, 0.1, 0, 0.42, 0.5);
    P.bfill(0, 0.12, 1, (g) => g.rect(-0.38, 0, 0.2, 0.42));
    for (let i = 0; i < 7; i++) {
      const a = -0.5 + i * 0.17 + (r() - 0.5) * 0.1, len = 0.35 + r() * 0.35;
      const pts = [[-0.28, 0.4]]; let u = -0.28, v = 0.4;
      for (let k = 0; k < 6; k++) { u += Math.sin(a + (r() - 0.5) * 0.4) * len / 6; v += Math.cos(a) * len / 6; pts.push([u, v]); }
      P.line('#3a2c20', 0.006, pts);
      for (let k = 2; k < 6; k += 2) P.line('#3a2c20', 0.004, [pts[k], [pts[k][0] + (r() - 0.5) * 0.12, pts[k][1] + 0.06 + r() * 0.05]]);
    }
    // 右手前: たたんだ ウールの布
    P.fill('#6d6255', (g) => { g.moveTo(0.16, 0.0); g.lineTo(0.16, 0.07); g.quadraticCurveTo(0.16, 0.1, 0.2, 0.1); g.lineTo(0.5, 0.1); g.lineTo(0.5, 0.0); g.closePath(); });
    P.rect('#5a5046', 0.16, 0.045, 0.5, 0.052);
    P.grain(0.16, 0, 0.5, 0.1, 0.05, 0.5);
    // ずっと左(横向きの画面): 小さな棚と 器
    P.rect('#7e776b', -1.3, 0.62, -0.75, 0.65);
    P.fill('#9a8f7c', (g) => g.ellipse(-1.05, 0.72, 0.07, 0.07, 0, 0, Math.PI * 2));
    P.rect('#5d5448', -0.95, 0.65, -0.86, 0.8);
    P.shade(-1.6, 0, 1.6, 0.25, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
  },

  winter(P) {
    const r = P.r;
    // 灰青の木の壁(はば広の板と 枠)
    P.rect('#56656b', -1.6, 0, 1.6, 1.6);
    P.grain(-1.6, 0, 1.6, 1.6, 0.5, 0.3);
    for (const [u0, u1] of [[-1.5, -0.6], [0.6, 1.5]]) {
      P.rect('rgba(0,0,0,0.18)', u0, 0.12, u1, 1.4); P.rect('#5a6a70', u0 + 0.02, 0.14, u1 - 0.02, 1.38);
    }
    // 窓(キャンドルの真後ろ): 外は 雪の夜
    windowAt(P, -0.27, 0.06, 0.27, 1.34, '#b9b4aa', '#0d141c', [2, 3], 0.04, 0.6, 0.85, true);
    // 窓台の奥の 立ち上がり
    P.rect('#aaa59a', -0.4, 0, 0.4, 0.04);
    // 左: 麻のカーテンのはし
    P.fill('#a8a090', (g) => { g.moveTo(-0.6, 0); g.lineTo(-0.6, 1.6); g.lineTo(-0.36, 1.6); g.bezierCurveTo(-0.33, 1.1, -0.37, 0.5, -0.34, 0); g.closePath(); });
    for (let i = 0; i < 6; i++) { const u = -0.58 + i * 0.04; P.line(`rgba(0,0,0,${0.12 + r() * 0.15})`, 0.012, [[u, 0], [u + 0.01, 0.8], [u - 0.005, 1.6]]); }
    P.streak(-0.6, 0, -0.33, 1.6, 0.03, 0.4, 0.3);
    P.bfill(0, 0, 0.9, (g) => g.rect(-0.6, 0, 0.27, 1.6));
    // 右: 小さなローズマリーの鉢
    P.fill('#8a5a3c', (g) => { g.moveTo(0.29, 0); g.lineTo(0.27, 0.12); g.lineTo(0.39, 0.12); g.lineTo(0.37, 0); g.closePath(); });
    P.rect('#7a4e34', 0.265, 0.11, 0.395, 0.135);
    for (let i = 0; i < 14; i++) { const u = 0.3 + r() * 0.06, a = (r() - 0.5) * 0.7; P.line('#3c4a32', 0.007, [[u, 0.13], [u + Math.sin(a) * 0.08, 0.13 + 0.1 + r() * 0.12]]); }
    P.shade(-1.6, 0, 1.6, 0.2, 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0)');
  },

  paris(P) {
    // 灰緑の板壁、四角いモールディング
    P.rect('#4a4f46', -1.6, 0, 1.6, 1.6);
    P.grain(-1.6, 0, 1.6, 1.6, 0.7, 0.22);
    const box = (u0, v0, u1, v1) => {
      P.line('rgba(255,250,235,0.16)', 0.012, [[u0, v0], [u0, v1], [u1, v1]]);
      P.line('rgba(0,0,0,0.35)', 0.012, [[u1, v1], [u1, v0], [u0, v0]]);
    };
    box(-1.45, 0.15, -0.55, 1.45); box(0.55, 0.15, 1.45, 1.45);
    // 金の額の鏡
    const fw = 0.055;
    P.rect('#8a6a30', -0.3 - fw, 0.42 - fw, 0.3 + fw, 1.28 + fw);
    P.line('#b08c48', 0.012, [[-0.3 - fw * 0.5, 0.42 - fw * 0.5], [-0.3 - fw * 0.5, 1.28 + fw * 0.5], [0.3 + fw * 0.5, 1.28 + fw * 0.5]]);
    P.line('#5a4420', 0.012, [[0.3 + fw * 0.5, 1.28 + fw * 0.5], [0.3 + fw * 0.5, 0.42 - fw * 0.5], [-0.3 - fw * 0.5, 0.42 - fw * 0.5]]);
    P.grain(-0.36, 0.36, 0.36, 1.34, 0.08, 0.4);
    // かざりの頭
    P.fill('#8a6a30', (g) => { g.moveTo(-0.12, 1.33); g.quadraticCurveTo(0, 1.45, 0.12, 1.33); g.closePath(); });
    // 鏡のガラス: 暗く、部屋が うっすら映る
    P.rect('#1b1d1a', -0.3, 0.42, 0.3, 1.28);
    P.shade(-0.3, 0.42, 0.3, 1.28, 'rgba(80,70,50,0.25)', 'rgba(0,0,0,0)');
    P.rect('rgba(70,75,66,0.5)', -0.3, 0.42, -0.18, 1.28);   // 映った壁
    P.bfill(0, 0.9, 0.35, (g) => g.rect(-0.3, 0.42, 0.6, 0.86));
    P.bfill(0, 0.25, 1, (g) => g.rect(-0.3 - fw, 0.42 - fw, 0.6 + 2 * fw, 0.86 + 2 * fw));
    P.bfill(0, 0.9, 0.35, (g) => g.rect(-0.3, 0.42, 0.6, 0.86));
    // 左: 置き時計
    P.fill('#3a2e1e', (g) => { g.moveTo(-0.4, 0); g.lineTo(-0.4, 0.17); g.quadraticCurveTo(-0.32, 0.28, -0.24, 0.17); g.lineTo(-0.24, 0); g.closePath(); });
    P.fill('#b8ab88', (g) => g.ellipse(-0.32, 0.15, 0.045, 0.045, 0, 0, Math.PI * 2));
    P.line('#2a2014', 0.005, [[-0.32, 0.15], [-0.32, 0.185]]); P.line('#2a2014', 0.005, [[-0.32, 0.15], [-0.295, 0.14]]);
    P.bfill(0, 0.3, 1, (g) => g.ellipse(-0.32, 0.15, 0.045, 0.045, 0, 0, Math.PI * 2));
    // 大理石の マントルピースの奥の 立ち上がり
    P.rect('#b8b0a2', -1.6, 0, 1.6, 0.05); P.grain(-1.6, 0, 1.6, 0.05, 0.2, 0.3);
    P.rect('rgba(0,0,0,0.3)', -1.6, 0.05, 1.6, 0.056);
    P.shade(-1.6, 0.056, 1.6, 0.3, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
  },

  library(P) {
    const r = P.r;
    // 下は 板張り、上は 本棚
    P.rect('#3a2a1e', -1.6, 0, 1.6, 1.6);
    P.streak(-1.6, 0, 1.6, 0.3, 0.6, 0.04, 0.35);
    const shelves = [0.32, 0.72, 1.14, 1.56];
    const COLS = ['#5a2a24', '#2c3b30', '#262c3a', '#8a7c62', '#4a3420', '#6a3a1c', '#3a2a2e'];
    for (let s = 0; s < shelves.length - 1; s++) {
      const v0 = shelves[s] + 0.035, v1 = shelves[s + 1];
      P.rect('#140d08', -1.6, v0, 1.6, v1);           // 奥(暗い)
      P.brect(0, 0, 0.6, -1.6, v0, 1.6, v1);
      let u = -1.6;
      while (u < 1.6) {
        if (r() < 0.04) { u += 0.05 + r() * 0.08; continue; }     // すき間
        const w = 0.022 + r() * 0.03, h = (v1 - v0) * (0.7 + r() * 0.26);
        const c = jitter(COLS[(r() * COLS.length) | 0], r, 0.2);
        P.rect(c, u, v0, u + w - 0.002, v0 + h);
        P.rect('rgba(0,0,0,0.35)', u + w - 0.006, v0, u + w - 0.002, v0 + h);
        if (r() < 0.5) { const bv = v0 + h * (0.78 + r() * 0.1); P.rect('rgba(190,150,80,0.45)', u, bv, u + w - 0.002, bv + 0.005); P.rect('rgba(190,150,80,0.3)', u, v0 + h * 0.15, u + w - 0.002, v0 + h * 0.15 + 0.004); }
        u += w;
      }
      P.brect(0, 0, 0.9, -1.6, v0, 1.6, v1 - 0.02);
      P.shade(-1.6, v1 - 0.12, 1.6, v1, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)');
    }
    for (const v of shelves) {
      P.rect('#3a2618', -1.6, v, 1.6, v + 0.035);
      P.rect('#5a3c26', -1.6, v + 0.026, 1.6, v + 0.035);    // 段板の前のふち
      P.brect(0, 0, 1, -1.6, v, 1.6, v + 0.035);
    }
    for (const u of [-1.0, 1.0]) { P.rect('#2a1c12', u - 0.03, 0.32, u + 0.03, 1.6); P.brect(0, 0, 1, u - 0.03, 0.32, u + 0.03, 1.6); }
    P.grain(-1.6, 0, 1.6, 1.6, 0.4, 0.2);
    // 机の上: 左に寝かせて積んだ本、右に インクのびん
    const stack = [['#4a2a22', 0.05], ['#2c3b30', 0.04], ['#6a5a40', 0.045]];
    let v = 0;
    stack.forEach(([c, h], i) => { const o = (i % 2 ? 0.015 : -0.01); P.rect(c, -0.44 + o, v, -0.2 + o, v + h); P.rect('rgba(220,200,160,0.25)', -0.43 + o, v + 0.006, -0.42 + o, v + h - 0.006); v += h; });
    P.fill('#1a1e22', (g) => { g.moveTo(0.26, 0); g.lineTo(0.25, 0.05); g.quadraticCurveTo(0.29, 0.07, 0.33, 0.05); g.lineTo(0.32, 0); g.closePath(); });
    P.rect('#6a5226', 0.272, 0.06, 0.308, 0.085);
    P.bfill(0, 0.4, 1, (g) => g.rect(0.25, 0, 0.08, 0.06));
    P.line('#c8b898', 0.004, [[0.29, 0.08], [0.33, 0.3]]);   // ペン(羽根ではなく 木の軸)
  },

  chapel(P) {
    const r = P.r;
    // 切り石の壁
    P.rect('#3e3a33', -1.6, 0, 1.6, 1.6);
    const bh = 0.14;
    for (let row = 0, v = 0; v < 1.6; row++, v += bh) {
      let u = -1.6 - (row % 2) * 0.14 - r() * 0.05;
      while (u < 1.6) {
        const w = 0.22 + r() * 0.14;
        P.rect(jitter('#5a554c', r, 0.12), u + 0.006, v + 0.006, u + w - 0.006, v + bh - 0.006);
        P.rect('rgba(255,250,240,0.06)', u + 0.006, v + bh - 0.016, u + w - 0.006, v + bh - 0.006);
        u += w;
      }
    }
    P.grain(-1.6, 0, 1.6, 1.6, 0.3, 0.45);
    P.grain(-1.6, 0, 1.6, 1.6, 0.08, 0.25);
    // 細いとがった窓(鉛の格子)
    const arch = (g, u0, u1, v0, v1) => { const c = (u0 + u1) / 2, w = (u1 - u0); g.moveTo(u0, v0); g.lineTo(u0, v1 - w * 0.9); g.quadraticCurveTo(u0, v1 - w * 0.1, c, v1); g.quadraticCurveTo(u1, v1 - w * 0.1, u1, v1 - w * 0.9); g.lineTo(u1, v0); g.closePath(); };
    P.fill('#2a2722', (g) => arch(g, -0.16, 0.16, 0.6, 1.42));     // 奥の深い窓わく
    P.bfill(0, 0, 0.6, (g) => arch(g, -0.16, 0.16, 0.6, 1.42));
    P.fill('#10141c', (g) => arch(g, -0.1, 0.1, 0.66, 1.36));
    P.bfill(0.45, 0.35, 0.3, (g) => arch(g, -0.1, 0.1, 0.66, 1.36));
    const a = P.a; a.save(); a.beginPath(); arch(a, -0.1, 0.1, 0.66, 1.36); a.clip();
    for (let k = -12; k < 12; k++) { P.line('#2a2620', 0.005, [[-0.2, 0.66 + k * 0.06], [0.2, 0.66 + k * 0.06 + 0.4]]); P.line('#2a2620', 0.005, [[0.2, 0.66 + k * 0.06], [-0.2, 0.66 + k * 0.06 + 0.4]]); }
    a.restore();
    P.fill('#57524a', (g) => g.rect(-0.18, 0.57, 0.36, 0.035));   // 窓の下の 石の段
    // 左: 鉄の燭台(火はない)
    P.rect('#1e1c1a', -0.4, 0, -0.388, 0.75);
    P.line('#1e1c1a', 0.01, [[-0.45, 0], [-0.394, 0.06], [-0.34, 0]]);
    P.rect('#1e1c1a', -0.43, 0.75, -0.358, 0.765);
    P.rect('#2a2620', -0.41, 0.765, -0.378, 0.8);
    P.shade(-1.6, 0, 1.6, 0.3, 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)');
  },

  toscana(P) {
    const r = P.r;
    // 黄土色の しっくい(ムラ)
    P.rect('#b89a6a', -1.6, 0, 1.6, 1.6);
    P.grain(-1.6, 0, 1.6, 1.6, 1.2, 0.35);
    P.grain(-1.6, 0, 1.6, 1.6, 0.25, 0.3);
    P.grain(-1.6, 0, 1.6, 1.6, 0.6, 0.18, 'multiply');
    for (let i = 0; i < 3; i++) {   // 細い ひび
      let u = -1.2 + r() * 2.4, v = 0.3 + r() * 1.1; const pts = [[u, v]];
      for (let k = 0; k < 8; k++) { u += (r() - 0.5) * 0.06; v -= 0.02 + r() * 0.03; pts.push([u, v]); }
      P.line('rgba(40,22,10,0.4)', 0.003, pts);
    }
    P.brect(0, 0, 0.75, -1.6, 0, 1.6, 1.6);
    // アーチ形の くぼみ(キャンドルが その中に入る)
    const niche = (g, w, top) => { g.moveTo(-w, 0); g.lineTo(-w, top - w); g.arc(0, top - w, w, Math.PI, 0, true); g.lineTo(w, 0); g.closePath(); };
    P.fill('#8a7048', (g) => niche(g, 0.22, 0.98));
    P.bfill(0, 0, 1, (g) => niche(g, 0.22, 0.98));
    P.grain(-0.22, 0, 0.22, 0.98, 0.3, 0.35, 'overlay', (g) => niche(g, 0.22, 0.98));
    // くぼみの ふちの影(左と上)
    const a = P.a; a.save(); a.beginPath(); niche(a, 0.22, 0.98); a.clip();
    P.shade(-0.22, 0, -0.14, 1, 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'h');
    a.restore();
    P.line('rgba(255,230,190,0.12)', 0.008, [[0.222, 0], [0.222, 0.76]]);
    // 左: オリーブ油の びん
    P.fill('#4a4a1c', (g) => { g.moveTo(-0.36, 0); g.lineTo(-0.36, 0.2); g.quadraticCurveTo(-0.36, 0.25, -0.335, 0.27); g.lineTo(-0.335, 0.36); g.lineTo(-0.315, 0.36); g.lineTo(-0.315, 0.27); g.quadraticCurveTo(-0.29, 0.25, -0.29, 0.2); g.lineTo(-0.29, 0); g.closePath(); });
    P.roundShade(-0.325, 0.04, 0, 0.36, 0.4);
    P.rect('#6a6a2a', -0.355, 0.02, -0.295, 0.15);
    P.bfill(0, 0.35, 1, (g) => g.rect(-0.36, 0, 0.07, 0.36));
    P.rect('#2a1a0e', -0.334, 0.36, -0.316, 0.385);
    // 右: 素焼きの つぼ
    P.fill('#8a4a2c', (g) => { g.moveTo(0.29, 0); g.bezierCurveTo(0.24, 0.06, 0.24, 0.17, 0.28, 0.21); g.lineTo(0.3, 0.24); g.lineTo(0.38, 0.24); g.lineTo(0.4, 0.21); g.bezierCurveTo(0.44, 0.17, 0.44, 0.06, 0.39, 0); g.closePath(); });
    P.roundShade(0.34, 0.1, 0, 0.24, 0.45);
    P.rect('#7a3e24', 0.295, 0.235, 0.385, 0.255);
    // 天井ちかくの 木の梁
    P.rect('#3a2616', -1.6, 1.3, 1.6, 1.44); P.streak(-1.6, 1.3, 1.6, 1.44, 0.8, 0.03, 0.35);
    P.rect('rgba(0,0,0,0.35)', -1.6, 1.285, 1.6, 1.3);
    P.shade(-1.6, 0, 1.6, 0.2, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
  },

  riad(P) {
    const r = P.r;
    // 上: タデラクト(つやのある土の壁)
    P.rect('#7a4a32', -1.6, 0.32, 1.6, 1.6);
    P.grain(-1.6, 0.32, 1.6, 1.6, 0.9, 0.35);
    P.grain(-1.6, 0.32, 1.6, 1.6, 0.2, 0.15);
    P.brect(0, 0.08, 1, -1.6, 0.32, 1.6, 1.6);
    // 下: 深い青緑の タイル(ゼリージュ)
    P.rect('#0e2626', -1.6, 0, 1.6, 0.32);
    const t = 0.045;
    for (let v = 0; v < 0.32; v += t) for (let u = -1.6; u < 1.6; u += t) {
      P.rect(jitter('#1f4848', r, 0.18), u + 0.003, v + 0.003, u + t - 0.003, v + t - 0.003);
      if (r() < 0.5) P.rect('rgba(255,255,255,0.05)', u + 0.006, v + t * 0.55, u + t * 0.5, v + t - 0.006);
    }
    P.brect(0, 0.22, 1, -1.6, 0, 1.6, 0.32);
    // タイルの上の ふち
    P.rect('#2a5a58', -1.6, 0.32, 1.6, 0.34); P.rect('rgba(0,0,0,0.3)', -1.6, 0.34, 1.6, 0.345);
    // 鍵穴形の アーチのくぼみ
    const key = (g, w, top) => { const R = w * 1.18, cy = top - R; g.moveTo(-w, 0); g.lineTo(-w, cy - R * 0.5); g.arc(0, cy, R, Math.PI + 0.55, -0.55, true); g.lineTo(w, cy - R * 0.5); g.lineTo(w, 0); g.closePath(); };
    P.fill('#4a2a1c', (g) => key(g, 0.19, 1.12));
    P.bfill(0, 0.05, 0.95, (g) => key(g, 0.19, 1.12));
    P.grain(-0.25, 0, 0.25, 1.12, 0.35, 0.3, 'overlay', (g) => key(g, 0.19, 1.12));
    const a = P.a; a.save(); a.beginPath(); key(a, 0.19, 1.12); a.clip();
    P.shade(-0.25, 0, -0.12, 1.2, 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)', 'h');
    // くぼみの中の 下の段も タイル
    for (let v = 0; v < 0.12; v += t) for (let u = -0.2; u < 0.2; u += t) P.rect(jitter('#1f4848', r, 0.15), u + 0.003, v + 0.003, u + t - 0.003, v + t - 0.003);
    a.restore();
    // 右: 透かし彫りの ランタン(火はない)
    P.fill('#5a4422', (g) => { g.moveTo(0.28, 0); g.lineTo(0.28, 0.3); g.lineTo(0.42, 0.3); g.lineTo(0.42, 0); g.closePath(); });
    P.fill('#5a4422', (g) => { g.moveTo(0.27, 0.3); g.quadraticCurveTo(0.35, 0.48, 0.35, 0.5); g.quadraticCurveTo(0.35, 0.48, 0.43, 0.3); g.closePath(); });
    for (let v = 0.04; v < 0.28; v += 0.04) for (let u = 0.295 + ((v * 25) % 2 ? 0.015 : 0); u < 0.41; u += 0.03) P.fill('#140c06', (g) => g.ellipse(u, v, 0.007, 0.009, 0, 0, Math.PI * 2));
    P.bfill(0, 0.3, 1, (g) => g.rect(0.27, 0, 0.16, 0.5));
    // 左: ミントティーの グラス
    P.fill('rgba(110,80,30,0.9)', (g) => { g.moveTo(-0.33, 0); g.lineTo(-0.345, 0.09); g.lineTo(-0.275, 0.09); g.lineTo(-0.29, 0); g.closePath(); });
    P.rect('rgba(200,170,90,0.35)', -0.34, 0.07, -0.28, 0.09);
    P.bfill(0, 0.5, 1, (g) => g.rect(-0.35, 0, 0.08, 0.1));
    P.shade(-1.6, 0, 1.6, 0.15, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
  },

  indigo(P) {
    const r = P.r;
    // 藍色の 石灰の壁(ムラ)
    P.rect('#2c3450', -1.6, 0, 1.6, 1.6);
    P.grain(-1.6, 0, 1.6, 1.6, 1.0, 0.3);
    P.grain(-1.6, 0, 1.6, 1.6, 0.18, 0.18);
    // 右: 木の格子窓(ジャリ)
    const u0 = 0.16, u1 = 0.46, v0 = 0.24, v1 = 1.2;
    P.rect('#3a2618', u0 - 0.04, v0 - 0.04, u1 + 0.04, v1 + 0.04);
    P.rect('#0a0c14', u0, v0, u1, v1);
    P.brect(0.35, 0.1, 0.4, u0, v0, u1, v1);
    const a = P.a; a.save(); a.beginPath(); a.rect(u0, v0, u1 - u0, v1 - v0); a.clip();
    const c = 0.06;
    for (let v = v0; v < v1 + c; v += c) for (let u = u0; u < u1 + c; u += c) {
      a.strokeStyle = '#3a2618'; a.lineWidth = 0.011;
      a.beginPath(); a.arc(u, v, c * 0.5, 0, Math.PI * 2); a.stroke();
      a.beginPath(); a.arc(u + c / 2, v + c / 2, c * 0.5, 0, Math.PI * 2); a.stroke();
    }
    a.restore();
    P.line('rgba(255,220,170,0.12)', 0.008, [[u0 - 0.04, v0 - 0.04], [u0 - 0.04, v1 + 0.04]]);
    // 左: 真鍮の鉢
    P.fill('#7a5a26', (g) => { g.moveTo(-0.4, 0.11); g.quadraticCurveTo(-0.4, 0.0, -0.31, 0.0); g.quadraticCurveTo(-0.22, 0.0, -0.22, 0.11); g.closePath(); });
    P.fill('#5a4018', (g) => g.ellipse(-0.31, 0.11, 0.09, 0.015, 0, 0, Math.PI * 2));
    P.roundShade(-0.31, 0.09, 0, 0.11, 0.4);
    P.bfill(0, 0.45, 1, (g) => g.rect(-0.4, 0, 0.18, 0.12));
    // 右手前: たたんだ布(深い赤)
    P.fill('#5a2028', (g) => { g.moveTo(0.18, 0); g.lineTo(0.18, 0.05); g.quadraticCurveTo(0.18, 0.07, 0.21, 0.07); g.lineTo(0.48, 0.07); g.lineTo(0.48, 0); g.closePath(); });
    P.rect('#7a5020', 0.18, 0.035, 0.48, 0.04);
    P.grain(0.18, 0, 0.48, 0.07, 0.04, 0.35);
    P.shade(-1.6, 0, 1.6, 0.2, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
  },

  hanok(P) {
    // 韓紙を張った 格子戸(背面いっぱい)。紙ごしに 夜の光が うっすら
    P.rect('#3a2a1e', -1.6, 0, 1.6, 1.6);
    const doors = [-1.5, -0.75, 0, 0.75, 1.5];
    for (let i = 0; i < doors.length - 1; i++) {
      const u0 = doors[i] + 0.03, u1 = doors[i + 1] - 0.03;
      P.rect('#a89a80', u0, 0.2, u1, 1.6);
      P.grain(u0, 0.2, u1, 1.6, 0.12, 0.25);
      P.brect(0.2, 0, 0.75, u0, 0.2, u1, 1.6);
      const cw = (u1 - u0) / 5, ch = 0.13;
      for (let k = 1; k < 5; k++) { P.rect('#3a2a1e', u0 + k * cw - 0.006, 0.2, u0 + k * cw + 0.006, 1.6); P.brect(0, 0, 1, u0 + k * cw - 0.006, 0.2, u0 + k * cw + 0.006, 1.6); }
      for (let v = 0.2 + ch; v < 1.6; v += ch) { P.rect('#3a2a1e', u0, v - 0.006, u1, v + 0.006); P.brect(0, 0, 1, u0, v - 0.006, u1, v + 0.006); }
      // 下の 板
      P.rect('#4a3424', u0, 0.03, u1, 0.17);
      P.streak(u0, 0.03, u1, 0.17, 0.4, 0.03, 0.3);
    }
    P.rect('#2a1c12', -1.6, 0, 1.6, 0.03);   // 敷居
    // 左: 白い磁器の 月の壺
    P.fill('#d8d2c4', (g) => { g.ellipse(-0.3, 0.28, 0.19, 0.24, 0, 0, Math.PI * 2); });
    P.fill('#d8d2c4', (g) => g.rect(-0.36, 0.0, 0.12, 0.08));
    P.fill('#ccc5b6', (g) => g.rect(-0.35, 0.5, 0.1, 0.04));
    P.roundShade(-0.3, 0.19, 0.0, 0.54, 0.45);
    P.bfill(0.0, 0.25, 1, (g) => g.ellipse(-0.3, 0.28, 0.19, 0.25, 0, 0, Math.PI * 2));
    // 右: 低い膳(ソバン)
    P.fill('#5a3a20', (g) => g.ellipse(0.38, 0.15, 0.17, 0.03, 0, 0, Math.PI * 2));
    P.rect('#4a2e18', 0.21, 0.12, 0.55, 0.15);
    for (const u of [0.25, 0.51]) P.rect('#3a2414', u - 0.012, 0, u + 0.012, 0.12);
    P.bfill(0, 0.2, 1, (g) => g.rect(0.2, 0, 0.36, 0.19));
  },

  cabin(P) {
    const r = P.r;
    // 丸太の壁(横の段々)
    P.rect('#2a1e14', -1.6, 0, 1.6, 1.6);
    const lh = 0.14;
    for (let v = 0; v < 1.6; v += lh) {
      const c = jitter('#5c4632', r, 0.12);
      P.rect(c, -1.6, v + 0.012, 1.6, v + lh - 0.012);
      P.streak(-1.6, v + 0.012, 1.6, v + lh - 0.012, 0.9, 0.02, 0.22);
      P.shade(-1.6, v + 0.012, 1.6, v + lh * 0.5, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)');
      P.shade(-1.6, v + lh * 0.5, 1.6, v + lh - 0.012, 'rgba(255,230,190,0.07)', 'rgba(0,0,0,0.3)');
      P.rect('#6a5a46', -1.6, v, 1.6, v + 0.012);     // しっくいの すき間
      for (let k = 0; k < 3; k++) { const u = -1.5 + r() * 3; P.fill('rgba(30,20,10,0.5)', (g) => g.ellipse(u, v + lh * 0.5, 0.015, 0.012, 0, 0, Math.PI * 2)); }
    }
    // 木の棚と 木の釘(シェーカー様式)
    P.rect('#6a4e32', -1.6, 0.86, 1.6, 0.92); P.rect('rgba(0,0,0,0.4)', -1.6, 0.855, 1.6, 0.862);
    for (let u = -1.4; u < 1.6; u += 0.28) { P.fill('#7a5a3a', (g) => g.ellipse(u, 0.89, 0.013, 0.013, 0, 0, Math.PI * 2)); }
    P.brect(0, 0, 1, -1.6, 0.86, 1.6, 0.92);
    // 布の袋を 1つ
    P.fill('#7a6a52', (g) => { g.moveTo(0.29, 0.88); g.lineTo(0.26, 0.82); g.bezierCurveTo(0.2, 0.7, 0.21, 0.58, 0.28, 0.56); g.lineTo(0.38, 0.56); g.bezierCurveTo(0.45, 0.58, 0.46, 0.7, 0.4, 0.82); g.lineTo(0.37, 0.88); g.closePath(); });
    P.line('#4a3a2a', 0.006, [[0.29, 0.86], [0.37, 0.86]]);
    P.grain(0.2, 0.56, 0.46, 0.88, 0.05, 0.35);
    // 左: 毛糸の ブランケットのはし(くすんだ赤の格子)
    P.fill('#5a2a22', (g) => { g.moveTo(-0.6, 0); g.lineTo(-0.6, 0.3); g.bezierCurveTo(-0.45, 0.32, -0.38, 0.2, -0.33, 0); g.closePath(); });
    const a = P.a; a.save(); a.beginPath(); a.moveTo(-0.6, 0); a.lineTo(-0.6, 0.3); a.bezierCurveTo(-0.45, 0.32, -0.38, 0.2, -0.33, 0); a.closePath(); a.clip();
    for (let u = -0.6; u < -0.3; u += 0.06) P.rect('rgba(30,20,20,0.45)', u, 0, u + 0.02, 0.35);
    for (let v = 0; v < 0.35; v += 0.06) P.rect('rgba(30,20,20,0.35)', -0.6, v, -0.3, v + 0.02);
    a.restore();
    P.grain(-0.6, 0, -0.3, 0.32, 0.05, 0.35);
    // 右: ジャムの びん
    P.fill('#4a1418', (g) => g.rect(0.27, 0, 0.08, 0.1));
    P.rect('#b8a888', 0.268, 0.1, 0.352, 0.12);
    P.rect('rgba(220,200,170,0.5)', 0.29, 0.03, 0.33, 0.07);
    P.bfill(0, 0.4, 1, (g) => g.rect(0.27, 0, 0.08, 0.1));
    P.shade(-1.6, 0, 1.6, 0.25, 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)');
  },
};

export function paintRoom(i) {
  const room = ROOMS[i];
  const P = new Painter(1000 + i * 77);
  PAINT[room.id](P);
  // 上の はし(天井ちかく)は 少し暗く
  P.shade(-1.6, 1.25, 1.6, 1.6, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)');
  return { A: P.A, B: P.B };
}
