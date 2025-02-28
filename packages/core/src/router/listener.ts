import { createBrowserHistory, createHashHistory } from "history";
import type { History } from "history";
import { useEffect, useRef } from "react";

import { isBrowserRouter } from "./router.js";

type Handler = () => void;

let history: History;
if (isBrowserRouter()) {
  history = createBrowserHistory();
} else {
  history = createHashHistory();
}

export function useRouterChange(handler: Handler) {
  const listener = useRef(handler);
  listener.current = handler;

  useEffect(() => {
    history.listen(() => {
      if (listener.current) {
        listener.current();
      }
    });
  }, []);
}
