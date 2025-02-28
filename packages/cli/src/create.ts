import { confirm, input, select } from "@inquirer/prompts";

import { create as createRsbuild } from "./rsbuild.js";

export interface CreatorOption {
  name: string;
  lint: boolean;
}

type Creator = (option: CreatorOption) => void;

const creators: Record<string, Creator> = {
  rsbuild: createRsbuild,
};

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // no action
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

export async function create() {
  const name = await input({
    message: "What's name of your project?",
    required: true,
  });

  const type = await select({
    message: "What cli do you want to use?",
    choices: [
      {
        name: "rsbuild",
        value: "rsbuild",
      },
    ],
    default: "rsbuild",
  });

  const lint = await confirm({
    message: "Could you want to use lint(default: Yes)?",
    default: true,
  });

  const creator = creators[type];
  creator({ name, lint });
}
