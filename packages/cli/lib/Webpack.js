import { createRequire } from "node:module";
import path from "node:path";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { ObjectSet } from "@wisdesign/configure";
import LogWebpackPlugin from "@wisdesign/log-webpack-plugin";
import RemoteWebpackPlugin from "@wisdesign/remote-webpack-plugin";
import SetupHtmlWebpackPlugin from "@wisdesign/setup-html-webpack-plugin";
import chalk from "chalk";
import CompressionWebpackPlugin from "compression-webpack-plugin";
import CssMinimizerWebpackPlugin from "css-minimizer-webpack-plugin";
import ExternalRemotesWebpackPlugin from "external-remotes-plugin";
import figlet from "figlet";
import HtmlWebpackPlugin from "html-webpack-plugin";
import loaderUtils from "loader-utils";
import MiniCssExtractWebpackPlugin from "mini-css-extract-plugin";
import TerserWebpackPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import Webpackbar from "webpackbar";

import plugin from "./plugin.js";

const require = createRequire(import.meta.url);

function clearConsole() {
  process.stdout.write(
    process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H",
  );
}

function getPackageLocalIndent({ context, localName, libraryName }) {
  const result = path.parse(context.resourcePath);
  return `${libraryName}-${result.name.replace(/\.module$/, "")}-${localName}`;
}

function getProjectLocalIndent({ context, localName }) {
  const result = path.parse(context.resourcePath);
  const hashKey =
    path.basename(context.rootContext) +
    path.sep +
    path.posix.relative(context.rootContext, context.resourcePath);
  const hash = loaderUtils.getHashDigest(hashKey, "md5", "base64", 5);

  return `${result.name.replace(/\.module$/, "")}-${localName}--${hash}`;
}

function localIndentFactory(context, libraryName) {
  return (webpackContext, _, localName) => {
    if (
      webpackContext.resourcePath.startsWith(context.config.packageRootPath)
    ) {
      return getPackageLocalIndent({
        context: webpackContext,
        localName,
        libraryName,
      });
    }

    return getProjectLocalIndent({ context: webpackContext, localName });
  };
}

