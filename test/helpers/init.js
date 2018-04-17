const path = require('path');
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json');

const Replay = require('replay');
Replay.fixtures = './test/fixtures';
