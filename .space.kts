/**
 * JetBrains Space Automation
 * This Kotlin-script file lets you automate build activities
 * For more info, see https://www.jetbrains.com/help/space/automation.html
 */

job("Build windows") {
  container(image = "electronuserland/builder:16-wine") {
    shellScript {
      content = """
                echo Fetch dependencies
                echo TODO!

                echo Building
                npm install -g pnpm
                pnpm install
                pnpm run build:win

                echo Done, uploading
                SOURCE_PATH=$(find dist/ -name '*-setup.exe' -printf '%p')
                TARGET_PATH=clay-viewer-electron/${'$'}JB_SPACE_EXECUTION_NUMBER/
                REPO_URL=https://files.pkg.jetbrains.space/npathy/p/clay/files
                curl -i -H "Authorization: Bearer ${'$'}JB_SPACE_CLIENT_TOKEN" -F file=@"${'$'}SOURCE_PATH" ${'$'}REPO_URL/${'$'}TARGET_PATH
            """.trimIndent()
    }
  }
}
