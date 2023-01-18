const fs = require('fs')

module.exports = async (context) => {
  const ext =
    context.electronPlatformName === 'darwin'
      ? '.app'
      : context.electronPlatformName === 'win32'
      ? '.exe'
      : ''
  const relayFileName = `clay-relay${ext}`
  const os =
    context.electronPlatformName === 'darwin'
      ? 'mac'
      : context.electronPlatformName === 'win32'
      ? 'win'
      : 'linux'
  try {
    fs.statSync(`./relay/${os}/${relayFileName}`)
    console.log(`verifyRelay: Found ./relay/${os}/${relayFileName}`)
  } catch (err) {
    console.error(`./relay/${os}/${relayFileName} does not exist`)
    process.exit(1)
  }
}
