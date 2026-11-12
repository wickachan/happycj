import { ROOTS, indexes, targetsFor, makeSession, attempt, tick, stats, readHistory } from './engine.js';
import { createTutorials, LESSONS } from './tutorials.js';

const $ = (selector) => document.querySelector(selector);
const esc = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  practice:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h1m3 0h1m3 0h2M7 13h1m3 0h1m3 0h2M8 16h8"/>',
  library:'<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v16h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4zM12 5v16"/>',
  history:'<path d="M4 19V5m0 14h16M8 15l4-5 4 2 4-7"/>',
  roots:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  tutorial:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15M8 7h8m-8 4h8"/>',
  legacy:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M6 9h.01M9 9h.01M12 9h6M6 13h12M6 16h8"/>',
  arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
  reset:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.practice}</svg>`;
let data, dictionary, session, history = [], page = 'tutorial', mode = 'DICTION', groupIndex = 0, articleId = 'test1';
let code = '', hint = false, direct = false, candidatePage = 0, composing = false, storageOK = true, rootFilter = 'a';
let course, toastTimer, speedSamples = [];
const labels = {DICTION:'基礎字根', PREFIX:'字首練習', POSTFIX:'字尾練習', article:'文章練習'};
const sublabels = {DICTION:'認識字形，從最簡單的一筆開始。', PREFIX:'觀察字首，找到每個字的起點。', POSTFIX:'看見字尾，練熟最後的取碼。', article:'讓字根連成句子，讓練習成為日常。'};

function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function storeHistory() {
  try { localStorage.setItem('happycj.history.v1', JSON.stringify(history)); storageOK = true; }
  catch { storageOK = false; toast('瀏覽器無法儲存。請先匯出成績備份。'); }
}
function bitmap(record, cls = '') {
  const rows = record.bitmap_rows_u16_be_candidate;
  let cells = '';
  rows.forEach((row, y) => { for (let x = 0; x < 16; x++) if (row & (1 << (15-x))) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`; });
  return `<svg class="glyph ${cls}" viewBox="-2 -3 20 20" fill="currentColor" shape-rendering="crispEdges" role="img" aria-label="${esc(record.unicode_candidates[0] || '原教材部件字形')}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}
function currentArticle() { return data.lessons.find(x => x.id === articleId) || data.lessons[0]; }
function resetSession() {
  code = ''; hint = false; candidatePage = 0; speedSamples = [];
  if (mode === 'article') {
    const article = currentArticle();
    session = makeSession('article', targetsFor('article', article), article.title);
  } else {
    const records = data.sets.find(g => g.source === mode).records.slice(groupIndex*20, groupIndex*20+20);
    session = makeSession(mode, records, `${labels[mode]} · 第 ${groupIndex+1} 組`);
  }
}
function pause(force = false) {
  if (session.complete || session.paused || (!force && session.lastTick === null)) return;
  tick(session, performance.now()); session.paused = true; session.lastTick = null; code = ''; render();
}
function startClock() {
  if (session.lastTick === null && !session.paused && !session.complete) session.lastTick = performance.now();
}
const PAGES = ['practice','tutorial','library','history','roots','legacy'];
function navigate(next, fromHistory = false) {
  if (!PAGES.includes(next)) next = 'tutorial';
  if (page === 'practice' && next !== 'practice') pause();
  page = next;
  const hash = next === 'tutorial' ? '#tutorial/' + course.selected() : '#' + next;
  if (!fromHistory && location.hash !== hash) window.history.pushState(null, '', hash);
  render();
  setEmulatorActive(page === 'legacy' && !document.hidden);
  window.scrollTo({top:0});
}
function openRoute() {
  const [target, lesson] = location.hash.slice(1).split('/');
  if (target === 'tutorial' && lesson) course.choose(lesson);
  navigate(PAGES.includes(target) ? target : 'tutorial', true);
}
function frame() {
  const today = new Date().toLocaleDateString('en-CA');
  const todays = history.filter(r => new Date(r.date).toLocaleDateString('en-CA') === today);
  const practiced = todays.reduce((sum, r) => sum+r.correct, 0);
  const nav = [['practice','練習室'],['tutorial','倉頡入門'],['library','文章選集'],['history','學習紀錄'],['roots','倉頡字根'],['legacy','原版 DOS']];
  const pageNames = {practice:'練習室',tutorial:'倉頡入門',library:'文章選集',history:'學習紀錄',roots:'倉頡字根',legacy:'原版 DOS'};
  const pageHeadings = {practice:'把每一個字，打成日常。',tutorial:'先懂規則，再讓指尖記住。',library:'好文章，值得一字一句。',history:'每一點進步，都算數。',roots:'二十六鍵，無限可能。',legacy:'原版 CJ，留在同一個練習室。'};
  const pageSubtitles = {practice:'不急著快。先打對，再慢慢熟練。',tutorial:'從拆字、字根到取碼，循著原版入門教學一步一步來。',library:'從熟悉的詩句出發，練習指尖上的中文。',history:'回頭看看，你已經走了這麼遠。',roots:'記住字根，也找到漢字裡的風景。',legacy:'用 js-dos / DOSBox WebAssembly 直接執行原始 DOS 程式。'};
  return `<aside class="sidebar"><a class="brand" href="#tutorial" data-nav="tutorial"><span class="seal">倉</span><span>HappyCJ<small>快快樂樂學倉頡</small></span></a><div class="sidebar-label">每天，靠近中文一點</div><nav aria-label="主要導覽">${nav.map(([id,label]) => `<button class="nav-item ${page===id?'active':''}" data-nav="${id}" ${page===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span>${page===id?'<i></i>':''}</button>`).join('')}</nav><div class="sidebar-note"><span class="small-sun">${icon('sun')}</span><p>一日一字，<br>也能積少成多。</p><span>HAPPY LITTLE PROGRESS.</span></div><div class="sidebar-bottom"><span class="status-dot"></span>${storageOK?'進度儲存在此裝置':'請匯出成績備份'}<button data-action="help">使用說明 ${icon('help')}</button></div></aside><div class="workspace"><header class="topbar"><div><span class="mobile-brand">倉 <b>HappyCJ</b></span><span class="breadcrumb">${pageNames[page]}</span></div><div class="topbar-right"><span class="edition">快快樂樂學倉頡 · WEB EDITION</span><button class="icon-button" data-action="help" aria-label="使用說明">${icon('help')}</button><span class="avatar" title="本機練習者">CJ</span></div></header><main id="main" tabindex="-1"><div class="page-heading"><div><div class="eyebrow">A LITTLE PRACTICE, EVERY DAY</div><h1>${pageHeadings[page]}</h1><p>${pageSubtitles[page]}</p></div><div class="daily-note">${icon('sun')}<span>今日已練習<b>${practiced.toLocaleString()} <small>字</small></b></span></div></div><div id="page-content"></div><section id="legacy-panel" hidden></section><footer class="page-footer"><span>HappyCJ <i>·</i> 快快樂樂學倉頡，把經典的快樂留在指尖。</span><button data-action="help">源自 1992 DOS CJ ${icon('arrow')}</button></footer></main></div>`;
}
function keyboard() {
  return `<section class="keyboard-card" aria-label="倉頡虛擬鍵盤"><div class="keyboard-heading"><span>${icon('practice')} 倉頡鍵盤</span><span>切換英文輸入法 · 或點按鍵盤</span></div><div class="keyboard">${['qwertyuiop','asdfghjkl','zxcvbnm'].map((row,i)=>`<div class="key-row row-${i}">${[...row].map(letter=>`<button class="key ${code.includes(letter)?'lit':''}" data-key="${letter}" aria-label="${letter.toUpperCase()} ${ROOTS[letter]}"><span>${letter.toUpperCase()}</span><b>${ROOTS[letter]}</b></button>`).join('')}${i===2?'<button class="key key-back" data-key="Backspace" aria-label="刪除">⌫</button>':''}</div>`).join('')}<div class="key-row"><button class="key key-space" data-key=" " aria-label="空白鍵送出">SPACE <span>送出</span></button></div></div></section>`;
}
function selection() {
  if (mode === 'article') return `<label class="select-label"><span>篇目</span><select id="lesson-select" aria-label="選擇文章">${data.lessons.map(a=>`<option value="${a.id}" ${a.id===articleId?'selected':''}>${esc(a.title)} · ${a.characters} 字</option>`).join('')}</select></label>`;
  const count = data.sets.find(g=>g.source===mode).count;
  return `<label class="select-label"><span>練習組別</span><select id="group-select" aria-label="選擇練習組別">${Array.from({length:Math.ceil(count/20)},(_,i)=>`<option value="${i}" ${i===groupIndex?'selected':''}>第 ${String(i+1).padStart(2,'0')} 組 · ${i*20+1}–${Math.min(count,i*20+20)}</option>`).join('')}</select></label>`;
}
function practice() {
  const done = session.complete;
  const target = session.targets[session.position];
  const computed = stats(session.correct, session.attempts, session.elapsedMs);
  const progress = Math.round(session.position/session.targets.length*100);
  return `<div class="practice-layout"><div class="practice-main"><div class="mode-tabs" role="tablist" aria-label="練習模式">${Object.entries(labels).map(([key,label])=>`<button role="tab" aria-selected="${mode===key}" class="${mode===key?'selected':''}" data-mode="${key}">${label}</button>`).join('')}</div><section class="practice-card"><div class="card-toolbar">${selection()}<button class="text-button" data-action="reset">${icon('reset')} 重新開始</button></div><div class="exercise-intro"><span class="section-number">${mode==='article'?'文':'字'} / ${String(groupIndex+1).padStart(2,'0')}</span><div><h2>${mode==='article'?esc(currentArticle().title):labels[mode]}</h2><p>${sublabels[mode]}</p></div><span class="pill">${mode==='article'?'倉頡五代':'原版教材'}</span></div><div class="exercise-stage ${mode==='article'?'article-stage':''}" id="stage">${done?completion():mode==='article'?`<div class="article-text" aria-label="文章內容">${session.targets.map((char,i)=>`<span class="${i<session.position?'typed':i===session.position?'current':''}" ${i===session.position?'aria-current="true"':''}>${esc(char)}</span>`).join('')}</div>`:`<div class="glyph-stage"><span class="target-label">觀察字形，輸入它的倉頡碼</span><div class="character-box">${bitmap(target)}<span class="cross horizontal"></span><span class="cross vertical"></span></div><div class="upcoming">${session.targets.slice(Math.max(0,session.position-2),session.position+5).map(r=>`<span class="${r===target?'now':''}">${bitmap(r)}</span>`).join('')}</div></div>`}</div><div class="progress-line"><span style="width:${progress}%"></span></div><div class="progress-caption"><span>${done?'這次練習，完成了。':'一次一個字，就是進步。'}</span><span><b id="position">${session.position}</b> / ${session.targets.length} 字</span></div>${done?'':`<div class="input-area"><div class="input-heading"><label for="typing-input">${mode==='article'&&direct?'直接輸入中文':'輸入倉頡碼'}<span id="input-roots"></span></label>${mode==='article'?`<label class="input-type">輸入方式<select id="input-type" aria-label="輸入方式"><option value="cangjie" ${!direct?'selected':''}>倉頡五代</option><option value="direct" ${direct?'selected':''}>直接輸入</option></select></label>`:'<span>SPACE 或 ENTER 送出</span>'}</div><div class="input-wrapper"><input id="typing-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${mode==='article'&&direct?'輸入中文':'倉頡編碼'}" aria-describedby="feedback" placeholder="${mode==='article'&&direct?'使用中文輸入法，輸入上方文章…':'點這裡，開始輸入…'}" ${!direct||mode!=='article'?'maxlength="5"':''} ${session.paused?'disabled':''} value="${esc(code)}"><button data-action="commit" aria-label="送出答案">送出 ${icon('arrow')}</button></div><div id="candidates" class="candidates" aria-label="候選字"></div><div class="feedback-row"><span id="feedback" role="status" aria-live="polite">${session.paused?'已暫停，準備好再繼續。':'準備好了嗎？從第一個字開始。'}</span><button class="text-button" data-action="hint">${hint?'隱藏提示':'顯示提示'} <span>↗</span></button></div><div id="hint" class="hint ${hint?'shown':''}">${hintMarkup()}</div></div>`}${session.paused&&!done?'<div class="pause-overlay"><span class="pause-symbol">Ⅱ</span><h3>休息一下，也很好。</h3><p>計時已暫停，回來再接著練。</p><button class="primary" data-action="resume">繼續練習 '+icon('arrow')+'</button></div>':''}</section>${keyboard()}</div><aside class="practice-aside"><section class="stats-card"><div class="eyebrow">YOUR LITTLE PROGRESS</div><h2>這次的練習</h2><div class="stat-feature"><span>打字速度</span><div><b id="cpm">${computed.cpm}</b><span>字 / 分</span></div><svg class="sparkline" viewBox="0 0 200 38" aria-hidden="true"><path d="M0 30H200M0 15H200"/><path class="spark" d="${speedPath()}"/></svg></div><div class="stat-row"><span>正確率</span><b><span id="accuracy">${computed.accuracy}</span><small>%</small></b></div><div class="stat-row"><span>有效練習時間</span><b id="elapsed">${formatTime(computed.seconds)}</b></div><div class="stat-row"><span>錯誤次數</span><b id="errors">${session.errors}<small>次</small></b></div><button class="pause-button" data-action="${session.paused?'resume':'pause'}" ${done?'disabled':''}>${session.paused?'▷ 繼續練習':'Ⅱ 暫停練習'}</button></section><section class="tip-card"><span class="tip-mark">小</span><span class="eyebrow">A FRIENDLY REMINDER</span><h3>手指放輕，<br>進步會跟上。</h3><p>先追求正確，再追求速度。<br>熟悉每個字根，快就會自然發生。</p><div class="tip-bottom">慢慢來，比較快。 <span>✳</span></div></section><button class="library-link" data-nav="library"><span>想換個心情？<b>找一篇喜歡的文章</b></span>${icon('arrow')}</button></aside></div>`;
}
function hintMarkup() {
  if (session.complete) return '';
  const target = session.targets[session.position];
  const answers = mode==='article'?(dictionary.byChar.get(target)||[]):[target.answer_raw.trim().toLowerCase()];
  return answers.length?answers.slice(0,4).map(answer=>`<span class="hint-code">${[...answer].map(letter=>`<kbd>${letter.toUpperCase()}<small>${ROOTS[letter]||''}</small></kbd>`).join('')}</span>`).join('<span class="or">或</span>'):'這個字不在五代基本字表中，請切換「直接輸入」。';
}
function formatTime(seconds) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
function completion() {
  const metrics = stats(session.correct,session.attempts,session.elapsedMs);
  return `<div class="completion"><span class="completion-seal">好</span><div class="eyebrow">ONE MORE STEP FORWARD</div><h2>又向前了一點。</h2><p>完成 ${session.correct} 字 · 正確率 ${metrics.accuracy}% · ${metrics.cpm} 字／分</p><p class="save-status">${storageOK?'成績已儲存在此裝置。':'成績暫存於記憶體，請前往學習紀錄匯出。'}</p><div class="completion-actions"><button class="primary" data-action="next">下一次練習 ${icon('arrow')}</button><button class="secondary" data-nav="history">查看紀錄</button></div></div>`;
}
function library() {
  return `<div class="library-toolbar"><span class="eyebrow">21 ARTICLES FROM THE ORIGINAL CJ</span><label class="search-box"><span>⌕</span><input id="search" type="search" placeholder="搜尋篇名或內文…" aria-label="搜尋文章"></label></div><div class="article-grid">${data.lessons.map((a,i)=>`<button class="article-card" data-article="${a.id}" data-search="${esc(a.title+' '+a.text)}"><div class="article-top"><span>篇 ${String(i+1).padStart(2,'0')}</span><span>${a.characters} 字</span></div><h2>${esc(a.title)}</h2><p>${esc([...a.text.replace(/\s+/g,'')].slice(0,48).join(''))}…</p><div class="article-bottom"><span>${a.source.toUpperCase()} · 原版選文</span>${icon('arrow')}</div></button>`).join('')}</div><p id="no-results" class="empty" hidden>沒有找到文章，換個字試試看。</p>`;
}
function historyPage() {
  const total = history.reduce((s,r)=>s+r.correct,0), elapsed = history.reduce((s,r)=>s+r.elapsedMs,0);
  const best = history.length?Math.max(...history.map(r=>stats(r.correct,r.attempts,r.elapsedMs).cpm)):0;
  return `<div class="summary-cards"><section><span>累積練習字數</span><b>${total.toLocaleString()}<small>字</small></b></section><section><span>完成練習</span><b>${history.length}<small>次</small></b></section><section><span>總練習時間</span><b>${Math.floor(elapsed/60000)}<small>分鐘</small></b></section><section><span>最佳速度</span><b>${best}<small>字 / 分</small></b></section></div><section class="history-card"><div class="history-heading"><h2>練習足跡</h2><div><button class="secondary" data-action="import">匯入備份</button><button class="secondary" data-action="export">匯出紀錄 ↗</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></div>${history.length?`<div class="table-wrap"><table><thead><tr><th>日期</th><th>練習內容</th><th>字數</th><th>速度</th><th>正確率</th><th>時間</th></tr></thead><tbody>${history.map(r=>{const s=stats(r.correct,r.attempts,r.elapsedMs);return `<tr><td>${esc(new Date(r.date).toLocaleString('zh-HK',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}))}</td><td>${esc(r.title)}</td><td>${r.correct}</td><td>${s.cpm} 字／分</td><td><span class="accuracy-pill">${s.accuracy}%</span></td><td>${formatTime(s.seconds)}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty-history"><span>足</span><h3>第一步，從今天開始。</h3><p>完成一次練習，就會在這裡留下你的進步。</p><button class="primary" data-nav="practice">前往練習室 '+icon('arrow')+'</button></div>'}<p class="storage-note">紀錄只保存在目前的瀏覽器。建議定期匯出備份，換裝置時再匯入。</p></section>`;
}
function rootsPage() {
  const matching = [...dictionary.byCode.entries()].filter(([c])=>c.startsWith(rootFilter)).slice(0,18);
  return `<section class="roots-intro"><div><span class="eyebrow">THE CANGJIE ALPHABET</span><h2>字根，是漢字的小積木。</h2><p>點選一個字根，看看它能組成哪些字。<br>文章練習使用倉頡五代；原版部件題庫沿用 CJ 答案。</p></div><span class="root-art">木<span>木</span><span>木</span></span></section><div class="root-grid">${Object.entries(ROOTS).map(([letter,root])=>`<button data-root="${letter}" class="root-tile ${rootFilter===letter?'selected':''}"><span>${letter.toUpperCase()}</span><b>${root}</b></button>`).join('')}</div><section class="root-examples"><h2>${ROOTS[rootFilter]} <span>${rootFilter.toUpperCase()} 開頭的字</span></h2><div>${matching.map(([c,chars])=>`<span class="example"><b>${esc(chars.slice(0,3).join(' '))}</b><code>${c.toUpperCase()}</code></span>`).join('')}</div></section>`;
}
function legacyPage() {
  return `<section class="legacy-intro"><div><span class="eyebrow">THE ORIGINAL · 1992</span><h2>同一個練習室，原來的倉頡。</h2><p>按「啟動 CJ」直接在這個網站內執行原程式。離開此頁會自動暫停，回來接續；重新整理前，請先儲存模擬磁碟。網頁版成績與 DOS 磁碟各自保存在此瀏覽器。</p></div></section><div class="legacy-frame"><iframe id="cj-emulator" src="./emulator/?embed=1" title="快快樂樂學倉頡 · 原版 DOS" allow="fullscreen"></iframe></div>`;
}
function setEmulatorActive(active) {
  $('#cj-emulator')?.contentWindow?.postMessage({type:'happycj:visibility', active}, location.origin);
}
function render() {
  if (!$('#page-content')) $('#app').innerHTML = frame();
  else {
    // Keep the emulator's iframe in place so navigation does not reboot DOS.
    const template = document.createElement('template');
    template.innerHTML = frame();
    for (const selector of ['.sidebar','.topbar','.page-heading','.page-footer']) {
      $(selector).replaceWith(template.content.querySelector(selector));
    }
  }
  $('#page-content').hidden = page === 'legacy';
  $('#legacy-panel').hidden = page !== 'legacy';
  if (page === 'legacy') {
    if (!$('#cj-emulator')) {
      $('#legacy-panel').innerHTML = legacyPage();
      $('#cj-emulator').onload = () => setEmulatorActive(page === 'legacy' && !document.hidden);
    }
  } else $('#page-content').innerHTML = page === 'tutorial' ? course.render() : ({practice,library,history:historyPage,roots:rootsPage})[page]();
  wire();
  if (page === 'tutorial') course.wire($('#page-content'));
  if (page === 'practice') updateCode();
}
function wire() {
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=e=>{e.preventDefault();navigate(b.dataset.nav);});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;groupIndex=0;direct=false;resetSession();render();});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>virtualKey(b.dataset.key);});
  document.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>{articleId=b.dataset.article;mode='article';direct=false;resetSession();navigate('practice');});
  document.querySelectorAll('[data-root]').forEach(b=>b.onclick=()=>{rootFilter=b.dataset.root;render();});
  if ($('#group-select')) $('#group-select').onchange=e=>{groupIndex=Number(e.target.value);resetSession();render();};
  if ($('#lesson-select')) $('#lesson-select').onchange=e=>{articleId=e.target.value;resetSession();render();};
  if ($('#input-type')) $('#input-type').onchange=e=>{direct=e.target.value==='direct';code='';render();$('#typing-input')?.focus();};
  if ($('#search')) $('#search').oninput=e=>{let count=0;document.querySelectorAll('.article-card').forEach(c=>{c.hidden=!c.dataset.search.toLowerCase().includes(e.target.value.toLowerCase());if(!c.hidden)count++;});$('#no-results').hidden=!!count;};
  if ($('#import-file')) $('#import-file').onchange=importHistory;
  const input = $('#typing-input');
  if (input) {
    input.oncompositionstart=()=>{composing=true;};
    input.oncompositionend=e=>{composing=false;const value=e.target.value;e.target.value='';handleInput(value);};
    input.oninput=e=>{if(!composing&&!e.isComposing)handleInput(e.target.value);};
    input.onkeydown=e=>{
      if(composing||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key==='Escape'){e.preventDefault();code='';input.value='';updateCode();}
      if(e.key===' '||e.key==='Enter'){e.preventDefault();commit();}
      if(mode==='article'&&!direct&&/^[1-9]$/.test(e.key)&&code){e.preventDefault();commitCandidate(Number(e.key)-1);}
    };
  }
}
function handleInput(value) {
  if(session.paused||session.complete)return;
  startClock();
  if(mode==='article'&&direct) {
    code='';
    for(const char of [...value].filter(c=>!(/\s/u.test(c)))) {
      if(session.complete)break;
      submit(char);
    }
    if($('#typing-input'))$('#typing-input').value='';
    return;
  }
  const cleaned=value.toLowerCase().replace(/[^a-z]/g,'').slice(0,5);
  if(value&&!cleaned)toast('請先切換英文輸入法；文章模式也可選「直接輸入」。');
  code=cleaned;candidatePage=0;
  if($('#typing-input'))$('#typing-input').value=code;
  updateCode();
}
function candidates() { return dictionary.byCode.get(code)||[]; }
function updateCode() {
  if(!$('#input-roots'))return;
  $('#input-roots').textContent=[...code].map(c=>ROOTS[c]).join(' ');
  document.querySelectorAll('[data-key]').forEach(k=>k.classList.toggle('lit',code.includes(k.dataset.key)&&k.dataset.key.length===1));
  const c = $('#candidates');
  if(mode!=='article'||direct) { c.innerHTML='';return; }
  const options=candidates(), shown=options.slice(candidatePage*9,candidatePage*9+9);
  c.innerHTML=code?(shown.length?shown.map((char,i)=>`<button data-candidate="${i}" aria-label="候選字 ${i+1} ${esc(char)}"><small>${i+1}</small>${esc(char)}</button>`).join('')+ (options.length>9?`<button data-page="prev" ${candidatePage===0?'disabled':''} aria-label="上一頁候選字">‹</button><span>${candidatePage+1}/${Math.ceil(options.length/9)}</span><button data-page="next" ${(candidatePage+1)*9>=options.length?'disabled':''} aria-label="下一頁候選字">›</button>`:''):'<span>繼續取碼，或按退格修改。</span>'):'<span>輸入字碼後，候選字會出現在這裡。</span>';
  c.querySelectorAll('[data-candidate]').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>commitCandidate(Number(b.dataset.candidate));});
  c.querySelectorAll('[data-page]').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>{candidatePage+=b.dataset.page==='next'?1:-1;updateCode();};});
}
function commitCandidate(index) {
  const char=candidates()[candidatePage*9+index];
  if(char)submit(char);
}
function commit() {
  if(session.complete||session.paused||!code)return;
  if(mode==='article') {
    if(direct)return;
    const char=candidates()[candidatePage*9];
    if(char)submit(char);else feedback('這個字碼沒有候選字，請再檢查一下。',true);
  } else submit(code);
}
function feedback(message,error=false) { if($('#feedback')){$('#feedback').textContent=message;$('#feedback').classList.toggle('error',error);} }
function submit(value) {
  startClock();tick(session,performance.now());
  const result=attempt(session,value);
  if(result.ignored)return;
  if(result.accepted) {
    code='';candidatePage=0;
    if(result.complete) {
      const record={id:crypto.randomUUID(),title:session.title,mode:session.mode,date:new Date().toISOString(),correct:session.correct,attempts:session.attempts,elapsedMs:session.elapsedMs};
      history=[record,...history].slice(0,500);storeHistory();
    }
    render();
    if(!result.complete){feedback('很好，繼續下一個字。');$('#typing-input')?.focus();$('.article-text .current')?.scrollIntoView({block:'nearest',behavior:'smooth'});}
  } else {
    code='';candidatePage=0;if($('#typing-input'))$('#typing-input').value='';updateCode();
    feedback('差一點，再試一次。需要時可以看看提示。',true);
    $('#stage')?.classList.remove('shake');requestAnimationFrame(()=>$('#stage')?.classList.add('shake'));
    updateMetrics();
  }
}
function speedPath() {
  if (speedSamples.length < 2) return 'M0 30H200';
  const max = Math.max(30, ...speedSamples);
  return speedSamples.map((value,i) => `${i?'L':'M'}${i*200/(speedSamples.length-1)} ${32-value/max*28}`).join(' ');
}
function updateMetrics() {
  if(page!=='practice')return;
  const s=stats(session.correct,session.attempts,session.elapsedMs);
  if($('#cpm'))$('#cpm').textContent=s.cpm;
  if(session.lastTick!==null && !session.paused){speedSamples.push(s.cpm);speedSamples=speedSamples.slice(-40);}
  if($('.sparkline .spark'))$('.sparkline .spark').setAttribute('d', speedPath());
  if($('#accuracy'))$('#accuracy').textContent=s.accuracy;
  if($('#elapsed'))$('#elapsed').textContent=formatTime(s.seconds);
  if($('#errors'))$('#errors').textContent=session.errors;
}
function virtualKey(key) {
  if(page!=='practice'||session.complete||session.paused)return;
  if(direct&&mode==='article'){toast('直接輸入模式請使用中文輸入法，或切回倉頡五代。');return;}
  $('#typing-input')?.focus();
  if(key===' ')return commit();
  handleInput(key==='Backspace'?code.slice(0,-1):code+key);
}
function action(name) {
  if(name==='help'){pause();$('#help').showModal();return;}
  if(name==='pause'){pause(true);return;}
  if(name==='resume'){session.paused=false;session.lastTick=null;render();$('#typing-input')?.focus();return;}
  if(name==='reset'){resetSession();render();$('#typing-input')?.focus();return;}
  if(name==='commit'){commit();$('#typing-input')?.focus();return;}
  if(name==='hint'){hint=!hint;$('#hint').classList.toggle('shown',hint);document.querySelector('[data-action="hint"]').innerHTML=(hint?'隱藏提示':'顯示提示')+' <span>↗</span>';return;}
  if(name==='next') {
    if(mode==='article')articleId=data.lessons[(data.lessons.findIndex(x=>x.id===articleId)+1)%data.lessons.length].id;
    else groupIndex=(groupIndex+1)%Math.ceil(data.sets.find(g=>g.source===mode).count/20);
    resetSession();render();$('#typing-input')?.focus();return;
  }
  if(name==='export') {
    const blob=new Blob([JSON.stringify({app:'HappyCJ',version:1,exportedAt:new Date().toISOString(),history},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`happycj-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('練習紀錄已匯出。');return;
  }
  if(name==='import')$('#import-file').click();
}
async function importHistory(event) {
  const file=event.target.files[0];if(!file)return;
  try {
    if(file.size>2e6)throw Error('備份檔過大。');
    const imported=JSON.parse(await file.text());
    if(imported.app!=='HappyCJ'||imported.version!==1||!Array.isArray(imported.history))throw Error('不是有效的 HappyCJ 備份。');
    const valid=readHistory({getItem:()=>JSON.stringify(imported.history)});
    if(valid.length!==imported.history.length)throw Error('備份包含無效紀錄。');
    history=[...new Map([...history,...valid].map(r=>[r.id,r])).values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,500);
    storeHistory();render();toast(`已匯入 ${valid.length} 筆紀錄，重複項目已合併。`);
  } catch(error){toast(error instanceof SyntaxError?'備份格式有誤，請選擇匯出的 JSON 檔。':error.message);}
}
async function boot() {
  try {
    const response=await fetch('./data/cj.json');if(!response.ok)throw Error('教材載入失敗');
    data=await response.json();dictionary=indexes(data.dictionary);
    try{history=readHistory(localStorage);localStorage.setItem('happycj.storage-check','1');localStorage.removeItem('happycj.storage-check');}catch{storageOK=false;}
    course = createTutorials({data, bitmap, go:navigate, changeLesson:id=>window.history.pushState(null,'','#tutorial/'+id)});
    resetSession();openRoute();
    window.addEventListener('popstate',openRoute);
    window.addEventListener('hashchange',openRoute);
    setInterval(()=>{if(session&&!session.complete&&!session.paused&&session.lastTick!==null){tick(session,performance.now());updateMetrics();}},500);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&page==='practice')pause();setEmulatorActive(page==='legacy'&&!document.hidden);});
    window.addEventListener('blur',()=>{if(page==='practice')pause();});
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch(error){$('#app').innerHTML=`<div class="boot"><span class="seal">倉</span><h1>教材還沒準備好。</h1><p>請檢查連線，再重新整理。${esc(error.message)}</p><button class="primary" id="retry">重新載入</button></div>`;$('#retry').onclick=()=>location.reload();}
}
boot();
