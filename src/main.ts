import './styles.css';
import {
  AppState, EvidenceLevel, EvidenceMode, Objective, RecallCheck,
  emptyState, makeId, objectiveStats, validateImport, weakestObjectives, weeklyCsv,
} from './model';
import { sampleState } from './sample';
import { loadState, saveState, StorageSpace } from './storage';

type View = 'map' | 'review' | 'weak';
type ReviewPhase = 'question' | 'evidence' | 'complete';
type Route = 'landing' | 'map' | 'demo' | 'privacy' | 'terms' | 'notfound';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: AppState = emptyState();
let storageFallback = false;
let storageSpace: StorageSpace = 'real';
let route: Route = 'landing';
let view: View = 'map';
let selectedId: string | null = null;
let reviewId: string | null = null;
let reviewPhase: ReviewPhase = 'question';
let draftAnswer = '';
let analysisDays = 7;
let statusTimer = 0;

const BUILD_ID = '1.1.0';
const SITE_URL = 'https://recall-objective-map.sociobot.in';
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date)) : 'Not checked yet';
const capital = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const currentPath = () => location.pathname.replace(/\/+$/, '') || '/';

function routeFromPath(path: string): Route {
  if (path === '/') return 'landing';
  if (path === '/map') return 'map';
  if (path === '/demo') return 'demo';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return 'notfound';
}

const routeDetails: Record<Route, { title: string; description: string; canonical: string }> = {
  landing: { title: 'Recall Objective Map — map recall to objectives', description: 'Tie recall checks to learning objectives and find the two objectives with the thinnest recent evidence.', canonical: '/' },
  map: { title: 'Objective map — Recall Objective Map', description: 'Create objectives, answer recall questions, and record your evidence on this device.', canonical: '/map' },
  demo: { title: 'Demo — Recall Objective Map', description: 'Try a filled objective map with isolated sample data that you can reset.', canonical: '/demo' },
  privacy: { title: 'Privacy — Recall Objective Map', description: 'How Recall Objective Map stores learning records and handles network access.', canonical: '/privacy' },
  terms: { title: 'Terms — Recall Objective Map', description: 'Terms for using Recall Objective Map and its self-recorded evidence labels.', canonical: '/terms' },
  notfound: { title: 'Page not found — Recall Objective Map', description: 'The requested Recall Objective Map page was not found.', canonical: '/404.html' },
};

function setMetadata() {
  const details = routeDetails[route];
  document.title = details.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', details.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', details.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', details.description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', details.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', details.description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${SITE_URL}${details.canonical}`);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `${SITE_URL}${details.canonical}`);
}

function header() {
  return `<header class="site-header">
    <a class="wordmark" href="/" data-route><span class="brand-mark" aria-hidden="true"></span><span>Recall Objective Map</span></a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/demo" data-route${route === 'demo' ? ' aria-current="page"' : ''}>Demo</a>
      <a href="/map" data-route${route === 'map' ? ' aria-current="page"' : ''}>My map</a>
      <a href="/privacy" data-route${route === 'privacy' ? ' aria-current="page"' : ''}>Privacy</a>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="site-footer"><p>Link recall checks to objectives and review recent evidence.</p><nav class="footer-links" aria-label="Footer"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><a href="https://github.com/B-Divyesh/sf-recall-objective-map" rel="noreferrer">Source (external)</a><a href="https://www.sociobot.in/">Param Factory (external)</a></nav><p class="build-id">Version ${BUILD_ID} · Generated artwork</p></footer>`;
}

function demoBanner() {
  if (route !== 'demo') return '';
  return `<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved to your map</strong><div><button class="text-button" type="button" data-action="reset-demo">Reset demo</button><button class="text-button" type="button" data-action="start-real">Start for real</button></div></aside>`;
}

