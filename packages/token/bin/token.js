#!/usr/bin/env node

import { Command } from 'commander'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from '@prettier/sync'
import * as file from '@wisdesign/utils/file'

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
  .requiredOption('-l, --light <file>', 'Light theme token source file')
  .requiredOption('-d, --dark <file>', 'Dark theme token source file')
  .option('-o, --output <path>', 'Output token file root path', './tokens')
  .option('-n, --namespace <namespace>', 'Theme token namespace', 'token')

token.parse()

const opts = token.opts()
const whitelist = ['color', 'gradient', 'border', 'padding', 'margin', 'font', 'shadow', 'background']

function isTokenValue(data) {
  return '$type' in data && '$value' in data
}

function isVariableToken(data) {
  return /\{[a-zA-Z0-9.]+\}/.test(data)
}

function isPrivateToken(key) {
  return key.startsWith('_')
}

function resolvePath(filePath) {
  return path.resolve(process.cwd(), filePath)
}

function getTokenKey(keys) {
  return `--${opts.namespace}-${keys.join('-')}`
}

function flattenJSONData(json, path = [], result = {}) {
  Object.keys(json).forEach((key) => {
    if (isPrivateToken(key)) {
      return
    }

    const item = json[key]
    const keyPaths = path.concat(key)
    if (isTokenValue(item)) {
      result[getTokenKey(keyPaths)] = isVariableToken(item.$value)
        ? `var(${getTokenKey(item.$value.replace('{', '').replace('}', '').split('.'))})`
        : item.$value
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

function groupTokenMap(lightTokenMap, darkTokenMap) {
  return Object.keys(lightTokenMap).reduce((result, key) => {
    let group = key.replace(`--${opts.namespace}`, '').split('-').filter(Boolean)[0]
    if (whitelist.includes(group)) {
      group = 'base'
    }

    if (!result[group]) {
      result[group] = {
        fileName: `${group}.css`,
        children: [],
      }
    }

    result[group].children.push({
      key,
      value: {
        light: lightTokenMap[key],
        dark: darkTokenMap[key],
      },
    })

    return result
  }, {})
}

function format(content) {
  return prettier.format(content, { parser: 'css' })
}

const outputPath = resolvePath(opts.output)
function generateTokenFiles(groupTokens) {
  const imports = []
  Object.keys(groupTokens).forEach((groupKey) => {
    const group = groupTokens[groupKey]
    const { light, dark } = group.children.reduce(
      (result, item) => {
        result.light.push(`${item.key}: ${item.value.light}`)
        result.dark.push(`${item.key}: ${item.value.dark}`)
        return result
      },
      { light: [], dark: [] },
    )

    const content = `:root {
      ${light.join(';')}
    }
    html[data-theme='dark'] {
      ${dark.join(';')}
    }
    `

    file.writeFile(path.resolve(outputPath, group.fileName), format(content))
    imports.push(`@import './${group.fileName}';`)
  })

  file.writeFile(path.resolve(outputPath, 'index.css'), format(imports.join('')))
}

const lightSourceFilePath = resolvePath(opts.light)
const darkSourceFilePath = resolvePath(opts.dark)

const lightJSON = require(lightSourceFilePath)
const darkJSON = require(darkSourceFilePath)

const lightTokenMap = flatten(lightJSON)
const darkTokenMap = flatten(darkJSON)

const groupTokens = groupTokenMap(lightTokenMap, darkTokenMap)

generateTokenFiles(groupTokens)
