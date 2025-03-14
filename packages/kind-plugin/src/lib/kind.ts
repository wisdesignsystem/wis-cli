function getKinds() {
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
    const [regexString, value] = item.split(":").filter(Boolean);
    const regex = new RegExp(regexString);
    if (regex.test(moduleExpose)) {
      kind = value;
      break;
    }
  }

  return kind;
}
