import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Context, TemplateMeta } from "@wisdesign/context";

import type { FileMeta } from "./FileParser.js";
import { FileParser } from "./FileParser.js";
import { sourceImportPath, capitalize } from "./tool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.resolve(__dirname, "../../templates");

function getRouteParts(context: Context, filePath: string) {
  return path
    .dirname(filePath)
    .replace(context.path.src, "")
    .split(path.sep)
    .filter(Boolean)
    .slice(1);
}

export class PageFileParser extends FileParser {
  getRootPath() {
    return path.resolve(this.context.path.compiler, "pages/index.tsx");
  }

  getName(filePath: string) {
    const routeParts = getRouteParts(this.context, filePath);

    return routeParts
      .map((item, index) => {
        if (index === 0) {
          return item;
        }

        return capitalize(item);
      })
      .join("");
  }

  getComponentName(name: string) {
    return `P${capitalize(name)}`;
  }

  getRoutePath(filePath: string) {
    const routeParts = getRouteParts(this.context, filePath);

    if (routeParts.length === 0) {
      return "";
    }

    const routePath = routeParts.filter((item) => item !== "index").join("/");

    return routePath;
  }

  check(filePath: string): boolean {
    const basename = path.basename(filePath);
    const pageRegex = /.page.(ts|tsx)$/;
    const isPageFile = pageRegex.test(basename);
    const routeParts = getRouteParts(this.context, filePath);

    return isPageFile && routeParts.length > 0;
  }

  parse(filePath: string): FileMeta {
    const name = this.getName(filePath);

    const sourcePath = filePath;
    const targetName = `p${capitalize(name)}`
    const targetPath = path.resolve(
      this.context.path.compiler,
      `pages/${targetName}.ts`
    );
    const rootPath = this.getRootPath();

    const fileMeta = {
      type: "page",
      name: `page~${name}`,
      routePath: this.getRoutePath(filePath),
      component: {
        name: this.getComponentName(name),
        sourcePath,
        targetPath,
        importName: `page~${name}`,
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
        content: fs.readFileSync(path.resolve(templatesPath, "page.hbr"), "utf-8").toString(),
      },
      data: {
        importName: fileMeta.component.importName,
        importPath: fileMeta.component.importPath,
      },
    }
  }

  generateRoot(): TemplateMeta {
    return {
      name: "router",
      file: {
        path: this.getRootPath(),
        content: fs.readFileSync(path.resolve(templatesPath, "router.hbr"), "utf-8").toString(),
      },
      data: {
        browserRouter: this.context.config.browserRouter,
        pages: this.fileMeta,
      },
    }
  }
}
