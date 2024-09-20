export default [
  {
    path: '@wisdesign/plugin-cross',
  },
  {
    path: '@wisdesign/plugin-router',
    option: { extensions: ['.js', '.jsx'] },
  },
  {
    path: '@wisdesign/plugin-import-demand',
    option: [
      {
        test: '**/*/locales/*/index.{js,ts}',
        name: 'locales',
        scope: function (module, moduleMap) {
          if (!module.includes('/locales')) {
            return
          }
          // eslint-disable-next-line no-var
          var language = window.localStorage.getItem(window.$__wis_language__) || 'zh-CN'
          if (!language) {
            return
          }

          // eslint-disable-next-line no-var
          var [countryLanguage] = language.split('-').filter(Boolean)
          return [language, countryLanguage]
        },
      },
      {
        test: '**/*/themes/*/index.css',
        name: 'themes',
        scope: function (module, moduleMap) {
          if (!module.includes('/themes')) {
            return
          }

          // eslint-disable-next-line no-var
          var theme = document.documentElement.getAttribute('data-theme') || 'default'
          if (!theme) {
            return 'default'
          }

          return theme
        },
      },
    ],
  },
  {
    path: '@wisdesign/plugin-remote-entry',
  },
]
