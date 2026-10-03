// shelf-merge.js v1.00 | THE SHELF MERGE BOT (snailcade's half of THE STUDIO RUNS ON ITS OWN, part 2; the Director's answer
// "A" on studio issue 321, 2026-10-03; studio doc 13 section 15.2). With `shelfmerge: on` in .github/shelf/AUTOPILOT.md it
// merges a seat's shelf pull request without waiting for the Director when it ONLY ADDS versioned builds under test/<slug>/:
//   1. a claude/ branch of this repository, into main, not a draft;
//   2. every change adds a new file test/<slug>/<name>-vX(.YZ).html: nothing changed, moved or deleted, nothing outside
//      test/, never test/index.html (the shelf bot's: no version, no title folder, so the build pattern refuses it), never
//      the front end at the root or a title's folder (their seats');
//   3. no build holds a login, key or token (only the kind is said, never the value; Metered's public Open Relay Project
//      login is not a secret);
//   4. GitHub reads it as mergeable.
// The studio-first order (a shelf build is a byte copy of a build already published on the studio's main) is the seat's to
// keep: it opens its shelf pull request only after its studio pull request merged. This public repository holds no token for
// the private studio, so the bot cannot read it (answer A); the Studio Head's `node tools/snailcade.js check` at every
// check-in catches a slip. A merge is pinned to the head it judged. Its token starts no workflow, so after a merge it starts
// the shelf bot itself (shelf-page.yml). A refused pull request from this repository gets one comment per head commit; one
// from a fork gets none. `shelfmerge: off`: nothing is merged or commented; the run summary says what it would do.
//   node .github/shelf/shelf-merge.js --sweep   (the workflow; GH_TOKEN, GITHUB_REPOSITORY). It runs main's code and only
//   reads each pull request with git. SHELFMERGE_ROOT=<dir> reads another checkout (the studio's test uses it).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const VERSION = 'v1.00';
const ROOT = path.resolve(process.env.SHELFMERGE_ROOT || path.join(__dirname, '..', '..'));
const git = (a) => { const r = cp.spawnSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const switchOn = (text) => /^shelfmerge: on\s*$/m.test(text || '');
const BUILD = /^test\/[a-z0-9][a-z0-9-]*\/[^/]+[-_]v\d+(?:[._]\d+)*\.html$/i;
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
  const bad = changes.filter((c) => !(c.st === 'A' && BUILD.test(c.to))).map((c) => c.st[0] + ' ' + (c.st[0] === 'R' ? c.from + ' -> ' + c.to : c.to));
  if (bad.length) refuse.push('it does more than add versioned builds under test/<slug>/: ' + bad.slice(0, 4).join('; ') + (bad.length > 4 ? '; and ' + (bad.length - 4) + ' more' : ''));
  const held = [];
  for (const c of changes.filter((x) => x.st === 'A' && /\.html$/i.test(x.to))) { const src = f.content(c.to) || ''; const k = SECRETS.filter(([re]) => re.test(src)).map(([, n]) => n); if (k.length) held.push(c.to + ' (' + k.join(', ') + ')'); }
  if (held.length) refuse.push('a build holds a secret: ' + held.join('; ') + ': never publish it without the Director\'s word for that page');
  return { verdict: refuse.length ? 'DIRECTOR' : wait.length ? 'WAIT' : 'MERGE', reasons: refuse.concat(wait), fork: f.sameRepo === false };
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
      commit_message: pr.title + '\n\nMerged by the shelf merge bot (.github/shelf/shelf-merge.js ' + VERSION + '): new versioned builds under test/ only.' });
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

module.exports = { VERSION, switchOn, decide, sweep, gitFacts };

if (require.main === module) {
  if (!process.argv.includes('--sweep')) { console.log('usage: node .github/shelf/shelf-merge.js --sweep'); process.exit(1); }
  const token = process.env.GH_TOKEN, repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) { console.log('SHELF MERGE BOT RED: GH_TOKEN and GITHUB_REPOSITORY are needed'); process.exit(1); }
  const api = async (method, url, body) => {
    const r = await fetch('https://api.github.com' + url, { method, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'snail-shelfmerge' }, body: body ? JSON.stringify(body) : undefined });
    let json = null; try { json = await r.json(); } catch (e) { json = null; }
    return { status: r.status, json };
  };
  const facts = (pr) => {
    const ref = 'refs/shelfmerge/pr' + pr.number;
    if (git(['fetch', '-q', 'origin', '+refs/pull/' + pr.number + '/head:' + ref]) === null) return { error: 'git could not fetch the pull request\'s head' };
    return gitFacts(ref, 'origin/main');
  };
  let autopilot = ''; try { autopilot = fs.readFileSync(path.join(ROOT, '.github', 'shelf', 'AUTOPILOT.md'), 'utf8'); } catch (e) { autopilot = ''; }
  sweep({ api, repo, facts, autopilot, log: (l) => console.log(l), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) })
    .then((res) => {
      if (process.env.GITHUB_STEP_SUMMARY) try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### SHELF MERGE BOT ' + VERSION + '\n' + res.lines.map((l) => '- ' + l).join('\n') + '\n'); } catch (e) { /* a convenience */ }
      process.exit(res.error ? 1 : 0);
    })
    .catch((e) => { console.log('SHELF MERGE BOT RED: ' + e.message); process.exit(1); });
}
