import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

export function crossPlugin(context: Context): RsbuildPlugin {
  return {
    name: "crossPlugin",
    setup(api) {
      console.log('a')
    },
  };
}
