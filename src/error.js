export const STOP = 'stop'
export const DONE = 'done'
const BUG = "it should not happen, it might be a bug"

export function stop() {
  throw new Error(STOP)
}

export function done(){
  throw new Error(DONE)
}

export function aBugHere(){
  throw new Error(BUG)
}
