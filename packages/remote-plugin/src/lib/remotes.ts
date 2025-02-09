import type { Context } from "@wisdesign/context";

export function remotes(context: Context) {
  const remotes = context.config.remotes;

  const result: Record<string, string> = {}
  for (const remote in remotes) {
    const url = remotes[remote];
    result[remote] = url.endsWith("/") ? `${context.config.name}@${url}manifest.json` : `${context.config.name}@${url}/manifest.json`;
  }

  return result
}
