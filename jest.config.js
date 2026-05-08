/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
          tsconfig: {
            module: "commonjs",
            moduleResolution: "node",
            jsx: "react-jsx",
          },
        }],
      },
      transformIgnorePatterns: [
        "node_modules/(?!(next-auth|@auth|oauth4webapi|jose)/)",
      ],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testMatch: ["**/__tests__/lib/**/*.test.ts", "**/__tests__/api/**/*.test.ts", "**/__tests__/integration/**/*.test.ts"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    },
    {
      displayName: "component",
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
          tsconfig: {
            module: "commonjs",
            moduleResolution: "node",
            jsx: "react-jsx",
          },
        }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testMatch: ["**/__tests__/components/**/*.test.tsx"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    },
  ],
};

module.exports = config;
