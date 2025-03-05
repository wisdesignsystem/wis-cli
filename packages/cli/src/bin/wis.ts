#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

import { create } from "../create.js";
import { token } from "../token.js";

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

cli
  .command("token")
  .description("Generate CSS variables from theme JSON files")
  .requiredOption("--dark <file>", "Dark theme token file")
  .requiredOption("--light <file>", "Light theme token file")
  .requiredOption("--component <file>", "Component theme token file")
  .requiredOption("--palette <file>", "Palette theme token file")
  .requiredOption("--gray <files...>", "Gray theme token file")
  .requiredOption("-t, --themes <files...>", "Theme JSON file paths")
  .option("-p, --scope <scope>", "CSS variable prefix", "wis")
  .option("-o, --output <dir>", "Output directory", "./dist")
  .action(token);

cli.parse();
