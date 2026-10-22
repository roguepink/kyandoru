// キャンドルの場面を 1枚の絵として描く「シェーダー」(画面の1点ずつの色を決めるプログラム)。
// 単位は cm。原点は「台の上、キャンドルの真下の手前のふち」。上が +y。
// 場面: 手前に台(木・大理石・石・真鍮など)、奥に「部屋」の絵(rooms.js で描いた絵を、炎の光で照らす)。
// 部屋の絵は 少しぼかす(写真の「背景ぼけ」と同じ。主役はキャンドル)。

export const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uS;        // 1cm が何ピクセルか
uniform vec2  uOrg;      // 原点の位置(ピクセル)
uniform float uType;     // 0 ふつう / 1 ティーライト(アルミの器)
uniform vec4  uBody;     // 高さ, 上の半径, 下の半径, 形(1 まっすぐ / マイナス = 球)
uniform vec3  uWax;      // ろうの色(リニア)
uniform vec4  uWaxP;     // 透け具合(cm), 池の広さ(割合), くぼみの深さ(cm), 模様(0なし 2蜂の巣 3ねじれ 5まだら)
uniform vec4  uWick;     // 芯の長さ, 太さ, 曲がり, 種類(0 綿 2 木)
uniform vec4  uFlame;    // 炎の高さ, 半幅, 根元の傾き, 先の傾き
uniform vec4  uFlameP;   // 灯っている度合い, ゆらめき, 芯の赤い火, 炎の色(0 ふつう→1 だいだい)
uniform vec4  uMulti;    // 炎の数(1〜3), 横のはなれ(cm), 奥の2つの上がり(cm), 手前の1つの下がり(cm)
uniform vec2  uFB;       // 炎の根元の位置(cm)
uniform vec2  uLP;       // 光の中心(cm)
uniform vec4  uLight;    // 光の強さ, 露出, まわりのうす明かり, 色(0 白っぽい .5 ふつう 1 あたたか)
uniform vec4  uHold;     // 台(0 なし 1 燭台 2 金属の燭台 3 皿 4 ワインのびん 5 手持ちの燭台), 高さ, 半径, つや
uniform vec3  uHoldCol;  // 台の色
uniform vec3  uHoldCol2; // 台の2つめの色(びんの わら / ふちの色)
uniform vec4  uSmoke;    // 消えてからの秒数, 濃さ, 芯の先 x, y
uniform float uBlack;    // 1 で真っ黒
uniform vec4  uCover;    // かさ: 種類(0なし 1ランタン 3ガラスの風よけ 4モロッコ 5ガラスの器 6ガラスの鉢), 半径, 下の高さ, 上の高さ
uniform vec4  uCoverP;   // くもり(0 透明〜1 すりガラス), 色の濃さ, 水の高さ, -
uniform vec3  uCoverCol; // ガラス・金属の色
uniform vec3  uFrameCol; // 枠の色
// 部屋
uniform sampler2D uRoomA;  // 部屋の色
uniform sampler2D uRoomB;  // r 自分で光る(夜の窓) / g 鏡・ガラス(炎が映る) / b 光の届きやすさ
uniform vec4  uBg;       // 部屋の絵の 1単位が何ピクセルか, 台の奥のふち(ピクセル), 1単位が何cmか, 壁までの距離(cm)
uniform vec4  uRoomP;    // 壁の明るさ, 光のたまりの大きさ(cm), 夜の窓の明るさ, ぼかし
uniform vec3  uRoomAmb;  // 部屋の うす明かりの色
uniform float uYJ;       // 台の奥のふち(cm, 画面の高さ)
uniform vec4  uSurf;     // 台の面: 種類(0木 1ぬった木 2大理石 3石 4真鍮 5みがいた黒い石 6油紙), 映り込み, もくめの細かさ, つや
uniform vec3  uSurfCol;
uniform vec3  uSurfCol2;

const float K  = 0.2;    // 見下ろす角度(上の面のだ円のつぶれ具合)
float gSide = 0.0;
float gNoFlame = 0.0;    // 1 = 炎は描かない(映り込みのぼかし用)
float gRefl = 0.0;       // 1 = 映り込みを描いている(上の面は映らない)

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03 + vec2(1.7,9.2); a *= 0.5; }
  return s;
}

vec3 lightCol(){
  vec3 cool = vec3(1.0, 0.52, 0.23);
  vec3 mid  = vec3(1.0, 0.43, 0.14);
  vec3 warm = vec3(1.0, 0.34, 0.08);
  float w = uLight.w;
  return w < 0.5 ? mix(cool, mid, w*2.0) : mix(mid, warm, w*2.0-1.0);
}

// ---------- 炎 ----------
float prof(float t, float t0, float tb, float w, float tipE){
  if (t < t0 || t > 1.0) return 0.0;
  if (t < tb){ float u = (tb - t)/(tb - t0); return w*sqrt(max(1.0 - u*u, 0.0)); }
  float u = (t - tb)/(1.0 - tb);
  return w*(1.0 - pow(u, tipE))*(1.0 - 0.22*u);
}

vec3 flameOne(vec2 p, vec2 fb, float hk, float ph, float lean){
  float lit = uFlameP.x;
  float h = uFlame.x*hk*mix(0.22, 1.0, lit);
  float w = uFlame.y*mix(0.55, 1.0, lit);
  vec2 q = p - fb;
  float t = q.y/h;
  if (t < -0.2 || t > 1.05) return vec3(0.0);
  if (abs(q.x) > h*1.2 + w*2.0) return vec3(0.0);
  float bend = ((uFlame.z + lean)*t + (uFlame.w - uFlame.z)*t*t)*h;
  float wob = uFlameP.y*w*t*t*((vnoise(vec2(t*3.0 - uTime*4.3, 2.0 + ph)) - 0.5)*1.4 + (vnoise(vec2(t*6.0 - uTime*9.7, 5.0 + ph)) - 0.5)*0.7);
  float x = q.x - bend - wob;
  float tint = uFlameP.w;
  float wide = smoothstep(0.6, 1.2, w/h);   // 木の芯: 横に広い炎

  float tipE = mix(1.6, 2.4, tint);
  float hwO = prof(t, -0.13, 0.22 + 0.12*tint + 0.1*wide, w, tipE);
  float hwL = prof(t, 0.03 + 0.05*tint, 0.30 + 0.14*tint + 0.1*wide, w*0.9, tipE);
  float aa = 1.2/(uS*max(w, 0.05));
  float dO = abs(x)/max(hwO, 1e-4);
  float dL = abs(x)/max(hwL, 1e-4);
  float envO = hwO > 0.0 ? smoothstep(1.0, 0.78 - aa, dO) : 0.0;
  float envL = hwL > 0.0 ? smoothstep(1.0, 0.70 - aa, dL) : 0.0;

  float tn = clamp((t - 0.03)/0.97, 0.0, 1.0);
  float core = (1.0 - dL*dL)*(1.0 - smoothstep(0.30, 0.95 - 0.15*tint, tn));
  vec3 cTip  = vec3(1.0, 0.33, 0.06);
  vec3 cOut  = vec3(1.0, 0.56, 0.15);
  vec3 cMid  = vec3(1.0, 0.83, 0.46);
  vec3 cCore = vec3(1.0, 0.96, 0.86);
  vec3 c = mix(cTip, cOut, smoothstep(0.98, 0.62, tn));
  cMid = mix(cMid, vec3(1.0, 0.55, 0.18), tint);
  cCore = mix(cCore, vec3(1.0, 0.78, 0.45), tint);
  c = mix(c, cMid, smoothstep(0.15, 0.65, core));
  c = mix(c, cCore, smoothstep(0.55, 0.95, core));
  float lum = envL*mix(1.0, 0.25 + 0.15*tint, smoothstep(0.6, 1.0, tn))*(2.2 + 5.5*core*(1.0 - 0.7*tint))*(1.0 - 0.38*tint);

  // 芯のまわりの暗いところ(まだ燃えていない ろうの蒸気)
  float dz = 1.0 - smoothstep(0.30, 1.0, length(vec2(x/(w*mix(0.55, 0.75, tint)*mix(1.0, 0.7, wide)), (t - 0.10 - 0.08*tint)/(0.17 + 0.14*tint))));
  lum *= 1.0 - 0.88*dz;
  vec3 e = c*lum;

  // 青い根元(洋ろうそくは 小さく うすい)
  float blue = envO*(1.0 - envL*0.92)*smoothstep(0.11, 0.0, t)*(0.6 + 0.4*smoothstep(0.3, 0.9, dO))*(1.0 - 0.8*tint);
  blue *= 0.2 + 0.8*smoothstep(0.25, 0.85, dO);
  e += vec3(0.05, 0.10, 0.45)*blue*0.3;
  e += vec3(0.22, 0.10, 0.03)*dz*envO*0.06;

  // つけたて・消えかけは 小さく 青っぽい
  float young = smoothstep(0.15, 0.75, lit);
  e = mix(vec3(0.12, 0.22, 1.0)*(envO*1.4 + envL*0.6), e, young);
  return e*smoothstep(0.0, 0.12, lit);
}

