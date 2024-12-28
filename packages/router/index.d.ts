import type { BrowserRouter, HashRouter, Routes, Route } from "react-router";

type Delta = number;
type RoutePath = string;

export function useNavigate(): (to: RoutePath | Delta) => void;
export function useRedirect(): (to: RoutePath) => void;
export function useParams(): URLSearchParams;
export function useRouteChange(handle: () => void): void;

export type { BrowserRouter, HashRouter, Routes, Route };