function shell(main: string, includeDialogs = false) {
  app.innerHTML = `${header()}${demoBanner()}<main id="main" tabindex="-1">${main}</main>${footer()}
    <div class="offline-flag" role="status">Offline · changes stay on this device</div>
    <div class="status-line" role="status" aria-live="polite"></div>
    <div class="route-status" aria-live="polite" aria-atomic="true"></div>
    ${includeDialogs ? `${objectiveDialog()}${toolsDialog()}` : ''}`;
  updateOnlineStatus(false);
}

function renderLanding() {
  return `<section class="landing-hero" aria-labelledby="landing-title">
      <div class="landing-copy"><p class="eyebrow">Recall evidence by objective</p><h1 id="landing-title" tabindex="-1">Map recall checks to learning objectives</h1><p class="audience">For self-learners starting broad topics who need to see which objectives lack recent evidence.</p>
      <div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data</a><span>Opens a filled map you can reset.</span><a class="button quiet" href="/map" data-route>Start your own map</a></div>
      <ul class="plain-facts"><li>Works offline after the first load.</li><li>Records stay in this browser.</li><li>Free to use. No account.</li></ul></div>
      <picture><source type="image/avif" srcset="/assets/field-map-720.avif 720w, /assets/field-map.avif 1200w" sizes="(max-width: 760px) calc(100vw - 32px), 50vw"><source type="image/webp" srcset="/assets/field-map-720.webp 720w, /assets/field-map.webp 1200w" sizes="(max-width: 760px) calc(100vw - 32px), 50vw"><img class="hero-print" src="/assets/field-map.jpg" width="1200" height="800" alt="Paper branches connect three symbols for explaining, solving, and recognizing" fetchpriority="high" decoding="async"></picture>
    </section>
    <section class="product-preview" aria-labelledby="preview-title"><div><p class="eyebrow">Filled map preview</p><h2 id="preview-title">See what needs another recall check</h2><p>The sample connects each question and answer to a stated learning objective.</p></div><div class="preview-sheet"><p><strong>Explain why planets stay in orbit</strong><span class="stamp building">Building</span></p><ul><li>Solve circular orbit speed <span>Supported</span></li><li>Compare orbital energy changes <span>Thin</span></li></ul><p class="preview-next">Next check: Compare orbital energy changes</p></div></section>
    <section class="how-section" aria-labelledby="how-title"><p class="eyebrow">Three steps</p><h2 id="how-title">How it works</h2><ol class="step-list"><li><strong>Write an objective.</strong><span>Add one question and describe useful evidence.</span></li><li><strong>Answer from memory.</strong><span>Record whether you explained, solved, or recognized it.</span></li><li><strong>Review the weak map.</strong><span>See the two objectives with the thinnest recent evidence.</span></li></ol></section>
    <section class="limits-section" aria-labelledby="limits-title"><div><p class="eyebrow">Limits and privacy</p><h2 id="limits-title">You judge your own evidence</h2></div><div><p>The app does not grade mastery, generate lessons, or schedule cards.</p><p>Your objectives, answers, and notes stay in local browser storage. JSON and CSV exports let you keep copies.</p><p><a href="/privacy" data-route>Read the privacy details</a></p></div></section>`;
}

function renderPrivacy() {
  return `<article class="legal"><p class="eyebrow">Effective 5 September 2026</p><h1 tabindex="-1">Privacy</h1><p>Recall Objective Map stores objectives, recall answers, and evidence notes in this browser. The main store is IndexedDB. A localStorage fallback is used only when IndexedDB is unavailable.</p><h2>Data you control</h2><p>You can export all learning records as JSON and the weak-objective report as CSV. Import shows what will replace the current map and waits for confirmation.</p><p>Removing this site’s browser data erases your records. Keep a JSON export if you need a backup.</p><h2>Demo data</h2><p>The demo uses a separate IndexedDB database and a separate fallback key. Demo changes do not read or write your real map.</p><h2>Network use</h2><p>The app has no analytics, advertising, account system, third-party fonts, or tracking scripts. Normal use sends no learning records to a server.</p><h2>Contact</h2><p>Questions can be raised through the <a href="https://github.com/B-Divyesh/sf-recall-objective-map">public source repository</a>.</p></article>`;
}

