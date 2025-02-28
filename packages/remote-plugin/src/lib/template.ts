import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Context } from "@wisdesign/context";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.resolve(__dirname, "../../templates");

export function addTemplate(
  context: Context,
  templateFile: string,
  data: Record<string, unknown>,
) {
  const templateFilePath = path.resolve(templatesPath, templateFile);

  const name = path.basename(templateFilePath, ".hbr");
  const filePath = path.resolve(context.path.compiler, name);
  const fileContent = fs.readFileSync(templateFilePath, "utf-8").toString();
  const file = { path: filePath, content: fileContent };
  const template = context.template.create(name, file, data);
  context.template.add(template);
}
