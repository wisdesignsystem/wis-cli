import type { Context } from "@wisdesign/context";
import { isNormalExpose, isThemeExpose, isPlatformExpose, isPlatformThemeExpose } from "@wisdesign/context"
import type { ModuleFederationOptions } from "@module-federation/rsbuild-plugin"

function parseExposes(context: Context) {
  return Object.keys(context.config.exposes).reduce((result, exportKey) => {
    const value = context.config.exposes[exportKey]
    if (isNormalExpose(value)) {
      result[exportKey] = value
    } else if (isThemeExpose(value) || (isPlatformExpose(value) && !isPlatformThemeExpose(value))) {
      const currentValue: Record<string, string> = value
      return Object.keys(currentValue).reduce((acc, key) => {
        acc[`${exportKey}/${key}`] = currentValue[key];
        return acc;
      }, result)
    } else if (isPlatformThemeExpose(value)) {
      const currentValue: Record<string, Record<string, string>> = value
      return Object.keys(currentValue).reduce((acc, key) => {
        return Object.keys(currentValue[key]).reduce((acc2, key2) => {
          acc2[`${exportKey}/${key}/${key2}`] = currentValue[key][key2];
          return acc2;
        }, acc)
      }, result)
    }
    
    return result
  }, {} as Record<string, string>)
}

function parseShared() {

}

function getPublicPath() {
  if (!process.env.BASE_URL) {
    return;
  }

  let publicUrl = process.env.BASE_URL
  if (!publicUrl.endsWith("/")) {
    publicUrl = `${publicUrl}/`
  }

  return `return "${publicUrl}"`
}

export function getMFConfig(context: Context): ModuleFederationOptions {
  return {
    name: context.config.name,
    filename: 'remote.js',
    shared: {
      react: {
        requiredVersion: "^18",
        singleton: true,
      },
      "react-dom": {
        requiredVersion: "^18",
        singleton: true,
      },
      wiscore: {
        requiredVersion: "^0",
      },
    },
    runtimePlugins: [].concat(),
    exposes: parseExposes(context),
    getPublicPath: getPublicPath(),
    manifest: {
      fileName: "manifest.json"
    },
    shareStrategy: "loaded-first",
  };
}
