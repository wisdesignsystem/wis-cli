import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { wisRsbuildPlugin } from "@wisdesign/wis-plugin/rsbuild"

export default defineConfig({
  plugins: [pluginReact(), wisRsbuildPlugin()],
});
