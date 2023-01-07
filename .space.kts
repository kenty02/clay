/**
 * JetBrains Space Automation
 * This Kotlin-script file lets you automate build activities
 * For more info, see https://www.jetbrains.com/help/space/automation.html
 */

job("Build windows") {
  container(image = "electronuserland/builder:16-wine") {
    shellScript {
      content = """
                # curl is already installed
                REPO_URL=https://files.pkg.jetbrains.space/npathy/p/clay/files
                OS=win
                EXT=.exe

                echo Fetch dependencies
                REF_PATH=clay-relay/latest.txt
                curl -f -L -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -o latest.txt ${'$'}REPO_URL/${'$'}REF_PATH
                LATEST_RELAY=$(cat latest.txt) # e.g. clay-relay/builds/1/

                mkdir -p ./bin/${'$'}OS
                curl -f -L -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -o ./bin/${'$'}OS/clay_relay${'$'}EXT ${'$'}REPO_URL/${'$'}{LATEST_RELAY}clay_relay${'$'}EXT

                echo Building
                npm install -g pnpm
                pnpm install
                pnpm run build:win

                echo Done, uploading
                SOURCE_PATH=$(find dist/ -name '*-setup.exe' -printf '%p')
                TARGET_PATH=clay-viewer-electron/${'$'}JB_SPACE_EXECUTION_NUMBER/
                curl -i -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -F file=@"${'$'}SOURCE_PATH" ${'$'}REPO_URL/${'$'}TARGET_PATH
            """.trimIndent()
    }
  }
}
