import * as path from "path";
import inlineWorkerPlugin from "esbuild-plugin-inline-worker";

/**
 * @var {Partial<import('esbuild').BuildOptions>}
 */
export default {
  platform: "browser",
  entryPoints: [
    path.resolve("src/renderer/index.js"),
    path.resolve("src/renderer/index.css"),
  ],
  bundle: true,
  minify: false, // Minification screws up the worklet injection
  target: "chrome96", // electron version target
  loader: { ".js": "jsx", ".svg": "file", ".svgi": "text" },
  plugins: [inlineWorkerPlugin()],
};
