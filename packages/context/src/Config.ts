import { loadConfig, loadPackageJSON } from "./loaderFile.js";

export enum Platform {
  PC = "pc",
  Mobile = "mobile",
  Pad = "pad",
}

type ExposeName = string;

export type NormalExpose = string;

interface ClassifyRequired {
  default: string;
}
interface ClassifyOther {
  [key: string]: string;
}
export type ClassifyExpose = Required<ClassifyRequired> & Omit<ClassifyOther, Platform>;

export interface PlatformExpose {
  [Platform.PC]: string;
  [Platform.Mobile]?: string;
  [Platform.Pad]?: string;
}

export interface PlatformClassifyExpose {
  [Platform.PC]: ClassifyExpose;
  [Platform.Mobile]?: ClassifyExpose;
  [Platform.Pad]?: ClassifyExpose;
};

export type Exposes = {
  [key: ExposeName]:
    | NormalExpose
    | PlatformExpose
    | ClassifyExpose
    | PlatformClassifyExpose
};

interface ShareConfig {
  singleton?: boolean;
  requiredVersion?: string;
}

type Shared = string[] | Record<string, ShareConfig>;

type Remotes = Record<string, string>;

function isObject(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function isExposeValue(data: Record<string, unknown>) {
  return Object.keys(data).every((key) => typeof data[key] === "string");
}

function isPlatform(data: unknown) {
  if (!isObject(data)) {
    return false;
  }

  const hasOnlyPlatformKey = Object.keys(data).every((key) => Object.values(Platform).some(data => key === data));

  return data.pc !== undefined && hasOnlyPlatformKey;
}

function isClassify(data: unknown) {
  if (!isObject(data)) {
    return false;
  }

  const hasNonePlatformKey = !Object.keys(data).some((key) => Object.values(Platform).some(data => key === data))

  return data.default !== undefined && hasNonePlatformKey;
}

export function isNormalExpose(data: unknown): data is NormalExpose {
  return typeof data === "string";
}

export function isPlatformExpose(data: unknown): data is PlatformExpose {
  if (!isObject(data)) {
    return false;
  }

  return isPlatform(data) && isExposeValue(data);
}

export function isClassifyExpose(data: unknown): data is ClassifyExpose {
  if (!isObject(data)) {
    return false;
  }

  if (isPlatformExpose(data)) {
    return false;
  }

  return isClassify(data) && isExposeValue(data);
}

export function isPlatformClassifyExpose(
  data: unknown
): data is PlatformClassifyExpose {
  if (!isObject(data)) {
    return false;
  }

  if (!isPlatform(data)) {
    return false;
  }

  return Object.keys(data).every((platform) => {
    return isClassifyExpose(data[platform]);
  });
}

export interface WisConfig {
  name?: string;

  libraryRegExp?: RegExp;

  entry?: ExposeName;

  remotes?: Remotes;

  exposes?: Exposes;

  shared?: Shared;

  runtimePlugins?: string[];

  designWidth?: number;
}

export class Config {
  rawConfig: WisConfig = {};

  libraryRegExp?: RegExp = undefined;

  name = "";

  remotes: Remotes = {};

  exposes: Exposes = {};

  shared: Shared = [];

  runtimePlugins: string[] = [];

  designWidth = 320;

  load() {
    const config = loadConfig();
    if (config) {
      this.rawConfig = config;
    }

    const packageJson = loadPackageJSON();

    this.name = this.rawConfig.name || packageJson.name;
    this.libraryRegExp = this.rawConfig.libraryRegExp || this.libraryRegExp;
    this.exposes = this.rawConfig.exposes || this.exposes;
    this.shared = this.rawConfig.shared || this.shared;
    this.remotes = this.rawConfig.remotes || this.remotes;
    this.runtimePlugins = this.rawConfig.runtimePlugins || this.runtimePlugins;
    this.designWidth = this.rawConfig.designWidth || this.designWidth;
  }

  addRuntimePlugin(plugin: string) {
    this.runtimePlugins.push(plugin)
  }
}
