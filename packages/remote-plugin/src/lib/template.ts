import path from "node:path";
import fs from "node:fs";
import type { Context } from "@wisdesign/context";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateRootPath = path.resolve(__dirname, "../../templates");

function readdir(filePath: string, fn: (filePath: string) => void) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const files = fs.readdirSync(filePath);

  for (const fileName of files) {
    const nextFilePath = path.resolve(filePath, fileName);
    const stat = fs.statSync(nextFilePath);

    if (stat.isDirectory()) {
      readdir(nextFilePath, fn);
    } else {
      fn(nextFilePath);
    }
  }
}

export function copyTemplates(context: Context) {
  if (!fs.existsSync(templateRootPath)) {
    return;
  }

  readdir(templateRootPath, (filePath) => {
    const fileOutputContent = fs.readFileSync(filePath, "utf-8").toString();
    const fileOutputPath = filePath.replace(
      templateRootPath,
      context.compilerPath
    );

    const fileOutputDirectory = path.dirname(fileOutputPath);
    if (!fs.existsSync(fileOutputDirectory)) {
      fs.mkdirSync(fileOutputDirectory, { recursive: true });
    }

    fs.writeFileSync(fileOutputPath, fileOutputContent);
  });
}
