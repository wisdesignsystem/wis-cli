import path from "node:path";

const srcPath = path.resolve(process.cwd(), "src");
const compilerPath = path.resolve(srcPath, ".wis");

export class Path {
  src = srcPath;

  compiler = compilerPath;
}
