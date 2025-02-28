import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.resolve(__dirname, "../../templates");

function createFile(filePath: string, fileContent: string) {
  const fileDirectory = path.dirname(filePath);

  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  fs.writeFileSync(filePath, fileContent);
}

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

export function writeTemplates(projectName: string) {
  readdir(templatesPath, (templateFilePath) => {
    const templateBasename = path.basename(templateFilePath, ".tpl");
    const templateDirname = path.dirname(templateFilePath);

    const filePath = path.resolve(
      process.cwd(),
      `${projectName}${path.resolve(templateDirname, templateBasename).replace(templatesPath, "")}`,
    );
    const fileContent = fs.readFileSync(templateFilePath, "utf-8");

    createFile(filePath, fileContent);
  });
}
