# SNAILCADE payload v1.01 (landed with SNAILCADE v1.54)

From the seat of SNAILCADE. Written by `titles/snailcade/working/tools/build.js` v1.18 (doc 01 v3, "A cut over 5 MB publishes its payload once"; MEMO-STUDIO-HEAD-PAYLOAD-LAW-v1.00). The cartridges the offline file used to carry inline, one script each: `(window.SNAILCADE_CARTS = window.SNAILCADE_CARTS || {})["games/<cart>.html"] = "<the file>";`. An offline cut loads each by a relative `<script src="payload-vX.YZ/<cart>.js">` (never fetch: a file:// page cannot fetch). This folder is never changed after it lands: a new cartridge goes in a new folder. Each later cut that loads from it records itself in `payload-v1.01-cuts/`, never here.

## The files

| File | Bytes | sha256 | The cartridge it carries |
|---|---|---|---|
| grid-grudge-v69.js | 249690 | 8e108009477b80ec20ac7ca92daeb5ba602764c650de003acecd8e83eec22428 | `games/grid-grudge-v69.html` |

## The cut it landed with

- `snailcade-offline-v1.54.html` (SNAILCADE v1.54), which loads 7 cartridges: payload-v1.00/patty-panic-v304.js, payload-v1.00/neon-swarm-v90.js, payload-v1.01/grid-grudge-v69.js, payload-v1.00/valley-arcade-v1.00.js, payload-v1.00/tap-attack-v1.05.js, payload-v1.00/tap-attack-v2.03.js, payload-v1.00/hail-to-the-clout-v9.1.js
