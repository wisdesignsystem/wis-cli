import type { Configuration } from "webpack"

type RelativePath = string;
type AbsolutePath = string;
type AliasPath = string;
type Path = RelativePath | AbsolutePath | AliasPath;

type CrossModulePath = {
  pc: Path;
  pad?: Path;
  mobile: Path;
}
type ResourceModulePath = Record<string, Path>

type ExposeModuleName = string;
type ExposeModulePath = Path | CrossModulePath | ResourceModulePath;

type Shared = (string | SharedObject)[] | SharedObject;

/**
 * Advanced configuration for modules that should be shared in the share scope.
 */
interface SharedConfig {
	/**
	 * Include the provided and fallback module directly instead behind an async request. This allows to use this shared module in initial load too. All possible shared modules need to be eager too.
	 */
	eager?: boolean;

	/**
	 * Provided module that should be provided to share scope. Also acts as fallback module if no shared module is found in share scope or version isn't valid. Defaults to the property name.
	 */
	import?: string | false;

	/**
	 * Package name to determine required version from description file. This is only needed when package name can't be automatically determined from request.
	 */
	packageName?: string;

	/**
	 * Version requirement from module in share scope.
	 */
	requiredVersion?: string | false;

	/**
	 * Module is looked up under this key from the share scope.
	 */
	shareKey?: string;

	/**
	 * Share scope name.
	 */
	shareScope?: string;

	/**
	 * Allow only a single version of the shared module in share scope (disabled by default).
	 */
	singleton?: boolean;

	/**
	 * Do not accept shared module if version is not valid (defaults to yes, if local fallback module is available and shared module is not a singleton, otherwise no, has no effect if there is no required version specified).
	 */
	strictVersion?: boolean;

	/**
	 * Version of the provided module. Will replace lower matching versions, but not higher.
	 */
	version?: string | false;
}

/**
 * Modules that should be shared in the share scope. Property names are used to match requested modules in this compilation. Relative requests are resolved, module requests are matched unresolved, absolute paths will match resolved requests. A trailing slash will match all requests with this prefix. In this case shareKey must also have a trailing slash.
 */
interface SharedObject {
	[index: string]: string | SharedConfig;
}

export interface Config {
  /**
   * Remote module to be executed first during project initialization runtime.
   */
  remoteEntry?: ExposeModuleName;

  /**
   * Configuration for project reference path aliases.
   */
  alias?: Record<string, RelativePath | AbsolutePath>;

  /**
   * Root directory configuration for component packages. Components under this directory will have non-random style names when using CSS Modules.
   */
  packageRootPath?: Path;

	/**
	 * Modules that should be exposed by this container. When provided, property name is used as public name, otherwise public name is automatically inferred from request.
	 */
  exposes?: Record<ExposeModuleName, ExposeModulePath>;

	/**
	 * Modules that should be shared in the share scope. When provided, property names are used to match requested modules in this compilation.
	 */
  shared?: Shared;

  /**
   * Style component to display to the user when the page or layout resources have not yet loaded successfully.
   */
  loading?: Path | Record<"page" | "layout", Path>;

  /**
   * Use the browser's history API to implement routing, requires server-side routing support.
   */
  browserHistory?: boolean;

  /**
   * Configure the list of plugins to be used.
   */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  plugins?: string[] | [string, any];

  webpackConfig?: (config: Configuration) => Configuration;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  webpackConfigure?: (configure: any) => void;
}
