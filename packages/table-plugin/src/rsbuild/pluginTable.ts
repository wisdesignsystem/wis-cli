import type { RsbuildPlugin } from "@rsbuild/core";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function pluginTable(): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "pluginTable",
    setup(api) {
      api.modifyRsbuildConfig((config) => {
        config.tools ||= {};
        config.tools.bundlerChain ||= [];

        if (typeof config.tools.bundlerChain === "function") {
          config.tools.bundlerChain = [config.tools.bundlerChain];
        }

        config.tools.bundlerChain.push((chain, { CHAIN_ID }) => {
          chain.module.rule(CHAIN_ID.RULE.TS)
            .use("table-loader")
            .after(CHAIN_ID.USE.SWC)
            .loader(require.resolve("./loaderTable"))
            .options({});
        });

        return config;
      });
    },
  };

  return plugin;
}
