import Wis from "../lib/Wis.js";

export default function () {
  process.env.NODE_ENV = "production";
  const wis = new Wis();
  wis.build();
}
