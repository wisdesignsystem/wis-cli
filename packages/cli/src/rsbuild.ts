import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { $ } from "zx";
import ora from "ora";

import type { CreatorOption } from "./create.js";
import { getLastedVersion } from "./lib/package.js";
import { writeTemplates } from "./lib/template.js";

const require = createRequire(import.meta.url);

function createRsbuild(option: CreatorOption) {
  return new Promise((resolve, reject) => {
    const params = [
      "create-rsbuild",
      `-d ${option.name}`,
      "-t react-ts",
      option.lint ? "--tools biome" : undefined,
    ].filter(Boolean) as string[];

    const rsbuild = spawn("npx", params, {
      stdio: "inherit",
      shell: true,
    });

    rsbuild.stdin?.on("data", (data) => {
      console.info(data.toString());
    });
    rsbuild.stdout?.on("data", (data) => {
      console.info(data.toString());
    });
    rsbuild.stderr?.on("data", (data) => {
      console.error(data.toString());
    });

    rsbuild.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(code);
      }
    });
  });
}

function writeTSConfig(option: CreatorOption) {
  const tsconfigPath = path.resolve(
    process.cwd(),
    `${option.name}/tsconfig.json`,
  );

  const tsconfig = JSON.parse(
    fs.readFileSync(tsconfigPath, "utf-8").replace(/\/\*.*\*\//g, ""),
  );

  tsconfig.compilerOptions ||= {};
  tsconfig.compilerOptions.paths ||= {};
  tsconfig.compilerOptions.paths["*"] = ["./@mf-types/*"];

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
}

async function writePackageJson(option: CreatorOption) {
  const packageJsonPath = path.resolve(
    process.cwd(),
    `${option.name}/package.json`,
  );

  const packageJson = require(packageJsonPath);
  packageJson.dependencies ||= {};
  packageJson.devDependencies ||= {};

  packageJson.dependencies.react = "18.2.0";
  packageJson.dependencies["react-dom"] = "18.2.0";
  packageJson.devDependencies["@types/react"] = "18.2.79";
  packageJson.devDependencies["@types/react-dom"] = "18.2.25";

  const wiscoreVersion = await getLastedVersion("wiscore");
  packageJson.dependencies.wiscore = wiscoreVersion;

  const lsiconVersion = await getLastedVersion("@wisdesign/lsicon");
  packageJson.dependencies["@wisdesign/lsicon"] = lsiconVersion;

  const wisPluginVersion = await getLastedVersion("@wisdesign/wis-plugin");
  packageJson.devDependencies["@wisdesign/wis-plugin"] = wisPluginVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

export async function create(option: CreatorOption) {
  await createRsbuild(option);

  const spin = ora().start();

  writeTSConfig(option);
  await writePackageJson(option);
  writeTemplates(option.name);

  await $`rm -rf ${option.name}/src/App.tsx`;
  await $`rm -rf ${option.name}/src/App.css`;
  await $`rm -rf ${option.name}/src/index.tsx`;

  spin.stop();
}
