/* jshint node: true */

'use strict';

module.exports = {
  framework: 'mocha',
  test_page: 'test/percy-agent-client/test.html',
  src_files: [
    'dist-test/browserified-tests.js',
  ],
  disable_watching: true,
  launch_in_ci: ['Chrome', 'Firefox'],
  launch_in_dev: ['Chrome'],
  browser_args: {
    Chrome: {
      mode: 'ci',
      args: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.DOCKER ? '--no-sandbox' : null,

        '--disable-gpu',
        '--remote-debugging-port=0',
        '--window-size=1440,900',
      ].filter(Boolean),
    },
  },
};
