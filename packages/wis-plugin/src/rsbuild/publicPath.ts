interface Option {
  port: number;
  host: string;
  https: boolean;
  homepage?: string;
}

export function injectRemotePublicPath(option: Option) {
  if (process.env.NODE_ENV === "development") {
    const protocol = option.https ? "https://" : "http://";
    const url = new URL(option.homepage || "/", "https://wis.design");

    process.env.PUBLIC_PATH = `${protocol}${option.host}:${option.port}${
      url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
    }`
    return;
  }

  if (!option.homepage) {
    throw new Error("Environment 'process.env.BASE_URL' cannot be empty!");
  }

  process.env.PUBLIC_PATH = option.homepage.endsWith("/")
    ? option.homepage
    : `${option.homepage}/`;
}
