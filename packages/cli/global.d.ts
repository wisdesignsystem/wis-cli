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
declare module "@wisdesign/lsicon";

interface Window {
  /**
   * When switching languages, the current language will be stored in window.localStorage with this variable as the key
   */
  $__wis_language__: string;

  /**
   * Stores the remote address of the application
   */
  $__wis__remotes__: Record<string, string>;

  /**
   * Stores the list of layouts supported by the current application
   */
  $__layouts__: string[];

  /**
   * Stores the current application route type
   */
  $__router_type__: "browserRouter" | "hashRouter";
}
