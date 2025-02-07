import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("ts-node/register");

export function loadPackageJSON() {
  const data = require(path.resolve(process.cwd(), "package.json"))
  return data;
}

export function loadTSConfigFile(file: string) {
  if (!fs.existsSync(file)) {
    return;
  }

  const { default: config } = require(file);
  return config;
}