function renderTerms() {
  return `<article class="legal"><p class="eyebrow">Effective 5 September 2026</p><h1 tabindex="-1">Terms</h1><p>Recall Objective Map is a personal learning utility. Its evidence labels describe your own recorded attempts. They do not measure mastery, ability, or educational attainment.</p><h2>Use and availability</h2><p>You are responsible for your learning records and exports. The app is provided “as is” under the MIT License.</p><p>Browser storage can be cleared or corrupted. Export a JSON backup when the records matter to you.</p><h2>Fair use</h2><p>Do not interfere with the site or use the product unlawfully. These terms may change for future versions, with a new effective date.</p><h2>Software and artwork</h2><p>The application source is available under the MIT License. The generated artwork is original to this product and may be used as shipped with the application.</p></article>`;
}

function renderNotFound() {
  return `<section class="not-found"><p class="error-code">404</p><h1 tabindex="-1">Page not found</h1><p>The address does not match a page in Recall Objective Map.</p><a class="button primary" href="/" data-route>Return home</a></section>`;
}

function appFrame() {
  const modeCopy = route === 'demo' ? 'Use the sample to inspect the full flow.' : 'Add an objective, answer from memory, and record the evidence.';
  return `<section class="app-title"><p class="eyebrow">Objective-based recall</p><h1 tabindex="-1">Review recall against your objectives</h1><p>${modeCopy}</p></section>
    <nav class="workspace-nav" aria-label="Map sections"><button class="nav-button" type="button" data-view="map">Objective map</button><button class="nav-button" type="button" data-view="review">Recall check</button><button class="nav-button" type="button" data-view="weak">Weak-objective map</button><button class="nav-button tools-button" type="button" data-action="tools">Data tools</button></nav>
    <div id="workspace"><div class="loading">Opening your objective map…</div></div>`;
}

function objectiveDialog() {
  return `<dialog id="objective-dialog" aria-labelledby="objective-dialog-title"><div class="dialog-inner">
    <div class="dialog-head"><div><p class="eyebrow">Objective details</p><h2 id="objective-dialog-title">Add objective</h2></div><button class="icon-button" type="button" data-close-dialog="objective-dialog" aria-label="Close objective form">×</button></div>
    <form id="objective-form" novalidate>
      <input type="hidden" name="id"><input type="hidden" name="parentId"><p id="objective-form-error" class="form-error" role="alert"></p>
      <div class="field"><label for="objective-title">Objective</label><input id="objective-title" name="title" type="text" required maxlength="100" aria-describedby="objective-title-help objective-form-error"><p id="objective-title-help" class="field-help">Start with an observable verb, such as Explain, Solve, or Compare.</p></div>
      <div class="field"><label for="objective-description">Context <span class="muted">(optional)</span></label><textarea id="objective-description" name="description" maxlength="600"></textarea></div>
      <div class="field"><label for="objective-prompt">One recall question</label><textarea id="objective-prompt" name="prompt" required maxlength="500" aria-describedby="prompt-help objective-form-error"></textarea><p id="prompt-help" class="field-help">Write one question you can answer without opening your notes.</p></div>
      <div class="field"><label for="evidence-target">What would count as evidence?</label><textarea id="evidence-target" name="evidenceTarget" required maxlength="500" aria-describedby="target-help objective-form-error"></textarea><p id="target-help" class="field-help">Describe what a useful explanation, solution, or recognition would include.</p></div>
      <div class="dialog-actions"><button class="button quiet" type="button" data-close-dialog="objective-dialog">Cancel</button><button class="button primary" type="submit">Save objective</button></div>
    </form>
  </div></dialog>`;
}

