import * as ReactRouter from "react-router";

import { useRouterChange } from "./listener.js";
import { useNavigate, useRedirect } from "./navigate.js";

export { useRouterChange, useNavigate, useRedirect }

export const useParams = ReactRouter.useParams;
export const useSearchParams = ReactRouter.useSearchParams;

export const BrowserRouter = ReactRouter.BrowserRouter;
export const HashRouter = ReactRouter.HashRouter;
export const Routes = ReactRouter.Routes;
export const Route = ReactRouter.Route;
