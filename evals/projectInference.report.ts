import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type RunResult = {
  ok: boolean
  projectType?: string
  features: string[]
  title?: string
  errorCode?: string
  typeHit: boolean
  missed: string[]
  forbiddenHits: string[]
  noise: string[]
}

export type CaseResult = {
  id: string
  tag: string
  projectName: string
  description: string
  acceptableTypes: string[]
  requiredFeatures: string[]
  acceptableFeatures: string[]
  forbiddenFeatures: string[]
  runs: RunResult[]
}

export type FeatureResult = {
  feature: string
  expected: number
  hit: number
  picked: number
  outsideOkSet: number
}

export type EvalResults = {
  label: string
  startedAt: string
  runsPerCase: number
  summary: {
    typeAccuracy: number
    requiredRecall: number
    forbiddenRate: number
    avgPicked: number
    avgNoise: number
    errors: number
  }
  cases: CaseResult[]
  features: FeatureResult[]
}

// '<' is escaped so case text can never close the inline script tag
const toInlineJson = (data: EvalResults): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

const pageTemplate = (data: EvalResults): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inference Eval ${data.label}</title>
<style>
  :root {
    --bg: #fafaf7; --card: #ffffff; --text: #1c1c1a; --muted: #6b6b66; --line: #e4e3dc;
    --ok: #1f7a4d; --ok-bg: #e2f3ea; --ext: #55555a; --ext-bg: #ececef;
    --noise: #9a5b00; --noise-bg: #fdf0d5; --bad: #b3261e; --bad-bg: #fbe3e1; --accent: #2b59c3;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #151514; --card: #1f1f1d; --text: #ecebe4; --muted: #9a9990; --line: #34342f;
      --ok: #6fd0a0; --ok-bg: #173a2a; --ext: #b4b4bb; --ext-bg: #2b2b30;
      --noise: #f0b95a; --noise-bg: #3b2d12; --bad: #ff8c84; --bad-bg: #432020; --accent: #8fb0ff;
    }
  }
  * { box-sizing: border-box }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, sans-serif }
  main { max-width: 1000px; margin: 0 auto; padding: 24px 16px 64px }
  h1 { font-size: 20px; margin: 0 0 4px }
  .sub { color: var(--muted); margin-bottom: 20px }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px }
  .tile { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px }
  .tile b { display: block; font-size: 22px }
  .tile span { color: var(--muted); font-size: 12px }
  .legend, .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px }
  .chip { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; border: 1px solid transparent; margin: 2px 4px 2px 0 }
  .req { background: var(--ok-bg); color: var(--ok) }
  .ext { background: var(--ext-bg); color: var(--ext) }
  .noise { background: var(--noise-bg); color: var(--noise) }
  .bad { background: var(--bad-bg); color: var(--bad) }
  .miss { border: 1px dashed var(--bad); color: var(--bad); background: transparent }
  button { font: inherit; background: var(--card); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 4px 10px; cursor: pointer }
  button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent) }
  .case { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px }
  .case.problem { border-left: 4px solid var(--bad) }
  .head { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap }
  .id { font-weight: 600 }
  .tag { color: var(--muted); font-size: 12px; margin-left: 6px }
  .desc { color: var(--muted); margin: 4px 0 8px; white-space: pre-wrap; overflow-wrap: anywhere }
  .exp { font-size: 12px; color: var(--muted); margin-bottom: 8px }
  .run { border-top: 1px solid var(--line); padding: 6px 0 }
  .type { font-weight: 600 }
  .type.wrong { color: var(--bad) }
  .title { color: var(--muted); margin-left: 8px }
  table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: 8px }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line) }
  th { color: var(--muted); font-weight: 500; font-size: 12px }
  h2 { font-size: 15px; margin: 28px 0 8px }
</style>
</head>
<body>
<main>
  <h1>Project inference eval</h1>
  <div class="sub" id="sub"></div>
  <div class="tiles" id="tiles"></div>
  <div class="legend">
    <span class="chip req">required, picked</span>
    <span class="chip miss">required, missed</span>
    <span class="chip ext">acceptable extra</span>
    <span class="chip noise">noise (unexpected)</span>
    <span class="chip bad">forbidden</span>
  </div>
  <div class="toolbar" id="toolbar"></div>
  <div id="cases"></div>
  <h2>Per feature</h2>
  <table id="features"></table>
