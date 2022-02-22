import * as path from "path";
import { nodeExternalsPlugin } from "esbuild-node-externals";

/**
 * @var {Partial<import('esbuild').BuildOptions>}
 */
export default {
  platform: "node",
  entryPoints: [
    path.resolve("src/main/main.js"),
    path.resolve("src/main/preload.js"),
  ],
  bundle: true,
  target: "node14.16.1", // electron version target
  plugins: [nodeExternalsPlugin()],
};
