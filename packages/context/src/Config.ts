import path from "node:path";

import { loadTSConfigFile, loadPackageJSON } from "./loaderFile.js";

type NormalExpose = string;

type ThemeExpose = Record<string, string>;

type Platform = "pc" | "mobile" | "pad";
type PlatformExpose = {
  [platform in Platform]: string;
};

type PlatformThemeExpose = {
  [platform in Platform]: ThemeExpose;
};

export type Exposes = {
  [key: string]:
    | NormalExpose
    | PlatformExpose
    | ThemeExpose
    | PlatformThemeExpose;
};

interface ShareConfig {
  singleton?: boolean;
  requiredVersion?: string;
  eager?: boolean;
  shareScope?: string;
}

type Shared = string[] | Record<string, ShareConfig>;

type Remotes = Record<string, string>;

const platforms = ["pc", "pad", "mobile"];

function isObject(data: unknown): data is object {
  return typeof data === "object" && data !== null;
}

export function isNormalExpose(data: unknown): data is NormalExpose {
  return typeof data === "string";
}

function isPlatform(data: unknown) {
  if (!isObject(data)) {
    return false;
  }

  return (
    Object.keys(data).every((key) => platforms.includes(key)) && "pc" in data
  );
}

function isLikePlatform(data: unknown) {
  if (!isObject(data)) {
    return false;
  }

  return Object.keys(data).some((key) => platforms.includes(key));
}

export function isPlatformExpose(data: unknown): data is PlatformExpose {
  if (!isObject(data)) {
    return false;
  }

  return isPlatform(data);
}

export function isThemeExpose(data: unknown): data is ThemeExpose {
  if (!isObject(data)) {
    return false;
  }

  if (isPlatformExpose(data)) {
    return false;
  }

  if (isLikePlatform(data)) {
    return false;
  }

  return (
    Object.keys(data).length !== 0 &&
    Object.keys(data as Record<string, unknown>).every(
      (key) => typeof (data as Record<string, unknown>)[key] === "string"
    )
  );
}

export function isPlatformThemeExpose(
  data: unknown
): data is PlatformThemeExpose {
  if (!isPlatformExpose(data)) {
    return false;
  }

  return Object.keys(data as Record<string, unknown>).every((platform) => {
    return isThemeExpose((data as Record<string, unknown>)[platform]);
  });
}

export interface WisConfig {
  name?: string;

  libraryPath?: string;

  remoteEntries?: string[];

  remotes?: Remotes;

  exposes?: Exposes;

  shared?: Shared;
}

export class Config {
  configFile = path.resolve(process.cwd(), "wis.config.ts");

  rawConfig: WisConfig = {};

  name = "";

  libraryPath = "";

  remoteEntries: string[] = [];

  remotes: Remotes = {};

  exposes: Exposes = {};

  shared: Shared = [];

  setup() {
    const config = loadTSConfigFile(this.configFile);
    if (config) {
      this.rawConfig = config;
    }

    const packageJson = loadPackageJSON();

    this.name = this.rawConfig.name || packageJson.name;
    this.libraryPath = this.rawConfig.libraryPath || this.libraryPath;
    this.remoteEntries = this.rawConfig.remoteEntries || this.remoteEntries;
    this.exposes = this.rawConfig.exposes || this.exposes;
    this.shared = this.rawConfig.shared || this.shared;
    this.remotes = this.rawConfig.remotes || this.remotes;
  }
}
