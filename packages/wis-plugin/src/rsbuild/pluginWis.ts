import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { RsbuildPlugin } from "@rsbuild/core";
import { Context } from "@wisdesign/context";
import { pluginCross } from "@wisdesign/cross-plugin/rsbuild";
import { pluginKind } from "@wisdesign/kind-plugin/rsbuild";
import { pluginRemote } from "@wisdesign/remote-plugin/rsbuild";
import { pluginShell } from "@wisdesign/shell-plugin/rsbuild";

import { injectRemotePublicPath } from "./publicPath.js";

export function pluginWis(): RsbuildPlugin[] {
  const context = new Context();

  const plugin: RsbuildPlugin = {
    name: "pluginWis",
    setup(api) {
      context.reset();

      fs.rmSync(context.path.compiler, { recursive: true, force: true });

      api.onBeforeCreateCompiler(() => {
        context.template.render();
      });

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const rawConfig = api.getRsbuildConfig('original');

        const port = rawConfig.server?.port || 3000;
        const host = rawConfig.server?.host || "localhost";

        injectRemotePublicPath({
          https: !!config.server?.https,
          port,
          host,
          homepage: process.env.BASE_URL || "/",
        });

        process.env.MOUNT_ID = config.html?.mountId || "root";

        const newConfig = mergeRsbuildConfig(config, {
          server: {
            port,
            host,
          },
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
                localName,
              ) => {
                if (context.config.libraryRegExp?.test(ctx.resourcePath)) {
                  const { name } = path.parse(ctx.resourcePath);

                  return `${context.config.name}-${name.replace(
                    /\.module$/,
                    "",
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
          source: {
            define: {
              "process.env.MOUNT_ID": JSON.stringify(process.env.MOUNT_ID),
            },
          },
        });
        return newConfig;
      });
    },
  };

  return [
    plugin,
    pluginRemote(context),
    pluginCross(context),
    pluginKind(context),
    pluginShell(context),
  ];
}