// 炎(芯が3本のときは 3つ。奥の2つは 少し上に見える)
vec2 flameOff(int i){
  if (i == 0) return uMulti.x > 2.5 ? vec2(-uMulti.y, uMulti.z) : vec2(0.0);
  if (i == 1) return vec2(uMulti.y, uMulti.z);
  return vec2(0.0, -uMulti.w);
}
vec3 flameEmit(vec2 p){
  if (uFlameP.x <= 0.002) return vec3(0.0);
  vec3 e = flameOne(p, uFB + flameOff(0), 1.0, 0.0, uMulti.x > 2.5 ? 0.05 : 0.0);
  if (uMulti.x > 2.5){
    e += flameOne(p, uFB + flameOff(1), 0.96, 3.7, -0.05);
    e += flameOne(p, uFB + flameOff(2), 1.03, 7.1, 0.0);
  }
  return e;
}

vec3 halo(vec2 p){
  float lit = uFlameP.x;
  if (lit <= 0.002) return vec3(0.0);
  vec2 d = p - uLP;
  d.y *= 0.72;
  float r = length(d)/max(uFlame.x*(uMulti.x > 2.5 ? 1.6 : 1.0), 0.5)*3.0;
  float g = 0.26*exp(-r*1.6) + 0.06*exp(-r*0.42) + 0.012*exp(-r*0.12);
  return mix(vec3(1.0, 0.55, 0.20), lightCol(), 0.5)*g*(uLight.x/60.0)*lit;
}

// ---------- 光と影 ----------
// 世界の点 P(x,y,z) が炎から照らされるか(キャンドル本体の影)。1=照らされる
float candleShadow(vec3 P){
  float Rt = uBody.y;
  float Htop = uHold.y + uBody.x;
  if (uCover.x > 4.5){ Rt = max(Rt, uCover.y*0.98); Htop = max(Htop, uCover.w); }   // ガラスの器: ふちが影をつくる
  vec2 L = vec2(uLP.x, 0.0);
  vec2 D = vec2(P.x, P.z) - L;
  float dd = dot(D, D);
  if (dd < 1e-4) return 0.0;
  float b = dot(L, D);
  float c = dot(L, L) - Rt*Rt;
  float disc = b*b - dd*c;
  if (disc < 0.0) return 1.0;
  float s = (-b + sqrt(disc))/dd;     // 本体の上をこえる位置
  if (s >= 1.0) return 1.0;
  float hExit = uLP.y + s*(P.y - uLP.y);
  float pen = uFlame.x*0.35*(1.0 - s) + 0.05;
  float sh = smoothstep(-pen, pen, hExit - Htop);
  if (uCover.x > 4.5) sh = mix(0.55 + 0.25*(1.0 - uCoverP.x), 1.0, sh);   // ガラスごしの光は 少しは とどく
  return sh;
}

float irr(vec3 P, vec3 n){
  vec3 L = vec3(uLP, 0.0) - P;
  float d2 = dot(L, L);
  float c = max(dot(n, normalize(L)), 0.0);
  return c/(d2 + 4.0);
}

// ---------- かさ ----------
// モロッコの透かし: まわりの長さ u と高さ y(cm)。星と丸の穴が 互いちがいに並ぶ
float moroHole(float u, float y, float soft){
  float y0 = uCover.z + 1.6, y1 = uCover.w - 1.2;
  if (y < y0 - 1.0 || y > y1 + 1.0) return 0.0;
  vec2 q = vec2(u, y)/1.2;
  float row = floor(q.y);
  q.x += mod(row, 2.0)*0.5;
  vec2 f = fract(q) - 0.5;
  float a = atan(f.y, f.x);
  float star = 0.17 + 0.06*cos(8.0*a);
  float small = length(f - vec2(0.5, 0.5)*sign(f)) - 0.07;
  float d = min(length(f) - star, small);
  float edge = smoothstep(y0 - 0.5, y0 + 0.3, y)*smoothstep(y1 + 0.5, y1 - 0.3, y);
  return (1.0 - smoothstep(-soft, soft, d))*edge;
}
float glassR(float y){
  float t = clamp((y - uCover.z)/(uCover.w - uCover.z), 0.0, 1.0);
  float k = uCover.x;
  if (k < 3.5) return uCover.y*(0.80 + 0.20*sin(3.14159*min(t*1.05, 1.0)))*(1.0 - 0.06*smoothstep(0.85, 1.0, t));  // 風よけ(ふくらみ)
  if (k < 5.5) return uCover.y;                                                                                  // 器(まっすぐ)
  return uCover.y*(0.42 + 0.58*sqrt(max(1.0 - pow(1.0 - t, 2.0), 0.0)));                                         // 鉢
}
vec3 coverTint(){
  if (uCover.x < 0.5 || uCover.x > 3.5 && uCover.x < 4.5) return vec3(1.0);
  return mix(vec3(1.0), uCoverCol/max(max(uCoverCol.r, uCoverCol.g), max(uCoverCol.b, 0.001)), uCoverP.y);
}
// 部屋(壁・台)へ とどく光の割合
float coverTrans(vec3 P){
  float k = uCover.x;
  if (k < 0.5) return 1.0;
  vec2 L = vec2(uLP.x, 0.0);
  vec2 D = vec2(P.x, P.z) - L;
  if (k < 1.5){
    // ランタン: 四すみの柱と 上下の枠が 影になる
    float m = max(abs(D.x), abs(D.y));
    if (m < 1e-3) return 1.0;
    float s = uCover.y/m;
    vec3 Hh = vec3(uLP, 0.0) + s*(P - vec3(uLP, 0.0));
    if (s >= 1.0) return 1.0;
    float side = min(abs(abs(Hh.x - uLP.x) - uCover.y), abs(abs(Hh.z) - uCover.y));
    float post = smoothstep(0.35, 0.65, side + 0.05*length(P - Hh)*0.0);
    float soft = 0.25 + length(P - Hh)*0.012;
    post = smoothstep(0.3 - soft, 0.3 + soft, side);
    float rail = smoothstep(uCover.z + 0.3, uCover.z + 0.8, Hh.y)*smoothstep(uCover.w + 0.2, uCover.w - 0.6, Hh.y);
    return (0.12 + 0.8*post)*rail + 0.04;
  }
  if (k < 3.5) return 0.95;
  if (k > 4.5) return 1.0;
  // モロッコ: 穴と 上の口から だけ
  float dd = dot(D, D);
  float b = dot(L, D), c = dot(L, L) - uCover.y*uCover.y;
  float s = (-b + sqrt(max(b*b - dd*c, 0.0)))/max(dd, 1e-4);
  if (s >= 1.0) return 1.0;
  vec3 Hh = vec3(uLP, 0.0) + s*(P - vec3(uLP, 0.0));
  if (Hh.y > uCover.w) return 0.05;
  float u = atan(Hh.x, Hh.z)*uCover.y;
  float dist = length(P - Hh);
  return moroHole(u, Hh.y, 0.03 + dist*0.006)*1.9 + 0.02;
}

