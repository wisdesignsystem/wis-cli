import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

type RuntimePlugin = () => FederationRuntimePlugin;

const remoteEntryPlugin: RuntimePlugin = () => {
  let isInjectRemoteEntry = false;

  return {
    name: "remote-entry-plugin",
    beforeInit(data) {
      return data;
    },
    init(data) {
      if (__FEDERATION__.__INSTANCES__[0]) {
        const hostName = __FEDERATION__.__INSTANCES__[0].name;

        if (data.options.name !== hostName) {
          const hostsRemote = data.options.remotes.find((remote) => {
            return remote.name === hostName || remote.alias === hostName;
          });

          if (hostsRemote) {
            // @ts-ignore
            hostsRemote.entry = hostsRemote.entry.replace(
              "remote",
              `${hostName}_partial`,
            );
          }
        }
      }

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
