import './styles.css';
import {
  AppState, EvidenceLevel, EvidenceMode, Objective, RecallCheck,
  emptyState, makeId, objectiveStats, validateImport, weakestObjectives, weeklyCsv,
} from './model';
import { loadState, saveState } from './storage';

type View = 'map' | 'review' | 'weak';
type ReviewPhase = 'question' | 'evidence' | 'complete';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: AppState = emptyState();
let storageFallback = false;
let view: View = 'map';
let selectedId: string | null = null;
let reviewId: string | null = null;
let reviewPhase: ReviewPhase = 'question';
let draftAnswer = '';
let analysisDays = 7;
let premium = false;
let statusTimer = 0;

const LICENSE_KEY = 'sb_license:recall-objective-map';
const VERDICT_KEY = 'sb_license_verdict:recall-objective-map';
const BILLING = 'https://api.sociobot.in/api/v1/products/recall-objective-map';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date)) : 'Not checked yet';
const capital = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function shell() {
  app.innerHTML = `
    <header class="app-header">
      <div class="brand"><span class="brand-mark" aria-hidden="true"></span><div>
        <p class="eyebrow">Your evidence field guide</p>
        <h1>Recall Objective Map</h1>
        <p class="tagline">Know what you can explain—not just what you reviewed.</p>
      </div></div>
      <div class="top-actions"><button class="button quiet" type="button" data-action="tools" aria-label="Open data and purchase settings">⚙ <span class="button-label">Data &amp; unlock</span></button></div>
    </header>
    <nav class="primary-nav" aria-label="Primary">
      <button class="nav-button" data-view="map">Objective map</button>
      <button class="nav-button" data-view="review">Recall check</button>
      <button class="nav-button" data-view="weak">Weak-skill map</button>
    </nav>
    <main id="main" tabindex="-1"><div class="loading">Opening your field notes…</div></main>
    <footer class="site-footer"><div>Private by default. Your learning records stay in this browser. Original generated field-map artwork.</div><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-recall-objective-map" rel="noreferrer">Source</a></div></footer>
    <div class="offline-flag" role="status">Offline · changes stay local</div>
    <div class="status-line" role="status" aria-live="polite"></div>
    ${objectiveDialog()}
    ${toolsDialog()}`;
}

function objectiveDialog() {
  return `<dialog id="objective-dialog" aria-labelledby="objective-dialog-title"><div class="dialog-inner">
    <div class="dialog-head"><div><p class="eyebrow">Map an outcome</p><h2 id="objective-dialog-title">Add objective</h2></div><button class="icon-button" type="button" data-close-dialog="objective-dialog" aria-label="Close objective form">×</button></div>
    <form id="objective-form">
      <input type="hidden" name="id"><input type="hidden" name="parentId">
      <div class="field"><label for="objective-title">Objective</label><input id="objective-title" name="title" type="text" required maxlength="100" aria-describedby="objective-title-help"><p id="objective-title-help" class="field-help">Use an observable verb: “Explain…”, “Solve…”, “Compare…”.</p></div>
      <div class="field"><label for="objective-description">Context <span class="muted">(optional)</span></label><textarea id="objective-description" name="description" maxlength="600"></textarea></div>
      <div class="field"><label for="objective-prompt">One recall question</label><textarea id="objective-prompt" name="prompt" required maxlength="500" aria-describedby="prompt-help"></textarea><p id="prompt-help" class="field-help">One focused question you can answer without opening your notes.</p></div>
      <div class="field"><label for="evidence-target">What would count as evidence?</label><textarea id="evidence-target" name="evidenceTarget" required maxlength="500" aria-describedby="target-help"></textarea><p id="target-help" class="field-help">Describe what a good explanation, solution, or recognition would include.</p></div>
      <div class="dialog-actions"><button class="button quiet" type="button" data-close-dialog="objective-dialog">Cancel</button><button class="button primary" type="submit">Save objective</button></div>
    </form>
  </div></dialog>`;
}

function toolsDialog() {
  return `<dialog id="tools-dialog" aria-labelledby="tools-dialog-title"><div class="dialog-inner">
    <div class="dialog-head"><div><p class="eyebrow">Ownership &amp; extras</p><h2 id="tools-dialog-title">Data &amp; unlock</h2></div><button class="icon-button" type="button" data-close-dialog="tools-dialog" aria-label="Close data settings">×</button></div>
    <div id="tools-content"></div>
  </div></dialog>`;
}

