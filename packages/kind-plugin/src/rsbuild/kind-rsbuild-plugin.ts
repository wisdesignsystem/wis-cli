import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function kindRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "kindRsbuildPlugin",
    setup() {
      const noneFilePath = path.resolve(context.path.compiler, "none.ts");
      const template = context.template.create(
        "none",
        {
          path: noneFilePath,
          content: "export default {}",
        },
        {}
      );
      context.template.add(template);
      context.config.exposes["./$none"] = noneFilePath;

      context.config.addRuntimePlugin(
        path.resolve(__dirname, "../lib/kindPlugin.js")
      );
    },
  };

  return plugin;
}
