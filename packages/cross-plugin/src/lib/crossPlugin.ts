import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

import { getBrowserAgent } from "./agent.js";

interface RemoteModule {
  modulePath: string;
  moduleName: string;
}

type RuntimePlugin = () => FederationRuntimePlugin;

function matchModule({
  modules,
  agent,
  moduleExpose,
}: {
  modules: RemoteModule[];
  agent?: string;
  moduleExpose: string;
}) {
  if (!agent) {
    return moduleExpose;
  }

  const crossModuleExpose = `${moduleExpose}/${agent}`;
  const isMatched = modules.some((mod) => {
    if (!mod.modulePath.startsWith(crossModuleExpose)) {
      return false;
    }

    const replacedPath = mod.modulePath.slice(crossModuleExpose.length);
    return replacedPath === "" || replacedPath.startsWith("/");
  });

  if (isMatched) {
    return crossModuleExpose;
  }

  return moduleExpose;
}

const crossPlugin: RuntimePlugin = () => {
  return {
    name: "cross-plugin",
    afterResolve(data) {
      // @ts-ignore
      const modules: RemoteModule[] = data.remoteSnapshot?.modules || [];
      const moduleCrossExpose = matchModule({
        modules,
        agent: getBrowserAgent(),
        moduleExpose: data.expose,
      });
      data.expose = moduleCrossExpose;

      return data;
    },
    generatePreloadAssets() {
      return Promise.resolve({
        cssAssets: [],
        jsAssetsWithoutEntry: [],
        entryAssets: [],
      });
    },
  };
};

export default crossPlugin;
