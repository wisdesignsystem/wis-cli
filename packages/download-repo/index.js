import stream from "node:stream";
import { pipeline } from "node:stream/promises";
import { x } from "tar";

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download url: ${url}`);
  }

  return stream.Readable.fromWeb(response.body);
}

function unzip(outputPath) {
  return x({ cwd: outputPath, strip: 1 });
}

export async function downloadGithubRepo(githubRepo, outputPath, options) {
  const [username, repoName] = githubRepo.split("/");
  const branch = options?.branch || "main";

  const url = `https://codeload.github.com/${username}/${repoName}/tar.gz/${branch}`;
  await pipeline(await download(url), unzip(outputPath));
}
