'use strict';
emulators.pathPrefix = './vendor/';
let dos, ci, pageActive = true;
if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('embedded');
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'happycj:visibility') return;
  pageActive = event.data.active === true;
  if (ci) pageActive ? ci.resume() : ci.pause();
});
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
function log(message) { logEl.textContent = (logEl.textContent + '\n' + message).split('\n').slice(-100).join('\n'); }
document.getElementById('start').onclick = async () => {
  const button = document.getElementById('start');
  const mode = document.getElementById('launch').value;
  button.disabled = true;
  statusEl.textContent = '正在啟動 DOSBox…';
  try {
    if (!dos) {
      document.getElementById('welcome').remove();
      // Direct framebuffer access avoids old worker partial-frame issues.
      dos = Dos(document.getElementById('dos'), {clickToStart:false, emulatorFunction:"dosboxDirect"});
    }
    ci = await dos.run('./' + mode + '.jsdos?v=6');
    if (!pageActive) ci.pause();
    ci.events().onStdout(message => log(message));
    ci.events().onMessage((type, ...args) => { if (type === 'error' || type === 'warn') log(type + ': ' + args.join(' ')); });
    statusEl.textContent = '模擬器執行中。點 DOS 畫面以使用鍵盤。';
    document.getElementById('save').disabled = false;
    document.getElementById('fullscreen').disabled = false;
    document.querySelectorAll('[data-key]').forEach(b => b.disabled = false);
    button.textContent = '重新啟動';
    document.getElementById('dos').focus();
  } catch (error) {
    log(String(error));
    statusEl.textContent = '啟動失敗，請展開下方診斷資訊。';
  } finally { button.disabled = false; }
};
document.getElementById('save').onclick = async () => {
  try { await dos.layers.save(); statusEl.textContent = '模擬磁碟已儲存至這個瀏覽器。'; }
  catch(error) { log(String(error)); statusEl.textContent = '儲存失敗，請查看診斷資訊。'; }
};
document.getElementById('fullscreen').onclick = () => document.getElementById('dos').requestFullscreen().catch(error => log(String(error)));
document.querySelectorAll('[data-key]').forEach(button => {
  button.onpointerdown = event => event.preventDefault();
  button.onclick = () => { if(ci) { ci.simulateKeyPress(Number(button.dataset.key)); document.getElementById('dos').focus(); } };
});