</main>
<script id="data" type="application/json">${toInlineJson(data)}</script>
<script>
  const data = JSON.parse(document.getElementById('data').textContent)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const pct = (n) => (n * 100).toFixed(1) + '%'
  const chip = (cls, text) => '<span class="chip ' + cls + '">' + esc(text) + '</span>'

  document.getElementById('sub').textContent =
    'label: ' + data.label + ' | ' + data.startedAt + ' | ' + data.runsPerCase + ' runs per case'

  const s = data.summary
  document.getElementById('tiles').innerHTML = [
    ['Type accuracy', pct(s.typeAccuracy)],
    ['Required recall', s.requiredRecall.toFixed(2)],
    ['Forbidden picks', pct(s.forbiddenRate)],
    ['Avg features picked', s.avgPicked.toFixed(1)],
    ['Avg noise per run', s.avgNoise.toFixed(1)],
    ['Errors', String(s.errors)],
  ].map(([k, v]) => '<div class="tile"><b>' + v + '</b><span>' + k + '</span></div>').join('')

  const isProblem = (c) => c.runs.some((r) => !r.ok || !r.typeHit || r.missed.length || r.forbiddenHits.length)
  let filter = 'all'
  const filters = [['all', 'All cases'], ['problems', 'Problems only'], ['noise', 'Has noise']]

  const renderRun = (c, r) => {
    if (!r.ok) return '<div class="run">' + chip('bad', 'ERROR ' + r.errorCode) + '</div>'
    const chips = [
      ...r.features.map((f) =>
        c.requiredFeatures.includes(f) ? chip('req', f)
        : r.forbiddenHits.includes(f) ? chip('bad', f)
        : c.acceptableFeatures.includes(f) ? chip('ext', f)
        : chip('noise', f)),
      ...r.missed.map((f) => chip('miss', 'missing ' + f)),
    ].join('') || '<span class="tag">no features</span>'
    return '<div class="run"><span class="type' + (r.typeHit ? '' : ' wrong') + '">' + esc(r.projectType) +
      '</span><span class="title">' + esc(r.title) + '</span><div>' + chips + '</div></div>'
  }

  const renderCase = (c) =>
    '<div class="case' + (isProblem(c) ? ' problem' : '') + '">' +
    '<div class="head"><div><span class="id">' + esc(c.id) + '</span><span class="tag">' + esc(c.tag) + '</span></div>' +
    '<div class="exp">accepted types: ' + esc(c.acceptableTypes.join(', ')) + '</div></div>' +
    '<div class="desc"><b>' + esc(c.projectName) + '</b>: ' + esc(c.description) + '</div>' +
    '<div class="exp">required: ' + (esc(c.requiredFeatures.join(', ')) || 'none') +
    ' | forbidden: ' + (esc(c.forbiddenFeatures.join(', ')) || 'none') + '</div>' +
    c.runs.map((r) => renderRun(c, r)).join('') + '</div>'

  const render = () => {
    document.getElementById('toolbar').innerHTML = filters
      .map(([k, label]) => '<button data-f="' + k + '" aria-pressed="' + (filter === k) + '">' + label + '</button>').join('')
    document.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render() }))
    const shown = data.cases.filter((c) =>
      filter === 'problems' ? isProblem(c)
      : filter === 'noise' ? c.runs.some((r) => r.noise.length)
      : true)
    document.getElementById('cases').innerHTML = shown.map(renderCase).join('') || '<p>Nothing to show.</p>'
  }
  render()

  document.getElementById('features').innerHTML =
    '<tr><th>feature</th><th>required, found</th><th>times picked</th><th>picked outside ok set</th></tr>' +
    data.features.map((f) => '<tr><td>' + esc(f.feature) + '</td><td>' +
      (f.expected ? f.hit + '/' + f.expected : 'n/a') + '</td><td>' + f.picked + '</td><td>' + f.outsideOkSet + '</td></tr>').join('')
</script>
</body>
</html>
`

// Writes <dir>/<label>.json (raw data) and <dir>/<label>.html (readable report), returns both paths
export const writeResults = (
  data: EvalResults,
  dir: string
): { json: string; html: string } => {
  mkdirSync(dir, { recursive: true })
  const json = join(dir, `${data.label}.json`)
  const html = join(dir, `${data.label}.html`)
  writeFileSync(json, JSON.stringify(data, null, 2))
  writeFileSync(html, pageTemplate(data))
  return { json, html }
}
