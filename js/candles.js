// キャンドルの顔ぶれ(21)。2026-10-24 にノブさんの希望で「少し奇抜で面白い1本」= 貝がらのキャンドル(ギリシャ)を足した。2026-10-24 から Higgsfield で作った 動画・静止画で見せる(作り方は tools/hf_prompts.py と tools/media.py)。
// 1つずつ、そのキャンドルに合う「世界の部屋の一角」に置いてある(place)。
// tip = 芯の先の位置(絵の幅・高さに対する割合。tools/media.py が書く)。煙はここから出る。大きくするときの中心にもなる。
// smoke = 消したあとに煙を出すか(炎の見えない モロッコのランタンは出さない)
export const CANDLES = [
  { id: 'pillar', name: 'ピラーキャンドル', short: 'ピラー', place: 'デンマーク', tip: [0.5028, 0.5406], smoke: true },
  { id: 'glow', name: '内から光るピラー', short: '内から光る', place: 'スウェーデン', tip: [0.5042, 0.607], smoke: true },
  { id: 'hurricane', name: 'ガラスの風よけ', short: '風よけ', place: 'アメリカ', tip: [0.5021, 0.4779], smoke: true },
  { id: 'taper', name: '真鍮の燭台', short: '真鍮', place: 'イギリス', tip: [0.4986, 0.4055], smoke: true },
  { id: 'dinner', name: '銀の燭台', short: '銀', place: 'フランス', tip: [0.5, 0.3496], smoke: true },
  { id: 'chamber', name: '手持ちの燭台', short: '手持ち', place: 'イギリス', tip: [0.4972, 0.5461], smoke: true },
  { id: 'rolled', name: '巻いたみつろう', short: 'みつろう', place: 'ドイツ', tip: [0.4958, 0.3688], smoke: true },
  { id: 'dipped', name: '手づくりのみつろう', short: '手づくり', place: 'アメリカ', tip: [0.5, 0.432], smoke: true },
  { id: 'twist', name: 'ねじりキャンドル', short: 'ねじり', place: 'オランダ', tip: [0.5, 0.3303], smoke: true },
  { id: 'ball', name: 'ボールキャンドル', short: 'ボール', place: 'フィンランド', tip: [0.4958, 0.5938], smoke: true },
  { id: 'altar', name: '祭壇のろうそく', short: '祭壇', place: 'ドイツ', tip: [0.4972, 0.3641], smoke: true },
  { id: 'tall', name: '背の高いグラス', short: '高いグラス', place: 'メキシコ', tip: [0.5014, 0.5281], smoke: true },
  { id: 'votive', name: 'こはく色のグラス', short: 'こはく色', place: 'インド', tip: [0.4958, 0.6224], smoke: true },
  { id: 'lykta', name: '北欧のランタン', short: 'ランタン', place: 'ノルウェー', tip: [0.4903, 0.6336], smoke: true },
  { id: 'morocco', name: 'モロッコのランタン', short: 'モロッコ', place: 'モロッコ', tip: [0.5021, 0.5945], smoke: false },
  { id: 'woodwick', name: '木の芯のキャンドル', short: '木の芯', place: 'アメリカ', tip: [0.4931, 0.5609], smoke: true },
  { id: 'threewick', name: '3つの炎のジャー', short: '3つの炎', place: 'イギリス', tip: [0.4972, 0.6172], smoke: true },
  { id: 'chianti', name: 'ワインのびん', short: 'ワインのびん', place: 'イタリア', tip: [0.4931, 0.3578], smoke: true },
  { id: 'float', name: '水にうかぶキャンドル', short: '水にうかぶ', place: '韓国', tip: [0.5028, 0.6758], smoke: true },
  { id: 'tealight', name: 'ガラスのティーライト', short: 'ティーライト', place: 'フィリピン', tip: [0.4931, 0.5358], smoke: true },
  { id: 'shell', name: '貝がらのキャンドル', short: '貝がら', place: 'ギリシャ', tip: [0.5, 0.5], smoke: true },
];

export const SIZES = [{ id: 's', name: '小', zoom: 0.88 }, { id: 'm', name: '中', zoom: 1.0 }, { id: 'l', name: '大', zoom: 1.18 }];
// 明るさ5段階(動画の明るさに かける数)
export const BRIGHT = [0.5, 0.65, 0.82, 1.0, 1.15];
export const WARMTH = [{ id: 'cool', name: '白っぽく', v: 0.0 }, { id: 'mid', name: 'ふつう', v: 0.5 }, { id: 'warm', name: 'あたたかく', v: 1.0 }];
