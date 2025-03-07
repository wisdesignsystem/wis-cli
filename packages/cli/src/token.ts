import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

interface Option {
  dark: string;
  light: string;
  component: string;
  palette: string;
  gray: string[];
  themes: string[];
  scope: string;
  output: string;
}

type TokenKey = string;
type FormattedTokenKey = string;

interface CacheTokenObject {
  key: TokenKey;
  formattedKey?: FormattedTokenKey;
  value?: string | CacheTokenObject;
}

interface Token {
  selector: string;
  data: Record<FormattedTokenKey, string | CacheTokenObject>;
}

interface TokenValue {
  $type: string;
  $value: string;
}

interface TokenData {
  [key: string]: TokenValue | TokenData;
}

interface TokenSet {
  name: string;
  tokens: Token[];
}

interface ThemeToken {
  name: string;
  tokenSets: TokenSet[];
}

function isTokenValue(data: unknown): data is TokenValue {
  return (
    typeof data === "object" &&
    data !== null &&
    "$type" in data &&
    data.$type === "color" &&
    "$value" in data
  );
}

function isTokenProtocolFile(file: string) {
  return file.includes(":") && !file.startsWith(":") && !file.endsWith(":");
}

function isPrivateToken(key: string) {
  return key.startsWith("_");
}

function isReferenceToken(value: string) {
  return value.startsWith("{") && value.endsWith("}");
}

function createFile(filePath: string, fileContent: string) {
  const fileDirectory = path.dirname(filePath);

  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  fs.writeFileSync(filePath, fileContent);
}

function resolveTokenFilePath(filePath: string) {
  return path.resolve(process.cwd(), filePath);
}

function parseTokenProtocolFile(file: string) {
  if (!isTokenProtocolFile(file)) {
    throw new Error(
      chalk.redBright(`Invalid token protocol file: ${file} .e.g. xxx:xxx.json`)
    );
  }

  const [prefix, filePath] = file.split(":");

  return {
    prefix,
    filePath,
  };
}

function loadTokenFile(filePath: string): TokenData {
  const tokenFilePath = resolveTokenFilePath(filePath);

  if (!fs.existsSync(tokenFilePath)) {
    throw new Error(chalk.redBright(`File is not exists: ${tokenFilePath}`));
  }

  const content = fs.readFileSync(tokenFilePath, "utf-8");
  return JSON.parse(content);
}

function getReference(value: string): string | null {
  const match = value.match(/\{([^}]+)\}/);
  return match ? match[1] : null;
}

interface ProcessTokenOption {
  scope: string;
  selector: string;
  prefix: string;
  filePath: string;
}

let referenceTokenInstance: Record<TokenKey, CacheTokenObject> = {};
function clearReferenceTokenInstance() {
  referenceTokenInstance = {};
}

function processTokens({
  scope,
  selector,
  prefix,
  filePath,
}: ProcessTokenOption): Token {
  const token: Token = {
    selector,
    data: {},
  };

  function getTokenValue(value: string): string | CacheTokenObject {
    const reference = getReference(value);
    if (!reference) {
      return value;
    }

    const referenceKey = reference;
    let referenceToken = referenceTokenInstance[referenceKey];
    if (!referenceToken) {
      referenceToken = { key: referenceKey };
      referenceTokenInstance[referenceKey] = referenceToken;
    }

    return referenceToken;
  }

  function process(
    prefix: string,
    tokenData: TokenData,
    tokenKeyPath: string[] = []
  ) {
    for (const key in tokenData) {
      if (isPrivateToken(key)) {
        continue;
      }

      const value = tokenData[key];

      const currentTokenKeyPath = tokenKeyPath.concat(key);
      const currentCacheKey = currentTokenKeyPath.join(".");
      const currentFormattedTokenKey = `${prefix}-${currentTokenKeyPath.join(
        "-"
      )}`;

      if (isTokenValue(value)) {
        if (!value.$value) {
          continue;
        }

        let tokenInstance = referenceTokenInstance[currentCacheKey];
        if (!tokenInstance) {
          tokenInstance = {
            key: currentCacheKey,
          };
          referenceTokenInstance[currentCacheKey] = tokenInstance;
        }

        tokenInstance.formattedKey = currentFormattedTokenKey;
        tokenInstance.value = getTokenValue(value.$value);

        if (isReferenceToken(value.$value)) {
          token.data[currentFormattedTokenKey] = tokenInstance;
        } else {
          token.data[currentFormattedTokenKey] = value.$value;
        }
      } else {
        process(prefix, value, currentTokenKeyPath);
      }
    }
  }

  const tokenData = loadTokenFile(filePath);
  process(`--${scope}-${prefix}`, tokenData);

  return token;
}

