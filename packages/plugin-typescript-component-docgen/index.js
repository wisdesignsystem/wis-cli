import path from "node:path";
import docgen from "react-docgen-typescript";
import * as file from "@wisdesign/utils/file.js";

function replaceAliasPath(filePath, context) {
  const aliasName = Object.keys(context.config.alias).find((name) => {
    return filePath.startsWith(`${name}/`);
  });

  if (aliasName) {
    return filePath.replace(aliasName, context.config.alias[aliasName]);
  }

  return filePath;
}

function resolvePath(filePath, context) {
  const currentFilePath = replaceAliasPath(filePath, context);
  if (path.isAbsolute(currentFilePath)) {
    return currentFilePath;
  }

  return path.resolve(context.path.runtime, currentFilePath);
}

/**
 * The entry file of the component is usually index.ts under the package directory.
 * If it is a cross-platform component, it is pc/index.ts, pad/index.ts, mobile/index.ts under the package directory.
 *
 * e.g.
 * button/index.ts
 * button/pc/index.ts
 * button/pad/index.ts
 * button/mobile/index.ts
 */
function isComponentIndexFilePath(filePath = "") {
  const { dir, name, ext } = path.parse(filePath);
  if (ext !== ".ts") {
    return false;
  }

  if (name !== "index") {
    return false;
  }

  const agent = path.basename(dir);
  if (["mobile", "pad"].includes(agent)) {
    return false;
  }

  return true;
}

/**
 * The component definition file must be a TypeScript file with the same name as the component package.
 *
 * e.g.
 * button/button.ts
 */
function isComponentDefinitionFilePath(filePath = "") {
  const { dir, name, ext } = path.parse(filePath);
  if (ext !== ".ts") {
    return false;
  }

  const packageName = path.basename(dir);
  return packageName === name;
}

function getComponentIndexFilePathByDefinitionFilePath(filePath) {
  const packageFilePath = path.dirname(filePath);

  const indexFilePath = path.resolve(packageFilePath, "pc/index.ts");
  if (file.isExist(indexFilePath)) {
    return indexFilePath;
  }
}

function genDefinitionMeta(filePath) {
  const definitions = docgen.parse(path.resolve(process.cwd(), filePath), {
    savePropValueAsString: false,
    shouldExtractLiteralValuesFromEnum: true,
    propFilter: (prop) => {
      if (prop.declarations && prop.declarations.length > 0) {
        const hasPropAdditionalDescription = prop.declarations.find(
          (declaration) => {
            return !declaration.fileName.includes("node_modules");
          },
        );

        return Boolean(hasPropAdditionalDescription);
      }

      return true;
    },
  });

  if (definitions.length) {
    return { filePath, definitions };
  }
}

function writeDefinitions(filePath, definitionsMeta) {
  const result = {};

  for (const file of Object.keys(definitionsMeta)) {
    const definitions = definitionsMeta[file];

    for (const definition of definitions) {
      result[definition.displayName] = definition;
    }
  }

  file.writeFile(
    filePath,
    `export default ${JSON.stringify(result)}`,
  );
  process.exit(0);
}

export default function (plugin, options = {}) {
  if (!options.rootPath) {
    throw new Error("The rootPath option is required.");
  }

  plugin.hooks.context.tap((context) => {
    const packagesPath = resolvePath(options.rootPath, context);
    const definitionPath = path.resolve(
      context.path.compiler,
      "definitions.js",
    );

    const definitionsMeta = {};
    function resolveDefinition(filePath) {
      if (!filePath.startsWith(packagesPath)) {
        return;
      }

      let indexFilePath = filePath;
      if (isComponentDefinitionFilePath(filePath)) {
        indexFilePath = getComponentIndexFilePathByDefinitionFilePath(filePath);
      }

      if (!isComponentIndexFilePath(indexFilePath)) {
        return;
      }

      const definitionMeta = genDefinitionMeta(indexFilePath);
      if (!definitionMeta) {
        return;
      }

      definitionsMeta[definitionMeta.filePath] = definitionMeta.definitions;
    }

    function removeDefinition(filePath) {
      if (!filePath.startsWith(packagesPath)) {
        return;
      }

      if (!isComponentIndexFilePath(filePath)) {
        return false;
      }

      delete definitionsMeta[filePath];
    }

    plugin.hooks.eachFile.tap((filePath) => {
      resolveDefinition(filePath);
    });

    plugin.hooks.eachFileEnd.tap(() => {
      writeDefinitions(definitionPath, definitionsMeta);
    });

    plugin.hooks.watcher.tap((watcher) => {
      watcher
        .on("add", (filePath) => {
          resolveDefinition(filePath);
          writeDefinitions(definitionPath, definitionsMeta);
        })
        .on("unlink", (filePath) => {
          removeDefinition(filePath);
          writeDefinitions(definitionPath, definitionsMeta);
        })
        .on("change", (filePath) => {
          resolveDefinition(filePath);
          writeDefinitions(definitionPath, definitionsMeta);
        });
    });

    // plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
    //   const exposes = webpackConfigure.get("plugins.remote.exposes");
    //   exposes.set(
    //     "\\./$$definitions",
    //     path.resolve(context.path.compiler, "definitions.js"),
    //   );
    // })
  });
}
