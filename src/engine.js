export const ROOTS = Object.fromEntries([... '日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重'].map((root, i) => [String.fromCharCode(97 + i), root]));

export function indexes(entries) {
  const byCode = new Map(), byChar = new Map();
  for (const [char, code] of entries) {
    if (!byCode.has(code)) byCode.set(code, []);
    if (!byCode.get(code).includes(char)) byCode.get(code).push(char);
    if (!byChar.has(char)) byChar.set(char, []);
    if (!byChar.get(char).includes(code)) byChar.get(char).push(code);
  }
  return { byCode, byChar };
}

export function targetsFor(mode, item) {
  return mode === 'article' ? [...item.text].filter(c => !/\s/u.test(c)) : item;
}

export function isCorrect(mode, target, value) {
  return mode === 'article' ? target === value : target.answer_raw.trim().toLowerCase() === value.trim().toLowerCase();
}

export function stats(correct, attempts, elapsedMs) {
  return { accuracy: attempts ? Math.round(correct / attempts * 100) : 100,
    cpm: elapsedMs >= 1000 ? Math.round(correct / (elapsedMs / 60000)) : 0,
    seconds: Math.floor(elapsedMs / 1000) };
}

export function makeSession(mode, targets, title, now = Date.now()) {
  return { mode, targets, title, position: 0, attempts: 0, correct: 0, errors: 0,
    elapsedMs: 0, lastTick: null, startedAt: now, paused: false, complete: false };
}

export function attempt(session, value) {
  if (session.complete || session.paused) return { accepted: false, ignored: true };
  session.attempts++;
  const accepted = isCorrect(session.mode, session.targets[session.position], value);
  if (accepted) {
    session.correct++;
    session.position++;
    session.complete = session.position === session.targets.length;
  } else session.errors++;
  return { accepted, complete: session.complete };
}

export function tick(session, now) {
  if (session.lastTick !== null && !session.paused && !session.complete) session.elapsedMs += Math.max(0, now - session.lastTick);
  session.lastTick = session.paused || session.complete ? null : now;
}

export function readHistory(storage) {
  try {
    const data = JSON.parse(storage.getItem('happycj.history.v1') || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(r => r && typeof r.id === 'string' && typeof r.title === 'string'
      && Number.isFinite(r.correct) && r.correct >= 0 && Number.isFinite(r.attempts)
      && r.attempts >= r.correct && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0
      && typeof r.date === 'string' && !Number.isNaN(Date.parse(r.date))).slice(0, 500);
  } catch { return []; }
}
