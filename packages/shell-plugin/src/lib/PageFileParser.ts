import path from "node:path";
import type { Context, TemplateMeta } from "@wisdesign/context";

import type { FileParser, FileMeta } from "./FileParser.js";

export class PageFileParser implements FileParser {
  context: Context;

  fileMeta: FileMeta[] = [];

  constructor(context: Context) {
    this.context = context;
  }

  getName(filePath: string) {
    return "";
  }

  parseRoutePath(filePath: string) {
    const dirname = path.dirname(filePath);
    const routePaths = dirname
      .replace(this.context.path.src, "")
      .split(path.sep)
      .filter(Boolean)
      .slice(1);

    if (routePaths.length === 0) {
      return ""
    }

    return routePaths.join("/") || "/";
  }

  check(filePath: string): boolean {
    const basename = path.basename(filePath);
    const pageRegex = /.page.(ts|tsx)$/;
    const isPageFile = pageRegex.test(basename);

    return isPageFile && !!this.parseRoutePath(filePath);
  }

  parse(filePath: string): FileMeta {
    const name = this.getName(filePath);

    const fileMeta = {
      type: "page",
      name,
      routePath: this.parseRoutePath(filePath),
      component: {
        name,
        sourcePath: filePath,
        targetPath: "",
      },
    };

    return fileMeta;
  }

  generate(fileMeta: FileMeta): TemplateMeta {}

  generateRoot(): undefined | TemplateMeta {}
}

/index/index/index