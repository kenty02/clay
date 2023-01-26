import { SpotlightAction, SpotlightProvider as MantineSpotlightProvider } from '@mantine/spotlight'
import { PropsWithChildren } from 'react'

const actions: SpotlightAction[] = [
  {
    title: 'Reload',
    description: 'Reloads the current page',
    onTrigger: (): void => {
      window.location.reload()
    }
  },
  {
    title: 'Clear log file',
    onTrigger: (): void => {
      window.electron.ipcRenderer.invoke('clearLogFile')
    }
  },
  {
    title: 'Add Log Marker',
    onTrigger: (): void => {
      const promptResult = prompt('Enter a log marker')
      window.electron.ipcRenderer.invoke('writeLogEntry', {
        marker: `----------${promptResult}----------`
      })
    }
  }
]

function SpotlightProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <MantineSpotlightProvider
      actions={actions}
      shortcut={'p'}
      searchPlaceholder={'Command?'}
      nothingFoundMessage={':('}
    >
      {children}
    </MantineSpotlightProvider>
  )
}

export default SpotlightProvider
