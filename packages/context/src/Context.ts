import { Path } from "./Path.js";
import { Config } from "./Config.js";
import { Template } from "./Template.js"

export class Context {
  path: Path;

  config: Config;

  template: Template;

  constructor() {
    this.path = new Path();

    this.config = new Config();
    this.config.load();

    this.template = new Template();
  }

  reset() {
    this.config.load();
  }
}
