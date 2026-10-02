// Tamper layer. canonical: phz.forge · file: phantomz magic · v10.0
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MARK = 'canonical: phz.forge · file: phantomz magic · v10.0';
const SRC_DIR = path.join(__dirname, '..');
const MANIFEST = path.join(__dirname, '..', '..', 'integrity.manifest.json');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.js') ? [p] : [];
  });
}

// CRLF normalised so Windows git checkouts hash the same as Linux.
function computeSourceHash() {
  const h = crypto.createHash('sha256');
  for (const f of walk(SRC_DIR).sort()) {
    h.update(path.relative(SRC_DIR, f).replace(/\\/g, '/') + '\0');
    h.update(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
  }
  return h.digest('hex');
}

async function beacon(env, logger, payload) {
  if (env.TAMPER_BEACON_ENABLED !== 'true' || !env.TAMPER_BEACON_URL) return;
  try {
    await fetch(env.TAMPER_BEACON_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    logger.debug({ event: 'tamper_beacon_failed', msg: e.message });
  }
}

/** Logs and continues on mismatch. Never throws, never crashes the process. */
async function verifyIntegrity(env, logger) {
  const problems = [];
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    problems.push('manifest_missing_or_unreadable');
  }
  if (manifest) {
    if (manifest.mark !== MARK) problems.push('mark_mismatch');
    if (manifest.sourceHash !== computeSourceHash()) problems.push('source_hash_mismatch');
  }
  if (problems.length) {
    logger.warn({ event: 'tamper_detected', problems, mark: MARK });
    await beacon(env, logger, { event: 'tamper_detected', problems, mark: MARK, at: new Date().toISOString() });
  } else {
    logger.info({ event: 'integrity_ok' });
  }
}

module.exports = { MARK, computeSourceHash, verifyIntegrity, MANIFEST };
