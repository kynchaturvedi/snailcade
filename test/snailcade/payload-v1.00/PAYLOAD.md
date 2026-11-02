# SNAILCADE payload v1.00 (landed with SNAILCADE v1.53)

From the seat of SNAILCADE. Written by `titles/snailcade/working/tools/build.js` v1.17 (doc 01 v3, "A cut over 5 MB publishes its payload once"; MEMO-STUDIO-HEAD-PAYLOAD-LAW-v1.00). The cartridges the offline file used to carry inline, one script each: `(window.SNAILCADE_CARTS = window.SNAILCADE_CARTS || {})["games/<cart>.html"] = "<the file>";`. An offline cut loads each by a relative `<script src="payload-vX.YZ/<cart>.js">` (never fetch: a file:// page cannot fetch). This folder is never changed after it lands: a new cartridge goes in a new folder. Each later cut that loads from it records itself in `payload-v1.00-cuts/`, never here.

## The files

| File | Bytes | sha256 | The cartridge it carries |
|---|---|---|---|
| patty-panic-v304.js | 1121292 | 5097b34e8ffb5e7c29faa8cf0ad59c3715b676fbce4b97babdcaee433d52fd04 | `games/patty-panic-v304.html` |
| neon-swarm-v90.js | 328147 | eb299dc10a2649493707ca68eb78c17c144b17f061d9be16ae49c7825cac45fd | `games/neon-swarm-v90.html` |
| grid-grudge-v67.js | 243582 | b514a63279df4cc09662cab8fc1ce2c587e4e1e89a5886490665e8c50322718a | `games/grid-grudge-v67.html` |
| valley-arcade-v1.00.js | 112607 | fec44ca9cecdb0c46db0d74f835a84801556de78eba917d8bd27d06d1d7584b7 | `games/valley-arcade-v1.00.html` |
| tap-attack-v1.05.js | 171835 | b87068b3e4aa09dccad949a0042bb0218530eaa8117d42e0d80044d65b3d2973 | `games/tap-attack-v1.05.html` |
| tap-attack-v2.03.js | 461406 | e26d7a54d236152208c5c988eacb955158b0c4eb9d7fd96411883c4e8f9888d9 | `games/tap-attack-v2.03.html` |
| hail-to-the-clout-v9.1.js | 1158963 | d4a3c827a872a15496857856514b860bfcec0fc8682f5a36545d9b1fd7cafcf2 | `games/hail-to-the-clout-v9.1.html` |

## The cut it landed with

- `snailcade-offline-v1.53.html` (SNAILCADE v1.53), which loads 7 cartridges: payload-v1.00/patty-panic-v304.js, payload-v1.00/neon-swarm-v90.js, payload-v1.00/grid-grudge-v67.js, payload-v1.00/valley-arcade-v1.00.js, payload-v1.00/tap-attack-v1.05.js, payload-v1.00/tap-attack-v2.03.js, payload-v1.00/hail-to-the-clout-v9.1.js
