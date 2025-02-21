import type { Context } from "@wisdesign/context";

export interface FileMeta {
  type: string;
  name: string;
  path: string;
  elementName: string;
  elementSourcePath: string;
  elementTargetPath: string;
}

export interface FileParser {
  check(context: Context, filePath: string): boolean;

  parse(context: Context, filePath: string): FileMeta;

  renderFile(fileMeta: FileMeta): string;
}
