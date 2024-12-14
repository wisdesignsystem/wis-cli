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
  console.info(`👣 CLI@${cliPackage.version}`);
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
    .description("A toolset that integrates project templates, development, and packaging")
    .version(cliPackage.version, "-v --version", "View tool version")
    .helpOption("-h, --help", "View help information")
    .helpCommand(false);

  cli
    .command("create")
    .description("Create a template project")
    .argument("[name]", "Project or library name", ensureName)
    .addOption(
      new Option(
        "-t, --type <type>",
        "Type of template to create, project or library",
      ).choices(["project", "library"]),
    )
    .addOption(
      new Option("-s, --style <style>", "Which style processor to use").choices([
        "css",
        "less",
      ]),
    )
    .option("--typescript", "Whether to use TypeScript")
    .action((name, options) => {
      create({ name, ...options });
    });

  cli
    .command("dev")
    .description("Start development server")
    .action(() => {
      dev();
    });

  cli
    .command("build")
    .description("Build the production")
    .action(() => {
      build();
    });

  cli.parse();
}
