export function getKinds() {
  // @ts-ignore
  const kind = document.documentElement.getAttribute("data-kind");
  if (!kind) {
    return;
  }

  return kind.split(",").filter(Boolean);
}