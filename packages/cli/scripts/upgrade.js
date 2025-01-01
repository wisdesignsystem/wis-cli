import "zx/globals";
import { createRequire } from "node:module";
import path from "node:path";
import { select } from "@inquirer/prompts";
import * as file from "@wisdesign/utils/file.js";
import * as tool from "@wisdesign/utils/tool.js";
import chalk from "chalk";
import ora from "ora";
import semver from "semver";

import cliPath from "../context/cliPath.js";

const require = createRequire(import.meta.url);

function isSameMajorVersion(v1, v2) {
  return semver.major(v1) === semver.major(v2);
}

function cleanVersion(version) {
  return version.replace(/\^|\~/g, "");
}

function getPackageManageName() {
  if (file.isExist(path.resolve(process.cwd(), "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (file.isExist(path.resolve(process.cwd(), "yarn.lock"))) {
    return "yarn";
  }

  return "npm";
}

async function getLastedStableVersion(name, currentVersion) {
  const data = await $`npm view ${name} versions --json`;
  const versions = JSON.parse(data.stdout).filter(
    (version) => !/alpha|beta|rc/.test(version),
  );

  let lastedVersion;
  let breakLastedVersion;
  for (let i = versions.length - 1; i >= 0; i--) {
    const version = versions[i];

    if (!isSameMajorVersion(currentVersion, version) && !breakLastedVersion) {
      breakLastedVersion = version;
    }

    if (isSameMajorVersion(currentVersion, version) && !lastedVersion) {
      lastedVersion = version;
    }

    if (lastedVersion) {
      break;
    }
  }

  return { lastedVersion, breakLastedVersion };
}

async function updateCli({
  packageManager,
  appPackageJson,
  cliPackageJson,
  version,
}) {
  if (appPackageJson.devDependencies[cliPackageJson.name]) {
    appPackageJson.devDependencies[cliPackageJson.name] = version;
  }

  if (appPackageJson.dependencies[cliPackageJson.name]) {
    appPackageJson.dependencies[cliPackageJson.name] = version;
  }

  await $`${packageManager} install`;
}

async function updateDependencies({
  packageManager,
  appPackageJson,
  cliPackageJson,
}) {
  const appPackagePath = path.resolve(process.cwd(), "package.json");
  const cliVersionJson = require(
    path.resolve(cliPath.rootPath, "versionInfo.json"),
  );

  for (const name in cliPackageJson.peerDependencies) {
    const version =
      cliVersionJson[name] ||
      cleanVersion(cliPackageJson.peerDependencies[name]);
    if (appPackageJson.dependencies[name]) {
      appPackageJson.dependencies[name] = version;
    } else if (appPackageJson.devDependencies[name]) {
      appPackageJson.devDependencies[name] = version;
    }
  }

  const code = tool.formatCode(JSON.stringify(appPackageJson), {
    parser: "json",
  });
  file.writeFile(appPackagePath, code);

  await $`${packageManager} install`;
}

export default async function () {
  const appPackagePath = path.resolve(process.cwd(), "package.json");
  let appPackageJson = require(appPackagePath);
  let cliPackageJson = require(cliPath.packagePath);
  const currentVersion = cleanVersion(
    appPackageJson.devDependencies[cliPackageJson.name] ||
      appPackageJson.dependencies[cliPackageJson.name],
  );

  const spin = ora().start();
  const { lastedVersion, breakLastedVersion } = await getLastedStableVersion(
    cliPackageJson.name,
    currentVersion,
  );
  spin.stop();

  const versionOptions = [];
  if (semver.lt(currentVersion, lastedVersion)) {
    versionOptions.push({
      name: lastedVersion,
      value: lastedVersion,
    });
  }

  if (breakLastedVersion) {
    versionOptions.push({
      name: `${breakLastedVersion}(${chalk.yellowBright("⚠️ BREAKING CHANGES!!!")})`,
      value: breakLastedVersion,
      description: "Make sure you know what you are doing before updating!!!",
    });
  }

  if (!versionOptions.length) {
    console.info(
      `🎉🎉🎉 CLI version is upgrade to the latest version ${chalk.cyanBright(lastedVersion)}.`,
    );
    console.info();
    process.exit(0);
  }

  const upgradeVersion = await select({
    message: "Select the new version you want to upgrade to",
    choices: versionOptions,
  });

  spin.start();

  appPackageJson = require(appPackagePath);
  cliPackageJson = require(cliPath.packagePath);

  const packageManager = getPackageManageName();
  await updateCli({
    packageManager,
    appPackageJson,
    cliPackageJson,
    version: upgradeVersion,
  });
  await updateDependencies({
    packageManager,
    appPackageJson,
    cliPackageJson,
  });

  spin.stop();

  console.info();
  console.info(
    `🎉🎉🎉 CLI version is upgrade to the latest version ${chalk.cyanBright(upgradeVersion)}.`,
  );
  console.info();
}
