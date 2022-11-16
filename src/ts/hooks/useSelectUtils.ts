/*
 * Do not want to export these externally, but want to be able to export all the
 * exported functions/types in the useSelect file, so separated out here.
 * */
import { GroupSelectOption, isGroupSelectOption, OptionType } from './useSelect'

/**
 * Calculates the selectable option length, respecting the canSelectGroup option
 * (which increments the length by 1 per group).
 */
export function getOptionsLength(
  options?: OptionType<unknown>[],
  canSelectGroup = false
) {
  if (!options) return 0
  let count = 0
  // similar to the others we need to handle this recursively
  function countGroupOptions(groupSelectOption: GroupSelectOption<unknown>) {
    if (canSelectGroup) {
      count++
    }
    for (let i = 0; i < groupSelectOption.options.length; i++) {
      const opt = groupSelectOption.options[i]
      if (isGroupSelectOption(opt)) {
        countGroupOptions(opt)
      } else {
        count++
      }
    }
  }
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    if (isGroupSelectOption(option)) {
      countGroupOptions(option)
    } else {
      count++
    }
  }
  return count
}

/**
 * Retrieves the option at the specified index - respecting grouping.
 * Usually this will return a SelectOption, but if GroupSelect is enabled then a
 * GroupSelectOption may be returned.
 */
export function getOptionAtIndex<T, G = T>(
  options: OptionType<T, G>[],
  index: number,
  canSelectGroup = false
): OptionType<T, G> | null {
  let pos = 0
  // easier to make inner function here to be used recursively to capture pos variable,
  // rather than having some weird return signature to update the current pos
  function handleGroupOptions(
    groupOption: GroupSelectOption<T, G>
  ): OptionType<T, G> | null {
    if (canSelectGroup) {
      if (pos === index) return groupOption
      pos++
    }
    for (let j = 0; j < groupOption.options.length; j++) {
      const opt = groupOption.options[j]
      if (isGroupSelectOption(opt)) {
        const res = handleGroupOptions(opt)
        if (res) return res
      } else {
        if (pos === index) return opt
        pos++
      }
    }
    return null
  }
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    if (isGroupSelectOption(option)) {
      const res = handleGroupOptions(option)
      if (res) return res
    } else {
      if (pos === index) return option
      pos++
    }
  }
  return null
}

/**
 * Goes through the options and returns the index of the provided
 * option if it exists in the list; -1 is returned if the option
 * is not found in the array.
 */
export function getOptionIndex<T, G = T>(
  options: OptionType<T, G>[],
  optionToFind: OptionType<T, G>,
  canSelectGroup = false
): number {
  let pos = 0
  function handleGroupOptions(groupOption: GroupSelectOption<T, G>): number {
    if (canSelectGroup) {
      if (optionToFind === groupOption) {
        return pos
      }
      pos++
    }
    for (let i = 0; i < groupOption.options.length; i++) {
      const opt = groupOption.options[i]
      if (isGroupSelectOption(opt)) {
        const res = handleGroupOptions(opt)
        if (res >= 0) return res
      } else {
        if (optionToFind === opt) return pos
        pos++
      }
    }
    return -1
  }
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (isGroupSelectOption(opt)) {
      const res = handleGroupOptions(opt)
      if (res >= 0) return res
    } else {
      if (optionToFind === opt) return pos
      pos++
    }
  }
  return -1
}