function processGrayTokens(option: Option) {
  const grayTokens: ThemeToken[] = [];
  for (const grayFilePath of option.gray || []) {
    const { prefix, filePath } = parseTokenProtocolFile(grayFilePath);

    const token = processTokens({
      scope: option.scope,
      selector: ":root",
      prefix: "gray",
      filePath,
    });

    const grayToken: ThemeToken = {
      name: "gray",
      tokenSets: [],
    };

    grayToken.tokenSets.push({
      name: prefix,
      tokens: [token],
    });

    grayTokens.push(grayToken);
  }

  return grayTokens;
}

interface ThemeTokenOption {
  dark: Token;
  light: Token;
  palette: Token;
  component: Token;
}
function processThemeTokens(
  option: Option,
  { dark, light, palette, component }: ThemeTokenOption
) {
  const themeTokens: ThemeToken[] = [];
  for (const themeFilePath of option.themes || []) {
    const { prefix, filePath } = parseTokenProtocolFile(themeFilePath);

    const token = processTokens({
      scope: option.scope,
      selector: ":root",
      prefix: "common",
      filePath,
    });

    const themeToken: ThemeToken = {
      name: `theme/${prefix}`,
      tokenSets: [],
    };

    themeToken.tokenSets.push({
      name: "common",
      tokens: [dark, light, token],
    });

    themeToken.tokenSets.push({
      name: "palette",
      tokens: [palette],
    });

    themeToken.tokenSets.push({
      name: "component",
      tokens: [component],
    });

    themeTokens.push(themeToken);
  }

  return themeTokens;
}

function getTokenSelectors(tokens: Token[]): Token[] {
  const selectorTokenMap: Record<string, Token> = {};

  for (const token of tokens) {
    let currentSelector = selectorTokenMap[token.selector];
    if (!currentSelector) {
      currentSelector = {
        selector: token.selector,
        data: {},
      };
      selectorTokenMap[token.selector] = currentSelector;
    }

    currentSelector.data = {
      ...currentSelector.data,
      ...token.data,
    };
  }

  return Object.values(selectorTokenMap);
}

function generateCSSVariablesWithSelector(token: Token): string {
  let css = `${token.selector} {\n`;

  for (const [key, item] of Object.entries(token.data)) {
    if (typeof item === "string") {
      css += `  ${key}: ${item};\n`;
      continue;
    }
    
    if (typeof item.value === "string") {
      css += `  ${key}: ${item.value};\n`;
      continue;
    }

    const reference = item.value;
    if (!reference) {
      console.info(chalk.redBright(`Unknown token: ${key}`));
      continue;
    }

    css += `  ${key}: var(${reference.formattedKey});\n`;
  }

  css += "}\n";
  return css;
}

function create(themeTokens: ThemeToken[], outputFile: string, createIndexFile = true) {
  const outputDirectory = path.resolve(process.cwd(), outputFile);

  for (const themeToken of themeTokens) {
    let indexFileContent = "";

    for (const tokenSet of themeToken.tokenSets) {
      const themeTokenFilePath = path.resolve(
        outputDirectory,
        `${themeToken.name}/${tokenSet.name}.css`
      );
      const selectorTokens = getTokenSelectors(tokenSet.tokens);

      const themeTokenFileContent = selectorTokens.reduce(
        (acc, selectorToken) => {
          acc.push(generateCSSVariablesWithSelector(selectorToken));
          return acc;
        },
        [] as string[]
      );

      createFile(themeTokenFilePath, themeTokenFileContent.join("\n\n"));

      indexFileContent += `@import "./${tokenSet.name}.css";\n`
    }

    const indexFilePath = path.resolve(outputDirectory, `${themeToken.name}/index.css`);
    createIndexFile && createFile(indexFilePath, indexFileContent);
  }
}

export function token(option: Option) {
  clearReferenceTokenInstance();

  const dark = processTokens({
    scope: option.scope,
    selector: ":root[data-theme=\"dark\"]",
    prefix: "common",
    filePath: option.dark,
  });

  const light = processTokens({
    scope: option.scope,
    selector: ":root",
    prefix: "common",
    filePath: option.light,
  });

  const palette = processTokens({
    scope: option.scope,
    selector: ":root",
    prefix: "palette",
    filePath: option.palette,
  });

  const component = processTokens({
    scope: option.scope,
    selector: ":root",
    prefix: "component",
    filePath: option.component,
  });

  const grayTokens = processGrayTokens(option);
  const themeTokens = processThemeTokens(option, {
    dark,
    light,
    palette,
    component,
  });

  create(themeTokens, option.output);
  create(grayTokens, option.output, false);
}
