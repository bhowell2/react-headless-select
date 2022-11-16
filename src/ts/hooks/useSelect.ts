import {
  Dispatch,
  SetStateAction,
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useCurrentValueRef } from './internal/useCurrentValueRef'
import { useSafeLayoutEffect } from './internal/useSafeLayoutEffect'
import useScrollIntoView from './useScrollIntoView'
import { NOOP } from '../utils/noop'
import { Either } from '../types/typeUtils'
import { getOptionAtIndex, getOptionIndex, getOptionsLength } from './useSelectUtils'

export interface SelectOption<T> {
  label: string
  value: T
  /**
   * This or the UseSelectOptions#canSelect function can be used
   * to disable selection of an option. Note if this is provided
   * it will override the canSelect function.
   *
   * @default false (i.e., this option can be selected)
   */
  disableSelection?: boolean
}

export interface GroupSelectOption<T, G = T> {
  groupLabel: string
  /**
   * Options can be a combination of SelectOptions and GroupSelectOptions
   * (allowing for nested grouping).
   * */
  options: OptionType<T, G>[]
  value: G
  /**
   * This or the UseSelectOptions#canSelect function can be used
   * to disable selection of an option. Note if this is provided
   * it will override the canSelect function.
   *
   * @default false (i.e., this option can be selected)
   */
  disableSelection?: boolean
}

export type OptionType<T, G = T> = Either<SelectOption<T>, GroupSelectOption<T, G>>

export function isGroupSelectOption<T, G = T>(
  option: OptionType<T, G>
): option is GroupSelectOption<T, G> {
  return 'groupLabel' in option
}

export type OptionSelectedCheck<T, G = T> = (
  option: OptionType<T, G>,
  selectedOptions: OptionType<T, G>[]
) => boolean
const defaultIsOptionSelectedCheck: OptionSelectedCheck<any> = (
  option,
  selectedOptions
) => selectedOptions?.find((selected) => selected.value === option.value) !== undefined

/** Passed the current input value and filters the available options as desired. */
export type OptionsFilterFn<T, G = T> = (
  val: string,
  options: OptionType<T, G>[]
) => OptionType<T, G>[]

/**
 * Basic matching function that uses indexOf to match the label or groupLabel.
 * If the groupLabel matches then all GroupSelectionOption#options will be returned,
 * otherwise each group's options will be checked and if any match then the
 * GroupSelectOption will be returned with only the matching options.
 * */
function indexOfFilterMatch<T, O extends OptionType<T> | SelectOption<T>>(
  val: string,
  options: O[]
): O[] {
  if (val === '') {
    return options
  }
  const result: O[] = []
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
          } as O)
        }
      }
    } else if (option.label.indexOf(val) >= 0) {
      result.push(option)
    }
  }
  return result
}

