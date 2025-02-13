import fs from "node:fs";
import type { Rspack } from "@rsbuild/core";
import { Context } from "@wisdesign/context";

import RemoteRspackPlugin from "@wisdesign/remote-plugin/rspack";

interface WisPluginOption {
  watchConfig?: boolean;
}

class WisPlugin {
  watchConfig: boolean;

  constructor(option: WisPluginOption) {
    this.watchConfig =
      typeof option?.watchConfig === "boolean" ? option.watchConfig : true;
  }

  apply(compiler: Rspack.Compiler) {
    const context = new Context();
    context.setup();

    fs.rmSync(context.compilerPath, { recursive: true, force: true });
    fs.mkdirSync(context.compilerPath, { recursive: true });

    new RemoteRspackPlugin({ context }).apply(compiler);
  }
}

export default WisPlugin;
