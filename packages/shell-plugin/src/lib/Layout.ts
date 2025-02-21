import type { Context } from "@wisdesign/context";

import type { FileParser, FileMeta } from "./FileParser.js";

export class Layout implements FileParser {
  check(context: Context, filePath: string) {
    return false
  }

  parse(context: Context, filePath: string): FileMeta {
  }
}