module.exports = config => {
  config.set({
    frameworks: ["mocha"], // sets up the Mocha framework automatically
    reporters: ["mocha"], // reports back to the CLI formatted like Mocha
    browsers: ["Chrome", "Firefox"], // automatically launches chrome & firefox to run our tests

    files: [
      // karma-webpack will watch our files
      { pattern: "./index.js", watched: false }
    ],

    preprocessors: {
      // tells Karma that we'll be using Webpack to process this file
      "./index.js": ["webpack"],
      "./fixtures/**/*": ["webpack"],
    },

    // Mocha reporter options
    mochaReporter: {
      showDiff: true
    },

    // create a webpack config
    webpack: {
      mode: "development",
      module: {
        rules: [
          {
            test: /\.ts?$/,
            use: "babel-loader",
            exclude: /node_modules/
          },
          {
            test: /\.html?$/,
            use: "raw-loader",
            exclude: /node_modules/
          }
        ]
      },
      resolve: {
        extensions: [".ts", ".js"]
      }
    },

    webpackMiddleware: {
      stats: "minimal"
    }
    // for more Karma config options, check out the documentation
    // http://karma-runner.github.io/2.0/config/configuration-file.html
  });
};
