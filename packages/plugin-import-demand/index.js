import path from 'node:path'
import ContainerEntryWebpackPlugin from '@wisdesign/container-entry-webpack-plugin'
import { minimatch } from 'minimatch'
import * as is from '@wisdesign/utils/is.js'
import * as tool from '@wisdesign/utils/tool.js'

export default function (plugin, options = []) {
  function getExpose({ context, filePath, option }) {
    const { dir: baseDir, base: basename } = path.parse(filePath)
    const { dir: chunkDir, name: chunkName } = path.parse(baseDir)
    const { dir: parentDir, name } = path.parse(chunkDir)

    const item = parentDir.replace(context.path.src, '').split(path.sep).filter(Boolean)
    item.push(is.isFunction(option.getModuleName) ? option.getModuleName(name) : name)
    item.push(chunkName)

    return {
      name: `./${item.join('/')}`,
      path: path.resolve(baseDir, basename),
    }
  }

  function matchChunkOption(filePath) {
    return options.find((option) => {
      if (is.isFunction(option.test)) {
        return option.test(filePath)
      }

      return minimatch(filePath, option.test)
    })
  }

  function generateValidateRepeat() {
    return `if ('__VALIDATE_REPEAT__') {}`
  }

  function generateScopeMatchCode(options) {
    const code = options
      .map((option) => {
        return `
          result = (${option.scope.toString()})(module, moduleMap);
          if (Array.isArray(result)) {
            scopes = scopes.concat(result);
          } else {
            scopes.push(result);
          }
        `
      })
      .join('')

    return `
      ${generateValidateRepeat()}
      var scopes = [];
      var result;
      ${code}
      var scope = scopes.filter(Boolean).find(function (scope) {
        return moduleMap[module + '/' + scope];
      });
      if (scope) {
        module = module + '/' + scope;
      }
    `
  }

  const matchedChunkOptions = []
  const innerLocaleExposes = []
  plugin.hooks.context.tap((context) => {
    plugin.hooks.eachFile.tap((filePath) => {
      const option = matchChunkOption(filePath)
      if (!option) {
        return
      }

      const isExist = matchedChunkOptions.some((item) => item.name === option.name)
      if (!isExist) {
        matchedChunkOptions.push(option)
      }

      const expose = getExpose({ context, filePath, option })
      if (expose) {
        innerLocaleExposes.push(expose)
      }
    })

    plugin.hooks.watcher.tap((watcher) => {
      watcher
        .on('add', (filePath) => {
          if (matchChunkOption(filePath)) {
            plugin.restart()
          }
        })
        .on('unlink', (filePath) => {
          if (matchChunkOption(filePath)) {
            plugin.restart()
          }
        })
    })

    plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
      webpackConfigure.set(
        'plugins.containerEntry',
        {
          source(code, babel) {
            if (code.includes(generateValidateRepeat())) {
              return
            }

            const ast = babel.parser.parse(code, {
              sourceType: 'module',
            })

            babel.traverse.default(ast, {
              VariableDeclarator: (path) => {
                if (path.node.id.name === 'get') {
                  const node = babel.parser.parse(generateScopeMatchCode(matchedChunkOptions))
                  path.node.init.body.body.unshift(...node.program.body)
                }
              },
            })
            return babel.generator.default(ast).code
          },
        },
        { type: 'ClassSet', ClassObject: ContainerEntryWebpackPlugin },
      )

      const exposes = webpackConfigure.get('plugins.remote.exposes').toValue()
      const crossExpose = Object.keys(exposes).reduce((result, key) => {
        const value = exposes[key]
        if (is.isObject(value)) {
          for (const name of Object.keys(value)) {
            result[`${key}/${name}`] = value[name]
          }
        } else {
          result[key] = value
        }

        return result
      }, {})

      const exposePaths = Object.keys(crossExpose).reduce((result, name) => {
        const exposePath = path.resolve(tool.replaceAlias(context.config.alias, crossExpose[name]))
        result[exposePath] = true
        return result
      }, {})

      for (const expose of innerLocaleExposes) {
        const { dir, name } = path.parse(expose.path)

        if (exposePaths[path.resolve(dir, name)] || exposePaths[expose.path]) {
          continue
        }

        crossExpose[expose.name] = expose.path
      }

      webpackConfigure.set('plugins.remote.exposes', crossExpose)
    })
  })
}