function toolsDialog() {
  return `<dialog id="tools-dialog" aria-labelledby="tools-dialog-title"><div class="dialog-inner">
    <div class="dialog-head"><div><p class="eyebrow">Local files</p><h2 id="tools-dialog-title">Data tools</h2></div><button class="icon-button" type="button" data-close-dialog="tools-dialog" aria-label="Close data tools">×</button></div>
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

function updateOnlineStatus(shouldAnnounce = true) {
  document.documentElement.classList.toggle('offline', !navigator.onLine);
  if (shouldAnnounce && !navigator.onLine) announce('You are offline. Changes will keep saving on this device.');
}

async function persist(message = 'Saved on this device.') {
  try { await saveState(state, storageFallback, storageSpace); announce(message); }
  catch { announce('This browser blocked local storage. Export your work before leaving.'); }
}

function render() {
  const workspace = document.querySelector<HTMLElement>('#workspace');
  if (!workspace) return;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false'));
  workspace.innerHTML = view === 'map' ? renderMap() : view === 'review' ? renderReview() : renderWeakMap();
}

function pageHead(label: string, title: string, copy: string, action = '') {
  return `<div class="page-head"><div><p class="eyebrow">${label}</p><h2>${title}</h2><p>${copy}</p></div>${action}</div>`;
}

function renderMap() {
  if (!state.objectives.length) {
    return `<section class="empty-state" aria-labelledby="empty-title"><div><p class="eyebrow">No objectives yet</p><h2 id="empty-title">Add your first learning objective</h2><p>Give it one recall question and describe what useful evidence would include.</p><button class="button primary" type="button" data-action="new-objective">Add your first objective</button></div><img class="empty-print" src="/assets/field-map-720.webp" width="720" height="480" alt="Paper branches connect three recall evidence symbols" decoding="async"></section>`;
  }
  if (!selectedId || !state.objectives.some(item => item.id === selectedId)) selectedId = state.objectives[0].id;
  const selected = state.objectives.find(item => item.id === selectedId)!;
  const stats = objectiveStats(state).find(item => item.objective.id === selected.id)!;
  return `${pageHead('Objectives and evidence', 'Objective map', 'Each objective includes one recall question and your recorded evidence.', '<button class="button primary" data-action="new-objective">Add objective</button>')}
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
  if (!checks.length) return `<div class="history"><h3>Recall history</h3><p class="muted">No checks yet. Answer the recall question and record what the attempt showed.</p></div>`;
  return `<div class="history"><h3>Recall history</h3><ul class="history-list">${checks.slice(0, 8).map(check => `<li class="history-item"><span class="stamp ${check.level}">${check.mode}</span><div><p><strong>${capital(check.level)}</strong> · ${formatDate(check.checkedAt)}</p>${check.note ? `<p>${escapeHtml(check.note)}</p>` : ''}<p class="history-meta">Answer: ${escapeHtml(check.answer.slice(0, 120))}${check.answer.length > 120 ? '…' : ''}</p></div></li>`).join('')}</ul></div>`;
}

function currentReviewObjective() {
  if (reviewId && state.objectives.some(item => item.id === reviewId)) return state.objectives.find(item => item.id === reviewId)!;
  const weakest = weakestObjectives(state, analysisDays)[0]?.objective ?? null;
  reviewId = weakest?.id ?? null;
  return weakest;
}

