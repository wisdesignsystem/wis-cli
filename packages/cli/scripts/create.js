import { createRequire } from "node:module";
import path from "node:path";
import * as file from "@wisdesign/utils/file.js";
import * as is from "@wisdesign/utils/is.js";
import * as shell from "@wisdesign/utils/shell.js";
import trace from "@wisdesign/utils/trace.js";
import chalk from "chalk";
import download from "download-git-repo";
import ejs from "ejs";
import inquirer from "inquirer";
import ora from "ora";

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
  const data = [];

  if (is.isUndefined(options.name)) {
    data.push({
      type: "input",
      name: "name",
      message: "Project Name",
      validate: validateName,
    });
  }

  if (data.length) {
    const result = await inquirer.prompt(data);
    return { ...options, ...result };
  }

  return Promise.resolve(options);
}

function getDependencies() {
  const packageJson = require("../package.json");
  const peerDependencies = packageJson.peerDependencies;

  return Object.keys(peerDependencies).reduce((result, name) => {
    result[name] = peerDependencies[name].replace(/\^|~/g, "");
    return result;
  }, {})
}

export default async function create(options) {
  const config = await answers(options);
  const template = "wisdesignsystem/wis-basic-template#main"

  console.info();
  const spin = ora("Download Template...").start();
  const projectPath = `./${config.name}`;
  await downloadTemplate(template, projectPath).catch((error) => {
    spin.clear();
    spin.stop();
    trace.error("Download failed...");
    console.info();
    throw error;
  });
  spin.clear();
  spin.stop();
  trace.success("Download successful...");
  console.info();

  const templateFiles = file.readdirDeep(projectPath).filter((filePath) => {
    const ext = path.extname(filePath);
    return ext === ".ejs";
  });

  const renderContext = {
    config,
    packages: require("../versionInfo.json"),
    dependencies: getDependencies(),
  };

  for (let i = 0; i < templateFiles.length; i++) {
    trace.note(`[%d/${templateFiles.length}] - Apply template...`, i + 1);
    const templateFilePath = templateFiles[i];
    const templateContent = file.readFile(templateFilePath);
    const { dir, name } = path.parse(templateFilePath);
    const nextPath = path.resolve(dir, name);
    const content = ejs.render(templateContent, renderContext);
    file.writeFile(nextPath, content);
    shell.execSync(`rm ${templateFilePath}`);
  }

  console.info();

  shell.execSync(`cd ${projectPath} && git init`);

  trace.note("Application created successfully, thank you for using Wis");
  trace.note("You can run the following command to start the program");
  console.info();
  trace.note("Enter the project directory");
  trace.note(chalk.yellowBright(`cd ${config.name}`));
  console.info();
  trace.note("Install dependencies");
  trace.note(chalk.yellowBright("npm install"));
  console.info();
  trace.note("Start development");
  trace.note(chalk.yellowBright("npm run dev"));
  console.info();
  trace.note("Build production");
  trace.note(chalk.yellowBright("npm run build"));
  console.info();
  trace.note("Start your joyful coding journey!!!");
  console.info();
}
