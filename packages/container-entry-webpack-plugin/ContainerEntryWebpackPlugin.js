import Source from 'webpack-sources'
import babelParser from '@babel/parser'
import babelTraverse from '@babel/traverse'
import babelGenerator from '@babel/generator'

class ContainerEntryWebpackPlugin {
  constructor(option) {
    this.option = option
  }

  apply(compiler) {
    if (!this.option?.source) {
      return
    }

    compiler.hooks.compilation.tap('ContainerEntryWebpackPlugin', (compilation) => {
      let containerModules = []
      compilation.hooks.finishModules.tap('ContainerEntryWebpackPlugin', (modules) => {
        for (const item of modules) {
          if (item.constructor.name === 'ContainerEntryModule') {
            containerModules.push(item)
          }
        }
      })
      compilation.hooks.afterCodeGeneration.tap('ContainerEntryWebpackPlugin', () => {
        for (const item of containerModules) {
          const sourceMap = compilation.codeGenerationResults.get(item).sources
          const rawSource = sourceMap.get('javascript')
          const result = this.option.source(rawSource.source(), {
            parser: babelParser,
            traverse: babelTraverse,
            generator: babelGenerator,
          })
          if (!result) {
            return
          }
          sourceMap.set('javascript', new Source.RawSource(result))
        }
        containerModules = []
      })
    })
  }
}

export default ContainerEntryWebpackPlugin
