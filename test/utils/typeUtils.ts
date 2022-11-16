export function typeArrowDown(times = 1) {
  let res = ''
  for (let i = 0; i < times; i++) {
    res += '{ArrowDown}'
  }
  return res
}

export function typeArrowUp(times = 1) {
  let res = ''
  for (let i = 0; i < times; i++) {
    res += '{ArrowUp}'
  }
  return res
}
