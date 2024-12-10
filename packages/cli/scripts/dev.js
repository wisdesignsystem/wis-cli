import Wis from "../lib/Wis.js";

export default function () {
  process.env.NODE_ENV = "development";
  if (!process.env.ENV) {
    process.env.ENV = "dev";
  }

  const wis = new Wis();
  wis.dev();
}
