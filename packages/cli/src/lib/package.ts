import { $ } from "zx";

export async function getLastedVersion(name: string) {
  const data = await $`npm view ${name} versions --json`;
  const versions = JSON.parse(data.stdout).filter(
    (version: string) => !/alpha|beta|rc/.test(version),
  );

  return versions[versions.length - 1];
}
