# Higgsfield で作る 20本の静止画・動画の指示文(2026-10-24)。順番はアプリの並び(js/candles.js)と同じ。
# 背景は キャンドルごとに合う「世界の部屋の一角」(人・生き物・文字なし)。
BASE = ("Photorealistic night photograph, vertical 9:16, static locked-off camera at eye level slightly above the surface, centered composition. "
        "{c} It stands exactly in the horizontal center of the frame, its base about one quarter up from the bottom of the frame, on {s}. "
        "Behind it: {r} The background is softly out of focus (shallow depth of field) but clearly recognizable. "
        "The only light in the whole scene is this candle's warm amber light (about 1850K), pooling softly around it and fading into deep darkness toward the edges and the top; "
        "no other lamps, no other candles, no daylight. Calm, quiet, cozy, healing mood. Generous dark space above the flame. "
        "No people, no animals, no text, no logos.")
FLAME = " The flame is a natural, lively, slightly flickering yellow-orange candle flame with a small blue base and a thin curled black cotton wick."
C = [
 ("pillar", "An ivory pillar candle, 7.5 cm wide and 10 cm tall, matte wax, the top edge softly glowing, on a small round pewter plate." + FLAME,
  "a solid oak dining table with an oiled finish", "a Danish home: a wall of white-painted vertical pine boards, a small window with white muntins and the dark night outside on the right, a pale ceramic vase with a few dried branches on the left, a folded grey wool throw."),
 ("glow", "A wide cream-white pillar candle, 10 cm wide and 12 cm tall, burned down in the middle so its thick wax walls glow warmly from inside like a lampshade; the flame sits low inside the hollow, brightest near the rim and darker toward the bottom.",
  "a white-painted wooden windowsill", "a Swedish window directly behind it with white muntins, snowy night outside with snow piled on the lower panes, a pale linen curtain edge on the left, a small rosemary plant in a clay pot."),
 ("hurricane", "An ivory pillar candle 7 cm wide inside a tall clear glass hurricane chimney (about 30 cm tall, gently bulging), standing on a round dark wooden base; the flame is seen through the glass, with soft vertical highlights on the glass." + FLAME,
  "a weathered farmhouse wooden table", "an American farmhouse: a wall of horizontal painted wooden planks (shiplap) in muted sage, an old wooden ladder shelf with folded linen, a small enamel pitcher."),
 ("taper", "A slim ivory taper candle, 25 cm tall, in an antique polished brass candlestick with turned rings and a drip pan; small points of candlelight reflect on the brass." + FLAME,
  "a polished dark walnut writing desk", "an English library: tall dark wooden bookshelves full of old leather-bound books in oxblood, bottle green, navy and cream, gilt lettering catching the light, a small stack of books and a glass inkwell on the desk."),
 ("dinner", "A tall white dinner candle, 30 cm tall, in an elegant tall silver candlestick with a round base; soft matte reflections on the silver." + FLAME,
  "a pale limestone tabletop", "a French Provencal farmhouse room: a limewashed pale stone wall, a closed rustic wooden window shutter painted faded grey-blue, a stoneware jug with dried lavender, a folded linen napkin. No mirrors, no glass, no other candles (2026-10-24: the first version had a mirror reflecting other things, Nobu asked to avoid mirrors)."),
 ("chamber", "A short white candle, 12 cm tall, in a white enamel chamberstick (a wide round dish with a dark navy rim, a short socket and a ring handle on the side)." + FLAME,
  "a small painted wooden bedside table", "an English cottage bedroom: soft faded small-floral wallpaper, the edge of a white linen pillow and a knitted blanket, an old book lying closed on the table."),
 ("rolled", "A rolled honeycomb beeswax taper candle, 20 cm tall, golden honey color with a clear hexagonal honeycomb texture and a visible spiral seam, in a simple turned wooden candlestick." + FLAME,
  "an old scrubbed wooden kitchen table", "a German farmhouse kitchen in winter: a tall cream-white tiled stove (Kachelofen) with relief tiles, a wooden shelf with a few stoneware jars, a bunch of dried lavender."),
 ("dipped", "A hand-dipped beeswax taper, 25 cm tall, deep golden color, slightly thicker at the base, with a gentle natural sheen, in a hand-forged black iron candlestick." + FLAME,
  "a rough pine plank table", "an American log cabin: a wall of round horizontal logs with light chinking between them, a Shaker peg rail with one hanging linen bag, the edge of a red-and-black plaid wool blanket."),
 ("twist", "A deep wine-red twisted spiral taper candle, 25 cm tall, its spiral catching light and shadow, in a pewter candlestick." + FLAME,
  "a dark oak table with a heavy dark green velvet runner", "an old Dutch interior: a deep dark-green painted wall, a pewter jug, a blue-and-white Delft tile strip along the wall, the dark outline of a leaded window."),
 ("ball", "A round ivory ball candle, 8 cm in diameter, with a rustic mottled matte surface, the top melted into a small glowing pool, on a small white ceramic dish." + FLAME,
  "a natural linen tablecloth on a light birch table", "a Finnish home: a wall of pale birch wood panels, a simple white ceramic jug with a few dry grasses, soft wool cushion edges."),
 ("altar", "A tall thick ivory altar candle, 6 cm wide and 35 cm tall, on a tall heavy brass pricket candlestick with a thick column and a wide drip pan." + FLAME,
  "a worn stone ledge", "an old German stone chapel: walls of large cut sandstone blocks, a narrow pointed gothic window with dark leaded glass behind, a plain wrought-iron stand in the shadows. No religious figures or images."),
 ("tall", "A tall clear glass cylinder candle, 6 cm wide and 20 cm tall, filled with white wax almost to the top; the whole glass glows softly from the flame burning inside near the top. Plain glass, no pictures or labels." + FLAME,
  "a rustic terracotta tile shelf", "a Mexican adobe house: a warm rough plastered adobe wall with a small rounded niche, a hand-painted talavera tile edge in blue and white, a clay jug. No religious images."),
 ("votive", "A white votive candle inside a small amber glass cup, 6 cm wide and 7 cm tall; the amber glass glows and casts warm amber light around." + FLAME,
  "a polished black granite floor", "an Indian room: a deep indigo-blue limewashed wall with soft mottling, a carved wooden jali lattice window on the right, a small brass bowl, a folded deep red cloth."),
 ("lykta", "A white pillar candle inside a black iron Scandinavian lantern (square frame, four clear glass panes, a pointed little roof and a ring on top), about 25 cm tall; the flame is seen through the glass and the frame casts soft shadow lines.",
  "a wide wooden windowsill bench", "a Norwegian cabin: dark-painted wooden wall boards, a small window with the dark winter night outside, a knitted wool blanket folded beside."),
 ("morocco", "A Moroccan pierced brass lantern, about 20 cm tall, with an onion-dome top, covered with many small star-shaped and round perforations, a candle burning hidden inside. Warm golden light shines out through every perforation and the star patterns are projected as many soft scattered dots of light across the wall and surface around it. The flame itself is not directly visible.",
  "a hammered brass tray", "a Moroccan riad room: deep teal zellige mosaic tiles on the lower wall, smooth burnt-orange tadelakt plaster above, a keyhole-shaped arch niche, a small tea glass."),
 ("woodwick", "A soy candle with a flat wooden wick in an amber glass jar, 9 cm wide and 10 cm tall; the flame is low and wide like a little fan, spreading sideways from the wooden wick, warmer orange.",
  "a reclaimed wood coffee table", "a modern American mountain cabin: a wall of honey-colored logs, a flannel plaid blanket draped on the side, a stack of firewood in soft focus."),
 ("threewick", "A large white three-wick candle in a frosted white glass jar, 10 cm wide and 10 cm tall, three small flames burning together in a triangle, the frosted glass glowing evenly from inside.",
  "a low wooden coffee table", "a cozy English living room: a blurred sofa with a cable-knit throw, a bookshelf in deep shadow, a ceramic mug."),
 ("chianti", "A white taper candle stuck in the neck of an old straw-wrapped Chianti wine bottle (green glass, woven straw basket on the round lower part), with many layers of old colorful wax drips (red, white, blue, yellow) frozen down the neck and shoulders." + FLAME,
  "a red-and-white checkered tablecloth", "an old Italian trattoria: a rough warm ochre plaster wall, a dark wooden ceiling beam above, a small bottle of olive oil and a terracotta pot."),
 ("float", "A small white floating candle (a 6 cm disc) floating on still clear water in a wide shallow clear glass bowl, its flame reflected on the water surface; gentle light ripples.",
  "a low dark lacquered Korean wooden table (soban)", "a Korean hanok room: sliding doors of wooden lattice covered with translucent hanji paper, a large white porcelain moon jar on the left, an oiled yellow paper floor."),
 ("tealight", "A small tealight candle in a shiny ribbed aluminum cup, inside a short clear glass holder, 6 cm tall; a small bright flame." + FLAME,
  "a narra hardwood shelf", "a Philippine heritage house: a window of many small translucent capiz shell squares in a dark wooden grid, the night outside, a woven rattan basket."),
 ("shell", "A whimsical candle made inside a large natural spiral seashell (a big pale cream and soft pink conch-like shell lying on its side, its opening filled with ivory wax), a single cotton wick rising from the wax inside the shell's mouth. The flame is a natural, lively, slightly flickering yellow-orange candle flame with a small blue base and a thin curled black cotton wick; the glossy inner pink of the shell glows warmly from the flame.",
  "a thick whitewashed stone windowsill", "a Greek island house: a rounded whitewashed plaster wall niche, a small closed wooden window shutter painted soft Aegean blue, a few small smooth pebbles and a tiny clay jug beside. No mirrors, no other candles."),
]
def stills():
    return [(cid, BASE.format(c=c, s=s, r=r)) for cid, c, s, r in C]
