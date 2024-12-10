import ContainerEntryWebpackPlugin from "@wisdesign/container-entry-webpack-plugin";
import * as is from "@wisdesign/utils/is.js";

export default function (plugin) {
  function generateValidateRepeat() {
    return `if ('__VALIDATE_REMOTE_ENTRY_REPEAT__') {}`;
  }

  function generateRemoteEntryCode(remoteEntry) {
    return `
    ${generateValidateRepeat()}
    function createEntry() {
      var loaded = false;

      return function () {
        if (loaded) {
          return;
        }

        loaded = true;
        get('${remoteEntry}').then(factory => {
          factory();
        });
      }
    }
    var entry = createEntry();
    `;
  }

  function generateRemoteEntryRunCode() {
    return `
      entry();
    `;
  }

  plugin.hooks.config.tap((config, rawConfig) => {
    if (is.isUndefined(rawConfig.remoteEntry)) {
      return;
    }

    if (!is.isString(rawConfig.remoteEntry)) {
      return;
    }

    config.remoteEntry = rawConfig.remoteEntry;
  });

  plugin.hooks.context.tap((context) => {
    if (!context.config.remoteEntry) {
      return;
    }

    plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
      webpackConfigure.set(
        "plugins.remoteEntry",
        {
          source(code, babel) {
            if (code.includes(generateValidateRepeat())) {
              return;
            }

            const ast = babel.parser.parse(code, {
              sourceType: "module",
            });
            ast.program.body.splice(
              2,
              0,
              babel.parser.parse(
                generateRemoteEntryCode(context.config.remoteEntry),
              ),
            );
            babel.traverse.default(ast, {
              VariableDeclarator: (path) => {
                if (path.node.id.name === "init") {
                  const node = babel.parser.parse(generateRemoteEntryRunCode());
                  const index = path.node.init.body.body.findIndex(
                    (node) => node.type === "ReturnStatement",
                  );
                  path.node.init.body.body.splice(
                    index,
                    0,
                    ...node.program.body,
                  );
                }
              },
            });
            return babel.generator.default(ast).code;
          },
        },
        { type: "ClassSet", ClassObject: ContainerEntryWebpackPlugin },
      );
    });
  });
}
