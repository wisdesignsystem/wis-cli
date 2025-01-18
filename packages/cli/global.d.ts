declare module "*.scss";
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.svg";
declare module "*.png";
declare module "*.gif";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.json";
declare module "*.txt";

interface Window {
  /**
   * When switching languages, the current language will be stored in window.localStorage with this variable as the key
   */
  $__wis_language__: string;

  /**
   * Stores the remote address of the application
   */
  $__wis_remotes__: Record<string, string>;

  /**
   * Stores the raw remote address of the application
   */
  $__wis_raw_remotes__: Record<string, string>;

  /**
   * Stores the list of layouts supported by the current application
   */
  $__wis_layouts__: string[];

  /**
   * Stores the current application route type
   */
  $__wis_router_type__: "browserRouter" | "hashRouter";
}
