import { Context } from "./Context.js";
import type {
  WisConfig,
  Exposes,
  NormalExpose,
  ClassifyExpose,
  PlatformExpose,
  PlatformClassifyExpose,
} from "./Config.js";
import {
  Platform,
  isNormalExpose,
  isPlatformExpose,
  isClassifyExpose,
  isPlatformClassifyExpose,
} from "./Config.js";
import type { TemplateMeta } from "./Template.js"

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
