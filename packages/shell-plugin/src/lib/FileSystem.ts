import type { Context } from "@wisdesign/context";
import chokidar, { type FSWatcher } from "chokidar";

import type { FileParser } from "./FileParser.js";

export class FileSystem {
  parsers: FileParser[] = [];

  context: Context;

  watcher?: FSWatcher;

  constructor(context: Context) {
    this.context = context;
  }

  registerParser(parser: FileParser) {
    this.parsers.push(parser);
  }

  matchParser(filePath: string) {
    return this.parsers.find(parser => parser.check(filePath))
  }

  start() {
    this.stop();

    this.watcher = chokidar.watch(this.context.path.src, {
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

  create(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(filePath);
    parser.add(fileMeta);
    const templateMeta = parser.generate(fileMeta);

    const template = this.context.template.create(templateMeta.name, templateMeta.file, templateMeta.data);
    this.context.template.add(template);

    const rootTemplateMeta = parser.generateRoot();
    if (rootTemplateMeta) {
      this.context.template.add(rootTemplateMeta);
    }

    this.context.template.render();
  }

  remove(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(filePath);
    parser.remove(fileMeta);
    this.context.template.remove(fileMeta.name);

    const rootTemplateMeta = parser.generateRoot();
    if (rootTemplateMeta) {
      this.context.template.update(rootTemplateMeta);
    }

    this.context.template.render();
  }

  change() {
    // no action
  }
}
