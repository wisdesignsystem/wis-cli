function isLayout(name: string) {
  // @ts-ignore
  return name in window.$__wis_layouts__;
}

function isApplication(name: string) {
  // @ts-ignore
  return window.$__wis_app__.includes(name);
}

export function isBrowserRouter() {
  // @ts-ignore
  return window.$__wis_router__ === "browserRouter";
}

export function isHashRouter() {
  // @ts-ignore
  return window.$__wis_router__ === "hashRouter";
}

function getRoute() {
  let pathname = window.location.pathname;
  if (isHashRouter()) {
    pathname = window.location.hash.replace("#", "").split("?")[0];
  }

  return pathname;
}

function getRouteMeta(): string[] {
  const route = getRoute();

  let [maybeLayout, maybeApplication] = route.split("/").filter(Boolean);
  const result: string[] = [];

  if (isLayout(maybeLayout)) {
    result.push(maybeLayout);
  } else {
    maybeApplication = maybeLayout;
  }

  if (isApplication(maybeApplication)) {
    result.push(maybeApplication);
  }

  return result;
}

export function resolveRoute(to: string) {
  if (to.startsWith("/")) {
    return to;
  }

  const [path] = to.split("/").filter(Boolean);

  const [currentLayout, currentApplication] = getRouteMeta();

  if (isApplication(path)) {
    return `/${[currentLayout, to].filter(Boolean).join("/")}`;
  }

  if (isLayout(path)) {
    return `/${to}`;
  }

  return `/${[currentLayout, currentApplication, to].filter(Boolean).join("/")}`;
}
