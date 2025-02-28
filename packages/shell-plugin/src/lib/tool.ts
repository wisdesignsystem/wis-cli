import path from "node:path";

export function posixPath(filePath: string) {
  return filePath.replace(new RegExp(path.sep, "g"), "/");
}

export function relativePath(basePath: string, filePath: string) {
  return path.relative(path.dirname(basePath), filePath);
}

export function sourceImportPath(basePath: string, filePath: string) {
  const importPath = posixPath(relativePath(basePath, filePath)).replace(
    /.ts(x)?$/,
    "",
  );
  if (importPath.startsWith("../")) {
    return importPath;
  }

  return `./${importPath}`;
}

export function capitalize(str: string) {
  if (!str) {
    return str;
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
}
