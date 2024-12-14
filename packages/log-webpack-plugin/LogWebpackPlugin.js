import chalk from "chalk";
import dayjs from "dayjs";

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
      console.info(
        `👣 ${chalk.red("[X]")} ${dayjs().format(this.DATE_FORMAT)} Error：${chalk.green(error.moduleName || "")}`,
      );
      console.info(chalk.red(error.stack));
    }
  }

  printWarning(stats) {
    for (const warn of stats.warnings) {
      console.info(
        `👣 ${chalk.yellow("[!]")} ${dayjs().format(this.DATE_FORMAT)} Warning：${chalk.green(warn.moduleName || "")}`,
      );
      console.info(chalk.yellow(warn.stack));
    }
  }
}

export default LogWebpackPlugin;
