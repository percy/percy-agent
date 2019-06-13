const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/percy-agent-client/index.ts",
  output: {
    library: "PercyAgent",
    libraryTarget: "window",
    libraryExport: "default",
    filename: "percy-agent.js",
    path: path.resolve(__dirname, "dist/public/")
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "babel-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  }
};
