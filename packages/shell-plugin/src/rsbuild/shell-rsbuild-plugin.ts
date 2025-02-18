import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

export function shellRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "shellRsbuildPlugin",
    setup(api) {
      
    },
  };

  return plugin;
}
