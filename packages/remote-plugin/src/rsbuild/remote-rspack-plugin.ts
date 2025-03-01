import path from "node:path";
import { fileURLToPath } from "node:url";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import type { Rspack } from "@rsbuild/core";
import type { Context } from "@wisdesign/context";

import { exposes } from "../lib/exposes.js";
import { remotes } from "../lib/remotes.js";
import { shared } from "../lib/shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      dts: {
        generateTypes: {
          extractRemoteTypes: true,
          extractThirdParty: true,
          generateAPITypes: true,
          compileInChildProcess: true,
          abortOnError: false,
          deleteTypesFolder: true,
          compilerInstance: "tsc",
        },
        consumeTypes: {
          consumeAPITypes: true,
          maxRetries: 3,
          abortOnError: false,
          deleteTypesFolder: true,
        },
      },
    }).apply(compiler);
  }
}
