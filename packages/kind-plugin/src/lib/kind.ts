export function getKinds() {
  // @ts-ignore
  const kind = document.documentElement.getAttribute("data-kind");
  if (!kind) {
    return;
  }

  return kind.split(",").filter(Boolean);
}

export function matchKind(moduleExpose: string) {
  const kinds = getKinds();

  let kind: string | undefined;
  for (const item of kinds) {
    const parts = item.split(":").filter(Boolean);
    const regexString = parts.slice(0, parts.length - 1).join(":");
    if (!regexString) {
      continue;
    }

    const value = parts[parts.length - 1];
    const regex = new RegExp(regexString);
    if (regex.test(moduleExpose)) {
      kind = value;
      break;
    }
  }

  return kind;
}
