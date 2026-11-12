# 原版 DOS CJ 播放器 / Embedded DOS player

此目錄只提供整合網站內嵌的原版 DOS 播放器。主要使用方式與專案說明見根目錄 [README.md](../README.md)。

`npm run build` 會自動呼叫 `emulator/build.py`，把播放器、WebAssembly 執行資源、原始 DOS 檔案副本和三個啟動磁碟包寫入 `dist/emulator/`。整合網站只需要 `npm run dev`。

`build.py` 讀取倉庫內 `legacy/CJ/` 的 52 個檔案，以副本建立 `intro.jsdos`、`direct.jsdos` 及 `prompt.jsdos`。保留原 `HPCJ`，另加入位元組相同的 `HPCJ.EXE` 別名。原檔只讀取；SHA-256 存於產生的 `manifest.json`。

執行資源位於 `vendor/`，來源及授權見 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。設定使用 `svga_s3`、10,000 cycles、`normal2x`，並以 `dosboxDirect` 避開舊版 worker 的畫面傳輸問題。沒有修改模擬器引擎原始碼。

儲存模擬磁碟使用同一網站來源的 IndexedDB，不會寫回 `legacy/CJ/`。不同啟動包有各自的儲存空間。網站網域或連接埠改變後，不會自動沿用原來源的存檔。

---

## English

This directory supplies only the embedded original DOS player used by the combined site. `npm run build` invokes `emulator/build.py` and writes the player, WebAssembly runtime, copied DOS files, and launch bundles into `dist/emulator/`. The integrated site is previewed with `npm run dev`.

The bundler reads the 52 repository-local files in `legacy/CJ/`, creates three launch bundles, and adds a byte-identical `HPCJ.EXE` alias. Original files are never changed. Generated manifests contain source/runtime SHA-256 hashes without local absolute paths.

The engine is vendored upstream code; only the player wrapper and DOSBox configuration are customized. Disk saves use origin-local IndexedDB, with separate namespaces for launch bundles. A new domain or port does not inherit existing saves. See the root README and third-party notices for hosting and distribution details.
