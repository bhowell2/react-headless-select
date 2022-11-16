import React, { RefObject, useEffect, useRef, useState } from 'react'
import { act, render } from '@testing-library/react'
import { refWrapper } from '../../src/ts'

test('ref wrapper forwards refs', async () => {
  const refs: RefObject<any>[] = []
  let rerenderer: any
  const Comp = () => {
    const [, setState] = useState(0)
    rerenderer = setState
    const ref1 = useRef<HTMLDivElement>()
    const ref2 = useRef()
    const ref3 = useRef()
    useEffect(() => {
      refs.push(...[ref1, ref2, ref3])
    }, [])
    return <div ref={refWrapper(ref1, ref2, ref3)}></div>
  }
  render(<Comp />)
  expect(refs.length).toEqual(3)
  const capturedRef0 = refs[0]
  expect(refs[0].current).toEqual(refs[1].current)
  expect(refs[0].current).toEqual(refs[2].current)
  await act(rerenderer)
  expect(refs[0].current).toEqual(capturedRef0.current)
})
