import path from "node:path";
import { fileURLToPath } from 'node:url';
import type { Context } from "@wisdesign/context";
import type { ModuleFederationOptions } from "@module-federation/rsbuild-plugin";

import { remotes } from "./remotes.js";
import { exposes } from "./exposes.js";
import { shared } from "./shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function moduleFederation(context: Context): ModuleFederationOptions {
  return {
    name: context.config.name,
    filename: "remote.js",
    remotes: remotes(context),
    exposes: exposes(context),
    shared: shared(context),
    getPublicPath: `return "${process.env.PUBLIC_PATH}"`,
    manifest: {
      fileName: "manifest.json",
    },
    shareStrategy: "loaded-first",
    runtimePlugins: [path.resolve(__dirname, "./remoteEntryPlugin.js"), ...context.config.runtimePlugins],
  };
}