// ---------- 部屋 ----------
vec4 roomTex(sampler2D t, vec2 uv, float b){
  vec2 o = vec2(0.0012, 0.0024)*exp2(b);
  return 0.25*(texture2D(t, uv + vec2(o.x, o.y), b) + texture2D(t, uv + vec2(-o.y, o.x), b)
             + texture2D(t, uv + vec2(-o.x, -o.y), b) + texture2D(t, uv + vec2(o.y, -o.x), b));
}
vec3 roomAt(vec2 fc){
  // 部屋の絵での位置(単位)。x は キャンドルの真ん中が 0、y は 台の奥のふちが 0
  vec2 lpx = uOrg + uLP*uS;                         // 炎の画面の位置
  vec2 bp = vec2(fc.x - uOrg.x, fc.y - uBg.y)/uBg.x;
  vec2 lb = vec2(lpx.x - uOrg.x, lpx.y - uBg.y)/uBg.x;
  vec2 uv = vec2(bp.x/3.2 + 0.5, bp.y/1.6);
  vec4 A = roomTex(uRoomA, uv, uRoomP.w);
  vec4 B = roomTex(uRoomB, uv, uRoomP.w);
  // 世界の点(炎を基準に、壁は uBg.w cm 奥)
  vec2 dw = (bp - lb)*uBg.z;
  vec3 P = vec3(uLP.x + dw.x, uLP.y + dw.y, -uBg.w);
  float sh = candleShadow(P)*coverTrans(P);
  float E = irr(P, vec3(0.0, 0.0, 1.0))*(uBg.w*uBg.w + 4.0);   // 炎の正面で 1
  E *= 1.0/(1.0 + dot(dw, dw)/(uRoomP.y*uRoomP.y));             // 光のたまり
  E *= sh*B.b;
  // 台との さかい目は 少し暗く
  float ao = 0.45 + 0.55*smoothstep(0.0, 0.08, bp.y);
  vec3 Lw = mix(lightCol(), vec3(1.0, 0.62, 0.34), 0.35)*coverTint();
  vec3 col = A.rgb*(E*uLight.x/60.0*uRoomP.x*Lw + uLight.z*uRoomAmb*8.0)*ao;
  // 夜の窓
  col += A.rgb*B.r*uRoomP.z;
  // 鏡・ガラス: 炎が うっすら映る
  vec2 dm = (fc - lpx - vec2(0.0, uFlame.x*uS*0.15))/uS;
  float fm = exp(-dot(dm*vec2(1.4, 0.7), dm*vec2(1.4, 0.7))/max(uFlame.x*uFlame.x*0.5, 0.3));
  col += B.g*lightCol()*uFlameP.x*(uLight.x/60.0)*(0.5*fm + 0.08*E);
  return col;
}

// ---------- 台の面 ----------
vec3 surfAlb(vec2 p, float z){
  float k = uSurf.x, g = uSurf.z;
  if (k < 0.5){            // 木(板が左右に のびる)
    float plank = floor(z/9.0);
    float x = p.x + hash(vec2(plank, 1.0))*40.0;
    float grain = fbm(vec2(x*0.05*g, z*0.9*g + plank*3.0));
    float ring = 0.5 + 0.5*sin(x*0.35*g + grain*9.0);
    vec3 a = mix(uSurfCol, uSurfCol2, smoothstep(0.3, 0.8, ring)*0.6 + grain*0.3);
    float seam = smoothstep(0.12, 0.0, abs(fract(z/9.0) - 0.5) - 0.48);
    return a*(1.0 - 0.45*seam)*(0.9 + 0.2*hash(vec2(plank, 4.0)));
  }
  if (k < 1.5){            // ぬった木(ペンキ)
    float br = fbm(vec2(p.x*0.6, z*2.5));
    return uSurfCol*(0.92 + 0.12*br);
  }
  if (k < 2.5){            // 大理石
    float n = fbm(p*0.08 + vec2(0.0, z*0.06));
    float v = abs(sin(p.x*0.09 + z*0.05 + n*7.0));
    float vein = smoothstep(0.06, 0.0, v)*0.8 + smoothstep(0.25, 0.0, v)*0.2;
    return mix(uSurfCol*(0.94 + 0.1*n), uSurfCol2, vein);
  }
  if (k < 3.5){            // 石
    float n = fbm(vec2(p.x, z)*0.25*g);
    float pit = smoothstep(0.78, 0.9, vnoise(vec2(p.x, z)*1.8*g));
    return mix(uSurfCol, uSurfCol2, n)*(1.0 - 0.3*pit);
  }
  if (k < 4.5){            // 真鍮の盆(細い同心の筋)
    float r = length(vec2(p.x, z));
    return uSurfCol*(0.9 + 0.1*sin(r*14.0))*(0.95 + 0.1*vnoise(vec2(p.x, z)*0.4));
  }
  if (k < 5.5){            // みがいた黒い石(細かい粒)
    float sp = smoothstep(0.82, 0.95, vnoise(vec2(p.x, z)*5.0));
    return mix(uSurfCol, uSurfCol2, sp*0.7);
  }
  // 油紙の床(四角い紙の継ぎ目)
  vec2 q = vec2(p.x, z)/26.0;
  float seam = max(smoothstep(0.03, 0.0, abs(fract(q.x) - 0.5) - 0.47), smoothstep(0.03, 0.0, abs(fract(q.y) - 0.5) - 0.47));
  float n = fbm(vec2(p.x, z)*0.12);
  return mix(uSurfCol, uSurfCol2, n*0.8)*(1.0 - 0.25*seam);
}
vec3 tableAt(vec2 p){
  float z = -p.y/K;
  vec3 P = vec3(p.x, 0.0, z);
  float sh = candleShadow(P)*coverTrans(P);
  float E = irr(P, vec3(0.0, 1.0, 0.0))*sh;
  vec3 alb = surfAlb(p, z);
  vec3 Lv = normalize(vec3(uLP, 0.0) - P);
  vec3 V = normalize(vec3(0.0, K, 1.0));
  vec3 Hh = normalize(Lv + V);
  float metal = step(3.5, uSurf.x)*step(uSurf.x, 4.5);
  float sheen = pow(max(Hh.y, 0.0), 12.0 + 50.0*uSurf.w)*uSurf.w*sh;
  float ao = 0.6 + 0.4*smoothstep(0.0, 2.5, (uYJ - p.y)/K);
  vec3 spc = mix(vec3(1.0), alb*3.0, metal);
  return (alb*(E*uLight.x*mix(1.0, 0.35, metal) + uLight.z*uRoomAmb*6.0) + spc*sheen*E*uLight.x*0.5)*lightCol()*ao;
}

