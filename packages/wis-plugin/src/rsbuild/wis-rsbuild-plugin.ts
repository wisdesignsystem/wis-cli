import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import type { RsbuildPlugin } from "@rsbuild/core";
import { Context } from "@wisdesign/context";
import { remoteRsbuildPlugin } from "@wisdesign/remote-plugin/rsbuild";
import { crossRsbuildPlugin } from "@wisdesign/cross-plugin/rsbuild";

import { injectRemotePublicPath } from "./publicPath.js";

export function wisRsbuildPlugin(): RsbuildPlugin[] {
  const context = new Context();

  const plugin: RsbuildPlugin = {
    name: "wisRsbuildPlugin",
    setup(api) {
      context.reset();

      fs.rmSync(context.compilerPath, { recursive: true, force: true });
      fs.mkdirSync(context.compilerPath, { recursive: true });

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        injectRemotePublicPath({
          https: !!config.server?.https,
          port: config.server?.port || 3000,
          host: config.server?.host || "0.0.0.0",
          homepage: process.env.BASE_URL || "/",
        });

        const newConfig = mergeRsbuildConfig(config, {
          dev: {
            watchFiles: [
              {
                paths: [path.resolve(process.cwd(), "wis.config.ts")],
                type: "reload-server",
              },
            ],
          },
          tools: {
            cssLoader(option) {
              option.modules ||= {};
              // @ts-ignore
              option.modules.getLocalIdent = (
                // @ts-ignore
                ctx,
                // @ts-ignore
                _,
                // @ts-ignore
                localName
              ) => {
                if (context.config.libraryRegExp?.test(ctx.resourcePath)) {
                  const { name } = path.parse(ctx.resourcePath);

                  return `${context.config.name}-${name.replace(
                    /\.module$/,
                    ""
                  )}-${localName}`;
                }

                const hash = crypto
                  .createHash("sha256")
                  .update(ctx.resourcePath + localName)
                  .digest("base64")
                  .slice(0, 5);
                return `${localName}--${hash}`;
              };
            },
          },
        });
        return newConfig;
      });
    },
  };

  return [plugin, remoteRsbuildPlugin(context), crossRsbuildPlugin(context)];
}
