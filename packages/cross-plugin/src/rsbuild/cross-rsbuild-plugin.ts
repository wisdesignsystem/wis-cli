import { createRequire } from "node:module";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { getPXToVWConfig } from "../lib/config.js";

const require = createRequire(import.meta.url);

export function crossRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "crossRsbuildPlugin",
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const newConfig = mergeRsbuildConfig(config, {
          tools: {
            postcss(_, { addPlugins }) {
              addPlugins(
                require("postcss-px-conversion")(getPXToVWConfig(context))
              );
            },
          },
          html: {
            meta({ value }) {
              value.viewport =
                "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, viewport-fit=cover";
              return value;
            },
          },
        });

        return newConfig;
      });
    },
  };

  return plugin;
}