// ---------- 台(燭台・皿・びん) ----------
float holderR(float y){
  float k = uHold.x; float Hh = uHold.y; float R = uHold.z;
  if (y < 0.0 || y > Hh) return 0.0;
  if (k < 1.5){            // 燭台: 丸い台座, 細い柱, 上に受け皿
    if (y < 0.45) return R*mix(1.0, 0.92, y/0.45);
    float pole = 0.095*R;
    if (y < 0.9)  return mix(R*0.92, pole*1.5, smoothstep(0.45, 0.9, y));
    if (y < Hh - 0.25) return pole + 0.05*smoothstep(Hh - 1.2, Hh - 0.4, y);
    return 0.55*R;
  } else if (k < 2.5){     // 金属の燭台(くびれ・玉・受け皿)
    float base = min(1.6, Hh*0.12);
    if (y < 0.35) return R;
    if (y < base) return mix(R, 0.85, pow(smoothstep(0.35, base, y), 0.6));
    float r = 0.55 + 0.18*exp(-pow((y - Hh*0.36)/(0.03*Hh + 0.2), 2.0)) + 0.24*exp(-pow((y - Hh*0.62)/(0.04*Hh + 0.2), 2.0))
            + 0.1*exp(-pow((y - Hh*0.85)/0.3, 2.0));
    if (y > Hh - 1.3) r = mix(r, 1.9, smoothstep(Hh - 1.3, Hh - 0.9, y));
    if (y > Hh - 0.7) r = mix(1.9, 1.45, smoothstep(Hh - 0.7, Hh - 0.4, y));
    return r;
  } else if (k < 3.5){     // 皿
    return R*mix(0.78, 1.0, smoothstep(0.0, Hh*0.7, y));
  } else if (k < 4.5){     // ワインのびん(丸い胴に わら、細い首)
    float yc = R*0.95;
    float bulb = R*sqrt(max(1.0 - pow((y - yc)/R, 2.0), 0.0));
    if (y < 0.2) bulb = max(bulb, R*0.55);
    float neck = 1.25 + 0.5*smoothstep(Hh - 0.6, Hh - 0.3, y)*smoothstep(Hh, Hh - 0.15, y);
    float r = max(bulb, neck);
    return mix(r, neck, smoothstep(yc + R*0.55, yc + R*1.0, y));
  } else {                 // 手持ちの燭台(皿 + 差しこみ口)
    if (y < 1.1) return R*mix(0.86, 1.0, smoothstep(0.0, 0.8, y));
    if (y < Hh - 0.4) return 1.35;
    return 1.6;
  }
}

vec4 holder(vec2 p){
  float k = uHold.x;
  if (k < 0.5) return vec4(0.0);
  float Hh = uHold.y; float R = max(uHold.z, 2.0);
  float ax = abs(p.x);
  float px = 1.0/uS;
  // 手持ちの燭台の 取っ手(右に 輪)
  float handle = 0.0;
  if (k > 4.5){
    vec2 hq = (p - vec2(R + 0.7, 0.5))*vec2(1.0, 1.3);
    float dr = abs(length(hq) - 1.05) - 0.24;
    handle = clamp(0.5 - dr/px, 0.0, 1.0)*step(R*0.8, p.x);
  }
  if ((ax > R + 0.1 && handle <= 0.0) || p.y < -K*R - 0.1 || p.y > Hh + K*R + 0.1) return vec4(0.0);
  // 上の面
  float topR = holderR(Hh - 0.001);
  if (k > 4.5) topR = 1.6;
  vec2 qe = vec2(p.x/topR, (p.y - Hh)/(K*topR));
  float Le = length(qe);
  vec2 g = vec2(qe.x/topR, qe.y/(K*topR))/max(Le, 1e-4);
  float dTop = (Le - 1.0)/max(length(g), 1e-4);
  float aTop = clamp(0.5 - dTop/px, 0.0, 1.0)*(1.0 - gRefl);
  // 皿の上の面(手持ちの燭台)
  float aDish = 0.0; float LeD = 0.0;
  if (k > 4.5){
    vec2 qd = vec2(p.x/R, (p.y - 1.1)/(K*R));
    LeD = length(qd);
    aDish = clamp(0.5 - (LeD - 1.0)*R*K/px, 0.0, 1.0)*(1.0 - gRefl);
  }
  // 横の面
  float y = p.y;
  float r = 0.0;
  for (int i = 0; i < 4; i++){
    r = holderR(clamp(y, 0.0, Hh));
    float s = sqrt(max(r*r - ax*ax, 0.0));
    y = p.y + K*s;
  }
  r = holderR(clamp(y, 0.0, Hh));
  float inSide = (y >= 0.0 && y <= Hh) ? clamp(0.5 - (ax - r)/px, 0.0, 1.0) : 0.0;
  if (y > Hh - 0.001 && aTop <= 0.0 && gRefl < 0.5) inSide = 0.0;
  float a = max(max(inSide, aTop), max(aDish, handle));
  if (a <= 0.0) return vec4(0.0);

  vec3 col;
  vec3 V = vec3(0.0, K, 0.98);
  vec3 Lc = lightCol();
  float I = uLight.x/60.0;
  bool top = aTop > 0.0 && dTop < px;
  bool dish = !top && aDish > 0.0 && inSide < 0.5;
  if (top || dish){
    float hy = top ? Hh : 1.1;
    float z = -(p.y - hy)/K;
    vec3 P = vec3(p.x, hy, z);
    float sh = candleShadow(P);
    float E = irr(P, vec3(0.0, 1.0, 0.0))*sh;
    vec3 Lv = normalize(vec3(uLP, 0.0) - P);
    float spec = pow(max(dot(normalize(Lv + V), vec3(0.0, 1.0, 0.0)), 0.0), 12.0 + 40.0*uHold.w)*uHold.w;
    float le = top ? Le : LeD;
    float rim = smoothstep(0.90, 0.985, le)*smoothstep(1.0, 0.985, le)*1.2;
    vec3 hc = uHoldCol;
    if (k > 4.5 && dish) hc = mix(uHoldCol, uHoldCol2, smoothstep(0.88, 0.93, le));   // ホーローの ふちの色
    if (k > 3.5 && k < 4.5) hc = uHoldCol*0.6;
    col = hc*(E*uLight.x*0.6*Lc + uLight.z*uRoomAmb*6.0) + Lc*E*uLight.x*(spec*2.0 + rim*(0.3 + uHold.w)*2.0);
  } else if (inSide > 0.0){
    float nx = clamp(p.x/max(r, 1e-3), -1.0, 1.0);
    float nz = sqrt(max(1.0 - nx*nx, 0.0));
    float dr = (holderR(clamp(y + 0.05, 0.0, Hh)) - holderR(clamp(y - 0.05, 0.0, Hh)))/0.1;
    vec3 n = normalize(vec3(nx, -dr, nz));
    vec3 P = vec3(p.x, y, nz*r);
    float sh = candleShadow(P + n*0.05);
    vec3 Lv = normalize(vec3(uLP, 0.0) - P);
    float E = irr(P, n)*sh;
    vec3 Hv = normalize(Lv + normalize(V));
    float gl = uHold.w;
    vec3 hc = uHoldCol;
    float u = asin(nx)*r;
    if (k > 3.5 && k < 4.5){
      // びん: 下は わらで巻き、上は 緑のガラス。首には 色とりどりの ろうの しずく
      float straw = 1.0 - smoothstep(R*1.15, R*1.35, y);
      float weave = 0.75 + 0.25*sin(y*9.0 + 0.6*sin(u*3.0)) + 0.1*(vnoise(vec2(u*6.0, y*1.5)) - 0.5);
      hc = mix(uHoldCol, uHoldCol2*weave, straw);
      gl = mix(0.9, 0.05, straw);
      float cell = floor(u*0.9 + 20.0);
      float L = 3.0 + 9.0*hash(vec2(cell, 3.0));
      float wid = 0.25 + 0.35*hash(vec2(cell, 8.0));
      float drip = step(0.35, hash(vec2(cell, 5.0)))*step(Hh - L, y)*smoothstep(wid, wid*0.6, abs(fract(u*0.9) - 0.5));
      float pick = hash(vec2(cell, 11.0));
      vec3 dc = pick < 0.25 ? vec3(0.45, 0.06, 0.05) : pick < 0.5 ? vec3(0.78, 0.74, 0.62) : pick < 0.72 ? vec3(0.06, 0.12, 0.30) : pick < 0.86 ? vec3(0.62, 0.42, 0.08) : vec3(0.12, 0.25, 0.10);
      float blob = drip*(1.0 - straw);
      hc = mix(hc, dc, blob);
      gl = mix(gl, 0.3, blob);
    }
    float spec = pow(max(dot(n, Hv), 0.0), 20.0 + 60.0*gl)*gl;
    float fres = pow(1.0 - nz, 3.0);
    vec3 env = vec3(1.0, 0.55, 0.28)*uLight.x*0.03;
    float diff = mix(0.6, 0.2, step(0.5, gl));
    col = hc*(E*uLight.x*diff*Lc + uLight.z*uRoomAmb*6.0 + env*(0.15 + 2.2*fres)*(0.4 + gl)) + Lc*sh*spec*uLight.x*mix(0.17, 0.7, step(0.7, gl));
    col *= 0.75 + 0.25*nz;
  } else {
    // 取っ手
    vec3 P = vec3(p.x, p.y, 0.0);
    float E = irr(P, normalize(vec3(-1.0, 0.3, 0.5)));
    col = uHoldCol*(E*uLight.x*0.5*Lc + uLight.z*uRoomAmb*6.0) + uHoldCol2*0.0;
  }
  return vec4(col, a);
}