function renderReview() {
  if (!state.objectives.length) return `${pageHead('Recall from memory', 'Recall check', 'Add an objective before starting a check.')}<div class="notice"><p><strong>There is nothing to check yet.</strong></p><p>Add one objective and its recall question.</p><button class="button primary" data-action="new-objective">Add objective</button></div>`;
  const objective = currentReviewObjective()!;
  if (reviewPhase === 'complete') return `${pageHead('Evidence saved', 'Check complete', 'The weak-objective map now includes this attempt.')}<div class="review-sheet"><h2>${escapeHtml(objective.title)}</h2><p>The answer and evidence are attached to this objective.</p><div class="review-actions"><button class="button" data-view="weak">See weak-objective map</button><button class="button primary" data-action="next-review">Check the next objective</button></div></div>`;
  if (reviewPhase === 'question') return `${pageHead('Recall from memory', 'Recall check', 'Write an answer without opening your notes.')}<section class="review-sheet" aria-labelledby="review-prompt"><div class="question-meta"><span>${escapeHtml(objective.title)}</span><span>${formatDate(new Date().toISOString())}</span></div><form id="attempt-form" novalidate><h2 class="prompt" id="review-prompt">${escapeHtml(objective.prompt)}</h2><p id="answer-error" class="form-error" role="alert"></p><div class="field"><label for="recall-answer">Your answer from memory</label><textarea id="recall-answer" name="answer" required maxlength="4000" autofocus aria-describedby="answer-help answer-error"></textarea><p id="answer-help" class="field-help">Write enough to judge the attempt. The app does not grade it.</p></div><div class="review-actions"><button class="button quiet" type="button" data-view="map">Leave check</button><button class="button primary" type="submit">Reveal evidence guide</button></div></form></section>`;
  return `${pageHead('Record the result', 'What did the attempt show?', 'Choose the evidence type and the strength of this attempt.')}<section class="review-sheet" aria-labelledby="evidence-title"><div class="question-meta"><span>${escapeHtml(objective.title)}</span><span>Self-recorded evidence</span></div><h2 id="evidence-title">Compare your answer with the evidence target</h2><div class="answer-draft"><strong>Your answer</strong><br>${escapeHtml(draftAnswer)}</div><div class="evidence-guide"><strong>Evidence target</strong><br>${escapeHtml(objective.evidenceTarget)}</div>
    <form id="evidence-form"><fieldset><legend>Evidence type</legend><div class="choice-grid">${choiceRadios('mode', [['explain','Explain'],['solve','Solve'],['recognize','Recognize']])}</div></fieldset><fieldset><legend>Strength of this attempt</legend><div class="choice-grid">${choiceRadios('level', [['thin','Thin'],['building','Building'],['supported','Supported']])}</div><p class="field-help">This describes one attempt. It is not a mastery score.</p></fieldset><div class="field"><label for="evidence-note">Evidence note <span class="muted">(optional)</span></label><textarea id="evidence-note" name="note" maxlength="600"></textarea></div><div class="review-actions"><button class="button quiet" type="button" data-action="back-to-answer">Edit answer</button><button class="button primary" type="submit">Attach evidence</button></div></form></section>`;
}

function choiceRadios(name: string, options: string[][]) {
  return options.map(([value, label], index) => `<div class="choice"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${index === 0 ? 'required' : ''}><label for="${name}-${value}">${label}</label></div>`).join('');
}

function renderWeakMap() {
  if (!state.objectives.length) return `${pageHead('Recent evidence', 'Weak-objective map', 'Add an objective before comparing evidence.')}<div class="notice"><p><strong>There are no objectives to compare.</strong></p><button class="button primary" data-action="new-objective">Add objective</button></div>`;
  const stats = weakestObjectives(state, analysisDays);
  const top = stats.slice(0, 2);
  const lens = analysisDays === 7 ? '7 days' : `${analysisDays} days`;
  return `${pageHead('Recent evidence', 'Weak-objective map', `Evidence from the last ${lens} ranks where another recall check could help. It does not measure mastery.`, '<button class="button primary" data-action="review-weakest">Check weakest objective</button>')}
    <div class="weak-intro">${top.map((item, index) => `<article class="weak-callout"><p class="rank">${index === 0 ? 'Thinnest evidence' : 'Next thinnest'}</p><h3>${escapeHtml(item.objective.title)}</h3><p>${weakReason(item)}</p><button class="button small" data-action="review-objective" data-id="${item.objective.id}">Check recall</button></article>`).join('')}</div>
    <div class="pane-head"><h3>Objective evidence · ${lens}</h3><label for="analysis-window">Evidence window <select id="analysis-window" data-action="analysis-window"><option value="7" ${analysisDays === 7 ? 'selected' : ''}>7 days</option><option value="14" ${analysisDays === 14 ? 'selected' : ''}>14 days</option><option value="30" ${analysisDays === 30 ? 'selected' : ''}>30 days</option></select></label></div>
    <div role="region" aria-label="Objective evidence table" tabindex="0"><table class="weak-table"><thead><tr><th>Objective</th><th>Evidence</th><th>Checks</th><th>Missing types</th><th>Last check</th></tr></thead><tbody>${stats.map(item => `<tr><td data-label="Objective"><strong>${escapeHtml(item.objective.title)}</strong></td><td data-label="Evidence"><span class="stamp ${item.band}">${item.band}</span></td><td data-label="Checks">${item.windowChecks.length}</td><td data-label="Missing"><div class="mode-tags">${item.missingModes.length ? item.missingModes.map(mode => `<span class="mode-tag">${mode}</span>`).join('') : 'All represented'}</div></td><td data-label="Last check">${formatDate(item.lastChecked)}</td></tr>`).join('')}</tbody></table></div>
    <div class="export-actions"><button class="button" data-action="export-csv">Export weak map (CSV)</button><button class="button" data-action="print-report">Print report</button></div>`;
}

