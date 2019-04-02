import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import pkg from "./package.json";

export default {
  input: "src/percy-agent-client/index.ts",
  output: {
    name: "percy-agent",
    file: pkg.main,
    format: "umd"
  },
  plugins: [
    // Allows node_modules resolution
    resolve({ extensions: [".ts"] }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Compile TypeScript/JavaScript files
    babel({
      extensions: [".ts"],
      include: ["src/**"]
    })
  ]
};
