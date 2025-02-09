import type { Context } from "@wisdesign/context";
import type { ModuleFederationOptions } from "@module-federation/rsbuild-plugin"

import { remotes } from "./remotes.js"
import { exposes } from "./exposes.js"
import { shared } from "./shared.js"
import { publicPath } from "./publicPath.js"

export function moduleFederation(context: Context): ModuleFederationOptions {
  return {
    name: context.config.name,
    filename: 'remote.js',
    remotes: remotes(context),
    exposes: exposes(context),
    shared: shared(context),
    getPublicPath: publicPath(),
    manifest: {
      fileName: "manifest.json"
    },
    shareStrategy: "loaded-first",
    runtimePlugins: [...context.config.runtimePlugins],
  };
}
