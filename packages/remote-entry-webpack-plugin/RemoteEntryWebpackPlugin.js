import Source from 'webpack-sources'

class RemoteEntryWebpackPlugin {
  constructor(remoteEntry) {
    this.remoteEntry = remoteEntry
  }

  apply(compiler) {
    if (!this.remoteEntry) {
      return
    }

    compiler.hooks.compilation.tap('RemoteEntryWebpackPlugin', (compilation) => {
      let containerModules = []
      compilation.hooks.finishModules.tap('RemoteEntryWebpackPlugin', (modules) => {
        modules.forEach((module) => {
          if (module.constructor.name === 'ContainerEntryModule') {
            containerModules.push(module)
          }
        })
      })
      compilation.hooks.afterCodeGeneration.tap('RemoteEntryWebpackPlugin', () => {
        containerModules.forEach((module) => {
          const sourceMap = compilation.codeGenerationResults.get(module).sources
          const rawSource = sourceMap.get('javascript')

          const code = rawSource.source()
          if (code.includes(this.getRemoteEntryCode())) {
            return
          }

          sourceMap.set('javascript', new Source.RawSource(`${code}${this.getRemoteEntryCode()}`))
        })
        containerModules = []
      })
    })
  }

  getRemoteEntryCode() {
    return `get('${this.remoteEntry}')`
  }
}

export default RemoteEntryWebpackPlugin
