import type { Context, TemplateMeta } from "@wisdesign/context";

interface Component {
  name: string;
  sourcePath: string;
  targetPath: string;
  importName: string;
  importPath: string;
  exportPath: string;
}

export interface FileMeta {
  type: string;
  name: string;
  routePath: string;
  component: Component;
}

export abstract class FileParser {
  context: Context;

  fileMeta: FileMeta[] = [];

  constructor(context: Context) {
    this.context = context;
  }

  isMatch(meta1: FileMeta, meta2: FileMeta) {
    return meta1.name === meta2.name && meta1.type === meta2.type;
  }

  isExist(meta: FileMeta) {
    return this.fileMeta.some((item) => this.isMatch(item, meta));
  }

  add(meta: FileMeta) {
    if (this.isExist(meta)) {
      return;
    }

    this.fileMeta.push(meta);
  }

  remove(meta: FileMeta) {
    this.fileMeta = this.fileMeta.filter((item) => !this.isMatch(item, meta));
  }

  update(meta: FileMeta) {
    this.fileMeta = this.fileMeta.map((item) => {
      if (this.isMatch(item, meta)) {
        return meta;
      }

      return item;
    });
  }

  abstract check(filePath: string): boolean;

  abstract parse(filePath: string): FileMeta;

  abstract generate(fileMeta: FileMeta): TemplateMeta;

  abstract generateRoot(): undefined | TemplateMeta;
}
