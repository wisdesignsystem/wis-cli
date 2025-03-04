import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

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

// Map reference path to prefix based on the first part of the path
function mapReferenceToPrefix(
  reference: string,
  paramPrefixes: string[]
): { prefix: string, path: string } {
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
  return { prefix, path: reference };
}

// Convert reference path to CSS variable reference
function pathToCssVar(
  reference: string,
  basePrefix: string,
  paramPrefixes: string[]
): string {
  const { prefix, path } = mapReferenceToPrefix(reference, paramPrefixes);
  return `var(--${basePrefix}-${prefix}-${path.replace(/\./g, '-')})`;
}

// Parse simple references and convert to CSS variable references
function convertReferencesToCssVars(
  value: string,
  prefix: string,
  paramPrefixes: string[]
): string {
  if (!isReference(value)) return value;
  
  // If it's a pure reference like {brand}, directly return CSS variable reference
  if (value.match(/^\{[^}]+\}$/)) {
    const refPath = getReferencePath(value);
    if (refPath) {
      return pathToCssVar(refPath, prefix, paramPrefixes);
    }
  }
  
  // If it's a mixed reference like #rgba({brand}, 0.5), replace the reference parts
  return value.replace(/\{([^}]+)\}/g, (_, path) => {
    return pathToCssVar(path, prefix, paramPrefixes);
  });
}

// Flatten nested token objects to a single layer structure with prefix
function flattenTokens(
  tokens: TokenData,
  tokenPrefix: string,
  cssPrefix: string,
  paramPrefix: string,
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

// Read JSON file
function loadTokenFile(filePath: string, isRequired = true): TokenData {
  try {
    if (!fs.existsSync(filePath)) {
      if (isRequired) {
        console.error(chalk.red(`File not found: ${filePath}`));
        process.exit(1);
      }
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red(`Error loading token file ${filePath}:`), error);
    if (isRequired) {
      process.exit(1);
    }
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

// Main function
export async function token(options: TokenOptions) {
  const { prefix, output, component, palette, light, dark, gray = [], themes = [] } = options;
  
  // Ensure output directory exists
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }
  
  // Track all parameter prefixes for dynamic reference resolution
  const paramPrefixes = ['component', 'palette', 'light', 'dark', 'gray'];
  
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
        console.error(chalk.red(`Theme file not found: ${result.file}`));
        process.exit(1);
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
    console.error(chalk.red('Invalid theme parameter format detected. The following parameters are invalid:'));
    for (const param of invalidParams) {
      console.error(chalk.red(`  - ${param}`));
    }
    console.error(chalk.red('The correct format is "themeName:filePath.json", for example: "blue:brand.blue.tokens.json"'));
    process.exit(1);
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
    
    // Split CSS variables by category
    
    // 1. Palette related variables
    const lightPaletteTokens = flattenTokens(paletteTokens, '', prefix, 'palette', paramPrefixes);
    const darkPaletteTokens = flattenTokens(paletteTokens, '', prefix, 'palette', paramPrefixes);
    
    const lightPaletteVars: Record<string, string> = {};
    const darkPaletteVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(lightPaletteTokens)) {
      lightPaletteVars[`palette-${key}`] = value;
    }
    
    for (const [key, value] of Object.entries(darkPaletteTokens)) {
      darkPaletteVars[`palette-${key}`] = value;
    }
    
    const lightPaletteCss = generateCSSVariablesWithSelector(lightPaletteVars, prefix, ':root');
    const darkPaletteCss = generateCSSVariablesWithSelector(darkPaletteVars, prefix, ':root[data-theme="dark"]');
    const paletteCss = `${lightPaletteCss}\n${darkPaletteCss}`;
    fs.writeFileSync(path.join(themeDir, 'palette.css'), paletteCss);
    
    // 2. Component related variables
    const lightComponentTokens = flattenTokens(componentTokens, '', prefix, 'component', paramPrefixes);
    const darkComponentTokens = flattenTokens(componentTokens, '', prefix, 'component', paramPrefixes);
    
    const lightComponentVars: Record<string, string> = {};
    const darkComponentVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(lightComponentTokens)) {
      lightComponentVars[`component-${key}`] = value;
    }
    
    for (const [key, value] of Object.entries(darkComponentTokens)) {
      darkComponentVars[`component-${key}`] = value;
    }
    
    const lightComponentCss = generateCSSVariablesWithSelector(lightComponentVars, prefix, ':root');
    const darkComponentCss = generateCSSVariablesWithSelector(darkComponentVars, prefix, ':root[data-theme="dark"]');
    const componentCss = `${lightComponentCss}\n${darkComponentCss}`;
    fs.writeFileSync(path.join(themeDir, 'component.css'), componentCss);
    
    // 3. Gray related variables
    const lightGrayTokens = flattenTokens(grayTokens, '', prefix, 'gray', paramPrefixes);
    const darkGrayTokens = flattenTokens(grayTokens, '', prefix, 'gray', paramPrefixes);
    
    const lightGrayVars: Record<string, string> = {};
    const darkGrayVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(lightGrayTokens)) {
      lightGrayVars[`gray-${key}`] = value;
    }
    
    for (const [key, value] of Object.entries(darkGrayTokens)) {
      darkGrayVars[`gray-${key}`] = value;
    }
    
    const lightGrayCss = generateCSSVariablesWithSelector(lightGrayVars, prefix, ':root');
    const darkGrayCss = generateCSSVariablesWithSelector(darkGrayVars, prefix, ':root[data-theme="dark"]');
    const grayCss = `${lightGrayCss}\n${darkGrayCss}`;
    fs.writeFileSync(path.join(themeDir, 'gray.css'), grayCss);
    
    // 4. Theme related variables
    const lightThemeOnlyTokens = flattenTokens(lightThemeTokens, '', prefix, 'light', paramPrefixes);
    const darkThemeOnlyTokens = flattenTokens(darkThemeTokens, '', prefix, 'dark', paramPrefixes);
    const customThemeTokens = flattenTokens(themeTokens, '', prefix, '', paramPrefixes);
    
    const lightThemeVars: Record<string, string> = {};
    const darkThemeVars: Record<string, string> = {};
    
    // Add custom theme variables
    for (const [key, value] of Object.entries(customThemeTokens)) {
      lightThemeVars[key] = value;
      darkThemeVars[key] = value;
    }
    
    // Add theme variables
    for (const [key, value] of Object.entries(lightThemeOnlyTokens)) {
      lightThemeVars[`light-${key}`] = value;
    }
    
    for (const [key, value] of Object.entries(darkThemeOnlyTokens)) {
      darkThemeVars[`dark-${key}`] = value;
    }
    
    const lightThemeCss = generateCSSVariablesWithSelector(lightThemeVars, prefix, ':root');
    const darkThemeCss = generateCSSVariablesWithSelector(darkThemeVars, prefix, ':root[data-theme="dark"]');
    const themeCss = `${lightThemeCss}\n${darkThemeCss}`;
    fs.writeFileSync(path.join(themeDir, 'theme.css'), themeCss);
    
    // 5. Create a main file that imports all CSS files
    const indexCss = `@import './palette.css';
@import './component.css';
@import './gray.css';
@import './theme.css';
`;
    fs.writeFileSync(path.join(themeDir, 'index.css'), indexCss);
  }
}
