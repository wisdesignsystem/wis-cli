import type { Context } from "@wisdesign/context";

export function remotes(context: Context) {
  const remotes = context.config.remotes;

  const result: Record<string, string> = {
    [context.config.name]: `${context.config.name}@${
      process.env.NODE_ENV === "production" ? process.env.PUBLIC_PATH : "/"
    }mf-manifest.json`,
  };

  for (const remote in remotes) {
    const url = remotes[remote];
    result[remote] = url.endsWith("/")
      ? `${remote}@${url}mf-manifest.json`
      : `${remote}@${url}/mf-manifest.json`;
  }

  return result;
}
