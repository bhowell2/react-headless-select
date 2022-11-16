import {
  fourGroupOptions,
  nestedGroupedOptions,
  testOptions,
  totalSelectableOptionsNoGroupSelectLength,
  totalSelectableOptionsWithGroupSelectLength
} from './testData'
import { getOptionAtIndex, getOptionsLength } from '../../src/ts/hooks/useSelectUtils'

describe('getOptionsAtIndex', () => {
  test('returns option at index - no group selection', () => {
    expect(getOptionAtIndex(testOptions, 0)).toEqual({ label: 'one', value: 'one' })
    // should select four.1, b/c selecting the group is not possible
    expect(getOptionAtIndex(testOptions, 3)).toEqual({ label: 'four.1', value: 'four.1' })

    // should select last option
    expect(
      getOptionAtIndex(testOptions, totalSelectableOptionsNoGroupSelectLength - 1)
    ).toEqual({
      label: 'five',
      value: 'five'
    })
    expect(
      getOptionAtIndex(testOptions, totalSelectableOptionsNoGroupSelectLength)
    ).toEqual(null)
  })

  test('returns option at index', () => {
    expect(getOptionAtIndex(testOptions, 0, true)).toEqual({ label: 'one', value: 'one' })
    // should return the entire group
    expect(getOptionAtIndex(testOptions, 3, true)).toEqual({
      groupLabel: 'four',
      options: fourGroupOptions,
      value: '4'
    })
    // b/c group is selectable it is the next position
    expect(getOptionAtIndex(testOptions, 4, true)).toEqual({
      label: 'four.1',
      value: 'four.1'
    })
    expect(
      getOptionAtIndex(testOptions, totalSelectableOptionsWithGroupSelectLength, true)
    ).toEqual(null)
  })

  test('returns option at index with nested grouping', () => {
    // this should return null b/c there are only 4 selectable items
    expect(getOptionAtIndex(nestedGroupedOptions, 4)).toEqual(null)
    expect(getOptionAtIndex(nestedGroupedOptions, 3)).toEqual({
      label: '2.0.0',
      value: '2.0.0'
    })
    expect(getOptionAtIndex(nestedGroupedOptions, 3, true)).toEqual({
      label: '0.0.0.0',
      value: '0.0.0.0'
    })
    expect(getOptionAtIndex(nestedGroupedOptions, 2, true)).toEqual(
      nestedGroupedOptions[0]!.options![0].options![0]
    )
    expect(getOptionAtIndex(nestedGroupedOptions, 5, true)).toEqual(
      nestedGroupedOptions[1]
    )
    expect(getOptionAtIndex(nestedGroupedOptions, 6, true)).toEqual(
      nestedGroupedOptions[2]
    )
    expect(getOptionAtIndex(nestedGroupedOptions, 7, true)).toEqual(
      nestedGroupedOptions[2].options![0]
    )
    expect(getOptionAtIndex(nestedGroupedOptions, 8, true)).toEqual(
      nestedGroupedOptions[2].options![0].options![0]
    )
    expect(getOptionAtIndex(nestedGroupedOptions, 9, true)).toEqual(null)
  })
})

test('getOptionsLength', () => {
  expect(getOptionsLength(testOptions)).toEqual(totalSelectableOptionsNoGroupSelectLength)
  expect(getOptionsLength(testOptions, true)).toEqual(
    totalSelectableOptionsWithGroupSelectLength
  )
  expect(getOptionsLength(nestedGroupedOptions)).toEqual(4)
  expect(getOptionsLength(nestedGroupedOptions, true)).toEqual(9)
})
