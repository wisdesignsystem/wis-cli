import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

// Configuration constants
const CONFIG = {
  selectors: {
    light: ':root',
    dark: ':root[data-theme="dark"]'
  },
  outputFiles: {
    palette: 'palette.css',
    component: 'component.css',
    gray: 'gray.css',
    theme: 'theme.css',
    index: 'index.css'
  },
  baseCategories: ['component', 'palette', 'theme', 'gray']
};

interface TokenOptions {
  dark: string;
  light: string;
  component: string;
  palette: string;
  gray: string[];
  themes: string[];
  prefix: string;
  output: string;
}

// Define more precise types
interface TokenValue {
  $type: string;
  $value: string;
}

interface TokenData {
  [key: string]: TokenValue | TokenData;
}

// Unified error handling
function handleError(message: string, exitProcess = true): void {
  console.error(chalk.red(message));
  if (exitProcess) {
    process.exit(1);
  }
}

// Type helper function
function isTokenValue(value: unknown): value is TokenValue {
  return value !== null && typeof value === 'object' && '$type' in (value as object) && '$value' in (value as object);
}

// Type guard to confirm the value is TokenData
function isTokenData(value: unknown): value is TokenData {
  return value !== null && typeof value === 'object' && !('$type' in (value as object));
}

// Check if the value is a reference
function isReference(value: string): boolean {
  return typeof value === 'string' && value.includes('{') && value.includes('}');
}

// Get the reference path
function getReferencePath(value: string): string | null {
  const match = value.match(/\{([^}]+)\}/);
  return match ? match[1] : null;
}

// 引用路径缓存，key为原始引用，value为最终CSS变量名
const referenceCache = new Map<string, string>();

// Map reference to CSS variable
function referenceToCSS(
  reference: string,
  basePrefix: string,
  paramPrefixes: string[]
): string {
  // 使用原始引用作为缓存键
  const cachedResult = referenceCache.get(reference);
  if (cachedResult) {
    return cachedResult;
  }

  // 解析引用路径
  const parts = reference.split('.');
  const firstPart = parts[0];

  // 确定前缀
  let prefix: string;
  
  // 处理light和dark特殊情况
  if (firstPart === 'light' || firstPart === 'dark') {
    prefix = 'theme';
  }
  // 处理component, palette, gray 等基础类别
  else if (['component', 'palette', 'gray'].includes(firstPart) || 
           reference.startsWith('component-') || 
           reference.startsWith('palette-') ||
           reference.startsWith('gray-')) {
    prefix = firstPart;
  }
  // 处理自定义灰度前缀，如coolGray-500
  else if (paramPrefixes.some(p => !CONFIG.baseCategories.includes(p) && reference.startsWith(`${p}-`))) {
    prefix = 'gray';
  }
  // 处理自定义主题引用
  else if (paramPrefixes.some(p => !CONFIG.baseCategories.includes(p) && 
                           (firstPart === p || reference.startsWith(`${p}.`)))
  ) {
    prefix = 'theme';
  }
  // 默认使用unknown
  else {
    prefix = 'unknown';
  }
  
  // 生成CSS变量引用
  // 确保将路径中的点替换为横杠
  const cssPath = reference.replace(/\./g, '-');
  let result: string;
  
  // 添加适当的前缀
  if (prefix) {
    result = `var(--${basePrefix}-${prefix}-${cssPath})`;
  } else {
    // 如果没有前缀，只使用基础前缀
    result = `var(--${basePrefix}-${cssPath})`;
  }
  
  // 存入缓存
  referenceCache.set(reference, result);
  
  return result;
}

// Parse simple references and convert to CSS variable references
function convertReferencesToCssVars(
  value: string,
  prefix: string,
  paramPrefixes: string[]
): string {
  if (!isReference(value)) return value;
  
  let result: string;
  
  // If it's a pure reference like {brand}, directly return CSS variable reference
  if (value.match(/^\{[^}]+\}$/)) {
    const refPath = getReferencePath(value);
    if (refPath) {
      result = referenceToCSS(refPath, prefix, paramPrefixes);
      return result;
    }
  }
  
  // If it's a mixed reference like #rgba({brand}, 0.5), replace the reference parts
  result = value.replace(/\{([^}]+)\}/g, (_, path) => {
    return referenceToCSS(path, prefix, paramPrefixes);
  });
  
  return result;
}

