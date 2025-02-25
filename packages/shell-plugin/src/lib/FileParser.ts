import type { Context, TemplateMeta } from "@wisdesign/context";

interface Component {
  name: string;
  sourcePath: string;
  targetPath: string;
}

export interface FileMeta {
  type: string;
  name: string;
  routePath: string;
  component: Component;
}

export interface FileParser {
  check(filePath: string): boolean;

  parse(filePath: string): FileMeta;

  generate(fileMeta: FileMeta): TemplateMeta;

  generateRoot(): undefined | TemplateMeta;
}
