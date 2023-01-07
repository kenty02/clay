const fs = require('fs')

module.exports = async () => {
  const ext = process.platform === 'darwin' ? '.app' : process.platform === 'win32' ? '.exe' : ''
  const relayFileName = `clay-relay${ext}`
  const os = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'win' : 'linux'
  try {
    fs.statSync(`./relay/${os}/${relayFileName}`)
    console.log(`verifyRelay: Found ./relay/${os}/${relayFileName}`)
  } catch (err) {
    console.error(`./relay/${os}/${relayFileName} does not exist`)
    process.exit(1)
  }
}
