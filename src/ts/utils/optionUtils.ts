import { ExtObj, GroupSelectOption, OptionType, SelectOption } from '../types/optionTypes'

export function isGroupSelectOption<T, G = T, O extends ExtObj = ExtObj>(
  option: OptionType<T, G, O>
): option is GroupSelectOption<T, G, O> {
  return 'groupLabel' in option
}

/**
 * Used to determine if two options are the same. This is used in some
 * reconciliation-type processes (e.g., finding last highlight index in
 * a new array of options).
 */
export type OptionEqualityCheck<T, G = T, O extends ExtObj = ExtObj> = (
  a: OptionType<T, G, O>,
  b: OptionType<T, G, O>
) => boolean
export const defaultOptionEqualityCheck: OptionEqualityCheck<any> = (a, b) =>
  a.value === b.value

/** Passed the current input value and filters the available options as desired. */
export type OptionsFilterFn<T, G = T, O extends ExtObj = ExtObj> = (
  val: string,
  options: OptionType<T, G, O>[]
) => OptionType<T, G, O>[]

type OptTypeOrSelectOptType<T, G = T, O extends ExtObj = ExtObj> =
  | OptionType<T, G, O>
  | SelectOption<T, O>

/**
 * Basic matching function that uses indexOf to match the label or groupLabel.
 * If the groupLabel matches then all GroupSelectionOption#options will be returned,
 * otherwise each group's options will be checked and if any match then the
 * GroupSelectOption will be returned with only the matching options.
 * */
export function indexOfFilterMatch<T, G = T, Ext extends ExtObj = ExtObj>(
  val: string,
  options: OptTypeOrSelectOptType<T, G, Ext>[]
): OptTypeOrSelectOptType<T, G, Ext>[] {
  if (val === '') {
    return options
  }
  const result: OptTypeOrSelectOptType<T, G, Ext>[] = []
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    if (isGroupSelectOption(option)) {
      if (option.groupLabel.indexOf(val) >= 0) {
        result.push(option)
      } else {
        // currently, this will only return SelectOptions since the group's options
        const groupFilteredOptions = indexOfFilterMatch(val, option.options)
        if (groupFilteredOptions.length > 0) {
          result.push({
            groupLabel: option.groupLabel,
            options: groupFilteredOptions
          } as OptTypeOrSelectOptType<T, G, Ext>)
        }
      }
    } else if (option.label.indexOf(val) >= 0) {
      result.push(option)
    }
  }
  return result
}

export function textMatchesSelectedOptions(
  text: string,
  selectedOptions: OptionType<unknown>[]
): boolean {
  for (let i = 0; i < selectedOptions.length; i++) {
    const option = selectedOptions[i]
    if (
      (isGroupSelectOption(option) && text === option.groupLabel) ||
      (!isGroupSelectOption(option) && text === option.label)
    ) {
      return true
    }
  }
  return false
}

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

export function flattenOptions<T, G>(
  options: OptionType<T, G>[],
  canSelectGroup: boolean
): OptionType<T, G>[] {
  const res: OptionType<T, G>[] = []
  // small optimization, if we did not encounter a group can just use
  // the same options array.
  let encounteredGroup = false
  function flattenGroup(groupOption: GroupSelectOption<T, G>) {
    encounteredGroup = true
    const gOpts = groupOption.options
    if (canSelectGroup) {
      res.push(groupOption)
    }
    for (let i = 0; i < gOpts.length; i++) {
      const opt = gOpts[i]
      if (isGroupSelectOption(opt)) {
        flattenGroup(opt)
      } else {
        res.push(opt)
      }
    }
  }
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (isGroupSelectOption(opt)) {
      flattenGroup(opt)
    } else {
      res.push(opt)
    }
  }
  return encounteredGroup ? res : options
}

/**
 * Retrieves the option at the specified index - respecting grouping.
 * Usually this will return a SelectOption, but if GroupSelect is enabled then a
 * GroupSelectOption may be returned.
 */
export function getOptionAtIndex<T, G = T, O extends ExtObj = ExtObj>(
  options: OptionType<T, G, O>[],
  index: number,
  canSelectGroup = false
): OptionType<T, G, O> | null {
  let pos = 0
  // easier to make inner function here to be used recursively to capture pos variable,
  // rather than having some weird return signature to update the current pos
  function handleGroupOptions(
    groupOption: GroupSelectOption<T, G, O>
  ): OptionType<T, G, O> | null {
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
  canSelectGroup = false,
  equalityCheck: OptionEqualityCheck<T, G> = defaultOptionEqualityCheck
): number {
  let pos = 0
  function handleGroupOptions(groupOption: GroupSelectOption<T, G>): number {
    if (canSelectGroup) {
      if (equalityCheck(optionToFind, groupOption)) {
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
        if (equalityCheck(optionToFind, opt)) return pos
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
      if (equalityCheck(optionToFind, opt)) return pos
      pos++
    }
  }
  return -1
}

export type OptionSelectedCheck<T, G = T, O extends ExtObj = ExtObj> = (
  option: OptionType<T, G, O>,
  selectedOptions: OptionType<T, G, O>[],
  equalityCheck?: OptionEqualityCheck<T, G, O>
) => boolean

export const defaultIsOptionSelectedCheck: OptionSelectedCheck<any> = (
  option,
  currentlySelectedOptions,
  equalityCheck = defaultOptionEqualityCheck
) =>
  currentlySelectedOptions?.find((selected) => equalityCheck(option, selected)) !==
  undefined
