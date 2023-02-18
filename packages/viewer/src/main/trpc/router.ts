import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { app } from 'electron'
import fs from 'fs/promises'
import * as path from 'path'
import { z } from 'zod'
import { exec } from 'child_process'

const t = initTRPC.create({ isServer: false, allowOutsideOfServer: true, transformer: superjson })

export type ElectronAppRouter = typeof electronAppRouter
export const electronAppRouter = t.router({
  getRelayInfos: t.procedure.query(async () => {
    const userDataDir = app.getPath('userData')
    const userDataFiles = await fs.readdir(userDataDir)
    const relayInfoFiles = userDataFiles
      .filter((name) => name.match(/^relayinfo-\d+\.json$/))
      .map((name) => path.join(userDataDir, name))

    const relayInfos = await Promise.all(
      relayInfoFiles.map(async (p) => {
        const content = await fs.readFile(p, 'utf-8')
        return relayInfoSchema.parse(JSON.parse(content))
      })
    )
    const validatedRelayInfos: typeof relayInfos = []
    await Promise.all(
      relayInfos.map(
        (relayInfo) =>
          new Promise<void>((resolve, reject) => {
            const { process_id } = relayInfo
            // noinspection JSDeprecatedSymbols
            const platform = process.platform
            let cmd = ''
            switch (platform) {
              case 'win32':
                cmd = `tasklist`
                break
              case 'darwin':
                cmd = `ps -ax | grep ${process_id}`
                break
              case 'linux':
                cmd = `ps -A`
                break
              default:
                break
            }
            exec(cmd, (err, stdout) => {
              if (err != null) {
                reject(err)
                return
              }
              if (stdout.toLowerCase().indexOf(String(process_id).toLowerCase()) > -1) {
                validatedRelayInfos.push(relayInfo)
              }
              resolve()
            })
          })
      )
    )

    return validatedRelayInfos
  })
})

const relayInfoSchema = z.object({
  port: z.number(),
  process_id: z.number(),
  tags: z.array(z.string()),
  token: z.string()
})
