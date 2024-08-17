import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { components } from '@figma-export/core'
import svgr from '@figma-export/output-components-as-svgr'
import svgo from '@figma-export/transform-svg-with-svgo'
import * as file from '@wisdesign/utils/file.js'
import * as shell from '@wisdesign/utils/shell.js'
import * as tool from '@wisdesign/utils/tool.js'
import prettier from '@prettier/sync'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootPath = path.resolve(__dirname, '..')
const outputPath = path.resolve(rootPath, './')
const metaPath = path.resolve(rootPath, './components/meta.js')
const indexPath = path.resolve(rootPath, './components/index.js')

const envPaths = [path.resolve(rootPath, './.env.local'), path.resolve(rootPath, './.env')].filter(file.isExist)

// 支持环境变量的模版字符串语法
envPaths.forEach((envFile) => {
  dotenvExpand.expand(dotenv.config({ path: envFile }))
})

function isValidIconName(name) {
  return /^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)
}

// 是一个正常组件
function isNormalComponent(name, type) {
  return isValidIconName(name) && (!type || name.endsWith(tool.toFirstUpperCase(type)))
}

// 是一个变量组件
function isVariantComponent(name, type) {
  return name.startsWith(`type=${type}`)
}

function getName(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((item) => tool.toFirstUpperCase(item.trim()))
    .join(' ')
}

function format(content) {
  const config = prettier.resolveConfig()
  return prettier.format(content, { ...config, parser: 'babel' })
}

const replaceCurrentColorPlugin = {
  name: 'replaceCurrentColor',
  description: 'Replace svg fill or stroke color by currentColor',
  fn: () => {
    return {
      element: {
        enter(node) {
          if (node.attributes.fill && node.attributes.fill !== 'none') {
            node.attributes.fill = 'currentColor'
          }

          if (node.attributes.stroke && node.attributes.stroke !== 'none') {
            node.attributes.stroke = 'currentColor'
          }
        },
      },
    }
  },
}

async function icon(iconOption) {
  const result = {
    type: iconOption.style,
    title: getName(iconOption.style),
    children: [],
  }

  const visited = {}
  await components({
    token: process.env.FIGMA_TOKEN,
    fileId: process.env.FIGMA_FILE_ID,
    onlyFromPages: [process.env.FIGMA_PAGE],
    filterComponent: (option) => {
      return (
        isVariantComponent(option.name, iconOption.type) ||
        isNormalComponent(option.name, iconOption.ignoreType ? undefined : iconOption.type)
      )
    },
    transformers: iconOption.transformers,
    outputters: [
      svgr({
        output: outputPath,
        getDirname: () => {
          return 'components'
        },
        getComponentName: (option) => {
          const category = option.pathToComponent.find((item) => item.type === 'FRAME')
          const component = option.pathToComponent.find((item) => item.type === 'COMPONENT_SET')
          const name = component ? component.name : option.componentName
          const names = name.split('-')

          const componentName = names
            .concat(iconOption.ignoreType ? [] : [iconOption.type])
            .map((item) => tool.toFirstUpperCase(item.trim()))
            .join('')

          let categoryItem = result.children.find((item) => item.type === category.name)
          if (!categoryItem) {
            categoryItem = {
              type: category.name,
              title: getName(category.name),
              children: [],
            }
            result.children.push(categoryItem)
          }

          if (!visited[componentName]) {
            categoryItem.children.push({
              type: 'component',
              name: componentName,
            })
            visited[componentName] = true
          }

          return componentName
        },
        getSvgrConfig: () => {
          return {
            icon: true,
            plugins: ['@svgr/plugin-jsx'],
          }
        },
      }),
    ],
  })

  return result
}

async function outline() {
  const result = await icon({
    style: 'outline',
    type: 'outline',
    ignoreType: true,
    transformers: [
      svgo({
        plugins: [
          'sortAttrs',
          'removeEmptyAttrs',
          replaceCurrentColorPlugin,
          { name: 'removeAttrs', params: { attrs: ['stroke-linecap', 'stroke-linejoin', 'stroke-width'] } },
        ],
      }),
    ],
  })
  return result
}

async function solid() {
  const result = await icon({
    style: 'solid',
    type: 'filled',
    transformers: [
      svgo({
        plugins: ['sortAttrs', 'removeEmptyAttrs', replaceCurrentColorPlugin],
      }),
    ],
  })
  return result
}

async function main() {
  shell.execSync(`rm -rf ${path.resolve(rootPath, './components')}`)

  const outlineMeta = await outline()
  const solidMeta = await solid()

  const meta = [outlineMeta, solidMeta]

  const components = []
  meta.forEach((style) => {
    style.children.forEach((category) => {
      category.children.forEach((component) => {
        components.push(component)
      })
    })
  })

  file.writeFile(
    metaPath,
    format(`
    export default ${JSON.stringify(meta)}  
  `),
  )

  file.writeFile(
    indexPath,
    format(
      components
        .map((component) => {
          return `export { default as ${component.name} } from './${component.name}.jsx';`
        })
        .join('\n'),
    ),
  )
}

main()
