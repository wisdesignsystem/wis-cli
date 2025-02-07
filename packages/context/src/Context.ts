import path from "node:path";

import { Config } from "./Config.js";

export class Context {
  config: Config;

  compilerPath = path.resolve(process.cwd(), "src/.wis");

  constructor() {
    this.config = new Config();
  }

  setup() {
    this.config.setup();
  }
}
