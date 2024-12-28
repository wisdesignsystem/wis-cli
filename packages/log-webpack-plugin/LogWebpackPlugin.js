import chalk from "chalk";

class LogWebpackPlugin {
  apply(compiler) {
    compiler.hooks.done.tap("LogWebpackPlugin", (stats) => {
      const statsJSONData = stats.toJson({}, true);

      setTimeout(() => {
        this.printWarning(statsJSONData);
        this.printErrors(statsJSONData);
      }, 0);
    });
  }

  printErrors(stats) {
    for (const error of stats.errors) {
      if (error.moduleName) {
        console.info(
          `[${chalk.redBright("ERROR")}] ${chalk.redBright(error.moduleName)}`,
        );
      }
      console.info(error.stack);
    }
  }

  printWarning(stats) {
    for (const warn of stats.warnings) {
      if (warn.moduleName) {
        console.info(
          `[${chalk.yellowBright("WARNING")}] ${chalk.yellowBright(error.moduleName)}`,
        );
      }
      console.info(warn.stack);
    }
  }
}

export default LogWebpackPlugin;
