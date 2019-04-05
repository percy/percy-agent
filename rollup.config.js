import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

export default {
  input: "src/percy-agent-client/index.ts",
  output: {
    name: "PercyAgent",
    file: "dist/public/percy-agent.js",
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