function getVenderName(module) {
  const packageData = module.resourceResolveData?.descriptionFileData || {};
  if (packageData.name && packageData.version) {
    return `vender~${packageData.name.replace(/@/g, "").replace(/\//g, "-")}`;
  }

  let parts = module.context.split("node_modules").filter(Boolean);
  const modulePath = parts[parts.length - 1];
  parts = modulePath.split("/").filter(Boolean);
  let name = parts[0];
  if (name.includes("@")) {
    name = [name.replace(/@/g, ""), parts[1]].join("-");
  }

  const result = ["vender", name.replace(/\//g, "-")].filter(Boolean).join("~");
  return result;
}

class Webpack {
  get env() {
    const isProduction = process.env.NODE_ENV === "production";
    const isEnableProfiler =
      isProduction && process.env.ENABLE_PROFILER === "true";
    const isEnableGzip = process.env.GZIP === "true";
    const isEnableAnalyzer = process.env.ENABLE_ANALYZER === "true";
    const isFastRefresh = process.env.FAST_REFRESH === "true";

    return {
      isProduction,
      isEnableProfiler,
      isEnableGzip,
      isEnableAnalyzer,
      isFastRefresh,
    };
  }

  constructor(context) {
    this.context = context;
    this.config = new ObjectSet("webpack");
  }

  initial() {
    this.config.set("context", this.context.path.runtime);
    this.config.set("target", "web");

    this.config.set("entry", {});
    this.config.set("entry.main", this.context.path.entry);

    this.config.set(
      "mode",
      this.env.isProduction ? "production" : "development",
    );
    this.config.set("watch", !this.env.isProduction);

    this.config.set("output", {
      clean: false,
      path: this.context.path.dist,
      filename: this.env.isProduction
        ? "static/js/[name].[contenthash:8].js"
        : "static/js/[name].js",
      chunkFilename: this.env.isProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : "static/js/[name].chunk.js",
      publicPath: process.env.PUBLIC_URL,
      assetModuleFilename: this.env.isProduction
        ? "static/media/[name].[contenthash:8][ext]"
        : "static/media/[name][ext]",
      uniqueName: require(this.context.path.packageJson).name,
    });

    this.config.set("resolve", {
      symlinks: true,
      alias: {},
      modules: [],
      extensions: [],
    });
    const modules = this.config.get("resolve.modules");
    modules.set("node_modules", "node_modules");
    const extensions = this.config.get("resolve.extensions");
    const extensionsData = [".js", ".jsx", ".ts", ".tsx"];
    for (const item of extensionsData) {
      extensions.set(item.replace(/\./g, ""), item);
    }

    this.config.set("module", {
      strictExportPresence: true,
      rules: [],
    });

    this.config.set("plugins", []);
    this.config.set("stats", "none");
    this.config.set("infrastructureLogging.level", "none");
    this.config.set("bail", this.env.isProduction);

    this.image();
    this.asset();
    this.css();
    this.cssModule();
    this.javascript();
    this.typescript();
    this.registerHtmlPlugin();
    this.registerRemotePlugin();
  }

  // react调试工具辅助
  reactProfiler() {
    const alias = this.config.get("resolve.alias");
    alias.set("react-dom$", "react-dom/profiling");
    alias.set("scheduler/tracing", "scheduler/tracing-profiling");
  }

  sourcemap() {
    this.config.set("devtool", "source-map");

    this.config.set("module.rules.sourcemap", {
      test: [],
      enforce: "pre",
      exclude: [],
      use: [],
    });

    const sourcemap = this.config.get("module.rules.sourcemap");

    sourcemap.set("test.js", /\.js$/);
    sourcemap.set("test.jsx", /\.jsx$/);
    sourcemap.set("test.ts", /\.ts$/);
    sourcemap.set("test.tsx", /\.tsx$/);

    sourcemap.set("exclude.babelRuntime", /@babel(?:\/|\\{1,2})runtime/);
    sourcemap.set("exclude.node_modules", /node_modules/);

    sourcemap.set("use.sourcemap", require.resolve("source-map-loader"));
  }

  image() {
    this.config.set("module.rules.image", {
      type: "asset",
      test: [],
      parser: {
        dataUrlCondition: {
          maxSize: process.env.IMAGE_INLINE_LIMIT_SIZE,
        },
      },
    });

    const image = this.config.get("module.rules.image");

    image.set("test.bmp", /\.bmp$/);
    image.set("test.gif", /\.gif$/);
    image.set("test.jpg", /\.jpe?g$/);
    image.set("test.png", /\.png$/);
  }

  svgr() {
    this.config.set("module.rules.svg", {
      type: "asset",
      resourceQuery: { not: [/inline/] },
      test: [],
    });

    const svg = this.config.get("module.rules.svg");
    svg.set("test.svg", /\.svg$/);

    this.config.set("module.rules.svgr", {
      test: [],
      resourceQuery: /inline/,
      use: [],
    });

    const svgr = this.config.get("module.rules.svgr");

    svgr.set("test.svg", /\.svg$/);

    svgr.set("use.svgr", {
      loader: require.resolve("@svgr/webpack"),
      options: {
        icon: true,
        ref: true,
        replaceAttrValues: {
          "#000": "currentColor",
          "#000000": "currentColor",
        },
      },
    });
  }

  asset() {
    this.config.set("module.rules.asset", {
      type: "asset/resource",
      test: [],
    });

    const asset = this.config.get("module.rules.asset");

    asset.set("test.json", /\.json$/);
    asset.set("test.txt", /\.txt$/);
    asset.set("test.eot", /\.eot$/);
    asset.set("test.woff", /\.woff$/);
    asset.set("test.woff2", /\.woff2$/);
    asset.set("test.ttf", /\.ttf$/);
  }

  css() {
    this.config.set("module.rules.css", {
      test: [],
      exclude: [],
      use: [],
    });

    const css = this.config.get("module.rules.css");

    css.set("test.css", /\.css$/);

    css.set("exclude.moduleCss", /\.module\.css$/);

    css.set("use.miniCss", MiniCssExtractWebpackPlugin.loader);
    css.set("use.css", {
      loader: require.resolve("css-loader"),
      options: {
        importLoaders: 2,
        sourceMap: false,
      },
    });
    css.set("use.postcss", {
      loader: require.resolve("postcss-loader"),
      options: {
        sourceMap: false,
        postcssOptions: {
          config: false,
          plugins: [],
        },
      },
    });
    const postcss = css.get("use.postcss");
    const postcssPlugins = postcss.get("options.postcssOptions.plugins");
    postcssPlugins.set(
      "flexBugfixes",
      require.resolve("postcss-flexbugs-fixes"),
    );
    postcssPlugins.set("presetEnv", []);
    postcssPlugins.set("presetEnv.0", require.resolve("postcss-preset-env"));
    postcssPlugins.set("presetEnv.1", {
      autoprefixer: {
        flexbox: "no-2009",
      },
      stage: 3,
    });
    postcssPlugins.set("normalize", require.resolve("postcss-normalize"));

    this.config.set(
      "plugins.miniCss",
      {
        filename: this.env.isProduction
          ? "static/css/[name].[contenthash:8].css"
          : "static/css/[name].css",
        chunkFilename: this.env.isProduction
          ? "static/css/[name].[contenthash:8].chunk.css"
          : "static/css/[name].chunk.css",
      },
      { type: "ClassSet", ClassObject: MiniCssExtractWebpackPlugin },
    );
  }

  cssModule() {
    this.config.set("module.rules.cssModule", {
      test: [],
      use: [],
    });

    const cssModule = this.config.get("module.rules.cssModule");

    cssModule.set("test.cssModule", /\.module\.css$/);

    cssModule.set("use.miniCss", MiniCssExtractWebpackPlugin.loader);

    cssModule.set("use.css", {
      loader: require.resolve("css-loader"),
      options: {
        importLoaders: 2,
        sourceMap: false,
        modules: {
          getLocalIdent: localIndentFactory(
            this.context,
            require(this.context.path.packageJson).name,
          ),
        },
      },
    });
    cssModule.set("use.postcss", {
      loader: require.resolve("postcss-loader"),
      options: {
        sourceMap: false,
        postcssOptions: {
          config: false,
          plugins: [],
        },
      },
    });
    const cssModulePostcss = cssModule.get("use.postcss");
    const cssModulePostcssPlugins = cssModulePostcss.get(
      "options.postcssOptions.plugins",
    );
    cssModulePostcssPlugins.set(
      "flexBugfixes",
      require.resolve("postcss-flexbugs-fixes"),
    );
    cssModulePostcssPlugins.set("presetEnv", []);
    cssModulePostcssPlugins.set(
      "presetEnv.0",
      require.resolve("postcss-preset-env"),
    );
    cssModulePostcssPlugins.set("presetEnv.1", {
      autoprefixer: {
        flexbox: "no-2009",
      },
      stage: 3,
    });
    cssModulePostcssPlugins.set(
      "normalize",
      require.resolve("postcss-normalize"),
    );
  }

  typescript() {
    this.config.set("module.rules.typescript", {
      test: [],
      resolve: {
        fullySpecified: false,
      },
      use: [],
      include: [],
      exclude: [],
    });

    const typescript = this.config.get("module.rules.typescript");
    typescript.set("test.ts", /\.ts$/);
    typescript.set("test.tsx", /\.tsx$/);

    typescript.set("include.src", this.context.path.src);
    typescript.set("exclude.dts", /\.d\.ts$/);

    typescript.set("use.babel", {
      loader: require.resolve("babel-loader"),
      options: {
        presets: [],
        plugins: [],
      },
    });

    const babel = typescript.get("use.babel");

    const babelPresets = babel.get("options.presets");
    babelPresets.set("presetEnv", []);
    babelPresets.set("presetEnv.0", require.resolve("@babel/preset-env"));
    babelPresets.set("presetEnv.1", {
      useBuiltIns: false,
      loose: false,
    });
    babelPresets.set("presetReact", []);
    babelPresets.set("presetReact.0", require.resolve("@babel/preset-react"));
    babelPresets.set("presetReact.1", {
      runtime: "automatic",
    });
    babelPresets.set(
      "presetTypescript",
      require.resolve("@babel/preset-typescript"),
    );

    const babelPlugins = babel.get("options.plugins");
    babelPlugins.set("transformRuntime", []);
    babelPlugins.set(
      "transformRuntime.0",
      require.resolve("@babel/plugin-transform-runtime"),
    );
    babelPlugins.set("transformRuntime.1", {
      absoluteRuntime: true,
    });

    babelPlugins.set("polyfill", []);
    babelPlugins.set(
      "polyfill.0",
      require.resolve("babel-plugin-polyfill-corejs3"),
    );
    babelPlugins.set("polyfill.1", {
      method: "usage-global",
      absoluteImports: true,
    });
  }

  javascript() {
    this.config.set("module.rules.javascript", {
      test: [],
      resolve: {
        fullySpecified: false,
      },
      include: [],
      use: [],
    });

    const javascript = this.config.get("module.rules.javascript");
    javascript.set("test.js", /\.js$/);
    javascript.set("test.jsx", /\.jsx$/);

    javascript.set("include.src", this.context.path.src);

    javascript.set("use.babel", {
      loader: require.resolve("babel-loader"),
      options: {
        presets: [],
        plugins: [],
        browserslistEnv: process.env.NODE_ENV,
        compact: this.env.isProduction,
      },
    });

    const babel = javascript.get("use.babel");

    const babelPresets = babel.get("options.presets");
    babelPresets.set("presetEnv", []);
    babelPresets.set("presetEnv.0", require.resolve("@babel/preset-env"));
    babelPresets.set("presetEnv.1", {
      useBuiltIns: false,
      loose: false,
      debug: false,
    });
    babelPresets.set("presetReact", []);
    babelPresets.set("presetReact.0", require.resolve("@babel/preset-react"));
    babelPresets.set("presetReact.1", {
      development: !this.env.isProduction,
      runtime: "automatic",
    });

    const babelPlugins = babel.get("options.plugins");
    babelPlugins.set("transformRuntime", []);
    babelPlugins.set(
      "transformRuntime.0",
      require.resolve("@babel/plugin-transform-runtime"),
    );
    babelPlugins.set("transformRuntime.1", {
      absoluteRuntime: true,
      corejs: 3,
      helpers: true,
      regenerator: true,
    });
  }

  alias() {
    const alias = this.config.get("resolve.alias");

    for (const name of Object.keys(this.context.config.alias)) {
      alias.set(
        name,
        path.resolve(
          this.context.path.runtime,
          this.context.config.alias[name],
        ),
      );
    }
  }

  shared() {
    return {
      ...this.context.config.shared,
      react: {
        requiredVersion: "^18",
        singleton: true,
      },
      "react-dom": {
        requiredVersion: "^18",
        singleton: true,
      },
      "react-router-dom": {
        requiredVersion: "^7",
      },
    };
  }

  registerHtmlPlugin() {
    this.config.set(
      "plugins.html",
      {
        inject: true,
        template: this.context.path.html,
        ...(this.env.isProduction
          ? {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
              },
            }
          : {}),
      },
      { type: "ClassSet", ClassObject: HtmlWebpackPlugin },
    );

    this.config.set(
      "plugins.setupHtml",
      {
        HtmlWebpackPlugin,
        env: this.context.env.env,
      },
      { type: "ClassSet", ClassObject: SetupHtmlWebpackPlugin },
    );
  }

  registerDefinePlugin() {
    this.config.set("plugins.define", this.context.env.stringify(), {
      type: "ClassSet",
      ClassObject: webpack.DefinePlugin,
    });
  }

  registerLogPlugin() {
    this.config.set("plugins.log", undefined, {
      type: "ClassSet",
      ClassObject: LogWebpackPlugin,
    });
  }

  registerCompressionPlugin() {
    this.config.set("plugins.compression", undefined, {
      type: "ClassSet",
      ClassObject: CompressionWebpackPlugin,
    });
  }

  registerBundleAnalyzerPlugin() {
    this.config.set("plugins.bundleAnalyzer", undefined, {
      type: "ClassSet",
      ClassObject: BundleAnalyzerPlugin,
    });
  }

  registerRemotePlugin() {
    const packageData = require(this.context.path.packageJson);
    this.config.set(
      `entry.${packageData.name}`,
      path.resolve(this.context.path.compiler, "publicPath.js"),
    );

    this.config.set(
      "plugins.remote",
      {
        name: packageData.name,
        filename: this.context.remoteFileName,
        scopeName: "remote",
        windowScopeName: "$__wis_remotes__",
        exposes: {
          ...this.context.config.exposes,
        },
        shared: this.shared(),
      },
      { type: "ClassSet", ClassObject: RemoteWebpackPlugin },
    );

    this.config.set("plugins.externalRemotes", undefined, {
      type: "ClassSet",
      ClassObject: ExternalRemotesWebpackPlugin,
    });
  }

  registerWebpackbarPlugin() {
    this.config.set(
      "plugins.webpackbar",
      {
        name: "Wis",
        color: "#08979c",
        reporter: {
          afterAllDone: () => {
            const cliPackage = require(this.context.path.cliPackageJson);
            const appPackage = require(this.context.path.packageJson);
            clearConsole();
            console.info(figlet.textSync("Wis", "Ghost"));
            console.info(`CLI@${cliPackage.version}`);
            console.info();
            console.info(`Application: ${chalk.cyanBright(appPackage.name)}`);
            console.info();
          },
        },
      },
      {
        type: "ClassSet",
        ClassObject: Webpackbar,
      },
    );
  }

  registerReactRefreshPlugin() {
    const babel = this.config.get("module.rules.javascript.use.babel");
    const babelPlugins = babel.get("options.plugins");
    babelPlugins.set("reactRefresh", require.resolve("react-refresh/babel"));
    this.config.set(
      "plugins.reactRefresh",
      { overlay: false, exclude: [/node_modules/, /bootstrap\.js$/] },
      { type: "ClassSet", ClassObject: ReactRefreshWebpackPlugin },
    );
  }

  optimization() {
    this.config.set("optimization", {
      chunkIds: "named",
      usedExports: true,
      minimize: this.env.isProduction,
      minimizer: [],
    });

    const optimization = this.config.get("optimization");
    const minimizer = optimization.get("minimizer");
    minimizer.set(
      "terser",
      {
        terserOptions: {
          // 开启性能分析时，不要破环类名及文件名
          keep_classnames: this.env.isEnableProfiler,
          keep_fnames: this.env.isEnableProfiler,
          output: {
            comments: false,
          },
        },
        extractComments: false,
      },
      { type: "ClassSet", ClassObject: TerserWebpackPlugin },
    );
    minimizer.set("cssMinimizer", undefined, {
      type: "ClassSet",
      ClassObject: CssMinimizerWebpackPlugin,
    });

    // 第三方包打包机制
    const venderCacheGroup = {
      test: /[\\/]node_modules[\\/]/,
      name: (module) => {
        return getVenderName(module);
      },
    };
    const cacheGroups = {};
    cacheGroups.vender = venderCacheGroup;

    optimization.set("splitChunks", {
      chunks: "async",
      cacheGroups,
    });
  }

  build(callback) {
    // 初始化基础能力
    this.initial();
    // 添加别名能力支持
    this.alias();
    // 添加svg组件支持
    this.svgr();
    // 注册define支持
    this.registerDefinePlugin();
    // 注册log支持
    this.registerLogPlugin();
    // 注册进度条
    this.registerWebpackbarPlugin();
    // 注册打包优化
    this.optimization();

    // 添加sourcemap支持
    if (!this.env.isProduction) {
      this.sourcemap();
      this.env.isFastRefresh && this.registerReactRefreshPlugin();
    }

    // 启用react调试功能
    if (!this.env.isProduction && this.env.isEnableProfiler) {
      this.reactProfiler();
    }

    // 启用gzip
    if (this.env.isEnableGzip) {
      this.registerCompressionPlugin();
    }

    if (this.env.isEnableAnalyzer) {
      this.registerBundleAnalyzerPlugin();
    }

    this.context.config.webpackConfigure(this.config);
    plugin.hooks.webpackConfigure.call(this.config);

    let webpackConfig = this.context.config.webpackConfig(
      this.config.toValue(),
    );
    webpackConfig = plugin.hooks.webpackConfig.call(webpackConfig);
    const compiler = webpack(webpackConfig, callback);

    plugin.hooks.webpack.call(compiler);

    return compiler;
  }
}

export default Webpack;
