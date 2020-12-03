import nodeResolve from "@rollup/plugin-node-resolve";
import cjs from "@rollup/plugin-commonjs";
import vue from "rollup-plugin-vue";
import replace from "@rollup/plugin-replace";
import html from "@rollup/plugin-html";
module.exports = {
  input: "src/index.js",
  output: {
    file: "dist/app.js",
    format: "esm",
  },
  plugins: [
    vue({ css: false }),
    nodeResolve(),
    cjs({ sourceMap: false }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    html({
      script: "app.js",
    }),
  ],
};
