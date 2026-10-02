const fs = require('fs');
const { MARK, computeSourceHash, MANIFEST } = require('../config/integrity');

fs.writeFileSync(MANIFEST, JSON.stringify({ mark: MARK, sourceHash: computeSourceHash() }, null, 2) + '\n');
console.log('sealed', MANIFEST);
