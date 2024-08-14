#!/usr/bin/env node

import { Command } from 'commander'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from '@prettier/sync'
import * as file from '@wisdesign/utils/file.js'
import * as tool from '@wisdesign/utils/tool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const require = createRequire(import.meta.url)

const packageData = require(path.resolve(__dirname, '../package.json'))

const icon = new Command()
icon
  .name('icon')
  .description('A quick tool to generate export svg components')
  .version(packageData.version)
  .helpOption('-h, --help', 'View help information')
  .requiredOption('-p, --path <path>', 'The svg source file path and must have a assets folder with svg files')
  .option('-t, --typescript', 'Generate typescript file')

icon.parse()

const opts = icon.opts()

const rootPath = process.cwd()
const iconRootPath = path.resolve(rootPath, opts.path)
const assetsPath = path.resolve(iconRootPath, 'assets')
const indexPath = path.resolve(iconRootPath, 'index.js')

function isValidIconName(name) {
  return /^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)
}

function parseSvgComponentName(iconFile) {
  const basename = path.basename(iconFile, '.svg')
  return basename
    .split('-')
    .map((name) => {
      return tool.toFirstUpperCase(name.trim())
    })
    .concat('Icon')
    .join('')
}

function parseSvgComponentImportPath(scriptFilePath, iconFile) {
  return tool.toPosixPath(`./${path.relative(path.dirname(scriptFilePath), iconFile)}?inline`)
}

function format(content) {
  const config = prettier.resolveConfig()
  return prettier.format(content, {
    ...config,
    parser: opts.typescript ? 'typescript' : 'babel',
  })
}

const invalidIconNames = []
const iconFiles = file.readdirDeep(assetsPath).filter((iconFile) => {
  if (path.extname(iconFile) !== '.svg') {
    return false
  }

  const name = path.basename(iconFile, '.svg')
  if (!isValidIconName(name)) {
    invalidIconNames.push(iconFile)
    return false
  }
  return true
})

if (invalidIconNames.length) {
  // eslint-disable-next-line no-console
  console.log(invalidIconNames)
  process.exit(1)
}
const iconComponentFiles = iconFiles.reduce((result, iconFile) => {
  const ext = path.extname(iconFile)
  if (ext !== '.svg') {
    return result
  }

  const dirname = path.dirname(iconFile)
  const scriptFilePath =
    path.resolve(iconRootPath, dirname.replace(assetsPath, '.')) + (opts.typescript ? '.ts' : '.js')
  const componentName = parseSvgComponentName(iconFile)
  const componentImportPath = parseSvgComponentImportPath(scriptFilePath, iconFile)

  if (!result[scriptFilePath]) {
    result[scriptFilePath] = []
  }

  result[scriptFilePath].push({
    componentName,
    componentImportPath,
  })

  return result
}, {})

const indexContents = []
Object.keys(iconComponentFiles).forEach((scriptFilePath) => {
  const importContents = []
  const exportContents = []

  iconComponentFiles[scriptFilePath].forEach(({ componentName, componentImportPath }) => {
    importContents.push(`import ${componentName} from '${componentImportPath}'`)
    exportContents.push(componentName)
  })

  const fileContent = `
  ${importContents.join('\n')}

  export {
    ${exportContents.join(',')}
  }
  `

  file.writeFile(scriptFilePath, format(fileContent))

  const { dir, name } = path.parse(scriptFilePath)
  const paths = path.resolve(dir, name).replace(iconRootPath, '').split(path.sep).filter(Boolean)

  indexContents.push(`'./icon/${paths.join('/')}': './${path.relative(rootPath, path.resolve(dir, name))}'`)
})

const indexContent = `
export default {
  ${indexContents.join(',')}
}
`
file.writeFile(indexPath, format(indexContent))