// ---------- キャンドル本体 ----------
float radiusAt(float y){
  if (uBody.w < 0.0){      // 球
    float R = uBody.z;
    return sqrt(max(R*R - (y - R)*(y - R), 0.0));
  }
  float t = clamp(y/uBody.x, 0.0, 1.0);
  float r = mix(uBody.z, uBody.y, pow(t, uBody.w));
  if (uWaxP.w > 2.5 && uWaxP.w < 3.5) r *= 1.0 - 0.16*(0.5 + 0.5*cos(2.0*(1.5708 - y*1.9)))*smoothstep(0.5, 1.5, y);   // ねじれ: 幅が波うつ
  return r;
}

float hexEdge(vec2 p){
  vec2 s = vec2(1.0, 1.7320508);
  vec2 a = mod(p, s) - s*0.5;
  vec2 b = mod(p - s*0.5, s) - s*0.5;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  vec2 q = abs(g);
  float d = max(dot(q, normalize(s)), q.x);
  return smoothstep(0.36, 0.5, d);
}

vec4 body(vec2 p){
  float H = uBody.x, Rt = uBody.y, Rb = uBody.z;
  float y0 = uHold.y;
  float y = p.y - y0;
  float ax = abs(p.x);
  float Rmax = max(Rt, Rb);
  float px = 1.0/uS;
  if (ax > Rmax + 2.0*px || y < -K*Rmax - 2.0*px || y > H + K*Rt + 2.0*px) return vec4(0.0);
  bool ball = uBody.w < 0.0;
  float Ry = radiusAt(clamp(y, 0.0, H));
  float st = sqrt(max(Rt*Rt - ax*ax, 0.0));
  float sb = ball ? 0.0 : sqrt(max(Rb*Rb - ax*ax, 0.0));
  float dSide = max(ax - Ry, max(-K*sb - y, y - (H - K*st)));
  if (ball){
    // 球: 輪郭は 円(上の面のところだけ 平ら)
    vec2 c = vec2(0.0, Rb);
    dSide = max(length(vec2(p.x, (y - Rb)*1.0)) - Rb, y - (H - K*st));
  }
  vec2 qe = vec2(p.x/Rt, (y - H)/(K*Rt));
  float Le = length(qe);
  vec2 g = vec2(qe.x/Rt, qe.y/(K*Rt))/max(Le, 1e-4);
  float dTop = (Le - 1.0)/max(length(g), 1e-4);
  float aSide = clamp(0.5 - dSide/px, 0.0, 1.0);
  float aTop = clamp(0.5 - dTop/px, 0.0, 1.0)*(1.0 - gRefl);
  float a = max(aSide, aTop);
  gSide = aSide*(1.0 - aTop);
  if (a <= 0.0) return vec4(0.0);
  if (ball) Ry = max(sqrt(max(Rb*Rb - (y - Rb)*(y - Rb), 0.0)), 1e-3);

  float I = uLight.x/60.0;
  vec3 Lc = lightCol();
  float tr = uWaxP.x;
  float depth = uWaxP.z;
  float Rp = Rt*uWaxP.y;
  vec3 wax = uWax;
  float tea = step(0.5, uType);

  // ---- 横の面 ----
  float nx = clamp(p.x/max(Ry, 1e-3), -1.0, 1.0);
  float nz = sqrt(max(1.0 - nx*nx, 0.0));
  float u = asin(nx)*Ry;
  vec3 side;
  if (tea > 0.5){
    float rib = 0.5 + 0.5*sin(u*42.0);
    float fres = pow(1.0 - nz, 2.0);
    vec3 alu = vec3(0.55, 0.55, 0.56);
    float refl = 0.010 + 0.05*smoothstep(0.0, 1.0, y/H)*(0.5 + 0.5*nz) + fres*0.03;
    side = alu*(refl*I*Lc*(0.7 + 0.3*rib)*1.6 + uLight.z*(0.4 + 0.3*rib));
    side += Lc*I*0.10*smoothstep(H - 0.25, H, y)*(0.6 + 0.4*rib);
  } else {
    float wall = max(Rt - Rp, 0.05);
    float thin = exp(-wall/(tr*1.3));
    float inTun = smoothstep(0.0, 0.25, depth)*step(H - depth, y);
    float yL = H - depth;
    float dy = max(yL - y, 0.0);
    float G = (0.18 + 1.6*thin*smoothstep(0.0, 0.8, depth) + 0.25*thin)*exp(-dy/tr);
    G *= mix(0.82, 1.0, nz) + 0.45*(1.0 - nz)*inTun;
    float mott = 0.93 + 0.1*fbm(vec2(u*2.5, y*2.5));
    if (uWaxP.w > 4.5) mott = 0.82 + 0.3*fbm(vec2(u*1.3, y*1.3)) + 0.08*vnoise(vec2(u*9.0, y*9.0));   // まだら(ラスティック)
    vec3 sssCol = Lc*pow(max(wax, vec3(0.001)), vec3(0.6 + dy*0.5/tr));
    side = sssCol*G*I*1.25;
    side += wax*uLight.z*uRoomAmb*6.0*(0.35 + 0.65*nz);
    side += wax*Lc*pow(1.0 - nz, 3.0)*I*0.05;
    vec3 refl = Lc*I*0.06*(0.45 + 0.55*nz) + uLight.z*uRoomAmb*6.0*(0.35 + 0.65*nz);
    side += wax*refl;
    side *= mott;
    if (uWaxP.w > 1.5 && uWaxP.w < 2.5){
      // 巻いた蜜ろう: 六角の模様と、ななめの 巻き目
      float he = hexEdge(vec2(u, y)*2.4);
      side *= 1.0 - 0.18*he;
      float seam = smoothstep(0.08, 0.0, abs(fract((u + y*0.35)/(6.283*Ry)) - 0.5) - 0.47);
      side *= 1.0 - 0.3*seam;
    }
    if (uWaxP.w > 2.5 && uWaxP.w < 3.5){
      // ねじれ: らせんに沿って 光と影
      float th = asin(nx);
      float gr = cos(2.0*(th - y*1.9));
      side *= 0.72 + 0.34*(0.5 + 0.5*gr);
    }
    side *= 0.9 + 0.1*nz;
  }

  // ---- 上の面 ----
  vec3 top = vec3(0.0);
  if (aTop > 0.0){
    float topY = y0 + H;
    vec2 qp = vec2(p.x/Rp, (y - (H - depth))/(K*Rp));
    float lp = length(qp);
    vec2 qo = vec2(p.x/Rp, (y - H)/(K*Rp));
    float lo = length(qo);
    float poolY = y0 + H - depth;
    vec3 liq = vec3(0.0), inner = vec3(0.0), rimc = vec3(0.0);
    {
      liq = Lc*pow(max(wax, vec3(0.001)), vec3(1.3))*I*(1.1 + 0.6*(1.0 - lp*lp));
      if (tea > 0.5){
        liq = Lc*vec3(1.0, 0.92, 0.80)*I*(0.9 + 0.5*(1.0 - lp*lp));
        float tab = smoothstep(0.24, 0.20, length(vec2(p.x, (y - (H - depth))/K)));
        liq = mix(liq, vec3(0.08, 0.08, 0.085)*I + Lc*I*0.1, tab*0.8);
      }
      float men = smoothstep(0.80, 1.0, lp);
      liq *= 1.0 - 0.35*men;
      vec3 mirror = flameEmit(vec2(p.x, 2.0*poolY - p.y + 0.02));
      liq += mirror*(0.25 + 0.3*men);
    }
    {
      float hgt = clamp((y - (H - depth))/max(depth, 0.01), 0.0, 1.0);
      inner = tea > 0.5 ? vec3(0.6)*Lc*I*0.9 : Lc*pow(max(wax, vec3(0.001)), vec3(0.7))*I*(2.2 - 0.8*hgt);
    }
    {
      float z = -(y - H)/K;
      vec3 P = vec3(p.x, topY, z);
      float dh = uLP.y - topY;
      float r2 = dot(P.xz, P.xz);
      float E = max(dh, 0.0)/pow(r2 + dh*dh + 0.5, 1.5);
      if (tea > 0.5){
        rimc = vec3(0.7)*Lc*(E*uLight.x*0.2 + 0.25*I) + vec3(0.6)*uLight.z;
      } else {
        float wall = max(Rt - Rp, 0.05);
        float thin = exp(-wall/(tr*1.3));
        rimc = wax*Lc*(E*uLight.x*0.15) + Lc*pow(max(wax, vec3(0.001)), vec3(0.8))*I*(0.15 + 1.3*thin*smoothstep(0.0, 0.6, depth));
        rimc += wax*uLight.z;
      }
    }
    float pw = px/(K*Rp);
    float mPool = 1.0 - smoothstep(1.0 - pw, 1.0 + pw, lp);
    float mOpen = 1.0 - smoothstep(1.0 - pw, 1.0 + pw, lo);
    top = mix(mix(rimc, inner, mOpen), liq, mPool);
  }
  vec3 col = mix(side, top, aTop);
  return vec4(col, a);
}

