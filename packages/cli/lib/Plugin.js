'use strict'

const { SyncHook, /* AsyncParallelHook, */ AsyncSeriesHook } = require('tapable')

const createStyle = require('./style')

function Plugin() {
  this.hooks = {
    env: new SyncHook(),
    afterEnv: new SyncHook(['env']),
    config: new SyncHook(),
    afterConfig: new SyncHook(['config']),

    plugins: new AsyncSeriesHook(['plugin']),
    plugin: new SyncHook(['option', 'plugin']),
    afterPlugin: new SyncHook(['option', 'plugin']),
    afterPlugins: new AsyncSeriesHook(['plugin']),

    complier: new SyncHook([]),
    afterComplier: new SyncHook(['complier']),
    webpack: new AsyncSeriesHook(['webpackChain']),

    server: new SyncHook([]),
    afterServer: new SyncHook(['server']),
    devServer: new AsyncSeriesHook(['config']),
  }
}

Plugin.prototype.style = function (webpackChain, option) {
  createStyle(webpackChain, option)
}

module.exports = Plugin
