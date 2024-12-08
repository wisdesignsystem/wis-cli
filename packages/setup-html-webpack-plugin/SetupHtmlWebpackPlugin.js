function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string')
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

class SetupHtmlWebpackPlugin {
  constructor({ HtmlWebpackPlugin, env }) {
    this.HtmlWebpackPlugin = HtmlWebpackPlugin
    this.env = env
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('SetupHtmlWebpackPlugin', (compilation) => {
      this.HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tap('SetupHtmlWebpackPlugin', (data) => {
        for (const key of Object.keys(this.env)) {
          const value = this.env[key]
          data.html = data.html.replace(new RegExp(`%${escapeStringRegexp(key)}%`, 'g'), value)
        }
      })
    })
  }
}

export default SetupHtmlWebpackPlugin
