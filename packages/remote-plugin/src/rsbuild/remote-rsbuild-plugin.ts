import path from "node:path";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { addTemplate } from "../lib/template.js";
import { RemoteRspackPlugin } from "./remote-rspack-plugin.js";

export function remoteRsbuildPlugin(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "remoteRsbuildPlugin",
    setup(api) {
      addTemplate(context, "index.ts.hbr", {});
      addTemplate(context, "bootstrap.tsx.hbr", {
        appName: "App",
        appPath: "../App",
      });

      api.modifyRspackConfig((config) => {
        config.output ||= {};
        config.output.uniqueName = context.config.name;
        config.output.publicPath = process.env.PUBLIC_PATH;

        config.plugins ||= [];
        config.plugins.push(new RemoteRspackPlugin(context));
      });

      api.modifyRsbuildConfig((config) => {
        config.source ||= {};
        config.source.entry = {
          index: path.resolve(context.path.compiler, "index.ts"),
        };
        return config;
      });
    },
  };

  return plugin;
}
