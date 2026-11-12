# HappyCJ · 快快樂樂學倉頡

HappyCJ 把經典 DOS CJ 倉頡學習程式整理成一個可在瀏覽器使用的中文輸入學習網站。它把現代化的倉頡練習、原版入門內容，以及原始 DOS 程式的 WebAssembly 模擬器放在同一個介面裡。

## 專案特色

- **倉頡入門**：五課互動教材，涵蓋中文字母分類、輔助字形、取碼原則、例外字、指法與口訣。
- **現代練習室**：基礎字根、字首、字尾、文章練習、候選字、提示、虛擬鍵盤和本機學習紀錄。
- **原版 DOS**：在「原版 DOS」頁內嵌 js-dos / DOSBox WebAssembly，直接執行原始 CJ 程式；不再另外提供第二個本機伺服器。
- **原始教材保存**：保留 21 篇文章與 616 筆原始點陣字形／答案資料。
- **靜態網站**：建置後是 HTML、CSS、JavaScript、JSON、WebAssembly 和 DOS 磁碟包，不需要後端資料庫或 Node.js 執行伺服器。

## 從 DOS 到網頁的轉換方式

這個專案不是把 DOS 視窗重新畫成一張圖片，也不是只做一個外觀相似的輸入框，而是分成兩條互補的路徑：

### 1. 原版程式的保留路徑

`legacy/CJ/` 保存使用者提供的 52 個 DOS CJ 檔案。建置腳本只讀取這些檔案，以原始位元組建立三個 js-dos 磁碟包，並保留原本沒有副檔名的 `HPCJ`，另加一個內容完全相同的 `HPCJ.EXE` 別名，讓 DOS 的程式搜尋規則可以啟動它。

網站使用本地的 js-dos / DOSBox WebAssembly 執行資源。`emulator/player.js` 負責啟動原程式、傳送鍵盤按鍵、儲存虛擬磁碟，以及在使用者離開「原版 DOS」頁時暫停與返回時繼續。DOS 畫面仍由原始程式和原始字型繪製，所以原版選單、中文字形和操作方式可以保留下來。

這條路徑沒有把 DOS 執行檔改寫成 JavaScript，也沒有重新實作 DOS 的計分演算法；它是在瀏覽器裡執行原程式的副本。建置過程會以 SHA-256 比對檔案，確認 `legacy/CJ/` 沒有被修改。

### 2. 原教材的網頁化路徑

DOS 的 `.ATC` 文章、`.PLB` 點陣題庫和 `.ANS` 答案資料先由 `research/inspect_cj.py` 進行結構化擷取：

1. 以 Big5 解碼 21 篇文章，轉成瀏覽器使用的 Unicode 文字。
2. 解析三組固定長度的點陣記錄，驗證記錄數、偏移和答案欄位長度。
3. 將 616 筆點陣資料與原始答案寫入 `research/extracted/training-records.json`。
4. 建置時將原始點陣轉成 SVG／像素顯示，保留教材中的部件外觀，不用猜測的 Unicode 字元取代。

現代文章練習另使用 Rime 倉頡五代字表，因為原始 DOS 字典與完整輸入演算法尚未被完整還原。`src/engine.js` 實作瀏覽器端的候選字、取碼、計時、正確率和本機紀錄；`src/tutorials.js` 則把原版五個入門主題改寫成可讀、可操作的網頁課程。這些是 HappyCJ 的現代化行為，不宣稱完全等同 DOS 原版的內部演算法。

### 3. 介面與靜態輸出

`src/app.js` 把練習室、入門課程、文章選集、學習紀錄、字根參考和原版 DOS 頁面組成單一導覽。`build.py` 產生 `dist/`：

- `dist/index.html`、JavaScript、CSS、JSON 和 service worker：現代 HappyCJ 介面。
- `dist/emulator/`：嵌入式 DOS 播放器、WebAssembly 執行資源和原始 DOS 磁碟包。
- `dist/licenses/` 與 `dist/THIRD_PARTY_NOTICES.md`：第三方來源及授權說明。

因此整個網站可由任何能提供靜態檔案的 HTTPS 主機服務。網站成績使用瀏覽器 `localStorage`，DOS 虛擬磁碟使用 IndexedDB，不需要應用程式伺服器。

## 開發與測試

需要 Python 3.10+ 與 Node.js 20+；不需要額外安裝 Python 或 npm 套件。

```sh
npm run build
npm test
```

建置後可用以下指令啟動整合網站：

```sh
npm run dev
```

開啟 <http://127.0.0.1:4173/>。請透過 HTTP 開啟，不能直接雙擊 `index.html`，因為教材會用 `fetch` 載入。要停止伺服器，按 `Ctrl+C`。

## 目錄