function announce(message: string) {
  const node = document.querySelector<HTMLDivElement>('.status-line');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => node.classList.remove('show'), 4200);
}

function updateOnlineStatus() {
  document.documentElement.classList.toggle('offline', !navigator.onLine);
  if (!navigator.onLine) announce('You’re offline. Reviews will keep saving on this device.');
}

async function persist(message = 'Saved on this device.') {
  try { await saveState(state, storageFallback); announce(message); }
  catch { announce('This browser blocked local storage. Export your work before leaving.'); }
}

function render() {
  const main = document.querySelector<HTMLElement>('main')!;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => {
    button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false');
  });
  main.innerHTML = view === 'map' ? renderMap() : view === 'review' ? renderReview() : renderWeakMap();
}

function pageHead(kicker: string, title: string, copy: string, action = '') {
  return `<div class="page-head"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${copy}</p></div>${action}</div>`;
}

function renderMap() {
  if (!state.objectives.length) {
    return `<section class="welcome" aria-labelledby="welcome-title">
      <div class="welcome-copy"><p class="eyebrow">Start with the outcome</p><h2 id="welcome-title">Turn a broad topic into evidence you can point to.</h2><p>Make one objective, give it one recall question, then record whether you could explain, solve, or recognize the idea without your notes.</p>
      <ul class="principles"><li><strong>State it</strong>Write an observable objective.</li><li><strong>Check it</strong>Answer one focused prompt.</li><li><strong>See it</strong>Find the thinnest evidence next.</li></ul>
      <button class="button primary" type="button" data-action="new-objective">Add your first objective</button></div>
      <img class="hero-print" src="/assets/field-map.webp" width="1200" height="800" alt="A halftone paper map branching toward explanation, problem-solving, and recognition symbols" fetchpriority="high" decoding="async">
    </section>`;
  }
  if (!selectedId || !state.objectives.some(item => item.id === selectedId)) selectedId = state.objectives[0].id;
  const selected = state.objectives.find(item => item.id === selectedId)!;
  const stats = objectiveStats(state).find(item => item.objective.id === selected.id)!;
  return `${pageHead('The whole terrain', 'Objective map', 'Each branch holds a recall prompt and the evidence you record against it.', '<button class="button primary" data-action="new-objective">Add objective</button>')}
    <div class="workbench"><section class="map-pane" aria-labelledby="tree-title"><div class="pane-head"><h3 id="tree-title">Objectives</h3><span class="muted">${state.objectives.length} mapped</span></div><ul class="tree">${renderTree(null)}</ul></section>
    <section class="detail-pane" aria-labelledby="detail-title"><div class="pane-head"><span class="stamp ${stats.band}">${stats.band} evidence</span><span class="muted">${stats.checks.length} ${stats.checks.length === 1 ? 'check' : 'checks'}</span></div>
      <h2 id="detail-title">${escapeHtml(selected.title)}</h2>${selected.description ? `<p class="detail-description">${escapeHtml(selected.description)}</p>` : ''}
      <div class="question-block"><p class="eyebrow">Recall question</p><p>${escapeHtml(selected.prompt)}</p></div>
      <div class="detail-actions"><button class="button primary" data-action="review-objective" data-id="${selected.id}">Check recall</button><button class="button" data-action="add-child" data-id="${selected.id}">Add sub-objective</button><button class="button quiet" data-action="edit-objective" data-id="${selected.id}">Edit</button><button class="button quiet" data-action="delete-objective" data-id="${selected.id}">Delete</button></div>
      ${renderHistory(stats.checks)}
    </section></div>`;
}

function renderTree(parentId: string | null): string {
  return state.objectives.filter(item => item.parentId === parentId).map(item => {
    const stats = objectiveStats(state).find(entry => entry.objective.id === item.id)!;
    const children = state.objectives.filter(child => child.parentId === item.id);
    return `<li class="tree-node"><button class="objective-select" data-action="select-objective" data-id="${item.id}" aria-pressed="${item.id === selectedId}"><strong>${escapeHtml(item.title)}</strong><span>${capital(stats.band)} · ${stats.checks.length} checks</span></button>${children.length ? `<ul>${renderTree(item.id)}</ul>` : ''}</li>`;
  }).join('');
}

