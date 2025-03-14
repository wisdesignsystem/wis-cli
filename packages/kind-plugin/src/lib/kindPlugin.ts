import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

import { matchKind } from "./kind.js";

type RuntimePlugin = () => FederationRuntimePlugin;

interface RemoteModule {
  modulePath: string;
  moduleName: string;
}

function isMatchModule(moduleExpose: string, module: RemoteModule) {
  if (!module.modulePath.startsWith(moduleExpose)) {
    return false;
  }

  const replacedPath = module.modulePath.slice(moduleExpose.length);
  return replacedPath === "" || replacedPath.startsWith("/");
}

function matchKindModule(moduleExpose: string, modules: RemoteModule[], kind: string) {
  let kindModuleExpose = "";
  const isMatched = modules.some((mod) => {
    kindModuleExpose = `${moduleExpose}/${kind}`;
    if (isMatchModule(kindModuleExpose, mod)) {
      return true;
    }

    return false;
  })

  if (!isMatched) {
    return "./$none";
  }

  return kindModuleExpose;
}

const kindPlugin: RuntimePlugin = () => {
  return {
    name: "kind-plugin",
    afterResolve(data) {
      // @ts-ignore
      const modules: RemoteModule[] = data.remoteSnapshot?.modules || [];

      const kind = matchKind(data.expose);
      if (!kind) {
        return data;
      }

      const moduleKindExpose = matchKindModule(data.expose, modules, kind);
      data.expose = moduleKindExpose;

      return data
    },
  };
};

export default kindPlugin;
