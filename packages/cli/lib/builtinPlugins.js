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

          const scopes = ['en-US', 'en']
          // eslint-disable-next-line no-var
          var language = window.localStorage.getItem(window.$__wis_language__)
          if (!language) {
            return scopes
          }

          if (scopes.includes(language)) {
            return scopes
          }

          // eslint-disable-next-line no-var
          var [countryLanguage] = language.split('-').filter(Boolean)
          return [language, countryLanguage].concat(scopes)
        },
      },
      {
        test: '**/*/themes/*/index.css',
        name: 'themes',
        scope: function (module, moduleMap) {
          if (!module.includes('/themes')) {
            return
          }

          const scopes = ['default']
          // eslint-disable-next-line no-var
          var theme = document.documentElement.getAttribute('data-theme')
          if (!theme) {
            return scopes
          }

          if (scopes.includes(theme)) {
            return scopes
          }

          return [theme].concat(scopes)
        },
      },
    ],
  },
  {
    path: '@wisdesign/plugin-remote-entry',
  },
]
