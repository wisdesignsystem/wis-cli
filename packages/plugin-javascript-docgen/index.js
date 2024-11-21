import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default function (plugin, option) {
  plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
    const babelPlugins = webpackConfigure.get('module.rules.javascript.use.babel.options.plugins')
    babelPlugins.set('react-docgen', require.resolve('babel-plugin-react-docgen'))
  })
}
