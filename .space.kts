/**
 * JetBrains Space Automation
 * This Kotlin-script file lets you automate build activities
 * For more info, see https://www.jetbrains.com/help/space/automation.html
 */

job("Build Host Extension for Chromium-based browsers") {
  startOn {
    gitPush {
      pathFilter {
        +"**"
        -"packages/**"
        +"packages/host/**"
        -"**/README.md"
      }
    }
  }
  container(image = "node:16-alpine") {
    shellScript {
      content = """
                set -e

                echo Install build deps
                apk update
                apk add --no-cache zip curl

                npm install -g pnpm
                pnpm install
                cd packages/host

                echo Building without type-checking and CWS key
                pnpm build:vite # TODO: use pnpm build

                echo Done, zipping and uploading
                zip -r clay-host.zip dist-prod/
                SOURCE_PATH=clay-host.zip
                TARGET_PATH=clay-host/${'$'}JB_SPACE_EXECUTION_NUMBER/
                REPO_URL=https://files.pkg.jetbrains.space/npathy/p/clay/files
                curl -i -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -F file=@"${'$'}SOURCE_PATH" ${'$'}REPO_URL/${'$'}TARGET_PATH
            """.trimIndent()
    }
  }
}
// viewer depends on host trpc router type
job("Build Viewer for windows") {
  startOn {
    gitPush {
      pathFilter {
        +"**"
        -"**/README.md"
      }
    }
  }
  container(image = "electronuserland/builder:16-wine") {
    shellScript {
      content = """
                set -e
                npm install -g pnpm
                pnpm install
                cd packages/viewer

                # curl is already installed
                REPO_URL=https://files.pkg.jetbrains.space/npathy/p/clay/files
                OS=win
                EXT=.exe

                echo Fetch dependencies
                REF_PATH=clay-relay/latest.txt
                curl -f -L -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -o latest.txt ${'$'}REPO_URL/${'$'}REF_PATH
                LATEST_RELAY=$(cat latest.txt) # e.g. clay-relay/builds/1/

                mkdir -p ./relay/${'$'}OS
                curl -f -L -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -o ./relay/${'$'}OS/clay-relay${'$'}EXT ${'$'}REPO_URL/${'$'}{LATEST_RELAY}clay-relay${'$'}EXT

                echo Building
                pnpm run build:win

                echo Done, uploading
                SOURCE_PATH=$(find dist/ -name '*-setup.exe' -printf '%p')
                TARGET_PATH=clay-viewer-electron/${'$'}JB_SPACE_EXECUTION_NUMBER/
                curl -i -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -F file=@"${'$'}SOURCE_PATH" ${'$'}REPO_URL/${'$'}TARGET_PATH
            """.trimIndent()
    }
  }
}
