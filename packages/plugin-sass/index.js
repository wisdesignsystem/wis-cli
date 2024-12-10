import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default function (plugin) {
  function sass(webpackConfigure) {
    webpackConfigure.set("module.rules.sass", {
      test: [],
      exclude: [],
      use: webpackConfigure.get("module.rules.css.use").clone(),
    });
    const sass = webpackConfigure.get("module.rules.sass");
    sass.set("test.sass", /\.scss$/);
    sass.set("exclude.moduleSass", /\.module\.scss$/);
    sass.set("use.sass", {
      loader: require.resolve("sass-loader"),
      options: {
        sourceMap: false,
      },
    });
  }

  function sassModule(webpackConfigure) {
    webpackConfigure.set("module.rules.sassModule", {
      test: [],
      use: webpackConfigure.get("module.rules.cssModule.use").clone(),
    });
    const sassModule = webpackConfigure.get("module.rules.sassModule");
    sassModule.set("test.sass", /\.module\.scss$/);
    sassModule.set("use.sass", {
      loader: require.resolve("sass-loader"),
      options: {
        sourceMap: false,
      },
    });
  }

  plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
    sass(webpackConfigure);
    sassModule(webpackConfigure);
  });
}
