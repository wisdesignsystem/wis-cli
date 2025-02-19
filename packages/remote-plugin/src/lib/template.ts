import fs from "node:fs";
import path from "node:path";
import type { Context } from "@wisdesign/context";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.resolve(__dirname, "../../templates");

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

export function createTemplates(context: Context) {
  readdir(templatesPath, (templateFilePath) => {
    const name = path.basename(templateFilePath, ".hbr");
    const filePath = path.resolve(context.path.compiler, name)
    const fileContent = fs.readFileSync(templateFilePath, "utf-8").toString();
    context.template.addTemplate(name, filePath, fileContent);
  })
}
