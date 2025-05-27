module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(ts|js|html)$": "ts-jest",
  },
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "html", "js", "json"],
  transformIgnorePatterns: ["node_modules/(?!(devextreme)/)"],
};
