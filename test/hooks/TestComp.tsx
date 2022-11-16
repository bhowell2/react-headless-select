import {
  useSelect,
  UseSelectOptions,
  UseSelectResult
} from '../../src/ts/hooks/useSelect'
import React from 'react'

export const TEST_COMP_INPUT_TEST_ID = 'input-test-id'

interface TestCompProps<T, G> {
  options: UseSelectOptions<T, G>
}

type UseSelectResultsRef<T, G> = {
  current: UseSelectResult<T, G>
}

export const makeUseSelectResultsRef = <T, G = T>() => ({} as UseSelectResultsRef<T, G>)

export function makeTestComp<T, G = T>(useSelectResultsRef: UseSelectResultsRef<T, G>) {
  return function TestComp(props: TestCompProps<T, G>) {
    const res = useSelect({ showMenuOnFocus: true, ...props.options })
    useSelectResultsRef.current = res
    return <input data-testid={TEST_COMP_INPUT_TEST_ID} {...res.inputProps} />
  }
}