| 路徑 | 用途 |
| --- | --- |
| `src/` | 網頁介面、倉頡引擎、入門課程、樣式和 service worker |
| `emulator/` | 嵌入式 DOS 播放器、打包腳本和本地 js-dos / DOSBox 資源 |
| `legacy/CJ/` | 52 個原始 DOS CJ 檔案副本，建置時只讀取 |
| `research/extracted/` | 文章和訓練資料的結構化結果 |
| `research/inspect_cj.py` | 重新擷取原始資料的工具 |
| `vendor/rime-cangjie/` | 倉頡五代字表、來源和授權文字 |
| `tests/` | 資料、引擎和教學課程測試 |
| `dist/` | 建置產生的靜態網站輸出，不加入版本控制 |

## 資料與授權

現代網頁練習使用 Rime 倉頡五代字表；原始 CJ 程式、字型、圖像、文章、題庫和紀錄資料的權利仍屬原權利人。來源及授權請參閱 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## English version

# HappyCJ · 快快樂樂學倉頡

HappyCJ turns the classic DOS CJ Cangjie learning program into a browser-based Chinese input trainer. It combines a modern practice room, rewritten introductory lessons, and the original DOS application running through an embedded js-dos / DOSBox WebAssembly emulator.

## Features

- **Cangjie lessons**: five interactive topics covering root families, auxiliary shapes, code-selection rules, exceptions, and fingering mnemonics.
- **Modern practice room**: root, prefix, postfix, and article practice with candidates, hints, a virtual keyboard, and browser-local records.
- **Original DOS**: the original CJ program runs inside the combined site under the “原版 DOS” page. There is no separate DOS server.
- **Preserved source material**: 21 original articles and 616 original bitmap/answer records are retained.
- **Static output**: the build produces HTML, CSS, JavaScript, JSON, WebAssembly, and DOS disk bundles. No backend database or Node.js runtime server is required.

## How the DOS program became a web feature

The conversion uses two complementary paths.

### 1. Running the original program

The 52 supplied DOS CJ files are kept under `legacy/CJ/`. The build script reads them without modifying them and creates three js-dos disk bundles. The original extensionless `HPCJ` file is retained, with a byte-identical `HPCJ.EXE` alias added so DOS executable lookup can start it.

The site vendors js-dos / DOSBox WebAssembly locally. `emulator/player.js` starts the original program, forwards keyboard controls, saves the virtual disk, and pauses/resumes the emulator when the user leaves or returns to the “原版 DOS” page. The original program and font still draw the DOS menu and Chinese glyphs.

The DOS executable is not rewritten as JavaScript and its scoring algorithms are not reimplemented. The browser runs a copy of the original program. SHA-256 checks during packaging confirm that the files under `legacy/CJ/` remain unchanged.

### 2. Rebuilding the teaching material for the web

`research/inspect_cj.py` structures the original `.ATC`, `.PLB`, and `.ANS` resources:

1. It decodes 21 Big5 articles into Unicode text.
2. It validates fixed-size bitmap records, offsets, record counts, and answer lengths.
3. It writes all 616 bitmap records and original answers to `research/extracted/training-records.json`.
4. The web build renders the original bitmap data as pixel/SVG artwork instead of replacing components with guessed Unicode characters.

Article practice uses the Rime Cangjie 5 dictionary because the original DOS dictionary and full input algorithm have not been completely recovered. `src/engine.js` implements browser-side candidates, input, timing, accuracy, and local history. `src/tutorials.js` rewrites the five original introductory topics as readable interactive lessons. These are modern HappyCJ behaviors, not a claim of exact DOS algorithm recovery.

### 3. Interface and static packaging

`src/app.js` joins the practice room, lessons, article library, history, root reference, and embedded DOS page into one navigation system. `build.py` produces `dist/` with the modern app, the embedded emulator and bundles, and license/source notices.

The resulting site can be served by any HTTPS static host. Practice history uses browser `localStorage`; the DOS virtual disk uses IndexedDB. No application server is required.

## Development and testing

Requires Python 3.10+ and Node.js 20+. No additional Python or npm packages are required.

```sh
npm run build
npm test
npm run dev
```

Open <http://127.0.0.1:4173/> after starting the integrated preview. Use HTTP rather than opening `index.html` directly because lessons load through `fetch`. Stop the server with `Ctrl+C`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | Interface, Cangjie engine, lessons, styles, and service worker |
| `emulator/` | Embedded DOS player, bundler, and local js-dos / DOSBox runtime |
| `legacy/CJ/` | Read-only copies of the 52 original DOS CJ files |
| `research/extracted/` | Structured article and exercise data |
| `research/inspect_cj.py` | Original-data extraction tool |
| `vendor/rime-cangjie/` | Cangjie 5 dictionary, source, and license text |
| `tests/` | Data, engine, and tutorial tests |
| `dist/` | Generated static website output, ignored by Git |

## Data and licensing

Modern article practice uses the Rime Cangjie 5 dictionary. Rights to the original CJ programs, fonts, images, articles, exercise data, and records remain with their respective holders. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for sources and license notices.
