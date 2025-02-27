import type { Context } from "@wisdesign/context";

export function getPXToVWConfig(context: Context) {
  return {
    viewportWidth: context.config.designWidth,
    excludeFiles: [/\/node_modules\//],
    includeFiles: [/\/mobile\//],
  }
}
