import React from 'react'
import {
  makeTestComp,
  makeUseSelectResultsRef,
  TEST_COMP_INPUT_TEST_ID
} from './TestComp'
import { act, render, screen } from '@testing-library/react'
import {
  nestedGroupedOptions,
  testOptions,
  totalSelectableOptionsNoGroupSelectLength,
  totalSelectableOptionsWithGroupSelectLength
} from './testData'
import userEvent from '@testing-library/user-event'
import { typeArrowDown, typeArrowUp } from '../utils/typeUtils'
import { getOptionsLength } from '../../src/ts/utils/optionUtils'
import { OptionType } from '../../src/ts/types/optionTypes'

function getTestInput() {
  return screen.getByTestId(TEST_COMP_INPUT_TEST_ID)
}

describe('increment and decrement highlight index', () => {
  test('w/ initialHighlight - no cycle, disallow no highlight', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp<string>(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: false,
          cycleHighlightIndex: false,
          initialState: { options: testOptions }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), '{arrowdown}')
    expect(ref.current.highlightIndex).toEqual(1)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), '{arrowup}{arrowup}')
    expect(ref.current.highlightIndex).toEqual(1)
    // just hit arrow down a lot and the index should not exceed the max non-group selectable amount
    await user.type(getTestInput(), typeArrowDown(15))
    expect(ref.current.highlightIndex).toEqual(
      totalSelectableOptionsNoGroupSelectLength - 1
    )
    // hit arrow up many times. should not increase highlightIndex above -1
    await user.type(getTestInput(), typeArrowUp(15))
    expect(ref.current.highlightIndex).toEqual(0)
  })

  test('w/ disableInitialHighlight', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: true,
          cycleHighlightIndex: false,
          initialState: { options: testOptions }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(-1)
    await user.type(getTestInput(), '{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{arrowup}')
    expect(ref.current.highlightIndex).toEqual(0)
    // just hit arrow down a lot and the index should not exceed the max non-group selectable amount
    await user.type(getTestInput(), typeArrowDown(15))
    expect(ref.current.highlightIndex).toEqual(
      totalSelectableOptionsNoGroupSelectLength - 1
    )
    // hit arrow up many times. should not increase highlightIndex above -1
    await user.type(getTestInput(), typeArrowUp(15))
    expect(ref.current.highlightIndex).toEqual(-1)
  })

  test('w/ group selection enabled', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: true,
          canSelectGroup: true,
          cycleHighlightIndex: false,
          initialState: {
            options: testOptions
          }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(-1)
    await user.type(getTestInput(), '{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{arrowup}')
    expect(ref.current.highlightIndex).toEqual(0)
    // just hit arrow down a lot and the index should not exceed the max non-group selectable amount
    await user.type(getTestInput(), typeArrowDown(15))
    expect(ref.current.highlightIndex).toEqual(
      totalSelectableOptionsWithGroupSelectLength - 1
    )
    // hit arrow up many times. should not increase highlightIndex above -1
    await user.type(getTestInput(), typeArrowUp(15))
    expect(ref.current.highlightIndex).toEqual(-1)
  })

  test('must use arrow key to show menu before highlightIndex increments', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: true,
          cycleHighlightIndex: false,
          initialState: { options: testOptions },
          showMenuOnFocus: false
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(-1)
    // must arrowdown twice - once to show the menu and the second time to increment highlightIndex
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{arrowup}')
    expect(ref.current.highlightIndex).toEqual(0)
    // just hit arrow down a lot and the index should not exceed the max non-group selectable amount
    await user.type(getTestInput(), typeArrowDown(15))
    expect(ref.current.highlightIndex).toEqual(
      totalSelectableOptionsNoGroupSelectLength - 1
    )
    // hit arrow up many times. should not increase highlightIndex above -1
    await user.type(getTestInput(), typeArrowUp(15))
    expect(ref.current.highlightIndex).toEqual(-1)
  })

  test('cycle highlight index - allowNoHighlight=true', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: true,
          cycleHighlightIndex: true,
          initialState: { options: testOptions },
          showMenuOnFocus: false
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(-1)
    // must arrowdown twice - once to show the menu and the second time to increment highlightIndex
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(2)
    await user.type(getTestInput(), typeArrowUp(3))
    expect(ref.current.highlightIndex).toEqual(-1)
    await user.type(getTestInput(), typeArrowUp())
    // should be at last position
    expect(ref.current.highlightIndex).toEqual(getOptionsLength(testOptions) - 1)
    await user.type(getTestInput(), typeArrowDown())
    expect(ref.current.highlightIndex).toEqual(0)
  })

  test('cycle highlight index - allowNoHighlight=false', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: false,
          cycleHighlightIndex: true,
          initialState: { options: testOptions },
          showMenuOnFocus: false
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(0)
    // must arrowdown twice - once to show the menu and the second time to increment highlightIndex
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(1)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), typeArrowUp(3))
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), typeArrowUp())
    // should be at last position
    expect(ref.current.highlightIndex).toEqual(getOptionsLength(testOptions) - 1)
    await user.type(getTestInput(), typeArrowDown())
    expect(ref.current.highlightIndex).toEqual(0)
  })

  test('initial highlight index when all disabled', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          // even though there's no highlight here nothing can be highlighted...
          allowNoHighlight: false,
          cycleHighlightIndex: true,
          initialState: { options: testOptions },
          isDisabled: () => true,
          showMenuOnFocus: false
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(-1)
    // must arrowdown twice - once to show the menu and the second time to increment highlightIndex
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(-1)
  })

  test('does not highlight disabled option', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: false,
          cycleHighlightIndex: true,
          initialState: { options: testOptions },
          isDisabled: (option) => option.label === 'one',
          showMenuOnFocus: false
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.highlightIndex).toEqual(0)
    // must arrowdown twice - once to show the menu and the second time to increment highlightIndex
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(1)
    await user.type(getTestInput(), '{ArrowDown}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), '{arrowup}{ArrowDown}')
    expect(ref.current.highlightIndex).toEqual(3)
    await user.type(getTestInput(), typeArrowUp(3))
    expect(ref.current.highlightIndex).toEqual(0)
    await user.type(getTestInput(), typeArrowUp())
    // should be at last position
    expect(ref.current.highlightIndex).toEqual(getOptionsLength(testOptions) - 1)
    await user.type(getTestInput(), typeArrowDown())
    expect(ref.current.highlightIndex).toEqual(0)
  })
})

