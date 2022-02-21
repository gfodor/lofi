import * as path from "path";

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
  target: "chrome96", // electron version target
  loader: { ".js": "jsx" },
};
