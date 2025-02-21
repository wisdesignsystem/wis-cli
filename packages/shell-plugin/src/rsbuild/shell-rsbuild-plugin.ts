import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { FileRouter } from "../lib/FileRouter.js";
import { Page } from "../lib/Page.js";
import { Layout } from "../lib/Layout.js";

export function shellRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "shellRsbuildPlugin",
    setup(api) {
      const fileRouter = new FileRouter(context);

      fileRouter.registerParser(new Page());
      fileRouter.registerParser(new Layout());

      fileRouter.start(context.path.src);

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
