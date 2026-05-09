/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/*.ts",
    "!src/lib/env.ts",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 5,
      functions: 4,
      branches: 4,
    },
  },
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
