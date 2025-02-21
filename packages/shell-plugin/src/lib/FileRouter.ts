import fs from "node:fs";
import type { Context } from "@wisdesign/context";
import chokidar, { type FSWatcher } from "chokidar";

import type { FileParser, FileMeta } from "./FileParser.js"

export class FileRouter {
  parsers: FileParser[] = [];

  context: Context;

  watcher?: FSWatcher;

  fileMeta: FileMeta[] = [];

  constructor(context: Context) {
    this.context = context;
  }

  start(routerRootPath: string) {
    this.stop();

    this.watcher = chokidar.watch(routerRootPath, {
      ignored: this.context.path.compiler,
    });
    this.watcher
      .on("add", this.create.bind(this))
      .on("unlink", this.remove.bind(this))
      .on("change", this.change.bind(this));
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  registerParser(parser: FileParser) {
    this.parsers.push(parser);
  }

  matchParser(filePath: string) {
    return this.parsers.find(parser => parser.check(this.context, filePath))
  }

  create(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(this.context, filePath);
    this.fileMeta.push(fileMeta);

    const fileContent = parser.render(fileMeta);
  }

  remove(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(this.context, filePath);
    this.fileMeta = this.fileMeta.filter(meta => {
      return fileMeta.type === meta.type && fileMeta.path === meta.path
    });

    fs.rmSync(fileMeta.elementTargetPath);
  }

  change(filePath: string) {
    console.log('change', filePath)
  }
}
