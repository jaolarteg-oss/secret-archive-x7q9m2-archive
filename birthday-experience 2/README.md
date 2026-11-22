# Birthday surprise — minimal version

## How to open
Open `index.html` in a browser. The work login is a harmless mockup; it never submits or stores credentials. Use the already filled demo account and click **Sign in**.

## Visual direction
The entire surprise stays pure black with the original white messages and unlabeled photo/sticker placeholders. Original frame sizes, placement, and typography are unchanged.

Quiet neutral-white twinkles, soft little flares, and occasional white shooting streaks pass *behind* each chapter. They are intentionally sparse and do not tint the background. The final arrow reveals only staggered, fullscreen, colored optical bokeh (defocused camera lights, not a galaxy or new photo collage). The final bokeh fills the whole viewport with 176 overlapping colored, defocused lights, appearing in a rapid but staggered wave, with a subtle rebound and float.

No chapter titles, subtitles, decorative prose, pink starbursts, hearts, glitter, or confetti.

## Interactions
1. Click the white arrow to advance.
2. Move the white dot into the outlined circle, by dragging or tapping both.
3. Scroll down to move the whole first scene offscreen. When black takes over, scrolling locks while the next message appears. Scroll up to move that entire scene offscreen; after another black transition, a third message appears and the scene locks until the next arrow.
4. Press and HOLD the circular button continuously for about 1.55 seconds. Repeated clicks do not unlock it. A white-and-silver firework erupts across the screen, everything fades to black, and the photo and next message emerge from darkness.
5. Open all three empty sticker slots to uncover three different messages.
6. Click the final arrow to reveal the birthday message and the dense bokeh. A small monochrome gift appears shortly afterward.
7. Click the gift to open the supplied 30-second birthday video. The background music pauses during the video and resumes when it is closed; the video has native playback controls and a close button.

## Personalize
Only edit `content.js`. Add photographs and cat stickers to the `assets/` folder; use paths like `assets/photo-01.jpg` or `assets/cat-01.png`. The sixth photo (`photos[5]`) is the one that fades out of the black. The supplied Pluto Projector loop is already included as `assets/pluto-projector-loop.mp3` for every chapter. Music begins with the **Sign in** click where the browser allows it, and the small speaker control can pause or resume. To replace it, edit `music` in `content.js`.

The default project intentionally uses **empty image placeholders** rather than made-up personal images. It works on desktop and mobile.

## Birthday video
Your uploaded Miraculous birthday video is packaged at `assets/birthday-surprise-video.mp4`. To replace it, overwrite that file with another MP4 (H.264/AAC recommended). Nothing else needs to be changed.
