import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

type RuntimePlugin = () => FederationRuntimePlugin;

const remoteEntryPlugin: RuntimePlugin = () => {
  let isInjectRemoteEntry = false;

  return {
    name: "remote-entry-plugin",
    init(data) {
      // @ts-ignore
      if (!isInjectRemoteEntry && window[data.options.name]) {
        // @ts-ignore TODO
        window[data.options.name].get("./core").then((factory) => factory());
        isInjectRemoteEntry = true;
      }

      return data;
    },
    afterResolve(data) {
      // TODO
      if (data.id.includes("button")) {
        data.expose = "./button/mobile"
      }

      return data;
    },
  };
};

export default remoteEntryPlugin;
