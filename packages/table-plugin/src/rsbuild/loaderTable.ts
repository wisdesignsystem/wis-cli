// @ts-nocheck

import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import t from "@babel/types";
// import * as generator from "@babel/generator";

function loaderTable(source: string) {
  if (
    !this.resourcePath.endsWith(".tsx") &&
    !this.resourcePath.endsWith(".jsx")
  ) {
    return source;
  }

  const ast = parser.parse(
    `import { Table, Cell } from "wis/table";

    export default function () {
      return (
        <Cell role="cell">
          {cellData.data}
        </Cell>
      )
    }`,
    {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    },
  );

  traverse.default(ast, {
    JSXElement(path: unknown) {
      const openingElement = path.node.openingElement;
      if (
        t.isJSXIdentifier(openingElement.name) &&
        openingElement.name.name === "Cell"
      ) {
      }
    },
  });

  process.exit();

  return source;
}

export default loaderTable;
