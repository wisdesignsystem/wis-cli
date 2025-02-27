import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

import { getThemeKind, getLangKind } from "./kind.js";

type RuntimePlugin = () => FederationRuntimePlugin;

interface RemoteModule {
  modulePath: string;
  moduleName: string;
}

function matchModule({
  modules,
  kind,
  moduleExpose,
}: {
  modules: RemoteModule[];
  kind?: string;
  moduleExpose: string;
}) {
  if (!kind) {
    return;
  }

  const kindModuleExpose = `${moduleExpose}/${kind}`;
  const isMatched = modules.some((mod) => {
    if (!mod.modulePath.startsWith(kindModuleExpose)) {
      return false;
    }

    const replacedPath = mod.modulePath.slice(kindModuleExpose.length);
    return replacedPath === "" || replacedPath.startsWith("/");
  });

  if (isMatched) {
    return kindModuleExpose;
  }

  return;
}

const kindPlugin: RuntimePlugin = () => {
  return {
    name: "kind-plugin",
    afterResolve(data) {
      // @ts-ignore
      const modules: RemoteModule[] = data.remoteSnapshot?.modules || [];

      const themeKind = getThemeKind();
      let moduleKindExpose = matchModule({
        modules,
        kind: themeKind,
        moduleExpose: data.expose,
      });

      if (!moduleKindExpose) {
        const langKind = getLangKind();
        moduleKindExpose = matchModule({
          modules,
          kind: langKind,
          moduleExpose: data.expose,
        })
      }

      if (!moduleKindExpose) {
        moduleKindExpose = data.expose
      }

      data.expose = moduleKindExpose;

      return data;
    },
  };
};

export default kindPlugin;