function renderHistory(checks: RecallCheck[]) {
  if (!checks.length) return `<div class="history"><h3>Evidence ledger</h3><p class="muted">No checks yet. Try the prompt once; an honest “thin” result is useful evidence.</p></div>`;
  return `<div class="history"><h3>Evidence ledger</h3><ul class="history-list">${checks.slice(0, 8).map(check => `<li class="history-item"><span class="stamp ${check.level}">${check.mode}</span><div><p><strong>${capital(check.level)}</strong> · ${formatDate(check.checkedAt)}</p>${check.note ? `<p>${escapeHtml(check.note)}</p>` : ''}<p class="history-meta">Answer recorded: ${escapeHtml(check.answer.slice(0, 120))}${check.answer.length > 120 ? '…' : ''}</p></div></li>`).join('')}</ul></div>`;
}

function currentReviewObjective() {
  if (reviewId && state.objectives.some(item => item.id === reviewId)) return state.objectives.find(item => item.id === reviewId)!;
  const weakest = weakestObjectives(state)[0]?.objective ?? null;
  reviewId = weakest?.id ?? null;
  return weakest;
}

function renderReview() {
  if (!state.objectives.length) return `${pageHead('One question at a time', 'Recall check', 'A check needs an objective first.')}<div class="notice"><p><strong>Your review queue is empty.</strong></p><p>Map one objective and its recall question to begin.</p><button class="button primary" data-action="new-objective">Add objective</button></div>`;
  const objective = currentReviewObjective()!;
  if (reviewPhase === 'complete') return `${pageHead('Evidence recorded', 'Check complete', 'Your map has already been re-ranked.')}<div class="review-sheet"><p class="eyebrow">Next field note</p><h2>${escapeHtml(objective.title)}</h2><p>Your check is attached to this objective—not stranded in a card browser.</p><div class="review-actions"><button class="button" data-view="weak">See weak-skill map</button><button class="button primary" data-action="next-review">Check the next objective</button></div></div>`;
  if (reviewPhase === 'question') return `${pageHead('One question at a time', 'Recall check', 'Answer from memory. Your response stays private on this device.')}<section class="review-sheet" aria-labelledby="review-prompt"><div class="specimen"><span>${escapeHtml(objective.title)}</span><span>${formatDate(new Date().toISOString())}</span></div><form id="attempt-form"><h2 class="prompt" id="review-prompt">${escapeHtml(objective.prompt)}</h2><div class="field"><label for="recall-answer">Your answer from memory</label><textarea id="recall-answer" name="answer" required maxlength="4000" autofocus aria-describedby="answer-help"></textarea><p id="answer-help" class="field-help">Write enough to judge the attempt. This is not graded automatically.</p></div><div class="review-actions"><button class="button quiet" type="button" data-view="map">Leave check</button><button class="button primary" type="submit">Reveal evidence guide</button></div></form></section>`;
  return `${pageHead('Judge the evidence, not yourself', 'Record what happened', 'Choose the kind of evidence you attempted and how well this attempt supported it.')}<section class="review-sheet" aria-labelledby="evidence-title"><div class="specimen"><span>${escapeHtml(objective.title)}</span><span>Self-recorded evidence</span></div><h2 id="evidence-title">What did this attempt show?</h2><div class="answer-draft"><strong>Your answer</strong><br>${escapeHtml(draftAnswer)}</div><div class="evidence-guide"><strong>Evidence target</strong><br>${escapeHtml(objective.evidenceTarget)}</div>
    <form id="evidence-form"><fieldset><legend>Evidence type</legend><div class="choice-grid">${choiceRadios('mode', [['explain','Explain'],['solve','Solve'],['recognize','Recognize']])}</div></fieldset><fieldset><legend>Strength of this attempt</legend><div class="choice-grid">${choiceRadios('level', [['thin','Thin'],['building','Building'],['supported','Supported']])}</div><p class="field-help">This describes one attempt. It is not a mastery score.</p></fieldset><div class="field"><label for="evidence-note">Evidence note <span class="muted">(optional)</span></label><textarea id="evidence-note" name="note" maxlength="600" placeholder="What held up? What broke down?"></textarea></div><div class="review-actions"><button class="button quiet" type="button" data-action="back-to-answer">Edit answer</button><button class="button primary" type="submit">Attach evidence</button></div></form></section>`;
}

function choiceRadios(name: string, options: string[][]) {
  return options.map(([value, label], index) => `<div class="choice"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${index === 0 ? 'required' : ''}><label for="${name}-${value}">${label}</label></div>`).join('');
}

