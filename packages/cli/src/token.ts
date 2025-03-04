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
  baseCategories: ['component', 'palette', 'light', 'dark', 'gray']
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

// Reference path cache
const referencePathCache = new Map<string, { prefix: string, path: string }>();

// Map reference path to prefix based on the first part of the path
function mapReferenceToPrefix(
  reference: string,
  paramPrefixes: string[]
): { prefix: string, path: string } {
  // Check cache
  const cacheKey = `${reference}:${paramPrefixes.join(',')}`;
  const cachedResult = referencePathCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Split reference path
  const parts = reference.split('.');
  const firstPart = parts[0];
  
  // Check if the first part matches any of our parameter prefixes
  const matchedPrefix = paramPrefixes.find(p => 
    firstPart === p || firstPart.startsWith(`${p}-`)
  );
  
  // If we found a match, use it as prefix, otherwise use the theme name as default
  const prefix = matchedPrefix || 'theme';
  
  // Keep original path unchanged
  const result = { prefix, path: reference };
  
  // Store in cache
  referencePathCache.set(cacheKey, result);
  
  return result;
}

// CSS variable conversion cache
const cssVarCache = new Map<string, string>();

// Convert reference path to CSS variable reference
function pathToCssVar(
  reference: string,
  basePrefix: string,
  paramPrefixes: string[]
): string {
  const cacheKey = `${reference}:${basePrefix}:${paramPrefixes.join(',')}`;
  const cachedResult = cssVarCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  const { prefix, path } = mapReferenceToPrefix(reference, paramPrefixes);
  const result = `var(--${basePrefix}-${prefix}-${path.replace(/\./g, '-')})`;
  
  cssVarCache.set(cacheKey, result);
  return result;
}

// Reference to CSS variable cache
const referenceToCssCache = new Map<string, string>();

// Parse simple references and convert to CSS variable references
function convertReferencesToCssVars(
  value: string,
  prefix: string,
  paramPrefixes: string[]
): string {
  if (!isReference(value)) return value;
  
  const cacheKey = `${value}:${prefix}:${paramPrefixes.join(',')}`;
  const cachedResult = referenceToCssCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  let result: string;
  
  // If it's a pure reference like {brand}, directly return CSS variable reference
  if (value.match(/^\{[^}]+\}$/)) {
    const refPath = getReferencePath(value);
    if (refPath) {
      result = pathToCssVar(refPath, prefix, paramPrefixes);
      referenceToCssCache.set(cacheKey, result);
      return result;
    }
  }
  
  // If it's a mixed reference like #rgba({brand}, 0.5), replace the reference parts
  result = value.replace(/\{([^}]+)\}/g, (_, path) => {
    return pathToCssVar(path, prefix, paramPrefixes);
  });
  
  referenceToCssCache.set(cacheKey, result);
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
  
  // Track all parameter prefixes for dynamic reference resolution
  const paramPrefixes = [...CONFIG.baseCategories];
  
  // Load shared files
  const componentTokens = loadTokenFile(component);
  const paletteTokens = loadTokenFile(palette);
  const lightThemeTokens = loadTokenFile(light);
  const darkThemeTokens = loadTokenFile(dark);
  const grayTokens = gray.length ? loadTokenFile(gray[0]) : {};
  
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
      // Add theme name to paramPrefixes for dynamic reference resolution
      paramPrefixes.push(result.name);
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
    
    processTokenCategory(
      grayTokens, 
      prefix, 
      'gray', 
      paramPrefixes, 
      themeDir, 
      CONFIG.outputFiles.gray
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
    
    // Add light theme variables
    for (const [key, value] of Object.entries(lightThemeVars)) {
      combinedLightVars[`light-${key}`] = value;
    }
    
    // Add dark theme variables
    for (const [key, value] of Object.entries(darkThemeVars)) {
      combinedDarkVars[`dark-${key}`] = value;
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