function weakReason(item: ReturnType<typeof weakestObjectives>[number]) {
  if (!item.checks.length) return 'No recall evidence has been attached yet.';
  if (!item.windowChecks.length) return 'No recall check falls inside this evidence window.';
  if (item.missingModes.length) return `Missing ${item.missingModes.map(capital).join(', ')} evidence in this window.`;
  return `Recent attempts are marked ${item.band}.`;
}

function openObjectiveDialog(id?: string, parentId?: string) {
  const dialog = document.querySelector<HTMLDialogElement>('#objective-dialog')!;
  const form = document.querySelector<HTMLFormElement>('#objective-form')!;
  form.reset();
  clearFormError(form, '#objective-form-error');
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

function renderTools(importError = '') {
  const content = document.querySelector<HTMLDivElement>('#tools-content')!;
  content.innerHTML = `<section class="tools-section"><h3>${route === 'demo' ? 'Demo data' : 'Your data'}</h3><p>${route === 'demo' ? 'This sample uses a separate browser store. Exports contain only the current demo.' : `Stored in this browser${storageFallback ? ' with the local fallback' : ' using IndexedDB'}. Export a JSON backup when the records matter.`}</p><p id="import-error" class="form-error" role="alert">${escapeHtml(importError)}</p><div class="export-actions"><button class="button" data-action="export-json">Export all data (JSON)</button><button class="button" data-action="import-json">Import JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></section><section class="tools-section"><h3>Reports</h3><p>CSV export, printing, and every evidence window are included at no cost.</p><button class="button" data-view="weak">Open weak-objective map</button></section>`;
}

function openTools() {
  renderTools();
  document.querySelector<HTMLDialogElement>('#tools-dialog')!.showModal();
}

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function clearFormError(form: HTMLFormElement, errorSelector: string) {
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(field => field.setCustomValidity(''));
  const error = form.querySelector<HTMLElement>(errorSelector);
  if (error) error.textContent = '';
}

function requireTrimmed(form: HTMLFormElement, names: string[], errorSelector: string, message: string) {
  clearFormError(form, errorSelector);
  const invalid = names.map(name => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement).filter(field => !field.value.trim());
  if (!invalid.length) return true;
  invalid.forEach(field => { field.setCustomValidity(message); field.setAttribute('aria-invalid', 'true'); });
  const error = form.querySelector<HTMLElement>(errorSelector);
  if (error) error.textContent = message;
  invalid[0].focus();
  invalid[0].reportValidity();
  return false;
}

async function deleteObjective(id: string) {
  const collect = (parent: string): string[] => [parent, ...state.objectives.filter(item => item.parentId === parent).flatMap(item => collect(item.id))];
  const ids = collect(id);
  const item = state.objectives.find(entry => entry.id === id)!;
  const checkCount = state.checks.filter(check => ids.includes(check.objectiveId)).length;
  if (!confirm(`Delete “${item.title}”, ${ids.length - 1} sub-objective(s), and ${checkCount} attached check(s)? This cannot be undone.`)) return;
  state.objectives = state.objectives.filter(entry => !ids.includes(entry.id));
  state.checks = state.checks.filter(check => !ids.includes(check.objectiveId));
  selectedId = state.objectives[0]?.id ?? null;
  await persist('Objective and its attached evidence deleted.');
  render();
}

async function importFile(input: HTMLInputElement) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = validateImport(JSON.parse(await file.text()));
    if (!confirm(`Replace this map with ${imported.objectives.length} objective(s) and ${imported.checks.length} recall check(s) from “${file.name}”?`)) return;
    state = imported;
    selectedId = state.objectives[0]?.id ?? null;
    await persist('Backup imported.');
    document.querySelector<HTMLDialogElement>('#tools-dialog')?.close();
    render();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'That backup could not be imported.';
    renderTools(message);
    announce(message);
  } finally {
    input.value = '';
  }
}