describe('text filtering', () => {
  test('index of match', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: true,
          canSelectGroup: true,
          initialState: { options: testOptions }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.displayOptions.length).toEqual(testOptions.length)
    // should filter down to only the option with label 1
    await user.type(getTestInput(), 'one')
    expect(ref.current.displayOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].option).toEqual({ label: 'one', value: 'one' })
    await user.type(getTestInput(), typeArrowDown())
    expect(ref.current.displayOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].option).toEqual({ label: 'one', value: 'one' })
    // should now be highlighted
    expect(ref.current.displayOptions[0].isHighlighted).toBeTruthy()
    await user.type(getTestInput(), typeArrowUp())
    expect(ref.current.displayOptions[0].isHighlighted).toBeFalsy()
    await user.type(getTestInput(), '{backspace}{backspace}{backspace}')
    expect(ref.current.displayOptions.length).toEqual(testOptions.length)

    // test filtering sub-group options
    await user.type(getTestInput(), 'four.')
    expect(ref.current.displayOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].groupOptions?.length).toEqual(4)
    await user.type(getTestInput(), '4')
    expect(ref.current.displayOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].groupOptions?.length).toEqual(1)
  })

  test('does not filter when filtering disabled', async () => {
    const user = userEvent.setup()
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          canSelectGroup: true,
          disableFiltering: true,
          initialState: { options: testOptions }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.displayOptions.length).toEqual(testOptions.length)
    // should not filter
    await user.type(getTestInput(), 'one')
    expect(ref.current.displayOptions.length).toEqual(testOptions.length)
  })
})

