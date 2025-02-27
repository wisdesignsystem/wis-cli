import path from "node:path";
import type { Rspack } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

import { remotes } from "../lib/remotes.js";
import { exposes } from "../lib/exposes.js";
import { shared } from "../lib/shared.js";

export class RemoteRspackPlugin {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  apply(compiler: Rspack.Compiler) {
    new ModuleFederationPlugin({
      name: this.context.config.name,
      filename: "remote.js",
      remotes: remotes(this.context),
      exposes: exposes(this.context),
      shared: shared(this.context),
      getPublicPath: `return "${process.env.PUBLIC_PATH}"`,
      manifest: {
        fileName: "manifest.json",
      },
      shareStrategy: "loaded-first",
      runtimePlugins: [
        path.resolve(__dirname, "../lib/remoteEntryPlugin.js"),
        ...this.context.config.runtimePlugins,
      ],
    }).apply(compiler);
  }
}
