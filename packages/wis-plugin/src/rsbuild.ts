import fs from "node:fs";
import type { RsbuildPlugin } from "@rsbuild/core";
import { remotePlugin } from "@wisdesign/remote-plugin/rsbuild";
import { crossPlugin } from "@wisdesign/cross-plugin/rsbuild";
import { Context } from "@wisdesign/context";

export function wisPlugin(): RsbuildPlugin[] {
  const context = new Context();
  context.setup();

  const plugin: RsbuildPlugin = {
    name: "wisRsbuildPlugin",
    setup(api) {
      context.setup();

      fs.rmSync(context.compilerPath, { recursive: true, force: true });
      fs.mkdirSync(context.compilerPath, { recursive: true });

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const newConfig = mergeRsbuildConfig(config, {
          dev: {
            watchFiles: [{
              paths: context.config.configFile,
              type: 'reload-page',
            }],
          },
        })
        return newConfig
      })
    },
  };

  return [plugin, ...remotePlugin(context), crossPlugin(context)];
}
