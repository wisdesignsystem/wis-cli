export function getThemeKind() {
  // @ts-ignore
  return document.documentElement.getAttribute("data-kind-theme");
}

export function getLangKind() {
  // @ts-ignore
  return document.documentElement.getAttribute("data-kind-lang");
}
