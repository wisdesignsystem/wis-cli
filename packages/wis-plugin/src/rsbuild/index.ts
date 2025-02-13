import type { RsbuildPlugin } from "@rsbuild/core";
import { configFile } from "@wisdesign/context"

import WisRspackPlugin from "./rspack.js";
import { injectRemotePublicPath } from "./publicPath.js"

export function wisPlugin(): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "wisRsbuildPlugin",
    setup(api) {
      api.modifyRspackConfig((config) => {
        config.plugins ||= [];
        config.plugins.push(new WisRspackPlugin({ watchConfig: false }));
      });

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        injectRemotePublicPath({
          https: !!config.server?.https,
          port: config.server?.port || 3000,
          host: config.server?.host || '0.0.0.0',
          homepage: process.env.BASE_URL || '/',
        });

        const newConfig = mergeRsbuildConfig(config, {
          dev: {
            watchFiles: [
              {
                paths: configFile,
                type: "reload-page",
              },
            ],
          },
        });
        return newConfig;
      });
    },
  };

  return plugin;
}
