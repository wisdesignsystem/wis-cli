#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import typescriptDocgen from "react-docgen-typescript";
import { Command } from "commander";

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

function genDefinition(filePath) {
  
}

const definitions = typescriptDocgen.parse(
  path.resolve(process.cwd(), opts.source),
  {
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
  },
);
const content = JSON.stringify(definitions);

console.log(content);
