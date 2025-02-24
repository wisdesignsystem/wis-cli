import fs from "node:fs";
import path from "node:path";
import type { Context } from "@wisdesign/context";
import chokidar, { type FSWatcher } from "chokidar";

interface Component {
  name: string;
  sourcePath: string;
  targetPath: string;
}

interface Route {
  index: boolean;
  path: string;
}

export interface FileMeta {
  type: string;
  route: Route;
  component: Component;
  children: FileMeta[];
}

interface File {
  path: string;
  content: string;
}

export abstract class FileParser {
  context: Context;

  meta: FileMeta[] = [];

  constructor(context: Context) {
    this.context = context;
  }

  abstract check(filePath: string): boolean;

  abstract parse(filePath: string): FileMeta;

  abstract generate(fileMeta: FileMeta): File;

  abstract generateRoot(): undefined | File;
}

function writeFile(filePath: string, fileContent: string) {
  const fileDirectory = path.dirname(filePath);

  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  fs.writeFileSync(filePath, fileContent);
}

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
    const file = parser.generate(fileMeta);
    writeFile(file.path, file.content);

    const rootFile = parser.generateRoot();
    if (rootFile) {
      writeFile(rootFile.path, rootFile.content);
    }
  }

  remove(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(filePath);
    fs.rmSync(fileMeta.component.targetPath);

    const rootFile = parser.generateRoot();
    if (rootFile) {
      writeFile(rootFile.path, rootFile.content);
    }
  }

  change(filePath: string) {
    const parser = this.matchParser(filePath);
    if (!parser) {
      return;
    }

    const fileMeta = parser.parse(filePath);
    const file = parser.generate(fileMeta);
    writeFile(file.path, file.content);
  }
}
