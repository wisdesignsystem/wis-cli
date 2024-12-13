#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import docgen from "react-docgen-typescript";
import { Command } from "commander";
import { fileURLToPath } from "node:url";
import * as file from "@wisdesign/utils/file.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const packageData = require(path.resolve(__dirname, "../package.json"));

const token = new Command();
token
  .name("typescript-docgen")
  .description(
    "A quick tool for create the component packages typescript definition json files",
  )
  .version(packageData.version)
  .helpOption("-h, --help", "View help information")
  .requiredOption(
    "-s, --source <file>",
    "The source path of component packages",
  )
  .requiredOption(
    "-o, --output <path>",
    "the output path of component packages typescript definition json files",
  );

token.parse();
const opts = token.opts();

function readDefinitions(filePath) {
  return docgen.parse(path.resolve(process.cwd(), filePath), {
    savePropValueAsString: false,
    shouldExtractLiteralValuesFromEnum: true,
    propFilter: (prop) => {
      if (prop.declarations && prop.declarations.length > 0) {
        const hasPropAdditionalDescription = prop.declarations.find(
          (declaration) => {
            return !declaration.fileName.includes("node_modules");
          },
        );

        return Boolean(hasPropAdditionalDescription);
      }

      return true;
    },
  });
}

function writeDefinitions(filePath, definitions) {
  file.writeFile(filePath, `export default ${JSON.stringify(definitions)}`);
}

const sourceFilePath = path.resolve(process.cwd(), opts.source);
const targetFilePath = path.resolve(process.cwd(), opts.output);

const definitions = {};
fs.readdirSync(sourceFilePath).map((fileName) => {
  const filePath = path.resolve(sourceFilePath, fileName);
  let indexFilePath;
  if (file.isExist(path.resolve(filePath, "index.ts"))) {
    indexFilePath = path.resolve(filePath, "index.ts");
  } else if (file.isExist(path.resolve(filePath, "pc/index.ts"))) {
    indexFilePath = path.resolve(filePath, "pc/index.ts");
  }

  if (!indexFilePath) {
    return;
  }

  const currentDefinitions = readDefinitions(indexFilePath);
  for (const definition of currentDefinitions) {
    definitions[definition.displayName] = definition;
  }
});

writeDefinitions(targetFilePath, definitions);
