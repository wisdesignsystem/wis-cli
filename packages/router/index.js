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
  const [layout, app, ...parts] = to.split("/").filter(Boolean);
  const currentLayout = getLayout();
  const currentApp = getApp();

  if (isLayout(layout)) {
    if (app) {
      parts.unshift(app);
    }

    if (!isApp(app)) {
      if (currentApp) {
        parts.unshift(currentApp);
      }
    }

    if (layout) {
      parts.unshift(layout);
    }
  } else {
    if (app) {
      parts.unshift(app);
    }
    if (!isApp(layout)) {
      if (currentApp) {
        parts.unshift(currentApp);
      }
    }

    if (layout) {
      parts.unshift(layout);
    }

    if (currentLayout) {
      parts.unshift(currentLayout);
    }
  }

  return `/${parts.join("/")}`;
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

    if (isBrowserRouter()) {
      window.addEventListener("routechange", callback);
    } else {
      window.addEventListener("hashchange", callback);
    }

    return () => {
      if (isBrowserRouter()) {
        window.removeEventListener("routechange", callback);
      } else {
        window.removeEventListener("hashchange", callback);
      }
    };
  }, []);
}

export const BrowserRouter = ReactRouter.BrowserRouter;
export const HashRouter = ReactRouter.HashRouter;
export const Routes = ReactRouter.Routes;
export const Route = ReactRouter.Route;
