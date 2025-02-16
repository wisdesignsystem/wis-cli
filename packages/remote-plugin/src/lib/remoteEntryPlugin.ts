import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

type RuntimePlugin = () => FederationRuntimePlugin;

const remoteEntryPlugin: RuntimePlugin = () => {
  let isInjectRemoteEntry = false;

  return {
    name: "remote-entry-plugin",
    init(data) {
      if (isInjectRemoteEntry) {
        return data;
      }

      // @ts-ignore
      if (!window || window[data.options.name] === undefined) {
        return data;
      }

      isInjectRemoteEntry = true;
      // @ts-ignore
      window[data.options.name]
        // @ts-ignore
        .get("./core")
        // @ts-ignore
        .then((factory) => factory())
        .catch(() => {
          // no action
        });

      return data;
    },
  };
};

export default remoteEntryPlugin;