// ---------- 芯 ----------
vec4 wickOne(vec2 p, float ox, float oy){
  float L = uWick.x, ww = uWick.y;
  float y0 = uHold.y + uBody.x - uWaxP.z - 0.02 + oy;
  float t = (p.y - y0)/L;
  if (t < 0.0 || t > 1.0) return vec4(0.0);
  float px = 1.0/uS;
  float I = uLight.x/60.0;
  if (uWick.w > 1.5){
    // 木の芯: 平たい板。上のふちが 赤く燃える
    float hw = ww*0.5;
    float a = clamp(0.5 - (abs(p.x - ox) - hw)/px, 0.0, 1.0);
    if (a <= 0.0) return vec4(0.0);
    vec3 c = mix(vec3(0.06, 0.04, 0.025), vec3(0.01), smoothstep(0.3, 0.8, t));
    float em = uFlameP.z*smoothstep(0.6, 1.0, t)*(0.6 + 0.4*vnoise(vec2(p.x*6.0, uTime*2.0)));
    c += vec3(1.0, 0.25, 0.04)*em*1.6;
    return vec4(c, a);
  }
  float lean = uFlame.z*0.25*uFlameP.x;
  float cx = ox + uWick.z*t*t + lean*t*L;
  float dx = abs(p.x - cx);
  float hw = ww*0.5;
  float a = clamp(0.5 - (dx - hw)/px, 0.0, 1.0)*smoothstep(1.0, 0.94, t);
  if (a <= 0.0) return vec4(0.0);
  vec3 c = mix(vec3(0.05, 0.04, 0.035), vec3(0.008, 0.006, 0.005), smoothstep(0.2, 0.6, t));
  c += lightCol()*I*0.04*(1.0 - t);
  float em = uFlameP.z*smoothstep(0.55, 0.95, t);
  c += vec3(1.0, 0.22, 0.03)*em*(1.5 + 1.0*vnoise(vec2(uTime*3.0, 1.0)));
  return vec4(c, a);
}
vec4 wick(vec2 p){
  if (uMulti.x < 2.5) return wickOne(p, 0.0, 0.0);
  vec4 w = wickOne(p, -uMulti.y, uMulti.z);
  vec4 w2 = wickOne(p, uMulti.y, uMulti.z);
  if (w2.a > w.a) w = w2;
  vec4 w3 = wickOne(p, 0.0, -uMulti.w);
  if (w3.a > w.a) w = w3;
  return w;
}

