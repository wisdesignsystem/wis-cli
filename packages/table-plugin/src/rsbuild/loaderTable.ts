// @ts-nocheck
import type { LoaderContext } from '@rspack/core';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import t from "@babel/types";
import * as generator from "@babel/generator";
import type { Context } from "@wisdesign/context";

interface ImportState {
  namespace?: string;
  name?: string;
}

interface LoaderOptions {
  context: Context;
}

function loaderTable(this: LoaderContext<LoaderOptions>, source: string) {
  if (
    !this.resourcePath.endsWith(".tsx") &&
    !this.resourcePath.endsWith(".jsx")
  ) {
    return source;
  }

  const options = this.getOptions();
  const importState: ImportState = {};

  function isWisTable(name: string) {
    return name === `${options.context.config.wis.name}/table`;
  }

  function isColumn(node) {
    if (!t.isJSXElement(node)) {
      return false;
    }

    if (
      t.isJSXIdentifier(node.openingElement.name) &&
      importState.name !== undefined
    ) {
      // <X><X>
      return node.openingElement.name.name === importState.name;
    }

    if (
      t.isJSXMemberExpression(node.openingElement.name) &&
      importState.namespace !== undefined
    ) {
      // <X.X><X.X>
      return (
        t.isJSXIdentifier(node.openingElement.name.object) &&
        t.isJSXIdentifier(node.openingElement.name.property) &&
        node.openingElement.name.object.name === importState.namespace &&
        node.openingElement.name.property.name === "Column"
      );
    }

    return false;
  }

  function isNestedColumn(node) {
    if (!node.children || node.children.length <= 0) {
      return false;
    }

    return node.children.some((childNode) => isColumn(childNode));
  }

  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  let isChanged = false;

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (!isWisTable(path.node.source.value)) {
        return;
      }

      for (const specifier of path.node.specifiers) {
        if (t.isImportSpecifier(specifier)) {
          // import { xxx } from "xxx"
          // or
          // import { x as x } from "xxx"
          if (specifier.imported.name === "Column") {
            importState.name = specifier.local.name;
          }
        } else if (t.isImportNamespaceSpecifier(specifier)) {
          // import * as x from "xxx"
          importState.namespace = specifier.local.name;
        }
      }
    },

    JSXElement(path) {
      if (!isColumn(path.node)) {
        return;
      }

      if (isNestedColumn(path.node)) {
        return;
      }

      path.node.children = [
        t.jsxExpressionContainer(
          t.arrowFunctionExpression(
            [t.identifier("cell")],
            t.blockStatement([
              t.returnStatement(
                t.jsxFragment(
                  t.jsxOpeningFragment(),
                  t.jsxClosingFragment(),
                  path.node.children,
                ),
              ),
            ]),
          ),
        ),
      ];
      isChanged = true;
    },
  });

  if (!isChanged) {
    return source;
  }

  return generator.generate(ast).code;
}

export default loaderTable;
