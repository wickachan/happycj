import { ROOTS } from './engine.js';

// Rewritten from the original five teaching topics. These are browser lessons,
// not a transcription of every animation frame. Code examples use the bundled
// Rime Cangjie 5 dictionary; legacy bitmap drills retain their original answers.
export const ROOT_GROUPS = [
  {name:'哲理類', keys:'abcdefg', note:'日、月與五行：金、木、水、火、土。'},
  {name:'筆畫類', keys:'hijklmn', note:'竹、戈、十、大、中、一、弓，從基本筆勢認形。'},
  {name:'人體類', keys:'opqr', note:'人、心、手、口，從身體的形象來記憶。'},
  {name:'字形類', keys:'stuvwy', note:'尸、廿、山、女、田、卜，從外形記住字根。'},
];
export const LESSONS = [
  {id:'classification', title:'中文字母的分類', heading:'從一個字，看懂倉頡。', intro:'原版第一課先問：「什麼是倉頡輸入法？」從拆字開始，把漢字的形狀連到鍵盤上的字母。', quiz:[{glyph:'桔',answer:'dgr',hint:'木 D → 土 G → 口 R'},{glyph:'明',answer:'ab',hint:'日 A → 月 B'},{glyph:'林',answer:'dd',hint:'木 D → 木 D'}]},
  {id:'shapes', title:'輔助字形的學習', heading:'形狀變了，仍是一家人。', intro:'原版說明：二十四個基本字母衍生出七十八個輔助字形。它們延伸了字母的形狀，仍然使用同一個鍵位。', quiz:[{glyph:'氵',answer:'e',hint:'三點水屬於水 E'},{glyph:'扌',answer:'q',hint:'提手旁屬於手 Q'},{glyph:'忄',answer:'p',hint:'豎心旁屬於心 P'},{glyph:'亻',answer:'o',hint:'單人旁屬於人 O'}]},
  {id:'rules', title:'倉頡輸入取碼原則', heading:'先分結構，再取首尾。', intro:'並列型、上下型、外內形、連體形，是原版介紹的四種組合結構。先找字首與字身，再決定哪些字根要保留。', quiz:[{glyph:'休',answer:'od',hint:'左邊亻是人 O，右邊是木 D'},{glyph:'好',answer:'vnd',hint:'女 V → 弓 N → 木 D（子）'},{glyph:'哲',answer:'qlr',hint:'折作字首取首尾 QL，口為 R'},{glyph:'區',answer:'srrr',hint:'外框尸 S → 三個口 RRR'}]},
  {id:'exceptions', title:'例外字的輸入', heading:'特別的字形，有特別的約定。', intro:'除了通則，還有固定的特殊字形與難字碼。先辨認整組部件，再記住它在字表中的取碼，不必硬把每一筆拆開。', quiz:[{glyph:'臼',answer:'hx',hint:'竹 H → 難 X'},{glyph:'齊',answer:'yx',hint:'卜 Y → 難 X'},{glyph:'鹿',answer:'ixp',hint:'戈 I → 難 X → 心 P'},{glyph:'慶',answer:'ixe',hint:'戈 I → 難 X → 水 E'}]},
  {id:'fingers', title:'指法與口訣', heading:'眼睛認形，手指記路。', intro:'先把手放回基本鍵，再把字根口訣和字母連起來。用正確的手指按鍵，每次按完回到原位，先準確，再加快。', quiz:[{glyph:'日',answer:'a',hint:'左小指 · A'},{glyph:'火',answer:'f',hint:'左食指 · F'},{glyph:'十',answer:'j',hint:'右食指 · J'},{glyph:'口',answer:'r',hint:'左食指 · R'},{glyph:'田',answer:'w',hint:'左無名指 · W'}]},
];
export const CODE_EXAMPLES = [['桔','dgr'],['明','ab'],['林','dd'],['休','od'],['好','vnd'],['哲','qlr'],['謝','yrhhi'],['區','srrr'],['國','wirm'],['臼','hx'],['齊','yx'],['鹿','ixp'],['慶','ixe'],['龜','hxu'],['門','an']];
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const codeLabel = code => `<span class="lesson-code">${[...code].map(key=>`<kbd>${key.toUpperCase()}<small>${ROOTS[key]}</small></kbd>`).join('')}</span>`;
export function acceptsTutorialAnswer(question, value) { return value.trim().toLowerCase() === question.answer; }