function renderWeakMap() {
  if (!state.objectives.length) return `${pageHead('A weekly reading', 'Weak-skill map', 'The map becomes useful after you add an objective.')}<div class="notice"><p><strong>No skills to compare yet.</strong></p><button class="button primary" data-action="new-objective">Add objective</button></div>`;
  const stats = weakestObjectives(state, analysisDays);
  const top = stats.slice(0, 2);
  const lens = analysisDays === 7 ? 'This week' : `Last ${analysisDays} days`;
  return `${pageHead('A map, not a mark', 'Weak-skill map', `Evidence from ${lens.toLowerCase()} ranks where another recall check would be most useful. It does not measure mastery.`, '<button class="button primary" data-action="review-weakest">Check weakest objective</button>')}
    <div class="weak-intro">${top.map((item, index) => `<article class="weak-callout"><p class="rank">${index === 0 ? 'Thinnest evidence' : 'Next thinnest'}</p><h3>${escapeHtml(item.objective.title)}</h3><p>${weakReason(item)}</p><button class="button small" data-action="review-objective" data-id="${item.objective.id}">Check recall</button></article>`).join('')}</div>
    <div class="pane-head"><h3>Evidence ledger · ${lens}</h3>${premium ? `<label for="analysis-window">Evidence window <select id="analysis-window" data-action="analysis-window"><option value="7" ${analysisDays === 7 ? 'selected' : ''}>7 days</option><option value="14" ${analysisDays === 14 ? 'selected' : ''}>14 days</option><option value="30" ${analysisDays === 30 ? 'selected' : ''}>30 days</option></select></label>` : '<span class="stamp">7-day lens</span>'}</div>
    <div role="region" aria-label="Objective evidence table" tabindex="0"><table class="weak-table"><thead><tr><th>Objective</th><th>Evidence</th><th>Checks</th><th>Missing modes</th><th>Last check</th></tr></thead><tbody>${stats.map(item => `<tr><td data-label="Objective"><strong>${escapeHtml(item.objective.title)}</strong></td><td data-label="Evidence"><span class="stamp ${item.band}">${item.band}</span></td><td data-label="Checks">${item.windowChecks.length}</td><td data-label="Missing"><div class="mode-tags">${item.missingModes.length ? item.missingModes.map(mode => `<span class="mode-tag">${mode}</span>`).join('') : 'All represented'}</div></td><td data-label="Last check">${formatDate(item.lastChecked)}</td></tr>`).join('')}</tbody></table></div>
    <div class="export-actions"><button class="button" data-action="export-csv">Export weak map (CSV)</button>${premium ? '<button class="button" data-action="print-report">Print field report</button>' : '<button class="button quiet" data-action="tools">Unlock printable report + longer lenses</button>'}</div>`;
}

function weakReason(item: ReturnType<typeof weakestObjectives>[number]) {
  if (!item.checks.length) return 'No recall evidence has been attached yet.';
  if (!item.windowChecks.length) return 'No recall check falls inside this evidence window.';
  if (item.missingModes.length) return `Missing ${item.missingModes.map(capital).join(', ')} evidence in this window.`;
  return `Recent attempts are currently marked ${item.band}.`;
}

function openObjectiveDialog(id?: string, parentId?: string) {
  const dialog = document.querySelector<HTMLDialogElement>('#objective-dialog')!;
  const form = document.querySelector<HTMLFormElement>('#objective-form')!;
  form.reset();
  const objective = id ? state.objectives.find(item => item.id === id) : undefined;
  (form.elements.namedItem('id') as HTMLInputElement).value = objective?.id ?? '';
  (form.elements.namedItem('parentId') as HTMLInputElement).value = objective?.parentId ?? parentId ?? '';
  (form.elements.namedItem('title') as HTMLInputElement).value = objective?.title ?? '';
  (form.elements.namedItem('description') as HTMLTextAreaElement).value = objective?.description ?? '';
  (form.elements.namedItem('prompt') as HTMLTextAreaElement).value = objective?.prompt ?? '';
  (form.elements.namedItem('evidenceTarget') as HTMLTextAreaElement).value = objective?.evidenceTarget ?? '';
  dialog.querySelector('h2')!.textContent = objective ? 'Edit objective' : parentId ? 'Add sub-objective' : 'Add objective';
  dialog.showModal();
  (form.elements.namedItem('title') as HTMLInputElement).focus();
}

