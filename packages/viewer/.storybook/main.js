const { loadConfigFromFile } = require('electron-vite')
const path = require('path')
const { mergeConfig } = require('vite')

module.exports = {
  stories: [{ directory: '../src/renderer/src', titlePrefix: '' }],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-vite'
  },
  async viteFinal(config) {
    const { config: userConfig } = await loadConfigFromFile(
      {
        command: 'serve',
        mode: 'development'
      },
      path.resolve(__dirname, '../electron.vite.config.ts')
    )

    return mergeConfig(config, {
      ...userConfig.renderer,
      // manually specify plugins to avoid conflict
      plugins: []
    })
  },
  features: {
    interactionsDebugger: true
  }
}
