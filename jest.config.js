/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    transform: {
        ".+\\.tsx?$": "ts-jest",
        ".+\\.js$": "babel-jest",
    },
    transformIgnorePatterns: [
  `node_modules/(?!(nanoevents)/)`
],
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts$",
    moduleFileExtensions: ["ts", "js"],
    setupFilesAfterEnv: ["./src/setupTests.ts"],
};
