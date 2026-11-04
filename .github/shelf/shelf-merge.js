// shelf-merge.js v1.05 | THE SHELF MERGE BOT (snailcade's half of THE STUDIO RUNS ON ITS OWN, part 2; the Director's answer
// "A" on studio issue 321, 2026-10-03; studio doc 13 section 15.2). With `shelfmerge: on` in .github/shelf/AUTOPILOT.md it
// merges a seat's shelf pull request without waiting for the Director when it ONLY ADDS versioned builds under test/<slug>/,
// or (v1.01, the Director's answer "A" on studio issue 1437, 2026-10-14) ONLY ADDS versioned device labs under <slug>/labs/;
// one kind per pull request, as tools/snailcade.js v1.07 makes them (a pull request mixing builds and labs is his):
//   1. a claude/ branch of this repository, into main, not a draft;
//   2. every change adds a new file test/<slug>/<name>-vX(.YZ).html, or every change adds a new file
//      <slug>/labs/<name>-vX(.YZ).html (a lab: public but unlisted, a byte copy of the studio's titles/<slug>/labs/): nothing
//      changed, moved or deleted, nothing outside
//      test/, never test/index.html (the shelf bot's: no version, no title folder, so the build pattern refuses it), never
//      the front end at the root or a title's folder (their seats');
//   3. no build or lab holds a login, key or token (only the kind is said, never the value; Metered's public Open Relay Project
//      login is not a secret);
//   4. GitHub reads it as mergeable.
// The studio-first order (a shelf build is a byte copy of a build already published on the studio's main) is the seat's to
// keep: it opens its shelf pull request only after its studio pull request merged. This public repository holds no token for
// the private studio, so the bot cannot read it (answer A); the Studio Head's `node tools/snailcade.js check` at every
// check-in catches a slip. A merge is pinned to the head it judged. Its token starts no workflow, so after a merge it starts
// the shelf bot itself (shelf-page.yml). A refused pull request from this repository gets one comment per head commit; one
// from a fork gets none. `shelfmerge: off`: nothing is merged or commented; the run summary says what it would do.
// v1.02 (ECHO ESCAPE's MEMO-ECHO-ESCAPE-SHELF-PULL-REF-v1.00): GitHub sometimes makes no refs/pull/N/head for a pull
// request (#392 on 2026-10-28: clean and green, it waited at every sweep with no comment). fetchHead takes the pull ref
// first and, when there is none, the branch itself, only when the branch's commit is the pull request's head.sha (a
// branch that has moved on waits for the next sweep, when GitHub's head has moved with it).
// v1.03 (STUDIO OPERATIONS' MEMO-STUDIO-OPERATIONS-SHELF-BOT-STALE-MAIN-v1.00, the studio bot's fault on #3344): the workflow
// checks main out once, and a sweep after a slow checkout read a branch updated with a newer main as changing main's own
// files. fetchHead fetches main in the same fetch as the head, so the base is never older than the head.
// v1.04 (the Studio Head's MEMO-STUDIO-HEAD-SHELF-PAYLOAD-ANSWER-v1.00, SNAILCADE's v1.53 memo item 3): a build under the
// payload law (studio doc 01 v3) loads its parts from payload-vX.YZ/ beside it, and the studio's tools/snailcade.js v1.09 copies
// that folder with the build. A builds pull request may now also add new files directly in test/<slug>/payload-vX.YZ/, when
// it adds a versioned build under the same test/<slug>/; a payload folder alone, a file in a subfolder of one, or one beside
// another title's build stays the Director's. Each added payload file is read for a secret too. That the folder is the
// studio's, file for file, is the session's check (snailcade.js check), as for builds.
// v1.05 (the Studio Head's [AHEAD] line after the studio merge bot's v1.11, MEMO-STUDIO-HEAD-MERGEBOT-FETCH-RETRY-v1.00): every
// GitHub call goes through makeApi, the studio bot's own: a network error that threw, with no response, is retried three times,
// 2, 4 and 8 seconds apart; a response with a status is returned as it is and never retried, so the rules see real 4xx and 5xx
// statuses; an error that escapes names its cause code and the path that failed. Before it, one dropped connection ended a
// sweep RED (the studio bot's runs of 2026-11-03 on "fetch failed").
//   node .github/shelf/shelf-merge.js --sweep   (the workflow; GH_TOKEN, GITHUB_REPOSITORY). It runs main's code and only
//   reads each pull request with git. SHELFMERGE_ROOT=<dir> reads another checkout (the studio's test uses it).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const VERSION = 'v1.05';
const ROOT = path.resolve(process.env.SHELFMERGE_ROOT || path.join(__dirname, '..', '..'));
const git = (a) => { const r = cp.spawnSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const switchOn = (text) => /^shelfmerge: on\s*$/m.test(text || '');
const BUILD = /^test\/[a-z0-9][a-z0-9-]*\/[^/]+[-_]v\d+(?:[._]\d+)*\.html$/i;
const PAYLOAD = /^test\/([a-z0-9][a-z0-9-]*)\/payload-v\d+\.\d+\/[^/]+$/i;   /* v1.04: a file of a build's payload folder, flat */
const LAB = /^(?!test\/)[a-z0-9][a-z0-9-]*\/labs\/[^/]+[-_]v\d+(?:[._]\d+)*\.html$/i;   /* v1.01: a title's device lab, never under test/ */
const SECRETS = [[/\bcredential\s*:\s*["'](?!openrelayproject["'])[^"']{4,}["']/i, 'a relay or ICE login'],
  [/\b(?:api[_-]?key|apikey|client[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*["'][A-Za-z0-9_\-\/+=.]{16,}["']/i, 'a key or token']];

function gitFacts(headRef, mainRef) {
  const base = (git(['merge-base', mainRef, headRef]) || '').trim();
  if (!base) return { error: 'no merge base between ' + mainRef + ' and ' + headRef };
  const diff = git(['diff', '--name-status', '--find-renames', base, headRef]);
  if (diff === null) return { error: 'git could not read ' + base.slice(0, 7) + '..' + headRef };
  const changes = diff.split('\n').filter(Boolean).map((l) => { const c = l.split('\t'); return { st: c[0], from: c[1], to: c[2] || c[1] }; });
  return { changes, content: (p) => git(['show', headRef + ':' + p]) };
}

/* v1.02: the pull request's head, from its pull ref or, when GitHub made none, from its branch at the pull request's head.sha;
   v1.03: main fetched with it, so the base is never older than the head */
function fetchHead(pr, g) {
  g = g || git;
  const ref = 'refs/shelfmerge/pr' + pr.number, main = '+refs/heads/main:refs/remotes/origin/main';
  if (g(['fetch', '-q', 'origin', main, '+refs/pull/' + pr.number + '/head:' + ref]) !== null) return { ref, via: 'pull' };
  if (g(['fetch', '-q', 'origin', main, '+refs/heads/' + pr.head.ref + ':' + ref]) === null) return { error: 'git could not fetch the pull request\'s head, from its pull ref or its branch' };
  const at = (g(['rev-parse', ref]) || '').trim();
  if (at !== pr.head.sha) return { error: 'GitHub made no pull ref, and the branch ' + pr.head.ref + ' is at ' + at.slice(0, 7) + ', not the pull request\'s head ' + pr.head.sha.slice(0, 7) };
  return { ref, via: 'branch' };
}

/* MERGE, WAIT (no comment) or DIRECTOR (his to merge) */
function decide(f) {
  const refuse = [], wait = [];
  if (!/^claude\//.test(f.branch || '')) refuse.push('the branch ' + (f.branch || '(none)') + ' is not a claude/ branch');
  if (f.sameRepo === false) refuse.push('it comes from another repository');
  if (f.baseRef && f.baseRef !== 'main') refuse.push('it does not merge into main');
  if (f.draft) wait.push('it is a draft');
  if (f.mergeable === false) wait.push('it conflicts with main'); else if (f.mergeable === null) wait.push('GitHub has not yet read whether it merges cleanly');
  const changes = f.changes || [];
  if (!changes.length) wait.push('it changes nothing');
  const added = (re) => changes.filter((c) => c.st === 'A' && re.test(c.to)).length;
  /* v1.04: a payload file counts with the builds only beside a build this pull request adds under the same test/<slug>/ */
  const buildSlugs = new Set(changes.filter((c) => c.st === 'A' && BUILD.test(c.to)).map((c) => c.to.split('/')[1]));
  const payload = (c) => c.st === 'A' && PAYLOAD.test(c.to) && buildSlugs.has(c.to.split('/')[1]);
  const kind = changes.length && changes.every((c) => (c.st === 'A' && BUILD.test(c.to)) || payload(c)) && buildSlugs.size ? 'builds' : changes.length && added(LAB) === changes.length ? 'labs' : ''; /* v1.01: one kind only */
  const bad = kind ? [] : changes.filter((c) => !(c.st === 'A' && (BUILD.test(c.to) || LAB.test(c.to))) && !payload(c)).map((c) => c.st[0] + ' ' + (c.st[0] === 'R' ? c.from + ' -> ' + c.to : c.to) + (c.st === 'A' && PAYLOAD.test(c.to) ? ' (a payload file with no new build beside it)' : ''));
  if (!kind && changes.length && !bad.length) refuse.push('it adds both builds and labs: one kind per pull request (tools/snailcade.js v1.07), so this one is the Director\'s');
  if (bad.length) refuse.push('it does more than add versioned builds under test/<slug>/ (with their payload folders) or versioned labs under <slug>/labs/: ' + bad.slice(0, 4).join('; ') + (bad.length > 4 ? '; and ' + (bad.length - 4) + ' more' : ''));
  const held = [];
  for (const c of changes.filter((x) => x.st === 'A' && (/\.html$/i.test(x.to) || PAYLOAD.test(x.to)))) { const src = f.content(c.to) || ''; const k = SECRETS.filter(([re]) => re.test(src)).map(([, n]) => n); if (k.length) held.push(c.to + ' (' + k.join(', ') + ')'); }
  if (held.length) refuse.push('a page holds a secret: ' + held.join('; ') + ': never publish it without the Director\'s word for that page');
  return { verdict: refuse.length ? 'DIRECTOR' : wait.length ? 'WAIT' : 'MERGE', reasons: refuse.concat(wait), fork: f.sameRepo === false, kind };
}

async function sweep(env) {
  const on = switchOn(env.autopilot), lines = [], say = (l) => { lines.push(l); env.log(l); };
  say('SHELF MERGE BOT ' + VERSION + ': the switch reads shelfmerge: ' + (on ? 'on' : 'off') + (on ? '' : ' (nothing is merged or commented; this run only says what it would do)'));
  const list = await env.api('GET', '/repos/' + env.repo + '/pulls?state=open&base=main&per_page=100');
  if (list.status !== 200) { say('SHELF MERGE BOT: could not list the pull requests (HTTP ' + list.status + ')'); return { merged: [], lines, error: true }; }
  const merged = [];
  for (const p of list.json) {
    let pr = (await env.api('GET', '/repos/' + env.repo + '/pulls/' + p.number)).json || p;
    if (pr.mergeable === null || pr.mergeable === undefined) { await env.sleep(3000); pr = (await env.api('GET', '/repos/' + env.repo + '/pulls/' + p.number)).json || pr; }
    const sha = pr.head.sha, sameRepo = !!(pr.head.repo && pr.head.repo.full_name === env.repo);
    const gf = sameRepo ? env.facts(pr) : { changes: [] };
    const d = gf.error ? { verdict: 'WAIT', reasons: [gf.error] } : decide(Object.assign({}, gf, { branch: pr.head.ref, sameRepo, baseRef: pr.base.ref, draft: !!pr.draft, mergeable: pr.mergeable === undefined ? null : pr.mergeable }));
    const head = '#' + pr.number + ' ' + pr.head.ref + ' at ' + sha.slice(0, 7);
    if (d.verdict === 'MERGE' && !on) { say('WOULD MERGE ' + head); continue; }
    if (d.verdict === 'WAIT') { say('WAITS ' + head + ': ' + d.reasons.join('; ')); continue; }
    if (d.verdict === 'DIRECTOR') {
      say((on ? 'FOR THE DIRECTOR ' : 'WOULD LEAVE FOR THE DIRECTOR ') + head + ': ' + d.reasons.join('; '));
      if (!on || d.fork) continue;
      const mark = '<!-- shelfmerge:' + sha + ' -->';
      const cs = await env.api('GET', '/repos/' + env.repo + '/issues/' + pr.number + '/comments?per_page=100');
      if (cs.status === 200 && !(cs.json || []).some((c) => (c.body || '').includes(mark)))
        await env.api('POST', '/repos/' + env.repo + '/issues/' + pr.number + '/comments', { body: 'SHELF MERGE BOT ' + VERSION + ': this pull request waits for the Director to merge it, because ' + d.reasons.join('; ') + '.\n' + mark });
      continue;
    }
    const r = await env.api('PUT', '/repos/' + env.repo + '/pulls/' + pr.number + '/merge', { merge_method: 'merge', sha,
      commit_title: 'Merge pull request #' + pr.number + ' from ' + env.repo.split('/')[0] + '/' + pr.head.ref,
      commit_message: pr.title + '\n\nMerged by the shelf merge bot (.github/shelf/shelf-merge.js ' + VERSION + '): ' + (d.kind === 'labs' ? 'new versioned device labs under <slug>/labs/ only.' : 'new versioned builds under test/ only.') });
    if (r.status === 200 && r.json && r.json.merged) { merged.push(pr.number); say('MERGED ' + head); }
    else say('WAITS ' + head + ': GitHub refused the merge (HTTP ' + r.status + (r.json && r.json.message ? ', ' + r.json.message : '') + ')');
  }
  if (merged.length) {
    const r = await env.api('POST', '/repos/' + env.repo + '/actions/workflows/shelf-page.yml/dispatches', { ref: 'main' });
    say(r.status === 204 ? 'SHELF MERGE BOT: the shelf bot started (its own token starts no workflow, so the bot starts it)' : 'SHELF MERGE BOT: could not start the shelf bot (HTTP ' + r.status + ')');
  }
  say('SHELF MERGE BOT ' + VERSION + ': ' + list.json.length + ' open pull request(s), ' + merged.length + ' merged');
  return { merged, lines };
}

/* v1.05: one GitHub call, retried on a network error only (the studio's tools/mergebot.js v1.11 makeApi, its User-Agent this bot's) */
function makeApi({ token, fetchFn, sleep, base = 'https://api.github.com' }) {
  const f = fetchFn || fetch;
  return async (method, url, body) => {
    let lastErr = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await sleep(2000 * Math.pow(2, attempt - 1));
      let r;
      try {
        r = await f(base + url, { method, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'snail-shelfmerge' }, body: body ? JSON.stringify(body) : undefined });
      } catch (e) { lastErr = e; continue; }
      let json = null; try { json = await r.json(); } catch (e) { json = null; }
      return { status: r.status, json };
    }
    const code = (lastErr && lastErr.cause && lastErr.cause.code) || (lastErr && lastErr.code) || 'no code';
    throw new Error('fetch failed (' + code + ') for ' + method + ' ' + url + ' after 4 tries: ' + (lastErr && lastErr.message));
  };
}

module.exports = { VERSION, switchOn, decide, sweep, gitFacts, fetchHead, makeApi };

if (require.main === module) {
  if (!process.argv.includes('--sweep')) { console.log('usage: node .github/shelf/shelf-merge.js --sweep'); process.exit(1); }
  const token = process.env.GH_TOKEN, repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) { console.log('SHELF MERGE BOT RED: GH_TOKEN and GITHUB_REPOSITORY are needed'); process.exit(1); }
  const api = makeApi({ token, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }); /* v1.05 */
  const facts = (pr) => {
    const h = fetchHead(pr);
    if (h.error) return { error: h.error };
    if (h.via === 'branch') console.log('#' + pr.number + ': GitHub made no pull ref; read from the branch ' + pr.head.ref + ' at the pull request\'s head');
    return gitFacts(h.ref, 'origin/main');
  };
  let autopilot = ''; try { autopilot = fs.readFileSync(path.join(ROOT, '.github', 'shelf', 'AUTOPILOT.md'), 'utf8'); } catch (e) { autopilot = ''; }
  sweep({ api, repo, facts, autopilot, log: (l) => console.log(l), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) })
    .then((res) => {
      if (process.env.GITHUB_STEP_SUMMARY) try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### SHELF MERGE BOT ' + VERSION + '\n' + res.lines.map((l) => '- ' + l).join('\n') + '\n'); } catch (e) { /* a convenience */ }
      process.exit(res.error ? 1 : 0);
    })
    .catch((e) => { console.log('SHELF MERGE BOT RED: ' + e.message); process.exit(1); });
}
