#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

import { create } from "../create.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

const { version } = require(path.resolve(__dirname, "../../package.json"));

const cli = new Command()
  .name("wis")
  .description("Wis Design quickstart cli toolkit.")
  .version(version);

cli
  .command("create")
  .description("Create a new wis project")
  .action(() => {
    create();
  });

cli.parse();
