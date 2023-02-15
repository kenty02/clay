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
  }
]
const debugActions: SpotlightAction[] = [
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
      performAction('reset trpc')
    }
  },
  {
    title: 'Rerender Graph',
    onTrigger: (): void => {
      performAction('resetGraphData')
    }
  }
]

export const actionSubject = new Subject<string>()
export const performAction = (action: string): void => {
  const count = actionObserverCount.get(action) ?? 0
  if (count === 0) {
    showNotification({
      message: `Sorry, could not perform action "${action}". Please report this bug.`
    })
    return
  }
  actionSubject.next(action)
}

// for debugging, ensure there are at least one listener when an action is performed
const actionObserverCount = new Map<string, number>()
export const useAction = (action: string, listener: () => void): void => {
  useEffect(() => {
    const subscription = actionSubject.pipe(filter((a) => a === action)).subscribe(() => {
      listener()
    })

    const count = actionObserverCount.get(action) ?? 0
    actionObserverCount.set(action, count + 1)

    return () => {
      const count = actionObserverCount.get(action) ?? 0
      if (count === 0) {
        actionObserverCount.set(action, count - 1)
      } else {
        console.error(`Action observer count for ${action} is already 0`)
      }
      subscription.unsubscribe()
    }
  })
}

function SpotlightProvider({ children }: PropsWithChildren): JSX.Element {
  const allActions = import.meta.env.DEV ? [...actions, ...debugActions] : actions
  return (
    <MantineSpotlightProvider
      actions={allActions}
      shortcut={'p'}
      searchPlaceholder={'Command?'}
      nothingFoundMessage={':('}
    >
      {children}
    </MantineSpotlightProvider>
  )
}

export default SpotlightProvider
