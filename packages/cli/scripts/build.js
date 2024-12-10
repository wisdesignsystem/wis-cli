import Wis from "../lib/Wis.js";

export default function () {
  process.env.NODE_ENV = "production";
  if (!process.env.ENV) {
    process.env.ENV = "prod";
  }

  const wis = new Wis();
  wis.build();
}