function renderTools() {
  const content = document.querySelector<HTMLDivElement>('#tools-content')!;
  content.innerHTML = `<section class="tools-section"><h3>Your data</h3><p>Stored only in this browser${storageFallback ? ' using localStorage fallback mode' : ' using IndexedDB'}. Export a backup whenever you like.</p><div class="export-actions"><button class="button" data-action="export-json">Export all data (JSON)</button><button class="button" data-action="import-json">Import JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></section>
    <section class="tools-section"><h3>${premium ? 'Field kit unlocked' : 'Optional field kit · $9 once'}</h3>${premium ? `<div class="premium-note"><strong>License active on this device.</strong><p>You have printable field reports and 7/14/30-day evidence lenses. Core review and all exports remain available to everyone.</p></div>` : `<p>The free map includes unlimited objectives, recall checks, the weekly weak map, and every export. A one-time $9 purchase adds print-ready field reports and 14/30-day evidence lenses. No subscription.</p><a class="button primary" href="${BILLING}/checkout">Buy the field kit</a><form id="license-form"><div class="field"><label for="license-token">Have a license?</label><input id="license-token" name="license" type="text" autocomplete="off" required><p class="field-help">Paste the token from your receipt to restore on this device.</p></div><button class="button" type="submit">Verify license</button></form>`}<p class="field-help">Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license. See <a href="/terms/">terms</a> and <a href="/privacy/">privacy</a>.</p></section>`;
}