// ---------- 煙 ----------
float smoke(vec2 p){
  if (uSmoke.y <= 0.0) return 0.0;
  float age = uSmoke.x;
  vec2 o = uSmoke.zw;
  float yy = p.y - o.y;
  if (yy < 0.0 || yy > 45.0) return 0.0;
  float v = 12.0;
  float head = age*v;
  float tail = max(age - 3.0, 0.0)*v*1.1;
  if (yy > head + 2.0 || yy < tail - 2.0) return 0.0;
  float tur = smoothstep(4.0, 8.0, yy);
  float drift = ((vnoise(vec2(yy*0.15 - age*0.35, 7.0)) - 0.5)*(yy - 4.0)*0.6 + sin(yy*0.55 - age*1.6)*0.25*sqrt(yy))*tur + (vnoise(vec2(yy*0.4, age))-0.5)*0.08;
  float wid = 0.025 + yy*0.007 + tur*yy*0.03;
  float d = (p.x - o.x - drift)/wid;
  float dens = exp(-d*d)*smoothstep(head + 1.0, head - 2.5, yy)*smoothstep(tail - 1.0, tail + 3.5, yy);
  dens *= exp(-yy/16.0)/(1.0 + yy*0.12);
  return dens*uSmoke.y;
}

// ---------- 組み立て ----------
vec3 objects(vec2 p, out float cover){
  vec3 col = vec3(0.0);
  cover = 0.0;
  vec4 h = holder(p);
  col = mix(col, h.rgb, h.a); cover = max(cover, h.a);
  gSide = 0.0;
  vec4 b = body(p);
  col = mix(col, b.rgb, b.a); cover = max(cover, b.a);
  float front = gSide;
  vec4 w = wick(p);
  w.a *= 1.0 - front;
  col = mix(col, w.rgb, w.a); cover = max(cover, w.a);
  if (gNoFlame < 0.5) col += flameEmit(p)*(1.0 - max(front, gRefl*cover));
  return col;
}

// かさを 上から重ねる
vec3 coverLayer(vec2 p, vec3 col, out float cvA){
  cvA = 0.0;
  float k = uCover.x;
  if (k < 0.5) return col;
  float px = 1.0/uS;
  float I = uLight.x/60.0;
  vec3 Lc = lightCol();
  float ax = abs(p.x);
  float y0 = uCover.z, y1 = uCover.w, R = uCover.y;
  if (k < 1.5){
    // 北欧のランタン: 黒い鉄の四角い枠に ガラス。上に屋根と 輪
    float Yf0 = y0 - K*R, Yf1 = y1 - K*R;
    float post = 0.38;
    float inX = clamp(0.5 - (ax - R)/px, 0.0, 1.0);
    float base = inX*step(-K*R, p.y)*step(p.y, Yf0);
    float front = inX*step(Yf0, p.y)*step(p.y, Yf1);
    // 屋根(台形)と 輪
    float ry = p.y - Yf1;
    float roofW = mix(R + 0.3, R*0.28, clamp(ry/(R*0.55), 0.0, 1.0));
    float roof = step(0.0, ry)*step(ry, R*0.55)*clamp(0.5 - (ax - roofW)/px, 0.0, 1.0);
    vec2 rq = vec2(p.x, p.y - (Yf1 + R*0.55 + 0.9));
    float ring = clamp(0.5 - (abs(length(rq) - 0.8) - 0.12)/px, 0.0, 1.0);
    float frameA = max(max(base, roof), ring);
    if (front + frameA <= 0.0) return col;
    vec3 iron = uFrameCol*(0.03*I + uLight.z*1.5);
    vec3 c = col;
    if (front > 0.0){
      // ガラス: すけて見える。少し暗く、たての照りすじ
      c = col*0.9 + Lc*I*0.05*exp(-pow((p.x - R*0.6)/0.25, 2.0))*exp(-abs(p.y - uLP.y)/6.0);
      float rail = max(smoothstep(0.32, 0.22, abs(p.y - Yf0 - 0.2)), smoothstep(0.32, 0.22, abs(p.y - Yf1 + 0.2)));
      float posts = smoothstep(R - post - px, R - post + px, ax);
      float mid = smoothstep(0.1 + px, 0.1, abs(p.y - mix(Yf0, Yf1, 0.5)))*0.0;
      float fr = max(max(rail, posts), mid);
      c = mix(c, iron + uFrameCol*Lc*I*0.08*(1.0 - posts), fr);
      cvA = fr;
      return mix(col, c, front);
    }
    cvA = frameA;
    vec3 rc = iron + uFrameCol*Lc*I*0.06*smoothstep(R*0.55, 0.0, ry)*step(0.0, ry);
    return mix(col, rc, frameA);
  }
  if (k > 3.5 && k < 4.5){
    // モロッコの真鍮のランタン: 透かしから光がもれる。上は 玉ねぎ形の屋根
    float y = p.y, r = R;
    for (int i = 0; i < 3; i++){ y = p.y + K*sqrt(max(r*r - ax*ax, 0.0)); }
    float inSide = clamp(0.5 - (ax - r)/px, 0.0, 1.0)*step(y0, y)*step(y, y1);
    float dy = p.y - (y1 - K*0.0);
    float domeR = R*(1.0 - pow(clamp(dy/(R*1.3), 0.0, 1.0), 1.6))*(1.0 + 0.15*sin(clamp(dy/(R*1.3), 0.0, 1.0)*3.14));
    float dome = step(0.0, dy)*clamp(0.5 - (ax - domeR)/px, 0.0, 1.0);
    vec2 fq = vec2(p.x, p.y - (y1 + R*1.3 + 0.5));
    float fin = clamp(0.5 - (length(fq*vec2(1.0, 0.7)) - 0.35)/px, 0.0, 1.0);
    float foot = step(y0 - 0.9, p.y + K*R)*step(p.y + K*R, y0 + 0.2)*clamp(0.5 - (ax - R*0.75)/px, 0.0, 1.0);
    float A = max(max(inSide, dome), max(fin, foot));
    if (A <= 0.0) return col;
    float nx = clamp(p.x/r, -1.0, 1.0), nz = sqrt(max(1.0 - nx*nx, 0.0));
    vec3 brass = uCoverCol*(Lc*I*0.07*(0.3 + 0.7*nz) + uLight.z*uRoomAmb*6.0) + uCoverCol*Lc*I*0.25*pow(1.0 - nz, 2.0);
    vec3 c = brass;
    if (inSide > 0.0 && dome <= 0.0){
      float u = asin(nx)*R;
      float h = moroHole(u, y, 0.03);
      float inner = uLight.x*0.035*R*R/(R*R + pow(y - uLP.y, 2.0));
      c = mix(brass, Lc*inner*vec3(1.0, 0.82, 0.6), h);
    } else if (dome > 0.0){
      c = brass*(0.8 + 0.4*smoothstep(0.0, R, dy)) + uCoverCol*Lc*I*0.12*exp(-pow((p.x + R*0.35)/0.6, 2.0));
    }
    cvA = A;
    return mix(col, c, A);
  }
  // ガラス(風よけ・器・鉢): すけて見える。ふちが光り、たての照りが入る。すりガラスは 内側から光る
  float y = p.y, r = R;
  for (int i = 0; i < 3; i++){
    r = glassR(clamp(y, y0, y1));
    y = p.y + K*sqrt(max(r*r - ax*ax, 0.0));
  }
  float inG = clamp(0.5 - (ax - r)/px, 0.0, 1.0)*step(y0, y)*step(y, y1);
  float r1 = glassR(y1), r0 = glassR(y0);
  float lt = length(vec2(p.x/r1, (p.y - y1)/(K*r1)));
  float lb = length(vec2(p.x/r0, (p.y - y0)/(K*r0)));
  float rimT = smoothstep(0.07, 0.0, abs(lt - 1.0)*r1*K)*(1.0 - gRefl);
  float rimBt = smoothstep(0.06, 0.0, abs(lb - 1.0)*r0*K)*step(y0 - K*r0*0.2, p.y);
  if (inG <= 0.0 && rimT <= 0.0) return col;
  float nx = clamp(p.x/r, -1.0, 1.0), nz = sqrt(max(1.0 - nx*nx, 0.0));
  float near = exp(-abs(y - uLP.y)/5.0);
  vec3 tint = mix(vec3(1.0), uCoverCol*1.6, uCoverP.y);
  vec3 c = col*mix(vec3(1.0), tint*0.92, inG);
  // 厚い底
  float bottom = inG*smoothstep(y0 + 0.9, y0 + 0.5, y)*step(5.5, k)*0.0 + inG*smoothstep(y0 + 0.8, y0 + 0.4, y)*step(4.5, k);
  c = mix(c, uCoverCol*Lc*I*0.6 + uCoverCol*uLight.z, bottom*0.6);
  // すりガラス: 中の光で ぼんやり光る
  float fr = uCoverP.x*inG;
  float glow = uLight.x*0.03*R*R/(R*R*0.6 + pow(y - uLP.y, 2.0)*0.5);
  vec3 frost = uCoverCol*Lc*glow*(0.55 + 0.45*nz) + col*0.15;
  c = mix(c, frost, fr);
  c += Lc*I*inG*(0.22*pow(1.0 - nz, 3.0)*near + 0.07*(exp(-pow((nx - 0.55)/0.07, 2.0)) + 0.6*exp(-pow((nx + 0.62)/0.05, 2.0)))*near)*(1.0 - 0.6*uCoverP.x)*tint;
  c += Lc*I*0.35*(rimT + rimBt*inG)*tint;
  // 鉢の水: 水面のだ円が 光る
  if (k > 5.5 && uCoverP.z > 0.0){
    float wy = uCoverP.z, wr = glassR(wy);
    float lw = length(vec2(p.x/wr, (p.y - wy)/(K*wr)));
    float surf = (1.0 - smoothstep(0.97, 1.0, lw))*(1.0 - gRefl);
    float below = inG*step(p.y + K*sqrt(max(wr*wr - ax*ax, 0.0)), wy)*(1.0 - surf);
    c = mix(c, c*vec3(0.85, 0.92, 0.95), below*0.6);
    vec3 mirror = flameEmit(vec2(p.x + 0.05*sin(uTime*0.4 + p.y*3.0), 2.0*wy - p.y + 0.1));
    c += mirror*surf*0.35 + Lc*I*0.04*surf*(1.0 - lw*lw);
  }
  cvA = inG*0.2;
  return c;
}

