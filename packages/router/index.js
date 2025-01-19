import { useEffect, useRef } from "react";
import * as ReactRouter from "react-router";

function isBrowserRouter() {
  return window.$__wis_router_type__ === "browserRouter";
}

function getLayouts() {
  return window.$__wis_layouts__ || [];
}

function isLayout(item) {
  const layouts = getLayouts();
  return layouts.some((layout) => layout === item);
}

/**
 * Get the application current layout name, if it exists.
 */
function getLayout() {
  const route = getRoute();
  const [layout] = route.split("/").filter(Boolean);

  if (isLayout(layout)) {
    return layout;
  }
}

function isApp(item) {
  return window.$__wis_uncheck_remote__(item);
}

function getApp() {
  const route = getRoute();
  const [layout, app] = route.split("/").filter(Boolean);
  let appName = app;
  if (!isLayout(layout)) {
    appName = layout;
  }

  if (isApp(appName)) {
    return appName;
  }
}

function isDelta(to) {
  return typeof to === "number";
}

function resolveRoutePath(to) {
  if (to.startsWith("/")) {
    return to;
  }

  const [path] = to.split("/").filter(Boolean);

  const currentLayout = getLayout();
  const currentApp = getApp();

  if (isApp(path)) {
    return `/${[currentLayout, to].filter(Boolean).join("/")}`;
  }

  if (isLayout(path)) {
    return `/${to}`;
  }

  return `/${[currentLayout, currentApp, to].filter(Boolean).join("/")}`;
}

export function getRoute() {
  if (isBrowserRouter()) {
    return window.location.pathname;
  }

  const [route = ""] = window.location.hash.replace("#", "").split("?");
  return route;
}

export function useNavigate() {
  const navigate = ReactRouter.useNavigate();
  return (to) => {
    if (!to) {
      return;
    }

    function run(path, option) {
      navigate(path, option);
      window.dispatchEvent(new Event("routechange"));
    }

    if (isDelta(to)) {
      run(to);
      return;
    }

    const nextRoutePath = resolveRoutePath(to);
    run(nextRoutePath, { preventScrollReset: true, relative: "route" });
  };
}

export function useRedirect() {
  const navigate = ReactRouter.useNavigate();

  return (to) => {
    if (!to) {
      return;
    }

    function run(routePath, option) {
      navigate(routePath, option);
      window.dispatchEvent(new Event("routechange"));
    }

    const nextRoutePath = resolveRoutePath(to);
    run(nextRoutePath, { preventScrollReset: true, replace: true });
  };
}

export function useParams() {
  if (isBrowserRouter()) {
    return new URLSearchParams(window.location.search);
  }

  const [, search = ""] = window.location.hash.split("?");
  return new URLSearchParams(search);
}

export function useRouteChange(handle) {
  const listener = useRef(null);
  listener.current = handle;

  useEffect(() => {
    function callback() {
      if (listener.current) {
        listener.current();
      }
    }

    if (!isBrowserRouter()) {
      window.addEventListener("hashchange", callback);
    }

    window.addEventListener("routechange", callback);
    return () => {
      window.removeEventListener("routechange", callback);
      if (!isBrowserRouter()) {
        window.removeEventListener("hashchange", callback);
      }
    };
  }, []);
}

export const BrowserRouter = ReactRouter.BrowserRouter;
export const HashRouter = ReactRouter.HashRouter;
export const Routes = ReactRouter.Routes;
export const Route = ReactRouter.Route;
