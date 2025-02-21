import type { Context } from "@wisdesign/context";

interface Element {
  name: string;
  sourcePath: string;
  targetPath: string;
}

export interface FileMeta {
  type: string;
  name: string;
  path: string;
  element: Element;
}

export abstract class FileParser {
  meta: FileMeta[] = [];

  abstract check(filePath: string): boolean;

  abstract parse(filePath: string): FileMeta;

  abstract render(fileMeta: FileMeta): string;

  create() {}

  remove() {}

  update() {}
}

export class FileSystem {
  parsers: FileParser[] = [];

  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  register(parser: FileParser) {
    this.parsers.push(parser);
  }

  matchParser(filePath: string) {}

  start() {}

  stop() {}
}
