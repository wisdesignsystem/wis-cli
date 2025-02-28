import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { FileSystem } from "../lib/FileSystem.js";
import { LayoutFileParser } from "../lib/LayoutFileParser.js";
import { PageFileParser } from "../lib/PageFileParser.js";

export function shellRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "shellRsbuildPlugin",
    setup(api) {
      const fileRouter = new FileSystem(context);

      fileRouter.registerParser(new PageFileParser(context));
      fileRouter.registerParser(new LayoutFileParser(context));

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
