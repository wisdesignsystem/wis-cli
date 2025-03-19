import path from "node:path";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { addTemplate } from "../lib/template.js";
import { PluginRspackRemote } from "./pluginRspackRemote.js";

export function pluginRemote(context: Context): RsbuildPlugin {
  const plugin: RsbuildPlugin = {
    name: "pluginRemote",
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
        config.plugins.push(new PluginRspackRemote(context));

        config.optimization ||= {}
        config.optimization.runtimeChunk = "single"
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
