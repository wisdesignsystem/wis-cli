import path from "node:path";

export class Path {
  compiler = path.resolve(process.cwd(), "src/.wis");
}
