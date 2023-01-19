import { focusUpdateSubject, nodeUpdateSubject } from './trpc/router'

export const enableDebug = () => {
  nodeUpdateSubject.subscribe((nodeUpdate) => {
    console.log('nodeUpdate', nodeUpdate)
  })
  focusUpdateSubject.subscribe((focusUpdate) => {
    console.log('focusUpdate', focusUpdate)
  })
}
