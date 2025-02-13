import path from "node:path";
import type { Context } from "@wisdesign/context";
import type { Rspack } from "@rsbuild/core";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

import { moduleFederation } from "./lib/moduleFederation.js";
import { copyTemplates } from "./lib/template.js";

interface RemotePluginOption {
  context: Context;
}

class RemotePlugin {
  context: Context;

  constructor(options: RemotePluginOption) {
    this.context = options.context;
  }

  apply(compiler: Rspack.Compiler) {
    copyTemplates(this.context);

    if (typeof compiler.options.entry === 'object') {
      compiler.options.entry
    }

    compiler.options.entry ||= {};
    compiler.options.entry ||= {};
    // @ts-ignore
    compiler.options.entry.index = {
      import: [path.resolve(this.context.compilerPath, "index.ts")],
    }

    const moduleFederationOptions = moduleFederation(this.context);
    new ModuleFederationPlugin(moduleFederationOptions).apply(compiler);
  }
}

export default RemotePlugin;
