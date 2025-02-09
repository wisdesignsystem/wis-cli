import path from "node:path"
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import { moduleFederation } from "./lib/moduleFederation.js"
import { copyTemplates } from "./lib/template.js"

export function remotePlugin(context: Context): RsbuildPlugin[] {
  const plugin: RsbuildPlugin = {
    name: "remotePlugin",
    setup(api) {
      copyTemplates(context);

      api.modifyRsbuildConfig((config) => {
        config.source ||= {};
        config.source.entry = {
          index: path.resolve(context.compilerPath, "index.ts"),
        };
        return config
      })
    },
  };

  const moduleFederationOptions = moduleFederation(context);
  return [
    plugin,
    pluginModuleFederation(moduleFederationOptions),
  ];
}
