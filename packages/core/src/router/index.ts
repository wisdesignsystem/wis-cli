import * as ReactRouter from "react-router";

import { useRouterChange } from "./listener.js";
import { useNavigate, useRedirect } from "./navigate.js";

export { useRouterChange, useNavigate, useRedirect };

export const useParams = ReactRouter.useParams;
export const useSearchParams = ReactRouter.useSearchParams;

export const createBrowserRouter = ReactRouter.createBrowserRouter;
export const createHashRouter = ReactRouter.createHashRouter;
export const RouterProvider = ReactRouter.RouterProvider;
export const Outlet = ReactRouter.Outlet;