async function resetDemo() {
  state = sampleState();
  selectedId = state.objectives[0].id;
  view = 'map';
  reviewId = null;
  reviewPhase = 'question';
  await persist('Demo reset to the original sample.');
  render();
}

function navigate(path: string) {
  history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '');
  history.pushState({ scrollY: 0 }, '', path);
  void initRoute(0);
}

async function initRoute(restoreScroll = 0, focusHeading = true) {
  route = routeFromPath(currentPath());
  setMetadata();
  view = 'map';
  reviewPhase = 'question';
  reviewId = null;
  if (route === 'landing') shell(renderLanding());
  else if (route === 'privacy') shell(renderPrivacy());
  else if (route === 'terms') shell(renderTerms());
  else if (route === 'notfound') shell(renderNotFound());
  else {
    storageSpace = route === 'demo' ? 'demo' : 'real';
    shell(appFrame(), true);
    try {
      const loaded = await loadState(storageSpace);
      storageFallback = loaded.fallback;
      state = loaded.state;
      if (route === 'demo' && !state.objectives.length) {
        state = sampleState();
        await saveState(state, storageFallback, storageSpace);
      } else {
        state = validateImport(state);
      }
      selectedId = state.objectives[0]?.id ?? null;
      render();
      if (storageFallback) announce('IndexedDB is unavailable. A browser fallback is being used.');
    } catch {
      state = route === 'demo' ? sampleState() : emptyState();
      storageFallback = true;
      selectedId = state.objectives[0]?.id ?? null;
      render();
      announce('Stored records could not be opened. Export or import a valid backup before replacing them.');
    }
  }
  requestAnimationFrame(() => {
    window.scrollTo(0, restoreScroll);
    if (focusHeading) document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    const status = document.querySelector<HTMLElement>('.route-status');
    if (status) status.textContent = document.title;
  });
}