export function createTutorials({data, bitmap, go, changeLesson}) {
  let selected = 'classification', root = 'a', draft = '', feedback = '', revealed = false, composing = false;
  const progress = new Map();
  const lesson = () => LESSONS.find(item=>item.id===selected) || LESSONS[0];
  const state = () => {if(!progress.has(selected))progress.set(selected,{position:0});return progress.get(selected);};
  function choose(id) { selected = LESSONS.some(item=>item.id===id) ? id : LESSONS[0].id; draft='';feedback='';revealed=false; }
  function rootButtons() { return Object.entries(ROOTS).filter(([key])=>key!=='z').map(([key,value])=>`<button class="root-tile ${root===key?'selected':''}" data-course-root="${key}" aria-pressed="${root===key}"><span>${key.toUpperCase()}</span><b>${value}</b></button>`).join(''); }
  function body() {
    if(selected==='classification') return `<p>倉頡依字形拆字，而非依讀音拼字。把「桔」看成木、土、口，再把字根換成字母，就能輸入 D、G、R，最後按空白鍵送出。</p><div class="decomposition"><b>桔</b><span>→</span><strong>木</strong><strong>土</strong><strong>口</strong>${codeLabel('dgr')}</div><h3>二十四個基本字母，分成四大家族</h3><div class="family-grid">${ROOT_GROUPS.map(group=>`<section><h4>${group.name}</h4><p>${group.note}</p><div class="family-roots">${[...group.keys].map(key=>`<span><b>${ROOTS[key]}</b><small>${key.toUpperCase()}</small></span>`).join('')}</div></section>`).join('')}</div><p class="lesson-note">X「難」是特殊取碼鍵；Z 常標示「重」，不屬於這二十四個基本字母。本版字母鍵盤保留這些標示，文章候選字則以數字選取。</p>`;
    if(selected==='shapes') {
      const records = data.sets.find(set=>set.source==='DICTION').records.filter(record=>record.answer_raw.trim().toLowerCase()===root);
      return `<p>輔助字形可從形狀變化、局部省略等方式聯想母字根。例如「氵」回到水 E，「扌」回到手 Q；不用為每一個偏旁多記一個新按鍵。</p><div class="variant-grid">${[['水','氵','e'],['手','扌','q'],['心','忄','p'],['人','亻','o'],['火','灬','f'],['竹','⺮','h']].map(([base,variant,key])=>`<section><b>${base} <span>→</span> ${variant}</b>${codeLabel(key)}</section>`).join('')}</div><h3>對照原教材字形</h3><p>點字根，查看原始基礎題庫中使用同一鍵的字形。這裡保留原圖像素；不是用相似的中文字代替部件。</p><div class="course-root-grid" aria-label="輔助字形字根篩選">${rootButtons()}</div><div class="shape-gallery" aria-live="polite"><h4>${ROOTS[root]} · ${root.toUpperCase()} <small>${records.length} 個原教材字形</small></h4><div>${records.map(record=>`<figure>${bitmap(record)}<figcaption>${root.toUpperCase()} · 題 ${record.index}</figcaption></figure>`).join('')||'<p>原基礎題庫沒有此鍵的單碼字形。</p>'}</div></div>`;
    }
    if(selected==='rules') return `<h3>先辨認四種結構</h3><div class="structure-grid">${[['parallel','並列型','謝','言｜身｜寸','左到右，先字首，再字身。'],['vertical','上下型','哲','折／口','上到下，上部先取碼。'],['surround','外內形','區','匚〔品〕','外部先取，再看內部。'],['connected','連體形','重','筆畫相連','不硬切成左右、上下兩塊。']].map(([type,title,char,parts,desc])=>`<section><div class="structure ${type}" aria-hidden="true"><i></i><i></i>${type==='connected'?'<i></i>':''}</div><h4>${title} · ${char}</h4><b>${parts}</b><p>${desc}</p></section>`).join('')}</div><h3>碼太多時，怎樣省略？</h3><div class="table-wrap"><table class="lesson-table"><thead><tr><th>結構</th><th>取碼方法</th><th>記法</th></tr></thead><tbody><tr><td>連體字</td><td>最多四碼；超過時，取前三碼與最後一碼。</td><td>一、二、三、尾</td></tr><tr><td>字首 + 字身</td><td>字首最多取首尾兩碼；字身最多取首二尾一。</td><td>二 + 三，最多五碼</td></tr><tr><td>字身還可分</td><td>字首取首尾，次字首取首尾，最後部分取末碼。</td><td>二 + 二 + 一</td></tr></tbody></table></div><div class="lesson-principles"><section><h4>精簡</h4><p>能用較少的完整字根表示，就不拆成許多零碎筆畫。</p></section><section><h4>取大</h4><p>有不同拆法時，優先選較完整、較大的字根。</p></section><section><h4>兼顧字形</h4><p>拆出的部件須合理對應原字外形，不能只為湊碼。</p></section></div><div class="decomposition"><b>哲</b><span>折 → 首尾 QL</span><strong>口 R</strong>${codeLabel('qlr')}</div><p class="lesson-note">字根數少於上限時照實取碼，不補碼。上面的「哲」保留折的首尾與口；「區」取外框 S，再取內部 RRR。</p>`;
    if(selected==='exceptions') return `<h3>先分清楚兩種情況</h3><div class="family-grid"><section><h4>特殊字形</h4><p>一些部件有約定的整體取法，例如「門」取日弓 AN；不要只按一般筆順逐筆拆解。</p>${codeLabel('an')}</section><section><h4>難字碼 X</h4><p>有些難以用一般字根交代的部分，以 X 代替。X 是實際字碼的一部分，不是「任何字母」的萬用符號。</p>${codeLabel('hx')}</section></div><h3>把特例連成記憶</h3><div class="exception-codes">${[['臼','hx'],['齊','yx'],['鹿','ixp'],['慶','ixe'],['龜','hxu']].map(([char,code])=>`<section><b>${char}</b>${codeLabel(code)}</section>`).join('')}</div><p>練習時先觀察字形，再用提示確認難字碼的位置；答錯不會跳到下一題，可以修正後重試。</p><p class="lesson-note">本頁例字以網頁文章模式的倉頡五代字表驗證。「龜」另收 NXU。原 DOS 字表與五代的差異，仍可在「原版 DOS」對照；原始部件練習保持原答案。</p>`;
    return `<h3>基本鍵：ASDF · JKL;</h3><p>左手小指、無名指、中指、食指放在 A、S、D、F；右手食指、中指、無名指、小指放在 J、K、L、;。F、J 的凸點幫你不用看鍵盤也能定位，空白鍵由拇指按。</p><div class="finger-legend">${[['左小指','qaz'],['左無名指','wsx'],['左中指','edc'],['左食指','rfvtgb'],['右食指','yhnujm'],['右中指','ik'],['右無名指','ol'],['右小指','p']].map(([name,keys],i)=>`<span class="finger-${i}"><b>${name}</b> ${keys.toUpperCase()}</span>`).join('')}</div><div class="finger-keyboard" aria-label="指法與字根鍵盤">${['qwertyuiop','asdfghjkl','zxcvbnm'].map(row=>`<div>${[...row].map(key=>`<button type="button" data-finger-key="${key}"><small>${key.toUpperCase()}</small><b>${ROOTS[key]}</b></button>`).join('')}</div>`).join('')}</div><p id="finger-feedback" class="lesson-note" aria-live="polite">點一個鍵，查看它的字根與負責手指。</p><h3>四組口訣，先念字根，再找鍵位</h3><div class="mnemonic-board">${ROOT_GROUPS.map(group=>`<section><span>${group.name}</span><b>${[...group.keys].map(key=>ROOTS[key]).join('')}</b><code>${group.keys.toUpperCase().split('').join(' ')}</code></section>`).join('')}</div><p>每次按完回到基本鍵。手腕放鬆，眼睛看題目；先把一小組打對，再逐步增加速度。</p>`;
  }
  function quiz() {
    const {position}=state(), current=lesson(), question=current.quiz[position];
    if(!question) return `<section class="lesson-quiz completed"><span class="eyebrow">小練習完成</span><h3>這一課，你已經親手試過了。</h3><p>完成 ${current.quiz.length} 題；隨時可以回來複習。</p><button class="secondary" data-quiz-reset>重新練這一課</button></section>`;
    return `<section class="lesson-quiz"><div><span class="eyebrow">親手試一試 · ${position+1} / ${current.quiz.length}</span><h3>輸入「${question.glyph}」的${selected==='shapes'?'母字根鍵':'倉頡碼'}</h3><p>切到英文輸入法。按 Space 或 Enter 送出。</p></div><div class="quiz-target" aria-hidden="true">${question.glyph}</div><form id="lesson-quiz-form"><label class="sr-only" for="lesson-answer">入門練習答案</label><div class="quiz-entry"><input id="lesson-answer" value="${esc(draft)}" maxlength="5" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" aria-describedby="lesson-feedback"><button class="primary" type="submit">檢查答案</button></div><p id="lesson-feedback" role="status">${esc(feedback||'答錯可以再試，不用急。')}</p><button type="button" class="text-button" data-quiz-hint>${revealed?'隱藏提示':'顯示提示'}</button><p class="quiz-hint" ${revealed?'':'hidden'}>${esc(question.hint)}</p></form></section>`;
  }
  function render() {
    const index=LESSONS.findIndex(item=>item.id===selected);
    return `<div class="course-layout"><nav class="course-nav" aria-label="入門課程">${LESSONS.map((item,i)=>`<button data-course="${item.id}" ${selected===item.id?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span><b>${item.title}</b>${(progress.get(item.id)?.position||0)>=item.quiz.length?'<small>✓ 完成</small>':''}</button>`).join('')}<div class="course-source"><b>從原版走進網頁</b><p>沿用 DOS CJ 的五個入門主題，以可閱讀的文字、圖解與互動題重新編排。</p><button data-course-go="legacy">觀看完整 DOS 動畫 ↗</button></div></nav><div class="course-main"><article class="lesson-card"><header><span class="eyebrow">第 ${index+1} 課 / 共 ${LESSONS.length} 課</span><h2>${lesson().heading}</h2><p>${lesson().intro}</p></header><div class="lesson-body">${body()}</div></article>${quiz()}<div class="course-pagination"><button class="secondary" data-course-prev ${index===0?'disabled':''}>← 上一課</button><button class="primary" data-course-next>${index===LESSONS.length-1?'前往練習室':'下一課 →'}</button></div></div></div>`;
  }
  function wire(container) {
    const refresh = (focus=false) => {container.innerHTML=render();wire(container);if(focus)container.querySelector('#lesson-answer')?.focus();};
    const switchTo = id => {choose(id);changeLesson(id);refresh();container.querySelector('.lesson-card')?.scrollIntoView({block:'start'});};
    container.querySelectorAll('[data-course]').forEach(button=>button.onclick=()=>switchTo(button.dataset.course));
    container.querySelectorAll('[data-course-go]').forEach(button=>button.onclick=()=>go(button.dataset.courseGo));
    container.querySelector('[data-course-prev]').onclick=()=>switchTo(LESSONS[LESSONS.findIndex(item=>item.id===selected)-1].id);
    container.querySelector('[data-course-next]').onclick=()=>{const next=LESSONS[LESSONS.findIndex(item=>item.id===selected)+1];if(next)switchTo(next.id);else go('practice');};
    container.querySelectorAll('[data-course-root]').forEach(button=>button.onclick=()=>{root=button.dataset.courseRoot;refresh();});
    container.querySelectorAll('[data-finger-key]').forEach(button=>button.onclick=()=>{const key=button.dataset.fingerKey, name=[['qaz','左小指'],['wsx','左無名指'],['edc','左中指'],['rfvtgb','左食指'],['yhnujm','右食指'],['ik','右中指'],['ol','右無名指'],['p','右小指']].find(([keys])=>keys.includes(key))[1];container.querySelector('#finger-feedback').textContent=`${key.toUpperCase()} · ${ROOTS[key]} · ${name}`;});
    container.querySelector('[data-quiz-reset]')?.addEventListener('click',()=>{state().position=0;feedback='';refresh(true);});
    const input=container.querySelector('#lesson-answer');
    if(!input)return;
    input.oncompositionstart=()=>{composing=true;};input.oncompositionend=()=>{composing=false;input.value='';draft='';feedback='請切換英文輸入法，再輸入字母。';container.querySelector('#lesson-feedback').textContent=feedback;};
    input.oninput=()=>{if(!composing){input.value=input.value.replace(/[^a-z]/gi,'').slice(0,5);draft=input.value;}};
    container.querySelector('[data-quiz-hint]').onclick=()=>{revealed=!revealed;refresh(true);};
    const submit=()=>{if(composing||!draft.trim())return;const question=lesson().quiz[state().position];if(acceptsTutorialAnswer(question,draft)){state().position++;feedback='答對了，繼續下一題。';draft='';revealed=false;refresh(true);}else{feedback='再觀察一下字形，可以先看看提示。';container.querySelector('#lesson-feedback').textContent=feedback;input.select();}};
    input.onkeydown=event=>{if(event.isComposing||composing)return;if(event.key===' '){event.preventDefault();submit();}};
    container.querySelector('#lesson-quiz-form').onsubmit=event=>{event.preventDefault();submit();};
  }
  return {render, wire, choose, selected:()=>selected};
}
