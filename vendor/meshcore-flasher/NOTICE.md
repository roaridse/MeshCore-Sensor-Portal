# Third-party notice

`dfu.js` and the bundled `zip.min.js` are copied from
[`meshcore-dev/flasher.meshcore.io`](https://github.com/meshcore-dev/flasher.meshcore.io)
at commit `45a5257bf792b11a83f4c51c18d4f312addfb677` (2026-09-26).

The upstream repository is distributed under the MIT License:

```text
MIT License

Copyright (c) 2025 Rastislav Vysoky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`zip.min.js` is a bundled build of zip.js by Gildas Lormeau, which is
distributed under the BSD 3-Clause License. See
<https://github.com/gildas-lormeau/zip.js>.

The formatter image `firmware/FLASH_ERASE_nrf52_softdevice_v6.zip` is the
RAK4631/nRF52 formatter distributed by the official MeshCore flasher. Its
SHA-256 is recorded in `catalog/firmware.json` and verified before use.
