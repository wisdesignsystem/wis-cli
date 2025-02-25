import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { FileSystem } from "../lib/FileSystem.js";

export function shellRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "shellRsbuildPlugin",
    setup(api) {
      const fileRouter = new FileSystem(context);

      fileRouter.start();

      api.onCloseDevServer(() => {
        fileRouter.stop();
      });

      api.onCloseBuild(() => {
        fileRouter.stop();
      });
    },
  };

  return plugin;
}
