import { createRequire } from 'node:module'
import path from 'node:path'

import ReactRouter from './ReactRouter.js'

const require = createRequire(import.meta.url)

export default function (plugin, options) {
  plugin.hooks.context.tap((context) => {
    const router = new ReactRouter({
      appPackage: require(context.path.packageJson),
      appConfig: context.config,
      outputPath: context.path.complier,
      srcPath: context.path.src,
      publicPath: context.path.publicUrl,
      remoteFileName: context.remoteFileName,
      extensions: options.extensions,
    })

    plugin.hooks.eachFile.tap((filePath) => {
      router.parseFile(filePath)
    })

    plugin.hooks.eachFileEnd.tap(() => {
      router.bootstrap()
    })

    plugin.hooks.watcher.tap((watcher) => {
      watcher
        .on('add', (filePath) => {
          router.create(filePath)
        })
        .on('unlink', (filePath) => {
          router.remove(filePath)
        })
        .on('change', (filePath) => {
          router.change(filePath)
        })
    })

    plugin.hooks.webpackConfigure.tap((webpackConfigure) => {
      const exposes = webpackConfigure.get('plugins.remote.exposes')
      exposes.set('\\./$$Router', path.resolve(context.path.complier, 'Router.jsx'))
      exposes.set('\\./$$app', path.resolve(context.path.complier, 'app.js'))
    })
  })
}
