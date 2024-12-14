import Tap from "./Tap.js";
import TapStream from "./TapStream.js";

class Plugin {
  hooks = {};

  register(keys, instance) {
    const namePath = keys.split(".").filter(Boolean);
    if (!namePath.length) {
      return;
    }

    const keyPath = namePath.slice(0, namePath.length - 1);
    const name = namePath[namePath.length - 1];

    let next = this.hooks;
    for (const key of keyPath) {
      if (!next[key]) {
        next[key] = {};
      } else if (next[key] instanceof Tap || next[key] instanceof TapStream) {
        throw new Error(
          "Invalid plugin registration method detected. Please check the corresponding plugin's plugin.register method.",
        );
      }
      next = next[key];
    }

    next[name] = instance;
  }

  // 重启服务
  restart() {
    process.send("RESTART");
  }
}

const plugin = new Plugin();
plugin.Tap = Tap;
plugin.TapStream = TapStream;

export default plugin;
