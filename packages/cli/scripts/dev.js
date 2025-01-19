import Wis from "../lib/Wis.js";

export default function () {
  process.env.NODE_ENV = "development";
  const wis = new Wis();
  wis.dev();
}
