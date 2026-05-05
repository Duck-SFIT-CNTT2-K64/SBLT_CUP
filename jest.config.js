/** @type {import('jest').Config} */
const config = {
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
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

module.exports = config;
