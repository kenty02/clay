import { SpotlightAction, SpotlightProvider as MantineSpotlightProvider } from '@mantine/spotlight'
import { PropsWithChildren, useEffect } from 'react'
import { filter, Subject } from 'rxjs'
import { showNotification } from '@mantine/notifications'

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
  },
  {
    title: 'Reset trpc',
    onTrigger: (): void => {
      showNotification({
        message: 'Reset trpc'
      })
      debugAction('reset trpc')
    }
  }
]
export const debugActionSubject = new Subject<string>()
export const debugAction = (action: string): void => {
  debugActionSubject.next(action)
}
export const useDebugAction = (action: string, listener: () => void): void => {
  useEffect(() => {
    const subscription = debugActionSubject.pipe(filter((a) => a === action)).subscribe(() => {
      listener()
    })

    return () => subscription.unsubscribe()
  })
}

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