vec3 aces(vec3 x){
  return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0);
}

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (fc - uOrg)/uS;
  vec3 col = p.y > uYJ ? roomAt(fc) : tableAt(p);

  // 台への映り込み
  if (p.y < 0.0 && uSurf.y > 0.0){
    float Rb0 = uHold.x > 0.5 ? max(holderR(0.01), 0.1) : (uCover.x > 4.5 ? uCover.y*0.42 : uBody.z);
    if (uBody.w < 0.0) Rb0 = uBody.z*0.4;
    float yb = -K*sqrt(max(Rb0*Rb0 - p.x*p.x, 0.0));
    if (p.y < yb + 0.02){
      float dist = yb - p.y;
      float rough = (vnoise(vec2(p.x*0.8, p.y*0.5)) - 0.5)*0.04*dist;
      vec2 pm = vec2(p.x + rough, 2.0*yb - p.y);
      float spread = 0.04 + dist*0.07*(1.2 - uSurf.w);
      float cv, cv1, cv2, cv3, ca;
      gRefl = 1.0; gNoFlame = 1.0;
      vec3 rc = objects(pm + vec2(-spread, 0.3*spread), cv1)
              + objects(pm + vec2(0.0, -0.4*spread), cv2)
              + objects(pm + vec2(spread, 0.3*spread), cv3);
      gNoFlame = 0.0;
      vec2 pf = pm + vec2((vnoise(vec2(p.y*1.5, uTime*0.5)) - 0.5)*0.08*dist, 0.0);
      vec3 rf = flameEmit(pf)*(1.0 - (cv1 + cv2 + cv3)/3.0);
      rc = rc/3.0 + rf*0.3 + halo(pm)*0.35;
      rc = coverLayer(pm, rc, ca);
      gRefl = 0.0;
      cv = (cv1 + cv2 + cv3)/3.0;
      float fall = exp(-dist/9.0);
      float st = uSurf.y;
      vec3 tint = mix(vec3(1.0), uSurfCol*2.5, step(3.5, uSurf.x)*step(uSurf.x, 4.5));
      col = mix(col, col*0.5, cv*0.4*fall*st);
      col += rc*0.35*fall*st*tint;
      float dx = (p.x - uLP.x)/(uFlame.y*1.3 + 0.2);
      float dyv = (p.y + uLP.y)/(uFlame.x*2.6 + 2.0);
      col += lightCol()*uLight.x*uFlameP.x*0.0012*st*exp(-dx*dx - dyv*dyv)*tint;
    }
  }

  float cv;
  vec3 ob = objects(p, cv);
  col = mix(col, vec3(0.0), cv) + ob;
  float hk = uCover.x > 3.5 && uCover.x < 4.5 ? 0.25 : uCover.x > 0.5 ? 0.85 : 1.0;
  col += halo(p)*hk*coverTint();
  float ca;
  col = coverLayer(p, col, ca);

  // 煙
  float sm = smoke(p);
  col = mix(col, vec3(0.62, 0.58, 0.54)*(0.035 + uLight.z*6.0 + uFlameP.z*0.03), clamp(sm*0.75, 0.0, 1.0));

  vec2 vq = (fc - 0.5*uRes)/uRes.y;
  col *= 1.0 - 0.5*smoothstep(0.3, 0.9, length(vq*vec2(1.0, 0.8)));
  col *= uLight.y;
  col = aces(col);
  col = pow(col, vec3(1.0/2.2));
  vec2 gp = fc + floor(uTime*12.0)*vec2(5.588, 5.0);
  float gr = fract(52.9829189*fract(dot(gp, vec2(0.06711056, 0.00583715)))) - 0.5;
  float lumG = dot(col, vec3(0.3, 0.5, 0.2));
  col += gr*(2.2/255.0)*smoothstep(0.01, 0.06, lumG);
  col *= 1.0 - uBlack;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