describe('option selection', () => {
  test('only single selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          initialState: {
            options: testOptions
          }
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[1].isSelected).toBeFalsy()
    act(() => {
      ref.current.displayOptions[1].onSelect()
      // try to add twice, make sure is only added once
      ref.current.displayOptions[1].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    expect(ref.current.displayOptions[1].isSelected).toBeTruthy()
    act(() => {
      ref.current.displayOptions[1].onDeselect()
    })
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[1].isSelected).toBeFalsy()
  })

  test('multi option selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          initialState: {
            options: testOptions
          },
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
    act(() => {
      ref.current.displayOptions[0].onSelect()
      // try to add twice, make sure is only added once
      ref.current.displayOptions[0].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].isSelected).toBeTruthy()
    act(() => {
      ref.current.displayOptions[1].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(2)
    expect(ref.current.displayOptions[0].isSelected).toBeTruthy()
    expect(ref.current.displayOptions[1].isSelected).toBeTruthy()
    act(() => {
      ref.current.displayOptions[0].onDeselect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
    expect(ref.current.displayOptions[1].isSelected).toBeTruthy()
  })

  test('disable option selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          disableSelection: true,
          initialState: {
            options: testOptions
          },
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[1].isSelected).toBeFalsy()
    act(() => {
      ref.current.displayOptions[1].onSelect()
      ref.current.displayOptions[1].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[1].isSelected).toBeFalsy()
  })

  test('allows group selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          canSelectGroup: true,
          initialState: {
            options: nestedGroupedOptions
          },
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
    act(() => {
      ref.current.displayOptions[0].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    expect(ref.current.displayOptions[0].isSelected).toBeTruthy()
    act(() => {
      ref.current.displayOptions[0].groupOptions![0].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(2)
    expect(ref.current.displayOptions[0].isSelected).toBeTruthy()
    expect(ref.current.displayOptions[0].groupOptions![0]).toBeTruthy()
  })

  test('disallows group selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          canSelectGroup: false,
          initialState: {
            options: nestedGroupedOptions
          },
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
    act(() => {
      ref.current.displayOptions[0].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
  })

  test('initially supplied selection', async () => {
    const ref = makeUseSelectResultsRef()
    const Comp = makeTestComp(ref)
    render(
      <Comp
        options={{
          canSelectGroup: false,
          initialState: {
            options: nestedGroupedOptions,
            selectedOptions: [nestedGroupedOptions[1]]
          },
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(1)
    expect(ref.current.displayOptions[1].isSelected).toBeTruthy()
    act(() => {
      ref.current.displayOptions[1].onDeselect()
    })
    expect(ref.current.selectedOptions.length).toEqual(0)
    expect(ref.current.displayOptions[0].isSelected).toBeFalsy()
  })

  test('selectively disable option selection', async () => {
    const copy = JSON.parse(JSON.stringify(testOptions))
    const isDisabled = (option: OptionType<string>) => option.value === 'four.3'
    const ref = makeUseSelectResultsRef<string>()
    const Comp = makeTestComp<string>(ref)
    render(
      <Comp
        options={{
          allowNoHighlight: false,
          canSelectGroup: false,
          initialState: {
            options: copy
          },
          isDisabled,
          multiSelect: true
        }}
      />
    )
    expect(getTestInput()).toBeInTheDocument()
    expect(ref.current.selectedOptions.length).toEqual(0)
    act(() => {
      ref.current.displayOptions[0].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    act(() => {
      ref.current.displayOptions[3].groupOptions![2].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(1)
    act(() => {
      ref.current.displayOptions[3].groupOptions![3].onSelect()
    })
    expect(ref.current.selectedOptions.length).toEqual(2)
  })
})

test('onSearch is called', async () => {
  const user = userEvent.setup()
  const onSearchCalls: string[] = []
  const ref = makeUseSelectResultsRef<string>()
  const Comp = makeTestComp<string>(ref)
  render(
    <Comp
      options={{
        canSelectGroup: false,
        initialState: {
          options: testOptions
        },
        multiSelect: true,
        onSearch: (val) => {
          onSearchCalls.push(val)
        },
        onStateChange: (prevState, nextState, action) => {
          if (action.type === 'OPTION_SELECTED') {
            fail('onSelect should not have been called')
          }
          return nextState
        }
      }}
    />
  )
  expect(ref.current.highlightIndex).toEqual(0)
  expect(onSearchCalls.length).toEqual(0)
  await user.type(getTestInput(), 'aa') // aaa does not exist in the set
  await user.type(getTestInput(), '{enter}')
  expect(onSearchCalls.length).toEqual(1)
  expect(onSearchCalls[0]).toEqual('aa')
  await user.type(getTestInput(), '{backspace}{backspace}')
  expect(ref.current.inputProps.value).toEqual('')
  // throw in some extra backspaces, cause why not
  await user.type(getTestInput(), '{backspace}{backspace}')
  expect(ref.current.highlightIndex).toEqual(-1)
  // need to move the highlight index up (it is 0 b/c disableInitialHighlight was false)
  await user.type(getTestInput(), 'hello{enter}')
  expect(ref.current.highlightIndex).toEqual(-1)
  expect(onSearchCalls.length).toEqual(2)
  expect(onSearchCalls[1]).toEqual('hello')
})

test('onSelect is called', async () => {
  // check highlight index is reset
})

test('options changed', async () => {})
