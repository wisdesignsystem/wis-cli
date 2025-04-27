import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginWis } from "@wisdesign/wis-plugin/rsbuild";

export default defineConfig({
  plugins: [pluginReact(), pluginWis()],
});