UNLIT = ("Edit this photo: the candle has just been blown out. Keep everything else exactly the same (same candle, holder, room, framing). "
         "There is NO flame anymore: the wick is black with a tiny dim red ember at its tip. The scene is now very dark, lit only by faint cool ambient night light, "
         "the candle and room barely visible as soft dark shapes. No smoke.")
UNLIT_COVERED = ("Edit this photo: the candle inside has been put out. Keep everything else exactly the same (same lantern, room, framing). "
         "No light shines through anymore, no light dots on the wall. The scene is now very dark, lit only by faint cool ambient night light, everything barely visible as soft dark shapes.")
MOTION = ("Static locked-off camera, absolutely no camera movement. The candle flame is alive and clearly moving the whole time: it flickers and dances, "
          "stretching taller and shrinking shorter, swaying gently left and right, its tip fluttering, "
          "with occasional soft irregular gusts. The brightness of the flame and the warm glow on the walls and surfaces pulses softly and irregularly with it, "
          "shadows waver slightly. Real candlelight, never frozen, never still. Nothing else moves. No people.")
MOTION_COVERED = ("Static locked-off camera, absolutely no camera movement. The hidden flame inside is alive and flickering the whole time: the light shining out "
          "through the {what} pulses irregularly brighter and dimmer, the glow wavers and shimmers, the projected light patterns on the wall and surface "
          "tremble and shift slightly with the flickering. Real candlelight, never frozen, never still. Nothing else moves. No people.")
COVERED = {"morocco": "pierced holes", "lykta": "glass panes", "threewick": "frosted glass", "glow": "glowing wax walls"}
def motion(cid):
    if cid == "morocco": return MOTION_COVERED.format(what=COVERED[cid])
    m = MOTION
    if cid in COVERED: m += " Seen through the " + COVERED[cid] + ", the flame visibly flickers and its light pulses."
    if cid == "threewick": m += " All three flames flicker and sway, each a little differently."
    if cid == "woodwick": m += " The wide wooden-wick flame flutters and crackles, its brightness jumping in small irregular flickers."
    if cid == "float": m += " The floating candle drifts very slightly and the flame's reflection shimmers on the water."
    return m
if __name__ == "__main__":
    import json; print(json.dumps([{"index": i, "params": {"model": "gpt_image_2_5", "aspect_ratio": "9:16", "prompt": p}} for i, (c, p) in enumerate(stills())], ensure_ascii=False))