// Flatten nested token objects to a single layer structure with prefix
function flattenTokens(
  tokens: TokenData,
  tokenPrefix: string,
  cssPrefix: string,
  paramPrefixes: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  
  function processTokens(obj: TokenData, currentPath: string) {
    for (const key in obj) {
      const value = obj[key];
      const newPath = currentPath ? `${currentPath}-${key}` : key;
      
      if (isTokenValue(value)) {
        // This is a token
        if (isReference(value.$value)) {
          // If the value is a reference, convert to CSS variable reference
          result[newPath] = convertReferencesToCssVars(value.$value, cssPrefix, paramPrefixes);
        } else {
          // Otherwise use the value directly
          result[newPath] = value.$value;
        }
      } else if (isTokenData(value)) {
        // This is a nested object
        processTokens(value, newPath);
      }
    }
  }
  
  // Use tokenPrefix as path prefix
  processTokens(tokens, tokenPrefix);
  return result;
}

// Generate CSS variable text with selector
function generateCSSVariablesWithSelector(
  tokens: Record<string, string>,
  prefix: string,
  selector: string
): string {
  let css = `${selector} {\n`;
  
  for (const [key, value] of Object.entries(tokens)) {
    css += `  --${prefix}-${key}: ${value};\n`;
  }
  
  css += "}\n";
  return css;
}

// Generate and write CSS for both light and dark modes
function generateAndWriteCssFile(
  lightTokens: Record<string, string>,
  darkTokens: Record<string, string>,
  prefix: string,
  outputPath: string,
  lightSelector = CONFIG.selectors.light,
  darkSelector = CONFIG.selectors.dark
): void {
  const lightCss = generateCSSVariablesWithSelector(lightTokens, prefix, lightSelector);
  const darkCss = generateCSSVariablesWithSelector(darkTokens, prefix, darkSelector);
  const combinedCss = `${lightCss}\n${darkCss}`;
  fs.writeFileSync(outputPath, combinedCss);
}

// Read JSON file
function loadTokenFile(filePath: string, isRequired = true): TokenData {
  try {
    if (!fs.existsSync(filePath)) {
      if (isRequired) {
        handleError(`File not found: ${filePath}`);
      }
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    handleError(`Error loading token file ${filePath}: ${error}`, isRequired);
    return {};
  }
}

// Extract theme name and file from parameter format "themeName:filePath.json"
function parseThemeParam(param: string): { name: string, file: string } | null {
  const parts = param.split(':');
  if (parts.length === 2) {
    return {
      name: parts[0],
      file: parts[1]
    };
  }
  return null;
}

// Process a token category (palette, component, gray, theme)
function processTokenCategory(
  tokens: TokenData,
  prefix: string,
  paramPrefix: string,
  paramPrefixes: string[],
  themeDir: string,
  filename: string,
  prefixKey = true
): void {
  // Calculate once to avoid duplicate processing
  const flatTokens = flattenTokens(tokens, '', prefix, paramPrefixes);
  
  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};
  
  // Process variables based on whether they need prefixed keys
  for (const [key, value] of Object.entries(flatTokens)) {
    const varKey = prefixKey ? `${paramPrefix}-${key}` : key;
    lightVars[varKey] = value;
    darkVars[varKey] = value;
  }
  
  // Generate and write CSS file
  generateAndWriteCssFile(
    lightVars,
    darkVars,
    prefix,
    path.join(themeDir, filename)
  );
}

