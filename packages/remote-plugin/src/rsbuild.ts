import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import { getMFConfig } from "./mf.js"

export function remotePlugin(context: Context): RsbuildPlugin[] {
  const plugin: RsbuildPlugin = {
    name: "remotePlugin",
    setup(api) {
    },
  };

  return [
    plugin,
    pluginModuleFederation(getMFConfig(context)),
  ];
}