function textMatchesSelectedOptions(
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
 * This is called when some change occurs in the input. Currently, this
 * will set the highlight index to -1 when there are no options and it
 * will always keep the highlight index at -1 thereafter.
 */
function getHighlightIndexOnInputChange(
  currentHighlightIndex: number,
  visibleOptions: OptionType<any>[]
): number {
  if (visibleOptions.length === 0) return -1
  return currentHighlightIndex > 0 ? 0 : -1
}

function getHighlightCompletionPercentage(
  options: unknown[],
  highlightIndex: number
): number {
  if (options.length === 0 || highlightIndex === options.length - 1) return 1
  if (highlightIndex <= 0) return 0
  return highlightIndex / options.length
}

interface UseSelectOptionsCommon<T, G = T> {
  /**
   * The options to potentially display (note, these will be filtered
   * with the 'filterFn' prop if the input value changes).
   *
   * NOTE: this should be memoized.
   */
  options: OptionType<T, G>[]
  /**
   * If multiple options should be allowed to be selected at a time.
   * @default false
   */
  allowMultiSelect?: boolean
  /**
   * By default, all options are selectable, but this can be supplied
   * to disable selection of an option.
   *
   * This should return true if the option IS selectable; false otherwise.
   *
   * If an item is already selected then this will have no bearing.
   *
   * Note: this should be memoized.
   *
   * @default undefined (i.e., all options are selectable)
   */
  canSelect?: (option: OptionType<T, G>) => boolean
  /**
   * Disables filtering the options (by label) when some text is input.
   * @default false (i.e., filter on text input)
   */
  disableFiltering?: boolean
  /**
   * Disable initially highlighting the first item in the display options
   * @default false
   * */
  disableInitialHighlight?: boolean
  /**
   * When the visibleOptions change (e.g., from typing in the input) an attempt
   * is made to find the last highlighted option in the new visible options array
   * and change the highlightIndex to the new index of the previously highlighted
   * option. Setting this to true will cause the highlight index to always be reset
   * when the visibleOptions change.
   *
   * @default false (i.e., recalculate highlight index on change)
   */
  disableRecalculateHighlightIndex?: boolean
  /**
   * Disables selection of all items via click and/or highlight selection.
   * @default false (i.e., selection is NOT disabled)
   */
  disableSelection?: boolean
  /**
   * Uses the input value to filter options. If the text matches a groupLabel,
   * all of the group's options will be shown. By default, this will use a
   * strict indexOf match (i.e., the string exists in some form as a label
   * in the options).
   *
   * NOTE: this should be memoized.
   * @default String#indexOf match will be used
   *
   * TODO: implement fuzzy search
   */
  filterFn?: OptionsFilterFn<T, G>
  /**
   * By default, when an item is selected and the input text matches
   * the label of the selected item, then filtering will not be done.
   */
  filterWhenSelected?: boolean
  initialOptions?: {
    selectedOptions?: OptionType<T, G>[]
  }
  /**
   * Allows to override the default implementation which checks if an
   * option was by using a triple equal check on the option's value
   * (i.e., OptionType#value).
   *
   * Note: should be memoized.
   */
  isSelectedCheck?: OptionSelectedCheck<T, G>
  /**
   * This is called when the input value changes for the input field.
   * useSelect maintains its own internal state for values, but the one
   * provided overrides the internal value (resetting it on any change).
   */
  onChange?: (value: string) => void
  /**
   * Search occurs when the enter key is pressed and no item has
   * been selected with the arrow keys (i.e., highlightIndex = -1).
   *
   * The current internal input value will be passed back. A 'search'
   * function is also passed back in UseSelectResult so that a search
   * can be triggered, where this function will be called as well.
   */
  onSearch?: (search: string) => void
  /**
   * If showMenu should be true when the input is initially focused.
   * @default false (i.e., do not automatically show on focus)
   */
  showMenuOnFocus?: boolean
  /**
   * If value is provided and differs from the internal value (which
   * simply mirrors the text input value) the internal value will be
   * updated to reflect this value.
   */
  value?: string
}

// In this case there is no group type, so we need to type it as any here to avoid
// a typing conflict on the union of UseSelectOptionsWithoutGroupSelect and
// UseSelectOptionsWithGroupSelect.
export interface UseSelectOptionsWithoutGroupSelect<T>
  extends UseSelectOptionsCommon<T, any> {
  /**
   * If the group/groupLabel itself is selectable. If this is the case
   * then the highlight index will include the groupLabel itself. Note,
   * when a group is selected, then the GroupSelectOption will be returned.
   */
  canSelectGroup?: false
  /**
   * When the user clicks an item in the dropdown, or when the user
   * selects an item with the arrow keys (i.e., highlightIndex > -1).
   *
   * This differs from 'onChange' in that it is when an option is actually
   * selected and not when some text input occurs.
   */
  onSelect?: (value: string, selectedOption: SelectOption<T>) => void
}

export interface UseSelectOptionsWithGroupSelect<T, G = T>
  extends UseSelectOptionsCommon<T, G> {
  /**
   * If the group/groupLabel itself is selectable. If this is the case
   * then the highlight index will include the groupLabel itself. Note,
   * when a group is selected, the GroupSelectOption will be returned.
   *
   * Currently, this allows for selecting a group within a group (that has
   * already been selected) - the user could disable this behavior on their
   * end if it is not desired, but it may be that nested groups aren't really
   * ever even used anyway.
   */
  canSelectGroup?: true
  /**
   * When the user clicks an item in the dropdown, or when the user
   * selects an item with the arrow keys (i.e., highlightIndex > -1).
   *
   * The selected option may be a GroupSelectOption, you can use 'isGroupSelectOption'
   * to type guard/check the selected option if desired.
   */
  onSelect?: (value: string, selectedOption: OptionType<T, G>) => void
}

export type UseSelectOptions<T, G> =
  | UseSelectOptionsWithoutGroupSelect<T>
  | UseSelectOptionsWithGroupSelect<T, G>

export interface OptionProps<T, G = T> {
  /**
   * Provides the group-nested depth of the option.
   * Options that are not grouped will have a depth of 0 and
   * options that are grouped will have a depth of the parent
   * group option + 1.
   *
   * E.g.
   * The first GroupOption will have a depth of 0 and its options
   * will have a depth of 1 - if any of those nested options are
   * also a GroupOption then their options will have a depth of 2.
   */
  depth: number
  /**
   * When the keyboard is used to navigate the dropdown this specifies if
   * the highlight index is for the given item. This wraps the 'canSelectGroup'
   * functionality, so the consideration of highlighting/selecting is transparent
   * to the user.
   */
  isHighlighted: boolean
  /** Occurs when the item has actually been selected via click or enter. */
  isSelected: boolean
  /** Removes the item from selection. */
  onDeselect: () => void
  /** Selects the option. */
  onSelect: () => void
  /** The Group/SelectOption for this element. */
  option: OptionType<T, G>
  /** Props to be spread into each option. This includes spread to group options as well.*/
  spreadProps: {
    /** Simply the option's label. Provided for accessibility. */
    ['aria-label']: string
    // Passed when the object is highlighted
    ref?: MutableRefObject<any>
  }
  /**
   * The OptionProps for each of the group's options.
   * This prop can be checked to determine if the current option prop is for a
   * GroupSelectOption - containing the correct OptionProps for the group's options.
   * */
  groupOptions?: OptionProps<T, G>[]
}

export interface UseSelectResult<T, G = T, E extends HTMLElement = HTMLInputElement> {
  /**
   * Provides the list of options to display. This is after filtering
   * and determining if it is highlighted or selected.
   */
  displayOptions: OptionProps<T, G>[]
  /**
   * To be set on the displayOptions parent container to check if the
   * highlighted index is out of bounds so that it will be scrolled into
   * view.
   * */
  dropdownContainerRef: MutableRefObject<any>
  /**
   * Returns value 0-1 of highlightIndex's percentage completion of the
   * display options length.
   * E.g., displayOptions.length = 5, highlightIndex = 3, completion = 0.6
   */
  highlightCompletionPercent: number
  /**
   * -1 means no highlight, while 0 is the first element.
   * This can be used to determine when more item should be fetched.
   */
  highlightIndex: number
  /** Props to be spread into the input field for this select. */
  inputProps: {
    onChange: ChangeEventHandler<E>
    onKeyDown: KeyboardEventHandler<E>
    ref: MutableRefObject<E>
    value: string
  }
  /** If the input has been focused. */
  isInputFocused: boolean
  /** Triggers the onSearch call that is passed in as a prop. */
  search: () => void
  /**
   * If item(s) are selected then they will be returned here. The most recently
   * selected item is also passed to onSelect if it is provided.
   */
  selectedOptions: OptionType<T, G>[]
  /**
   * This gives the user the ability to manually set the selected options.
   * Be careful with this as it
   */
  setSelectedOptions: Dispatch<SetStateAction<OptionType<T, G>[]>>
  /**
   * This handles the accessibility considerations of when to show the menu and
   * the user can conditionally display their menu based on this value.
   * E.g., showMenu && <DropDown/>
   */
  showMenu: boolean
}

export function useSelect<
  T,
  G = T,
  E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(useSelectOptions: UseSelectOptions<T, G>): UseSelectResult<T, G, E> {
  const {
    allowMultiSelect = false,
    canSelect,
    disableFiltering = false,
    disableInitialHighlight,
    disableRecalculateHighlightIndex = false,
    disableSelection = false,
    filterFn = indexOfFilterMatch,
    filterWhenSelected,
    initialOptions,
    isSelectedCheck = defaultIsOptionSelectedCheck,
    onChange,
    onSearch,
    onSelect,
    options,
    showMenuOnFocus = false,
    value
  } = useSelectOptions
  const canSelectGroup = (useSelectOptions as UseSelectOptionsWithGroupSelect<T, G>)
    .canSelectGroup
  const inputRef = useRef<E>()
  const [internalValue, setInternalValue] = useState(value ?? '')
  const [highlightIndex, setHighlightIndex] = useState(disableInitialHighlight ? -1 : 0)
  const [selectedOptions, setSelectedOptions] = useState<OptionType<T, G>[]>(
    initialOptions?.selectedOptions || []
  )
  // State derived directly from the input element
  const [inputRelatedState, setInputRelatedState] = useState({
    isInputFocused: false,
    showMenu: false
  })

  // Options visible after filtering
  const [visibleOptions, setVisibleOptions] = useState(options)
  useEffect(() => setVisibleOptions(options), [options])
  /*
   * Don't want to make this calculation on every iteration as it is somewhat
   * expensive and unnecessary. This is b/c we allow nested grouping and,
   * optionally, selection of the groups themselves; otherwise we could just
   * use the visibleOptions.length and be done with it. In the future may want
   * to consider an optimization option that specifies that nested grouping
   * does not occur. This would simplify and improve the performance of the
   * highlightIndex calculation in the displayOptions calculation (i.e., could
   * simply increment and decrement).
   * */
  const visibleOptionsLength = useMemo(
    () => getOptionsLength(visibleOptions, canSelectGroup),
    [visibleOptions, canSelectGroup]
  )
  // allows for comparing the previously visible options
  const prevVisibleOptionsRef = useRef<OptionType<T, G>[]>()
  // if visible options change, reset highlight index
  useSafeLayoutEffect(() => {
    /*
     * When changing the highlight index we want to find the last option
     * and if it is still in the visibleOptions then we will
     * */
    if (
      !disableRecalculateHighlightIndex &&
      prevVisibleOptionsRef.current &&
      visibleOptions !== prevVisibleOptionsRef.current &&
      highlightIndex >= 0
    ) {
      const lastHighlightOption = getOptionAtIndex(
        prevVisibleOptionsRef.current,
        highlightIndex
      )
      if (lastHighlightOption) {
        const nextHighlightIndex = getOptionIndex(visibleOptions, lastHighlightOption)
        setHighlightIndex(nextHighlightIndex)
      } else {
        setHighlightIndex(getHighlightIndexOnInputChange(highlightIndex, visibleOptions))
      }
    }
    // this makes it so this does not run on mount and override the initial highlight index
    else if (prevVisibleOptionsRef.current) {
      setHighlightIndex(getHighlightIndexOnInputChange(highlightIndex, visibleOptions))
    }
    prevVisibleOptionsRef.current = visibleOptions
  }, [visibleOptions, disableInitialHighlight])

  useEffect(() => {
    // currently, only doing simple calculation
    if (
      internalValue === '' ||
      // if there's an item selected AND don't filter when selected
      // AND the current text equals the selected option's label then
      // show all options
      (selectedOptions &&
        !filterWhenSelected &&
        textMatchesSelectedOptions(internalValue, selectedOptions))
    ) {
      // show everything
      setVisibleOptions(options)
    } else if (!disableFiltering) {
      setVisibleOptions(filterFn(internalValue, options))
    }
  }, [
    disableFiltering,
    filterFn,
    filterWhenSelected,
    internalValue,
    options,
    selectedOptions
  ])

  const onChangePropsRef = useCurrentValueRef(onChange)
  const onChangeInternal = useCallback((val: string) => {
    setInternalValue(val)
    onChangePropsRef.current?.(val)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // In the case that the value provided changes, then it is assumed to be controlled
  // externally and thus the updated value should be reflected internally.
  useSafeLayoutEffect(() => {
    if (internalValue !== value && value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const internalValueRef = useCurrentValueRef(internalValue)
  const onSelectPropsRef = useCurrentValueRef(onSelect)
  /*
   * Selection could occur when the item is highlighted and the 'enter'
   * key is pressed, or selection could occur when the user clicks on
   * an actual item in the dropdown menu.
   */
  const onSelectionInternal = useCallback(
    (option: OptionType<T, G>) => {
      if (
        !disableSelection &&
        !option.disableSelection &&
        // if canSelect is not provided then this is true, otherwise we check if it can be selected
        (!canSelect || canSelect(option))
      ) {
        setSelectedOptions((prevOpts) => {
          if (allowMultiSelect && !isSelectedCheck(option, prevOpts)) {
            return [...prevOpts, option]
          }
          return [option]
        })
        // currently, only handling NON-group selection here
        // and only setting onChangeInternal when multi-select is not available
        if (!allowMultiSelect) {
          onChangeInternal(isGroupSelectOption(option) ? option.groupLabel : option.label)
        }
        setInputRelatedState((cur) => ({ ...cur, showMenu: false }))
        setHighlightIndex(getOptionIndex(visibleOptions, option, canSelectGroup))
        onSelectPropsRef.current?.(internalValueRef.current, option as any)
      }
    },
    [
      allowMultiSelect,
      canSelect,
      canSelectGroup,
      disableSelection,
      internalValueRef,
      isSelectedCheck,
      onChangeInternal,
      onSelectPropsRef,
      visibleOptions
    ]
  )

  const onDeselectInternal = useCallback(
    (option: OptionType<T, G>) => {
      setSelectedOptions((curOptions) => {
        const idx = curOptions.indexOf(option)
        if (idx >= 0) {
          // similar to how onSelectInternal handles selection, we need to remove
          // the option from the "value" if it is de-selected
          if (!allowMultiSelect && !isGroupSelectOption(option)) {
            onChangeInternal('')
          }
          return [
            ...curOptions.splice(0, idx),
            ...curOptions.splice(idx + 1, curOptions.length)
          ]
        }
        return curOptions
      })
    },
    [allowMultiSelect, onChangeInternal]
  )

  const keydownHandler = (event: KeyboardEvent<E>) => {
    // default is only prevented for the case statements, otherwise want the default to bubble up
    // (e.g., maybe user uses ctrl-p or ctrl-r)
    if (event.shiftKey) {
      // if shift key is held do not highlight
      return
    }
    /*
     * It's possible that the user has selected text using Shift+ArrowKey and then
     * presses 'ArrowDown' to clear the selected text, but this will not happen if
     * it is not explicitly handled here because 'ArrowDown' is usually handled to
     * navigate the dropdown menu. If text is selected and arrow down is pressed
     * then we do not want to "prevent default" and want the text to be unselected
     * as expected. Therefore return here.
     * */
    if (event.currentTarget.selectionStart !== event.currentTarget.selectionEnd) {
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        if (!inputRelatedState.showMenu) {
          // the first time ArrowDown is pressed just show the menu and do not increment the highlightIndex
          setInputRelatedState((cur) => ({ ...cur, showMenu: true }))
          return
        }
        event.preventDefault()
        if (highlightIndex < visibleOptionsLength - 1) {
          setHighlightIndex(highlightIndex + 1)
        }
        break
      case 'ArrowUp':
        if (!inputRelatedState.isInputFocused) {
          setInputRelatedState((cur) => ({ ...cur, showMenu: true }))
          return
        }
        event.preventDefault()
        // allowed to go all the way to -1, which means nothing is selected (0 being first item)
        if (highlightIndex > -1) {
          setHighlightIndex(highlightIndex - 1)
        }
        break
      case 'Enter':
        event.preventDefault()
        if (highlightIndex === -1) {
          onSearch?.(internalValue)
        } else {
          const selected = getOptionAtIndex(
            visibleOptions,
            highlightIndex,
            canSelectGroup
          )
          // this shouldn't ever return null...
          if (selected) {
            onSelectionInternal(selected)
          }
        }
        break
      case 'Escape':
        setInputRelatedState((cur) => ({ ...cur, showMenu: false }))
        event.preventDefault()
        break
      default:
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      const input = inputRef.current
      const onFocus = () => {
        setInputRelatedState((cur) => ({
          ...cur,
          isInputFocused: true,
          showMenu: showMenuOnFocus
        }))
      }
      const onBlur = () =>
        setInputRelatedState((cur) => ({
          ...cur,
          isInputFocused: false,
          showMenu: false
        }))

      input.addEventListener('focus', onFocus)
      input.addEventListener('blur', onBlur)
      return () => {
        input.removeEventListener('focus', onFocus)
        input.removeEventListener('blur', onBlur)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenuOnFocus, inputRef.current])

  const dropdownContainerRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLElement>(null)
  const selectedRef = useRef<HTMLElement>(null)
  useScrollIntoView(
    dropdownContainerRef,
    highlightIndex === -1 ? selectedRef : highlightRef
  )

  const displayOptions = useMemo<OptionProps<T, G>[]>(() => {
    const returnedDisplayOptions: OptionProps<T, G>[] = []
    let pos = 0

    const checkGroupOptions = (
      groupOption: GroupSelectOption<T, G>,
      groupAry: OptionProps<T, G>[],
      depth = 0
    ) => {
      const isGroupHighlighted = canSelectGroup ? highlightIndex === pos++ : false
      const isGroupSelected = canSelectGroup
        ? selectedOptions.includes(groupOption)
        : false
      groupAry.push({
        depth,
        isHighlighted: isGroupHighlighted,
        isSelected: isGroupSelected,
        onDeselect: () => onDeselectInternal(groupOption),
        onSelect: canSelectGroup ? () => onSelectionInternal(groupOption) : NOOP,
        option: groupOption,
        spreadProps: {
          'aria-label': groupOption.groupLabel,
          ref: isGroupHighlighted ? highlightRef : undefined
        }
      })
      const groupsOptionProps: OptionProps<any>[] = []
      const gOptions = groupOption.options
      for (let i = 0; i < gOptions.length; i++) {
        const opt = gOptions[i]
        if (isGroupSelectOption(opt)) {
          checkGroupOptions(opt, groupsOptionProps, depth + 1)
        } else {
          groupsOptionProps.push({
            depth: depth + 1,
            isHighlighted: highlightIndex === pos,
            // may need to make lookup table instead of using array includes
            isSelected: selectedOptions.includes(opt),
            onDeselect: () => onDeselectInternal(opt),
            onSelect: () => onSelectionInternal(opt),
            option: opt,
            spreadProps: {
              'aria-label': opt.label,
              ref: highlightIndex === pos ? highlightRef : undefined
            }
          })
          pos++
        }
      }
      groupAry[groupAry.length - 1].groupOptions = groupsOptionProps
    }

    for (let i = 0; i < visibleOptions.length; i++) {
      const option = visibleOptions[i]
      if (isGroupSelectOption(option)) {
        checkGroupOptions(option, returnedDisplayOptions)
      } else {
        returnedDisplayOptions.push({
          depth: 0,
          isHighlighted: highlightIndex === pos,
          isSelected: selectedOptions.includes(option),
          onDeselect: () => onDeselectInternal(option),
          onSelect: () => onSelectionInternal(option),
          option: option,
          spreadProps: {
            'aria-label': option.label,
            ref: highlightIndex === pos ? highlightRef : undefined
          }
        })
        pos++
      }
    }

    return returnedDisplayOptions
  }, [
    visibleOptions,
    canSelectGroup,
    highlightIndex,
    selectedOptions,
    onSelectionInternal,
    onDeselectInternal
  ])

  return {
    displayOptions,
    dropdownContainerRef,
    highlightCompletionPercent: getHighlightCompletionPercentage(
      displayOptions,
      highlightIndex
    ),
    highlightIndex,
    inputProps: {
      onChange: (event: ChangeEvent<E>) => onChangeInternal(event.target.value),
      onKeyDown: keydownHandler,
      ref: inputRef as MutableRefObject<E>,
      value: internalValue
    },
    isInputFocused: inputRelatedState.isInputFocused,
    search: () => {
      if (onSearch) {
        // reset highlight index when search is used
        setHighlightIndex(-1)
        onSearch?.(internalValue)
      }
    },
    selectedOptions,
    setSelectedOptions,
    showMenu: inputRelatedState.showMenu
  }
}
