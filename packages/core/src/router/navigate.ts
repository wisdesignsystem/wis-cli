import * as ReactRouter from "react-router";

import { resolveRoute } from "./router.js";

type NavigateTo = (to: string | number) => void;
type RedirectTo = (to: string) => void;

function isDelta(to: unknown): to is number {
  return typeof to === "number";
}

export function useNavigate(): NavigateTo {
  const navigate = ReactRouter.useNavigate();

  const navigateTo: NavigateTo = (to) => {
    if (isDelta(to)) {
      navigate(to);
      window.dispatchEvent(new Event("routeChange"));
      return;
    }

    const nextTo = resolveRoute(to);
    navigate(nextTo, { preventScrollReset: true });
    window.dispatchEvent(new Event("routeChange"));
  };

  return navigateTo;
}

export function useRedirect(): RedirectTo {
  const navigate = ReactRouter.useNavigate();

  const redirectTo: RedirectTo = (to) => {
    const nextTo = resolveRoute(to);
    navigate(nextTo, { preventScrollReset: true, replace: true });
    window.dispatchEvent(new Event("routeChange"));
  };

  return redirectTo;
}
