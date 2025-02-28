import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Context, TemplateMeta } from "@wisdesign/context";

import { FileParser } from "./FileParser.js";
import type { FileMeta } from "./FileParser.js";
import { capitalize, sourceImportPath } from "./tool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.resolve(__dirname, "../../templates");

function getLayoutParts(context: Context, filePath: string) {
  return path
    .dirname(filePath)
    .replace(context.path.src, "")
    .split(path.sep)
    .filter(Boolean)
    .slice(1);
}

export class LayoutFileParser extends FileParser {
  getRootPath() {
    return path.resolve(this.context.path.compiler, "layouts/Index.tsx");
  }

  getName(filePath: string) {
    return path.basename(path.dirname(filePath));
  }

  getComponentName(name: string) {
    return `L${capitalize(name)}`;
  }

  check(filePath: string): boolean {
    const basename = path.basename(filePath);
    const layoutRegex = /.layout.(ts|tsx)$/;
    const isLayoutFile = layoutRegex.test(basename);
    const layoutParts = getLayoutParts(this.context, filePath);

    return isLayoutFile && layoutParts.length > 0;
  }

  parse(filePath: string): FileMeta {
    const name = this.getName(filePath);

    const sourcePath = filePath;
    const targetName = `l${capitalize(name)}`;
    const targetPath = path.resolve(
      this.context.path.compiler,
      `layouts/${targetName}.ts`,
    );
    const rootPath = this.getRootPath();

    const fileMeta = {
      type: "layout",
      name: `layout~${name}`,
      routePath: name,
      component: {
        name: this.getComponentName(name),
        sourcePath,
        targetPath,
        importName: `layout~${name}`,
        importPath: sourceImportPath(targetPath, sourcePath),
        exportPath: sourceImportPath(rootPath, targetPath),
      },
    };

    return fileMeta;
  }

  generate(fileMeta: FileMeta): TemplateMeta {
    return {
      name: fileMeta.name,
      file: {
        path: fileMeta.component.targetPath,
        content: fs
          .readFileSync(path.resolve(templatesPath, "layout.hbr"), "utf-8")
          .toString(),
      },
      data: {
        importName: fileMeta.component.importName,
        importPath: fileMeta.component.importPath,
      },
    };
  }

  generateRoot(): undefined | TemplateMeta {
    return {
      name: "layoutEntry",
      file: {
        path: this.getRootPath(),
        content: fs
          .readFileSync(path.resolve(templatesPath, "layoutEntry.hbr"), "utf-8")
          .toString(),
      },
      data: {
        browserRouter: this.context.config.browserRouter,
        layouts: this.fileMeta,
      },
    };
  }
}