app.addEventListener('click', async event => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-route]');
  if (link && link.origin === location.origin) {
    event.preventDefault();
    navigate(link.pathname);
    return;
  }
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-view], [data-close-dialog]');
  if (!target) return;
  if (target.dataset.closeDialog) {
    document.querySelector<HTMLDialogElement>(`#${target.dataset.closeDialog}`)?.close();
    return;
  }
  if (target.dataset.view) {
    view = target.dataset.view as View;
    if (view === 'review') reviewPhase = 'question';
    document.querySelector<HTMLDialogElement>('#tools-dialog')?.close();
    render();
    return;
  }
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'new-objective') openObjectiveDialog();
  if (action === 'add-child') openObjectiveDialog(undefined, id);
  if (action === 'edit-objective') openObjectiveDialog(id);
  if (action === 'select-objective') { selectedId = id!; render(); }
  if (action === 'review-objective') { reviewId = id!; reviewPhase = 'question'; view = 'review'; render(); }
  if (action === 'review-weakest') { reviewId = weakestObjectives(state, analysisDays)[0]?.objective.id ?? null; reviewPhase = 'question'; view = 'review'; render(); }
  if (action === 'next-review') { reviewId = weakestObjectives(state, analysisDays).find(item => item.objective.id !== reviewId)?.objective.id ?? reviewId; reviewPhase = 'question'; render(); }
  if (action === 'back-to-answer') { reviewPhase = 'question'; render(); requestAnimationFrame(() => { const answer = document.querySelector<HTMLTextAreaElement>('#recall-answer'); if (answer) { answer.value = draftAnswer; answer.focus(); } }); }
  if (action === 'delete-objective') await deleteObjective(id!);
  if (action === 'tools') openTools();
  if (action === 'export-json') { download(`recall-map-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2), 'application/json'); announce('JSON backup exported.'); }
  if (action === 'export-csv') { download(`weak-objective-map-${new Date().toISOString().slice(0,10)}.csv`, weeklyCsv(state, analysisDays), 'text/csv'); announce('Weak-objective CSV exported.'); }
  if (action === 'import-json') document.querySelector<HTMLInputElement>('#import-file')?.click();
  if (action === 'print-report') window.print();
  if (action === 'reset-demo') await resetDemo();
  if (action === 'start-real') navigate('/map');
});

app.addEventListener('input', event => {
  const field = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (field.form && field.getAttribute('aria-invalid') === 'true') {
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    const error = field.form.querySelector<HTMLElement>('.form-error');
    if (error) error.textContent = '';
  }
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
    if (!requireTrimmed(form, ['title', 'prompt', 'evidenceTarget'], '#objective-form-error', 'Enter an objective, a recall question, and an evidence target.')) return;
    const id = String(data.get('id') || '');
    const existing = state.objectives.find(item => item.id === id);
    const now = new Date().toISOString();
    const objective: Objective = { id: existing?.id ?? makeId(), title: String(data.get('title')).trim(), description: String(data.get('description')).trim(), parentId: String(data.get('parentId') || '') || null, prompt: String(data.get('prompt')).trim(), evidenceTarget: String(data.get('evidenceTarget')).trim(), createdAt: existing?.createdAt ?? now, updatedAt: now };
    if (existing) state.objectives = state.objectives.map(item => item.id === id ? objective : item);
    else state.objectives.push(objective);
    selectedId = objective.id;
    document.querySelector<HTMLDialogElement>('#objective-dialog')!.close();
    await persist(existing ? 'Objective updated.' : 'Objective added.');
    render();
  }
  if (formId === 'attempt-form') {
    if (!requireTrimmed(form, ['answer'], '#answer-error', 'Write an answer from memory before revealing the evidence guide.')) return;
    draftAnswer = String(data.get('answer')).trim();
    reviewPhase = 'evidence';
    render();
  }
  if (formId === 'evidence-form') {
    if (!form.reportValidity()) return;
    const objective = currentReviewObjective()!;
    state.checks.push({ id: makeId(), objectiveId: objective.id, prompt: objective.prompt, answer: draftAnswer, mode: String(data.get('mode')) as EvidenceMode, level: String(data.get('level')) as EvidenceLevel, note: String(data.get('note')).trim(), checkedAt: new Date().toISOString() });
    await persist('Evidence attached to the objective.');
    reviewPhase = 'complete';
    render();
  }
});

window.addEventListener('online', () => updateOnlineStatus());
window.addEventListener('offline', () => updateOnlineStatus());
window.addEventListener('popstate', event => void initRoute(Number(event.state?.scrollY ?? 0)));

async function start() {
  if (!history.state) history.replaceState({ scrollY: window.scrollY }, '');
  document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', event => {
    event.preventDefault();
    document.querySelector<HTMLElement>('#main')?.focus();
  });
  await initRoute(Number(history.state?.scrollY ?? 0), false);
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announce('An app update is ready. Reload to use it.');
        });
      });
    } catch {
      announce('Offline installation is unavailable in this browser.');
    }
  }
}

void start();
