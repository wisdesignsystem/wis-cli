export default [
  {
    path: "@wisdesign/plugin-cross",
  },
  {
    path: "@wisdesign/plugin-router",
    option: { extensions: [".ts", ".tsx"] },
  },
  {
    path: "@wisdesign/plugin-import-demand",
    option: [
      {
        test: "**/*/locales/*/index.ts",
        name: "locales",
        scope: (module, moduleMap) => {
          if (!module.includes("/locales")) {
            return;
          }

          const scopes = ["en-US", "en"];
          // biome-ignore lint/style/noVar: <explanation>
          var language = window.localStorage.getItem(window.$__wis_language__);
          if (!language) {
            return scopes;
          }

          if (scopes.includes(language)) {
            return scopes;
          }

          // biome-ignore lint/style/noVar: <explanation>
          var [countryLanguage] = language.split("-").filter(Boolean);
          return [language, countryLanguage].concat(scopes);
        },
      },
      {
        test: "**/*/themes/*/index.css",
        name: "themes",
        scope: (module, moduleMap) => {
          if (!module.includes("/themes")) {
            return;
          }

          const scopes = ["default"];
          // biome-ignore lint/style/noVar: <explanation>
          var theme = document.documentElement.getAttribute("data-theme");
          if (theme === "none") {
            return ["$$none"];
          }

          if (!theme) {
            return scopes;
          }

          if (scopes.includes(theme)) {
            return scopes;
          }

          return [theme].concat(scopes);
        },
      },
    ],
  },
  {
    path: "@wisdesign/plugin-remote-entry",
  },
  {
    path: "@wisdesign/plugin-less",
  },
  {
    path: "@wisdesign/plugin-sass",
  },
];
