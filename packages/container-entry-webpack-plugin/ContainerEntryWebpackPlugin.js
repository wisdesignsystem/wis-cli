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
        modules.forEach((module) => {
          if (module.constructor.name === 'ContainerEntryModule') {
            containerModules.push(module)
          }
        })
      })
      compilation.hooks.afterCodeGeneration.tap('ContainerEntryWebpackPlugin', () => {
        containerModules.forEach((module) => {
          const sourceMap = compilation.codeGenerationResults.get(module).sources
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
        })
        containerModules = []
      })
    })
  }
}

export default ContainerEntryWebpackPlugin
