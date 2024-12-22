import path from "node:path";
import { ObjectSet } from "@wisdesign/configure";
import { ip } from "address";
import chalk from "chalk";
import clipboard from "clipboardy";
import WebpackDevServer from "webpack-dev-server";

import plugin from "./plugin.js";

function getHttpsConfig(context) {
  if (process.env.HTTPS !== "true") return false;

  const { HTTPS_KEY, HTTPS_CERT } = process.env;
  if (process.env.HTTPS_CERT && process.env.HTTPS_KEY) {
    const keyFilePath = path.resolve(context.path.runtime, HTTPS_KEY);
    const certFilePath = path.resolve(context.path.runtime, HTTPS_CERT);

    return {
      key: keyFilePath,
      cert: certFilePath,
    };
  }
}

function resolveServerUrl() {
  const isHttps = process.env.HTTPS === "true";

  const host = process.env.HOST;
  const port = isHttps ? process.env.HTTPS_PORT : process.env.PORT;
  const publicPath = process.env.PUBLIC_URL;

  const protocol = isHttps ? "https://" : "http://";
  const localhost =
    host === "127.0.0.1" || host === "0.0.0.0" ? "localhost" : host;

  return {
    localUrl: `${protocol}${localhost}:${port}${publicPath}`,
    realUrl: `${protocol}${ip()}:${port}${publicPath}`,
  };
}

export default class {
  constructor(context) {
    this.context = context;
    this.config = new ObjectSet("webpackDevServer");
  }

  initial() {
    const isHttps = process.env.HTTPS === "true";
    const isFastRefresh = process.env.FAST_REFRESH === "true";

    this.config.set("allowedHosts", "all");
    this.config.set("host", process.env.HOST);
    this.config.set(
      "port",
      isHttps ? process.env.HTTPS_PORT : process.env.PORT,
    );
    this.config.set("open", false);
    this.config.set("hot", isFastRefresh);
    this.config.set("liveReload", !isFastRefresh);
    this.config.set("compress", true);
    this.config.set("headers", {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    });
    this.config.set("static", {
      directory: this.context.path.public,
      publicPath: process.env.PUBLIC_URL,
    });
    this.config.set(
      "server",
      isHttps
        ? {
            type: "https",
            options: getHttpsConfig(this.context),
          }
        : "http",
    );
    this.config.set("historyApiFallback", true);
    this.config.set("setupExitSignals", true);
    this.config.set("client", {
      overlay: false,
      progress: false,
    });
    this.config.set("devMiddleware", {
      publicPath: process.env.PUBLIC_URL,
    });
  }

  async run(compiler) {
    this.initial();

    plugin.hooks.webpackDevServerConfigure.call(this.config);
    const webpackDevServerConfig = plugin.hooks.webpackDevServerConfig.call(
      this.config.toValue(),
    );
    const webpackDevServer = new WebpackDevServer(
      webpackDevServerConfig,
      compiler,
    );
    plugin.hooks.webpackDevServer.call(webpackDevServer);

    const url = resolveServerUrl();
    webpackDevServer.startCallback(() => {
      let isFirstCompilerDone = true;

      compiler.hooks.done.tap("done", () => {
        setTimeout(() => {
          console.info("Develop server listening at");
          console.info();
          console.info(`${chalk.cyanBright(url.localUrl)}`);
          console.info(`${chalk.cyanBright(url.realUrl)}`);
          console.info();

          if (isFirstCompilerDone) {
            isFirstCompilerDone = false;
            clipboard.writeSync(url.localUrl);
            console.info("The browser url has been copied to the clipboard.");
          }
        }, 0);
      });
    });

    // 注册结束信号监听
    const closeSigns = ["SIGINT", "SIGTERM"];
    for (const sign of closeSigns) {
      process.on(sign, () => {
        webpackDevServer.stop();
        process.exit(0);
      });
    }
  }
}
