import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import fs from "fs/promises";
import path from "path";
// @ts-expect-error @types/web-ext not yet available
import webExt from "web-ext";
import chokidar from "chokidar";

const dev = !!process.env["IS_DEV"];

// TODO: support other than chrome

/// build and watch for changes if option provided.
const buildSingle = async (
  entryPoints: [string],
  outdir: string,
  addition?: Partial<Parameters<typeof build>>[0]
) => {
  await build({
    entryPoints,
    outdir,
    bundle: true,
    sourcemap: dev ? "inline" : false,
    plugins: [
      sassPlugin({
        async transform(source) {
          const { css } = await postcss(
            autoprefixer,
            // @ts-expect-error @types/tailwindcss is outdated
            tailwindcss(path.resolve(__dirname, "../tailwind.config.js"))
          ).process(source, { from: undefined }); // suppress warning
          return css;
        },
      }),
    ],
    ...addition,
  });
};

const copyFromSrcToDist = async (from: string) => {
  const to = from.replace("src", "dist/chrome");
  await fs.copyFile(from, to);
};

(async () => {
  const watchMode = true;
  const watch: Parameters<typeof build>[0] = watchMode
    ? {
        watch: {
          onRebuild(error, result) {
            if (error) console.error("watch build failed:", error);
            else console.log("watch build succeeded:", result);
            extensionRunner.reloadAllExtensions();
          },
        },
      }
    : {};
  // ensure the dist folder exists
  await fs.mkdir("dist/chrome", { recursive: true });
  await fs.mkdir("dist/chrome/icons", { recursive: true });
  await fs.mkdir("dist/chrome/popup", { recursive: true });
  await fs.mkdir("dist/chrome/options", { recursive: true });
  await fs.mkdir("dist/chrome/background", { recursive: true });
  await fs.mkdir("dist/chrome/content-scripts", { recursive: true });

  await copyFromSrcToDist("src/manifest.json");
  await copyFromSrcToDist("src/popup/popup.html");
  await copyFromSrcToDist("src/options/options.html");
  await fs.cp("icons", "dist/chrome/icons", { recursive: true });

  await buildSingle(["./src/popup/index.tsx"], "./dist/chrome/popup/", watch);
  await buildSingle(
    ["./src/options/index.tsx"],
    "./dist/chrome/options/",
    watch
  );
  await buildSingle(
    ["./src/background/index.ts"],
    "./dist/chrome/background/",
    watch
  );
  await buildSingle(
    ["./src/content-scripts/index.ts"],
    "./dist/chrome/content-scripts/",
    watch
  );

  // NOTE: firefox android is supported
  const extensionRunner = await webExt.cmd.run(
    {
      sourceDir: path.join(__dirname, "../dist/chrome/"),
      target: "chromium",
      noReload: true,
    },
    { shouldExitProgram: true }
  );
  // extensionRunner.reloadAllExtensions();
  // extensionRunner.exit();
  if (watchMode)
    chokidar
      .watch("./src", { ignoreInitial: true })
      .on("all", async (event, path) => {
        console.log(event, path);
        if (path.endsWith(".json"))
          await copyFromSrcToDist("src/manifest.json");
        else if (path.endsWith(".html")) {
          await copyFromSrcToDist("src/popup/popup.html");
          await copyFromSrcToDist("src/options/options.html");
        } else if (path.endsWith(".tsx")) {
          // zatu
          return;
        }
        console.log("reloading!");
        extensionRunner.reloadAllExtensions();
      });
})();
