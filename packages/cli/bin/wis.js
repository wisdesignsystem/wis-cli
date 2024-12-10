#!/usr/bin/env node

import cluster from "node:cluster";
import { createRequire } from "node:module";
import * as is from "@wisdesign/utils/is.js";
import { Command, InvalidArgumentError, Option } from "commander";
import figlet from "figlet";

import cliPath from "../context/cliPath.js";
import build from "../scripts/build.js";
import create, { validateName } from "../scripts/create.js";
import dev from "../scripts/dev.js";

const require = createRequire(import.meta.url);

// 是否是开发环境
function isDevelopment() {
  return process.argv[2] === "dev";
}

// 开发环境下需要启动主从进程，方便服务重启
if (isDevelopment() && cluster.isPrimary) {
  let worker;
  function create() {
    worker = cluster.fork();
    worker.on("message", (message) => {
      if (message === "RESTART") {
        worker.kill("SIGINT");
        create();
      }
    });
  }
  create();
} else {
  const cliPackage = require(cliPath.packagePath);

  console.info(figlet.textSync("Wis", "Ghost"));
  console.info(`👣 Wis v${cliPackage.version}`);
  console.info();

  function ensureName(value) {
    const message = validateName(value);
    if (is.isString(message) && message) {
      throw new InvalidArgumentError(message);
    }

    return value;
  }

  const cli = new Command();

  cli
    .name("wis")
    .description("一款集项目模版，研发和打包一体化的工具集合")
    .version(cliPackage.version, "-v --version", "查看工具版本号")
    .helpOption("-h, --help", "查看帮助信息")
    .helpCommand(false);

  cli
    .command("create")
    .description("创建模版项目")
    .argument("[name]", "项目或者库名称", ensureName)
    .addOption(
      new Option(
        "-t, --type <type>",
        "创建的模版类型，project项目类型，library库类型",
      ).choices(["project", "library"]),
    )
    .addOption(
      new Option("-s, --style <style>", "使用哪种样式处理器").choices([
        "css",
        "less",
      ]),
    )
    .option("--typescript", "是否使用typescript")
    .action((name, options) => {
      create({ name, ...options });
    });

  cli
    .command("dev")
    .description("启动开发环境")
    .action(() => {
      dev();
    });

  cli
    .command("build")
    .description("打包项目工程")
    .action(() => {
      build();
    });

  cli.parse();
}
