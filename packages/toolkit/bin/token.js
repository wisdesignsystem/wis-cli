#!/usr/bin/env node

import { Command } from 'commander'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from '@prettier/sync'
import * as file from '@wisdesign/utils/file.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const require = createRequire(import.meta.url)

const packageData = require(path.resolve(__dirname, '../package.json'))

const token = new Command()
token
  .name('token')
  .description('A quick tool for converting Figma token JSON files into CSS variables')
  .version(packageData.version)
  .helpOption('-h, --help', 'View help information')
  .requiredOption('-s, --source <file>', 'The default theme token source file')
  .requiredOption(
    '-t, --theme <file>',
    'Other theme files, in the format such as: dark:../dark.json, multiple ones separated by commas',
  )
  .option('-o, --output <path>', 'Output token file root path', './tokens')
  .option('-n, --namespace <namespace>', 'Theme token namespace', 'token')

token.parse()

const opts = token.opts()

function isTokenValue(data) {
  return '$type' in data && '$value' in data
}

function isVariableToken(data) {
  return /\{[a-zA-Z0-9-.]+\}/.test(data)
}

function isPrivateToken(key) {
  return key.includes('_')
}

function kebabToCamel(str) {
  return str.replace(/-./g, (match) => match.charAt(1).toUpperCase())
}

function resolvePath(filePath) {
  return path.resolve(process.cwd(), filePath)
}

function getTokenKey(keys) {
  return `--${opts.namespace}-${keys.join('-')}`
}

function flattenJSONData(json, path = [], result = {}) {
  Object.keys(json).forEach((key) => {
    const item = json[key]
    const keyPaths = path.concat(key)
    const tokenKey = getTokenKey(keyPaths)

    if (isPrivateToken(tokenKey)) {
      return
    }

    if (isTokenValue(item)) {
      let category
      let group = keyPaths[0]
      if (['common', 'component'].includes(group)) {
        category = group
        group = keyPaths[1]
      }

      result[tokenKey] = {
        category,
        group,
        key: tokenKey,
        value: isVariableToken(item.$value)
          ? `var(${getTokenKey(item.$value.replace('{', '').replace('}', '').split('.'))})`
          : item.$value,
      }

      return
    }

    flattenJSONData(item, keyPaths, result)
  })
}

function flatten(json) {
  const result = {}
  const path = []
  flattenJSONData(json, path, result)
  return result
}

function parseThemeExpression(themeExpression) {
  const [theme, themeFilePath] = themeExpression.split(':')
  return { theme, themeFilePath }
}

function groupTokens(sourceToken, themeTokens) {
  return Object.keys(sourceToken).reduce((result, key) => {
    const token = sourceToken[key]
    if (!result[token.group]) {
      result[token.group] = {
        category: token.category,
        name: token.group,
        children: [],
      }
    }

    result[token.group].children.push({
      key,
      value: token.value,
      themeTokens: themeTokens.map(({ theme, tokens }) => {
        return { theme, token: tokens[key] }
      }),
    })

    return result
  }, {})
}

function format(content) {
  const config = prettier.resolveConfig()
  return prettier.format(content, { ...config, parser: 'css' })
}

const outputPath = resolvePath(opts.output)
function generateTokenFiles(groupTokens) {
  const imports = []
  Object.keys(groupTokens).forEach((groupKey) => {
    const group = groupTokens[groupKey]

    const defaultTheme = []
    const themes = group.children.reduce((result, item) => {
      defaultTheme.push(`${item.key}: ${item.value}`)
      item.themeTokens.forEach(({ theme, token }) => {
        if (!result[theme]) {
          result[theme] = []
        }

        result[theme].push(`${item.key}: ${token.value}`)
      })

      return result
    }, {})

    const content = `:root {
      ${defaultTheme.join(';')}
    }
    ${Object.keys(themes)
      .map((theme) => {
        return `html[data-theme='${theme}'] {
        ${themes[theme].join(';')}
      }`
      })
      .join('')}
    `

    const fileName = `${kebabToCamel(group.name)}.css`
    file.writeFile(path.resolve(outputPath, fileName), format(content))

    if (group.category !== 'component') {
      imports.push(`@import './${fileName}';`)
    }
  })

  file.writeFile(path.resolve(outputPath, 'index.css'), format(imports.join('')))
}

const sourceFilePath = resolvePath(opts.source)
const themes = opts.theme
  .split(',')
  .filter(Boolean)
  .map((themeExpression) => {
    const { theme, themeFilePath } = parseThemeExpression(themeExpression)
    return { theme, themeFilePath: resolvePath(themeFilePath) }
  })

const sourceTokens = flatten(require(sourceFilePath))
const themeTokens = themes.map(({ theme, themeFilePath }) => {
  return {
    theme,
    tokens: flatten(require(themeFilePath)),
  }
})

generateTokenFiles(groupTokens(sourceTokens, themeTokens))
