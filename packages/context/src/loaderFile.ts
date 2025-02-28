import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const { register } = require("@swc-node/register/register");
register();

export function loadPackageJSON() {
  const data = require(path.resolve(process.cwd(), "package.json"));
  return data;
}

function loadConfigFile(file: string) {
  delete require.cache[file];
  const { default: config } = require(file);
  return config;
}

export function loadConfig() {
  const TSConfigFile = path.resolve(process.cwd(), "wis.config.ts");
  if (fs.existsSync(TSConfigFile)) {
    return loadConfigFile(TSConfigFile);
  }

  return;
}
