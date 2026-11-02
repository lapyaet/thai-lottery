import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

// ESM-only packages that must be transformed for Jest's CommonJS runtime.
const esmPackages = ["next-intl", "use-intl", "@formatjs", "intl-messageformat"];

const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/mcp/", "<rootDir>/.next/"],
};

const jestConfig = async () => {
  const resolved = await createJestConfig(config)();
  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!(${esmPackages.join("|")})/)`,
      ...(resolved.transformIgnorePatterns ?? []).filter(
        (p: string) => !p.includes("node_modules"),
      ),
    ],
  };
};

export default jestConfig;
