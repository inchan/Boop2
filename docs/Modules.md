# Supported Modules

Boop Tauri provides a set of built-in modules that you can `require()` in your scripts.
We aim to maintain compatibility with original Boop scripts.

## Core Modules

| Module | Usage | Description |
| :--- | :--- | :--- |
| **Lodash** | `require('lodash')` | The full build of Lodash. |
| **Base64** | `require('@boop/base64')` | `encode(str)` and `decode(str)`. |
| **HTML Entities** | `require('@boop/he')` | HTML encoder/decoder. |
| **Hashes** | `require('@boop/hashes')` | MD5, SHA1, SHA256, SHA512 generation. |
| **CSV** | `require('@boop/papaparse.js')` | CSV parsing via PapaParse. |
| **YAML** | `require('@boop/js-yaml')` | YAML parsing/dumping via js-yaml. |
| **Beautify** | `require('@boop/vkBeautify')` | XML, SQL, CSS beautifier/minifier. |

## Compatibility Aliases
For backward compatibility with older scripts, the following paths are also supported:

*   `./lib/lodash.boop.js` -> `lodash`
*   `./lib/base64.js` -> `@boop/base64`
*   `./lib/he.js` -> `@boop/he`
*   ...and other paths found in the original `scripts/lib` folder.

## Requesting New Modules
If a script fails with `Module not found`, please check [RequireShim.ts](../src/lib/RequireShim.ts) in the source code or open an issue to request adding it. You can see how libraries are mapped and shimmed for compatibility there.