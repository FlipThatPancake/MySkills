# Classic paintings

`picture` forms 4 and up show a real public-domain painting on a paper mat. `colour` is keep (a little muted), soft (faded towards the paper) or ink (grey); the seed picks one when the spec sets none.

## Adding a painting
1. Find it on Wikimedia Commons. Use it only when the file page tags it public domain (PD-Art with PD-old, or PD-old-auto); the raw wikitext (`?action=raw`) shows the tags.
2. Download a standard thumbnail from upload.wikimedia.org (`960px-` in the name) with a descriptive User-Agent.
3. Crop any scan border, shrink it to 512 px on the long side and save it as a JPEG under 100 KB.
4. Add it to `src/library/paintings.js` with its file page and licence tag.
5. Look at it in each colour, at home-view size and close.

Choose paintings that read small: a few large shapes, strong light and dark.
