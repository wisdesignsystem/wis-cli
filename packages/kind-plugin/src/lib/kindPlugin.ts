import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

import { getKinds } from "./kind.js";

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
  return replacedPath.startsWith("/");
}

function isMatchModuleIn(moduleExpose: string, module: RemoteModule) {
  if (!module.modulePath.startsWith(moduleExpose)) {
    return false;
  }

  const replacedPath = module.modulePath.slice(moduleExpose.length);
  return replacedPath === "" || replacedPath.startsWith("/");
}

function isKindModule(moduleExpose: string, modules: RemoteModule[]) {
  return modules.some((mod) => isMatchModule(moduleExpose, mod));
}

function matchKindModule(moduleExpose: string, modules: RemoteModule[], kinds: string[]) {
  let kindModuleExpose = "";
  const isMatched = modules.some((mod) => {
    return kinds.some((kind) => {
      kindModuleExpose = `${moduleExpose}/${kind}`;
      if (isMatchModuleIn(kindModuleExpose, mod)) {
        return true;
      }

      return false;
    })
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

      if (!isKindModule(data.expose, modules)) {
        return data;
      }

      const kinds = getKinds();
      if (!kinds.length) {
        return data;
      }

      const moduleKindExpose = matchKindModule(data.expose, modules, kinds);
      data.expose = moduleKindExpose;

      return data
    },
  };
};

export default kindPlugin;