function openTools() {
  renderTools();
  document.querySelector<HTMLDialogElement>('#tools-dialog')!.showModal();
}

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function verifyLicense(token: string, force = false) {
  const cachedRaw = localStorage.getItem(VERDICT_KEY);
  const cached = cachedRaw ? JSON.parse(cachedRaw) as { valid: boolean; checkedAt: number } : null;
  if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) { premium = cached.valid; return; }
  try {
    const response = await fetch(`${BILLING}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verification unavailable');
    const result = await response.json() as { valid: boolean };
    premium = result.valid;
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    announce(result.valid ? 'Field kit unlocked.' : 'That license is no longer active.');
  } catch {
    if (cached?.valid) premium = true;
    announce('License verification is unavailable. The free map still works offline.');
  }
}

app.addEventListener('click', async event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-view], [data-close-dialog]');
  if (!target) return;
  if (target.dataset.closeDialog) { document.querySelector<HTMLDialogElement>(`#${target.dataset.closeDialog}`)?.close(); return; }
  if (target.dataset.view) { view = target.dataset.view as View; if (view === 'review') reviewPhase = 'question'; render(); document.querySelector('main')?.focus(); return; }
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'new-objective') openObjectiveDialog();
  if (action === 'add-child') openObjectiveDialog(undefined, id);
  if (action === 'edit-objective') openObjectiveDialog(id);
  if (action === 'select-objective') { selectedId = id!; render(); }
  if (action === 'review-objective') { reviewId = id!; reviewPhase = 'question'; view = 'review'; render(); document.querySelector('main')?.focus(); }
  if (action === 'review-weakest') { reviewId = weakestObjectives(state, analysisDays)[0]?.objective.id ?? null; reviewPhase = 'question'; view = 'review'; render(); }
  if (action === 'next-review') { reviewId = weakestObjectives(state, analysisDays).find(item => item.objective.id !== reviewId)?.objective.id ?? reviewId; reviewPhase = 'question'; render(); }
  if (action === 'back-to-answer') { reviewPhase = 'question'; render(); requestAnimationFrame(() => { const answer = document.querySelector<HTMLTextAreaElement>('#recall-answer'); if (answer) { answer.value = draftAnswer; answer.focus(); } }); }
  if (action === 'delete-objective') await deleteObjective(id!);
  if (action === 'tools') openTools();
  if (action === 'export-json') { download(`recall-map-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2), 'application/json'); announce('Full backup exported.'); }
  if (action === 'export-csv') { download(`weak-skill-map-${new Date().toISOString().slice(0,10)}.csv`, weeklyCsv(state, analysisDays), 'text/csv'); announce('Weak-skill CSV exported.'); }
  if (action === 'import-json') document.querySelector<HTMLInputElement>('#import-file')?.click();
  if (action === 'print-report') window.print();
});

app.addEventListener('change', event => {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  if (input.id === 'analysis-window') { analysisDays = Number(input.value); render(); }
  if (input.id === 'import-file' && input instanceof HTMLInputElement) void importFile(input);
});

app.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const data = new FormData(form);
  const formId = form.getAttribute('id');
  if (formId === 'objective-form') {
    const id = String(data.get('id') || '');
    const existing = state.objectives.find(item => item.id === id);
    const now = new Date().toISOString();
    const objective: Objective = { id: existing?.id ?? makeId(), title: String(data.get('title')).trim(), description: String(data.get('description')).trim(), parentId: String(data.get('parentId') || '') || null, prompt: String(data.get('prompt')).trim(), evidenceTarget: String(data.get('evidenceTarget')).trim(), createdAt: existing?.createdAt ?? now, updatedAt: now };
    if (existing) state.objectives = state.objectives.map(item => item.id === id ? objective : item); else state.objectives.push(objective);
    selectedId = objective.id; document.querySelector<HTMLDialogElement>('#objective-dialog')!.close(); await persist(existing ? 'Objective updated.' : 'Objective mapped.'); render();
  }
  if (formId === 'attempt-form') { draftAnswer = String(data.get('answer')).trim(); reviewPhase = 'evidence'; render(); document.querySelector('main')?.focus(); }
  if (formId === 'evidence-form') {
    const objective = currentReviewObjective()!;
    state.checks.push({ id: makeId(), objectiveId: objective.id, prompt: objective.prompt, answer: draftAnswer, mode: String(data.get('mode')) as EvidenceMode, level: String(data.get('level')) as EvidenceLevel, note: String(data.get('note')).trim(), checkedAt: new Date().toISOString() });
    await persist('Evidence attached to the objective.'); reviewPhase = 'complete'; render();
  }
  if (formId === 'license-form') {
    const token = String(data.get('license')).trim(); localStorage.setItem(LICENSE_KEY, token); await verifyLicense(token, true); renderTools(); render();
  }
});

async function deleteObjective(id: string) {
  const collect = (parent: string): string[] => [parent, ...state.objectives.filter(item => item.parentId === parent).flatMap(item => collect(item.id))];
  const ids = collect(id); const item = state.objectives.find(entry => entry.id === id)!;
  const checkCount = state.checks.filter(check => ids.includes(check.objectiveId)).length;
  if (!confirm(`Delete “${item.title}”, ${ids.length - 1} sub-objective(s), and ${checkCount} attached check(s)? This cannot be undone.`)) return;
  state.objectives = state.objectives.filter(entry => !ids.includes(entry.id)); state.checks = state.checks.filter(check => !ids.includes(check.objectiveId)); selectedId = state.objectives[0]?.id ?? null; await persist('Objective and its attached evidence deleted.'); render();
}

async function importFile(input: HTMLInputElement) {
  const file = input.files?.[0]; if (!file) return;
  try {
    const imported = validateImport(JSON.parse(await file.text()));
    if (!confirm(`Replace this map with ${imported.objectives.length} objective(s) and ${imported.checks.length} recall check(s) from “${file.name}”?`)) return;
    state = imported; selectedId = state.objectives[0]?.id ?? null; await persist('Backup imported.'); document.querySelector<HTMLDialogElement>('#tools-dialog')?.close(); render();
  } catch (error) { announce(error instanceof Error ? error.message : 'That backup could not be imported.'); }
  finally { input.value = ''; }
}

async function start() {
  shell(); updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus); window.addEventListener('offline', updateOnlineStatus);
  const query = new URLSearchParams(location.search); const returnedLicense = query.get('license');
  if (returnedLicense) { localStorage.setItem(LICENSE_KEY, returnedLicense); query.delete('license'); history.replaceState({}, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`); }
  const savedVerdict = localStorage.getItem(VERDICT_KEY); if (savedVerdict) premium = Boolean(JSON.parse(savedVerdict).valid);
  const token = returnedLicense ?? localStorage.getItem(LICENSE_KEY); if (token) void verifyLicense(token, Boolean(returnedLicense)).then(render);
  try { const loaded = await loadState(); state = loaded.state; storageFallback = loaded.fallback; selectedId = state.objectives[0]?.id ?? null; render(); if (storageFallback) announce('IndexedDB is unavailable; using a local browser fallback.'); }
  catch { state = emptyState(); storageFallback = true; render(); announce('Local records could not be opened. A fresh fallback map is ready.'); }
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) announce('An app update is ready. Reload when convenient.'); }); });
    } catch { announce('Offline installation is unavailable in this browser.'); }
  }
}

void start();
