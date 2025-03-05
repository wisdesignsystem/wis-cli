import fs from "node:fs";
import path from "node:path";

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
  value?: string | CacheTokenObject;
}

interface Token {
  selector: string;
  data: Record<FormattedTokenKey, CacheTokenObject>;
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
    "$value" in data
  );
}

function isTokenProtocolFile(file: string) {
  return file.includes(":") && !file.startsWith(":") && !file.endsWith(":");
}

function isPrivateToken(key: string) {
  return key.startsWith("_");
}

function resolveTokenFilePath(filePath: string) {
  return path.resolve(process.cwd(), filePath);
}

function parseTokenProtocolFile(file: string) {
  if (!isTokenProtocolFile(file)) {
    throw new Error(`Invalid token protocol file: ${file} .e.g. xxx:xxx.json`);
  }

  const [prefix, filePath] = file.split(":");

  return {
    prefix,
    filePath,
  };
}

function loadTokenFile(filePath: string): TokenData {
  const tokenFilePath = resolveTokenFilePath(filePath);

  if (fs.existsSync(tokenFilePath)) {
    throw new Error(`File is not exists: ${tokenFilePath}`);
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

let cacheTokenInstance: Record<TokenKey, CacheTokenObject> = {};
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

    let referenceTokenInstance = cacheTokenInstance[reference];
    if (!referenceTokenInstance) {
      referenceTokenInstance = { key: reference };
      cacheTokenInstance[reference] = referenceTokenInstance;
    }

    return referenceTokenInstance;
  }

  function process(prefix: string, tokenData: TokenData, tokenKey = "") {
    for (const key in tokenData) {
      if (isPrivateToken(key)) {
        continue;
      }

      const currentTokenKey = `${tokenKey}-${key}`;
      const value = tokenData[key];
      if (isTokenValue(value)) {
        if (!value.$value) {
          continue;
        }

        let tokenInstance = cacheTokenInstance[currentTokenKey];
        if (!tokenInstance) {
          tokenInstance = {
            key: currentTokenKey,
          };
          cacheTokenInstance[currentTokenKey] = tokenInstance;
        }

        tokenInstance.value = getTokenValue(value.$value);

        token.data[`${prefix}-${tokenInstance.key}`] = tokenInstance;
      }
    }
  }

  const tokenData = loadTokenFile(filePath);
  process(`--${scope}-${prefix}`, tokenData);

  return token;
}

function create(themeTokens: ThemeToken[], outputFile: string) {
  const outputDirectory = path.resolve(process.cwd(), outputFile);
  // TODO 完成生成逻辑
}

export function token(option: Option) {
  cacheTokenInstance = {};

  const dark = processTokens({
    scope: option.scope,
    selector: ':root[data-theme="dark"]',
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

  const grays: Token[] = [];
  for (const grayFilePath of option.gray || []) {
    const { prefix, filePath } = parseTokenProtocolFile(grayFilePath);

    const token = processTokens({
      scope: option.scope,
      selector: ":root",
      prefix,
      filePath,
    });

    grays.push(token);
  }

  const themeTokens: ThemeToken[] = [];
  for (const themeFilePath of option.themes || []) {
    const { prefix, filePath } = parseTokenProtocolFile(themeFilePath);

    const token = processTokens({
      scope: option.scope,
      selector: ":root",
      prefix,
      filePath,
    });

    const themeToken: ThemeToken = {
      name: prefix,
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

    themeToken.tokenSets.push({
      name: "gray",
      tokens: grays,
    });

    themeTokens.push(themeToken);
  }

  create(themeTokens, option.output);
}
