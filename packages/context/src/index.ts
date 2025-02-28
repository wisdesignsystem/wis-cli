import type {
  ClassifyExpose,
  Exposes,
  NormalExpose,
  PlatformClassifyExpose,
  PlatformExpose,
  WisConfig,
} from "./Config.js";
import {
  Platform,
  isClassifyExpose,
  isNormalExpose,
  isPlatformClassifyExpose,
  isPlatformExpose,
} from "./Config.js";
import { Context } from "./Context.js";
import type { TemplateMeta } from "./Template.js";

export {
  Context,
  Platform,
  isNormalExpose,
  isPlatformExpose,
  isClassifyExpose,
  isPlatformClassifyExpose,
};
export type {
  WisConfig,
  Exposes,
  NormalExpose,
  ClassifyExpose,
  PlatformExpose,
  PlatformClassifyExpose,
  TemplateMeta,
};
