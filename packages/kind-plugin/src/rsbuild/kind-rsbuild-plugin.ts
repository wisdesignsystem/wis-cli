import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function kindRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "kindRsbuildPlugin",
    setup() {
      context.config.addRuntimePlugin(
        path.resolve(__dirname, "../lib/kindPlugin.js"),
      );
    },
  };

  return plugin;
}
