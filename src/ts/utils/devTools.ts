/* eslint-disable @typescript-eslint/naming-convention */
export const __DEV__ = process.env.NODE_ENV !== 'production'

export function runIfDev(fn: () => void) {
  if (__DEV__) {
    fn()
  }
}

export function logIfDev(msg: string, ...args: any[]) {
  if (__DEV__) {
    console.log(msg, args)
  }
}

export function warnIfDev(msg: string, ...args: any[]) {
  if (__DEV__) {
    console.warn(msg, args)
  }
}

export function errorIfDev(msg: string, ...args: any[]) {
  if (__DEV__) {
    console.error(msg, args)
  }
}
