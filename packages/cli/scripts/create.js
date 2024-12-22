import { createRequire } from "node:module";
import path from "node:path";
import "zx/globals";
import { confirm, input } from "@inquirer/prompts";
import * as file from "@wisdesign/utils/file.js";
import * as is from "@wisdesign/utils/is.js";
import chalk from "chalk";
import download from "download-git-repo";
import ejs from "ejs";
import ora from "ora";

import cliPath from "../context/cliPath.js";

const require = createRequire(import.meta.url);

function downloadTemplate(source, target) {
  return new Promise((resolve, reject) => {
    download(source, target, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function validateName(value) {
  if (!/^[a-zA-Z]{1}[A-Za-z0-9_-]+$/.test(value)) {
    return "The application name can only consist of letters, numbers, underscores, and hyphens, and the first character must be a letter!";
  }

  return true;
}

async function answers(options) {
  const result = { ...options };

  if (is.isUndefined(result.name)) {
    result.name = await input({
      message: "What is your project named",
      required: true,
      validate: validateName,
    });
  }

  result.biome = await confirm({
    message: "Would you like to format and lint code(`biome` by default)",
    default: true,
  });
  result.alias = await confirm({
    message: "Would you like to customize the import alias(`@/*` by default)",
    default: true,
  });

  return result;
}

function getDependencies() {
  const packageJson = require(path.resolve(cliPath.rootPath, "package.json"));
  const peerDependencies = packageJson.peerDependencies;

  return Object.keys(peerDependencies).reduce((result, name) => {
    result[name] = peerDependencies[name].replace(/\^|~/g, "");
    return result;
  }, {});
}

export default async function create(options) {
  const config = await answers(options);
  const template = "wisdesignsystem/wis-basic-template#main";
  const applicationPath = path.resolve(process.cwd(), `./${config.name}`);

  console.info();
  console.info(`Creating wis application at ${applicationPath}`);
  console.info();

  const spin = ora().start();
  await downloadTemplate(template, applicationPath);

  const templateFiles = file.readdirDeep(applicationPath).filter((filePath) => {
    const ext = path.extname(filePath);
    return ext === ".ejs";
  });

  const renderContext = {
    config,
    packages: require(path.resolve(cliPath.rootPath, "versionInfo.json")),
    dependencies: getDependencies(),
  };

  for (let i = 0; i < templateFiles.length; i++) {
    const templateFilePath = templateFiles[i];
    const templateContent = file.readFile(templateFilePath);
    const { dir, name } = path.parse(templateFilePath);
    const nextPath = path.resolve(dir, name);
    const content = ejs.render(templateContent, renderContext);
    file.writeFile(nextPath, content);
    await $`rm ${templateFilePath}`;
  }
  spin.stop();

  const packageJson = require(path.resolve(applicationPath, "package.json"));

  console.info(`Using ${chalk.cyanBright("npm")} install dependency package.`);
  console.info();

  console.info("Dependencies:");
  for (const packageName in packageJson.dependencies) {
    console.info(`- ${chalk.cyanBright(packageName)}`);
  }
  console.info();

  console.info("DevDependencies:");
  for (const packageName in packageJson.devDependencies) {
    console.info(`- ${chalk.cyanBright(packageName)}`);
  }
  console.info();

  spin.start();
  await $`cd ${applicationPath} && git init && npm install`;
  spin.stop();

  if (config.biome) {
    await $`cd ${applicationPath} && npx husky@${packageJson.devDependencies.husky} init`;
    await $`echo '#!\/usr\/bin\/env sh\n\. "$(dirname "$0")\/\_\/husky.sh"\n\nnpx lint-staged' > ${path.resolve(applicationPath, "./.husky/pre-commit")}`;
  } else {
    await $`rm ${path.resolve(applicationPath, "biome.json")}`;
  }

  console.info();
  console.info(
    `${chalk.greenBright("Succeed!")} Created ${chalk.cyanBright(config.name)} app at ${chalk.cyanBright(applicationPath)}`,
  );
  console.info();
}
