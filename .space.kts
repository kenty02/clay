/**
 * JetBrains Space Automation
 * This Kotlin-script file lets you automate build activities
 * For more info, see https://www.jetbrains.com/help/space/automation.html
 */

job("Build for Chromium-based browsers") {
    container(image = "node:16-alpine") {
        shellScript {
            content = """
                set -e

                echo Install build deps
                apk update
                apk add --no-cache zip curl

                echo Building without type-checking and CWS key
                npm install -g pnpm
                pnpm install
                npx vite build # TODO: use pnpm run build

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
