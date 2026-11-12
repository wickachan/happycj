# HappyCJ — 第三方來源與授權 / Sources and notices

本專案混合現代程式碼、第三方開源資源與原 DOS CJ 材料；不宣告一份涵蓋全部內容的統一授權。以下亦適用於建置輸出與 `happycj-source.zip`。

## Rime Cangjie 5

文章模式使用 [rime/rime-cangjie](https://github.com/rime/rime-cangjie) 的倉頡五代基礎字表（取得日期：2026-11-10）。原始表頭標示《五倉世紀》、www.chinesecj.com、惜緣、佛振，以及 GPL；上游倉庫另有 LGPL-3.0 授權文件。保留表頭及兩份授權文字，不將它們重新標成其他授權。

來源位於 `vendor/rime-cangjie/`，建置後位於 `licenses/rime-cangjie/`：`COPYING`（GPL-3.0）、`LICENSE`（LGPL-3.0）及原始 YAML。`build.py` 從 `cangjie5.base.dict.yaml` 擷取字與字碼，產生獨立 JSON 資料。它不是原 DOS CJ 字典的完整還原。

Article input uses the Rime Cangjie 5 base dictionary. Original table notices and upstream GPL/LGPL license texts are retained. Character/code pairs are extracted by `build.py`; the dictionary remains separately replaceable. See `vendor/rime-cangjie/` in source and `licenses/rime-cangjie/` in the website.

## 原 CJ 材料 / Original CJ materials

`legacy/CJ/` 是使用者提供的 52 個原始檔案副本，包含 DOS 程式、字型、圖像、教材、字典及紀錄檔。21 篇文章、616 筆點陣字形與答案從這份資料擷取。版權仍屬原權利人；尚未確認公開散佈授權。

整合網站的 `emulator/*.jsdos` 會包含原 DOS 程式副本。產生的來源壓縮檔也包含 `legacy/CJ/`。將倉庫公開、上傳建置或發佈網站前，請先確認相關權利並檢查原紀錄檔。這些材料沒有因重製或放入 Git 倉庫而自動成為開源。

The original CJ rights remain with their holders; redistribution permission has not been established. Unlike the earlier web-only remake, the integrated build includes copied executables inside `.jsdos` bundles. The source download also includes original materials. Review rights and existing record files before public distribution.

## js-dos / DOSBox

js-dos v7 UI 檔案來源：<https://js-dos.com/v7/build/releases/latest/js-dos/>。引擎與 ZIP 執行資源來自 npm `emulators@0.73.8`；原工作目錄建立時曾以 npm registry SHA-512 驗證。現有資源保留於 `emulator/vendor/`，毋須在執行時使用 CDN。`manifest.json` 在建置時記錄資源與 DOS 原檔 SHA-256。

`emulator/vendor/emulators-LICENSE` 保留引擎的 GPL-2.0 文字。js-dos 及 DOSBox 為 GPL 專案；上游來源分別見 <https://github.com/caiiiycuk/js-dos> 與 <https://github.com/js-dos/emulators>。目前保留的是預先建置的執行資源與現有授權文字，尚未整理與每個二進位完全對應的完整來源包；公開散佈時須同時確認上游版本與適用的對應來源義務。

The player uses vendored upstream runtime files. No emulator engine source was modified here; HappyCJ adds a wrapper, a byte-identical executable alias, and DOSBox configuration (`normal2x`, `dosboxDirect`, 10,000 cycles). The retained engine license is GPL-2.0. Exact corresponding-source packaging for all prebuilt runtime files has not yet been assembled; resolve applicable upstream license obligations before redistribution.

## 字型與行為 / Typography and behavior

網頁使用裝置系統字型，沒有 Google Fonts 載入，也沒有另外散佈網頁字型。DOS 顯示使用原 CJ 字型。

HappyCJ 的速度、正確率、暫停與紀錄規則是現代實作，並非反組譯還原的 DOS 算法。原始點陣部件保留像素，不以猜測中文字代替；字型比對結果僅用於輔助標籤。

Web typography uses system fonts with no remote font dependency. DOS rendering uses the original CJ font. Modern scoring and persistence are HappyCJ rules, not recovered DOS algorithms.
