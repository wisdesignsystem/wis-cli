import type { Context } from "@wisdesign/context";

interface SharedConfig {
  import: string;
  singleton?: boolean;
  requiredVersion?: string;
}

type Shared = Record<string, SharedConfig>;

function getDefaultShared() {
  const defaultShared: Shared = {
    react: {
      import: "react",
      singleton: true,
    },
    "react-dom": {
      import: "react-dom",
      singleton: true,
    },
    wiscore: {
      import: "wiscore",
      singleton: true,
    },
    "react-router": {
      import: "react-router",
      singleton: true,
    },
    history: {
      import: "history",
      singleton: true,
    },
    "@module-federation/enhanced/runtime": {
      import: "@module-federation/enhanced/runtime",
      singleton: true,
    },
  };

  return defaultShared;
}

export function shared(context: Context) {
  const userShared = context.config.shared;

  const shared: Shared = getDefaultShared();
  if (Array.isArray(userShared)) {
    for (const key of userShared) {
      if (shared[key]) {
        continue;
      }

      shared[key] = {
        import: key,
      };
    }

    return shared;
  }

  for (const key in userShared) {
    if (shared[key]) {
      shared[key].singleton = userShared[key].singleton;
      shared[key].requiredVersion = userShared[key].requiredVersion;
      continue;
    }

    shared[key] = {
      import: key,
      singleton: userShared[key].singleton,
      requiredVersion: userShared[key].requiredVersion,
    };
  }

  return shared;
}