// Main function
export async function token(options: TokenOptions) {
  const { prefix, output, component, palette, light, dark, gray = [], themes = [] } = options;
  
  // Ensure output directory exists
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }
  
  // Load shared files
  const componentTokens = loadTokenFile(component);
  const paletteTokens = loadTokenFile(palette);
  const lightThemeTokens = loadTokenFile(light);
  const darkThemeTokens = loadTokenFile(dark);
  
  // 处理灰度文件参数，解析xxx:xxx.json格式用于区分不同灰度token
  const grayTokensMap: Record<string, TokenData> = {};
  const invalidGrayParams: string[] = [];
  
  // 创建paramPrefixes数组，包含所有基础前缀
  const paramPrefixes = [...CONFIG.baseCategories];
  
  // 如果没有传入gray参数，则使用空对象
  if (gray.length === 0) {
    // 创建默认空的gray
    grayTokensMap.gray = {};
    // 确保灰度默认前缀被添加
    if (!paramPrefixes.includes('gray')) {
      paramPrefixes.push('gray');
    }
  } else {
    for (const grayParam of gray) {
      const result = parseThemeParam(grayParam);
      
      if (result) {
        // Check if file exists
        if (!fs.existsSync(result.file)) {
          handleError(`Gray scale file not found: ${result.file}`);
        }
        
        grayTokensMap[result.name] = loadTokenFile(result.file);
        // Add gray name to paramPrefixes for dynamic reference resolution
        if (!paramPrefixes.includes(result.name)) {
          paramPrefixes.push(result.name);
        }
      } else {
        invalidGrayParams.push(grayParam);
      }
    }
    
    // Check if there are invalid gray parameters
    if (invalidGrayParams.length > 0) {
      handleError('Invalid gray parameter format detected. The following parameters are invalid:');
      for (const param of invalidGrayParams) {
        handleError(`  - ${param}`, false);
      }
      handleError('The correct format is "grayName:filePath.json", for example: "coolGray:gray.cool.tokens.json"');
    }
  }
  
  // Extract theme information from theme parameters (format: themeName:filePath.json)
  const themeFiles: {name: string, file: string}[] = [];
  const invalidParams: string[] = [];
  
  for (const themeParam of themes) {
    const result = parseThemeParam(themeParam);
    
    if (result) {
      // Check if file exists
      if (!fs.existsSync(result.file)) {
        handleError(`Theme file not found: ${result.file}`);
      }
      
      themeFiles.push(result);
      // 添加主题名称到前缀列表
      if (!paramPrefixes.includes(result.name)) {
        paramPrefixes.push(result.name);
      }
    } else {
      invalidParams.push(themeParam);
    }
  }
  
  // Check if there are invalid theme parameters
  if (invalidParams.length > 0) {
    handleError('Invalid theme parameter format detected. The following parameters are invalid:');
    for (const param of invalidParams) {
      handleError(`  - ${param}`, false);
    }
    handleError('The correct format is "themeName:filePath.json", for example: "blue:brand.blue.tokens.json"');
  }
  
  // Process each theme
  for (const theme of themeFiles) {
    // Load theme file
    const themeTokens = loadTokenFile(theme.file);
    
    // Create directory for each theme
    const themeDir = path.join(output, theme.name);
    if (!fs.existsSync(themeDir)) {
      fs.mkdirSync(themeDir, { recursive: true });
    }
    
    // Process standard categories
    processTokenCategory(
      paletteTokens, 
      prefix, 
      'palette', 
      paramPrefixes, 
      themeDir, 
      CONFIG.outputFiles.palette
    );
    
    processTokenCategory(
      componentTokens, 
      prefix, 
      'component', 
      paramPrefixes, 
      themeDir, 
      CONFIG.outputFiles.component
    );
    
    // 处理多个灰度文件
    const combinedGrayVars: Record<string, string> = {};
    
    // 处理每个灰度文件
    for (const [grayName, grayTokens] of Object.entries(grayTokensMap)) {
      const flatTokens = flattenTokens(grayTokens, '', prefix, paramPrefixes);
      
      // 为每个灰度变量添加其名称作为前缀
      for (const [key, value] of Object.entries(flatTokens)) {
        combinedGrayVars[`${grayName}-${key}`] = value;
      }
    }
    
    // 生成灰度CSS文件
    generateAndWriteCssFile(
      combinedGrayVars,
      combinedGrayVars,
      prefix,
      path.join(themeDir, CONFIG.outputFiles.gray)
    );
    
    // Process special theme category (includes light/dark/custom theme handling)
    // 4. Theme related variables
    const lightThemeVars = flattenTokens(lightThemeTokens, '', prefix, paramPrefixes);
    const darkThemeVars = flattenTokens(darkThemeTokens, '', prefix, paramPrefixes);
    const customThemeVars = flattenTokens(themeTokens, '', prefix, paramPrefixes);
    
    const combinedLightVars: Record<string, string> = {};
    const combinedDarkVars: Record<string, string> = {};
    
    // Add custom theme variables
    for (const [key, value] of Object.entries(customThemeVars)) {
      combinedLightVars[key] = value;
      combinedDarkVars[key] = value;
    }
    
    // Add light theme variables (不再添加light-前缀)
    for (const [key, value] of Object.entries(lightThemeVars)) {
      combinedLightVars[key] = value;
    }
    
    // Add dark theme variables (不再添加dark-前缀)
    for (const [key, value] of Object.entries(darkThemeVars)) {
      combinedDarkVars[key] = value;
    }
    
    // Generate and write theme CSS
    generateAndWriteCssFile(
      combinedLightVars,
      combinedDarkVars,
      prefix,
      path.join(themeDir, CONFIG.outputFiles.theme)
    );
    
    // 5. Create a main file that imports all CSS files
    const indexCss = `@import './${CONFIG.outputFiles.palette}';
@import './${CONFIG.outputFiles.component}';
@import './${CONFIG.outputFiles.gray}';
@import './${CONFIG.outputFiles.theme}';
`;
    fs.writeFileSync(path.join(themeDir, CONFIG.outputFiles.index), indexCss);
  }
}
