// async / await support in tests
import "babel-polyfill";

// require all files with `.test` into one file.
const requireTest = require.context(".", true, /.test/);
requireTest.keys().forEach(requireTest);
