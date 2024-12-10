import path from "node:path";

import Parser from "./Parser.js";
import cliPath from "./cliPath.js";

class Path extends Parser {
  constructor() {
    super();
    const runtimePath = process.cwd();
    const srcPath = path.resolve(runtimePath, "src");
    const publicPath = path.resolve(runtimePath, "./public");
    const prodCompilerPath = path.resolve(srcPath, ".wis");
    const devCompilerPath = path.resolve(srcPath, ".wis");
    const compilerPath =
      process.env.NODE_ENV === "production"
        ? prodCompilerPath
        : devCompilerPath;

    // 脚手架路径
    this.cli = cliPath.rootPath;
    this.cliPackageJson = cliPath.packagePath;
    this.cliNodeModules = cliPath.nodeModulesPath;
    // 运行时路径
    this.runtime = runtimePath;
    // 源码路径
    this.src = srcPath;
    // 环境变量配置文件路径
    this.env = path.resolve(runtimePath, "./.env");
    // 配置文件路径
    this.config = path.resolve(runtimePath, ".wisrc.js");
    // 网站public path
    this.public = publicPath;
    // 网站路口index.html路径
    this.html = path.resolve(publicPath, "index.html");
    // 编译路径，编译过程中产生的必要文件存放路径
    this.compiler = compilerPath;
    this.prodCompiler = prodCompilerPath;
    this.devCompilerPath = devCompilerPath;
    // 编译后输出文件目录
    this.dist = path.resolve(runtimePath, "dist");
    this.packageJson = path.resolve(runtimePath, "package.json");
    this.nodeModules = path.resolve(runtimePath, "node_modules");
    // 编译路口文件
    this.entry = path.resolve(compilerPath, "index.js");
  }

  static instance = null;

  static create() {
    if (!Path.instance) {
      Path.instance = new Path();
    }

    return Path.instance;
  }

  // 部署静态资源路径
  get publicUrl() {
    if (process.env.NODE_ENV === "production") {
      return process.env.PUBLIC_URL;
    }

    const isHttps = process.env.HTTPS === "true";
    const host = process.env.HOST;
    const port = isHttps ? process.env.HTTPS_PORT : process.env.PORT;

    const protocol = isHttps ? "https://" : "http://";
    const localhost =
      host === "127.0.0.1" || host === "0.0.0.0" ? "localhost" : host;

    return `${protocol}${localhost}:${port}${process.env.PUBLIC_URL}`;
  }
}

export default Path;
