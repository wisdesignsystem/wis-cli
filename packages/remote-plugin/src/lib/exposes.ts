import type { Context, PlatformExpose, ClassifyExpose, PlatformClassifyExpose } from "@wisdesign/context";
import {
  Platform,
  isNormalExpose,
  isClassifyExpose,
  isPlatformExpose,
  isPlatformClassifyExpose,
} from "@wisdesign/context";

function flattenPlatformExposes(mfExposes: Record<string, string>, key: string, value: PlatformExpose) {
  mfExposes[key] = value[Platform.PC]

  if (value[Platform.Pad] !== undefined) {
    mfExposes[`${key}/${Platform.Pad}`] = value[Platform.Pad];
  }

  if (value[Platform.Mobile] !== undefined) {
    mfExposes[`${key}/${Platform.Mobile}`] = value[Platform.Mobile];
  }

  return mfExposes;
}

function flattenClassifyExposes(mfExposes: Record<string, string>, key: string, value: ClassifyExpose) {
  mfExposes[key] = value.default;

  for (const k in value) {
    if (k === 'default') {
      mfExposes[key] = value[k]
    } else {
      mfExposes[`${key}/${k}`] = value[k]
    }
  }
}

function flattenPlatformClassifyExposes(mfExposes: Record<string, string>, key: string, value: PlatformClassifyExpose) {
  flattenClassifyExposes(mfExposes, key, value[Platform.PC])

  if (value[Platform.Pad] !== undefined) {
    flattenClassifyExposes(mfExposes, `${key}/${Platform.Pad}`, value[Platform.Pad])
  }

  if (value[Platform.Mobile] !== undefined) {
    flattenClassifyExposes(mfExposes, `${key}/${Platform.Mobile}`, value[Platform.Mobile])
  }
}

export function exposes(context: Context) {
  const exposes = context.config.exposes;

  const mfExposes: Record<string, string> = {};

  for (const key in exposes) {
    const value = exposes[key];

    if (isNormalExpose(value)) {
      mfExposes[key] = value;
      continue;
    }

    if (isPlatformExpose(value)) {
      flattenPlatformExposes(mfExposes, key, value);
      continue;
    }

    if (isClassifyExpose(value)) {
      flattenClassifyExposes(mfExposes, key, value);
      continue;
    }

    if (isPlatformClassifyExpose(value)) {
      flattenPlatformClassifyExposes(mfExposes, key, value);
      continue;
    }

    console.warn("Invalid 'expose' configuration option. Please check the 'wis.config.ts' configuration file.")
    console.warn()
    console.warn(`${key}: ${JSON.stringify(value, undefined, 2)}`)
  }

  return mfExposes;
}
