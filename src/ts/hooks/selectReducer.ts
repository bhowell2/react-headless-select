import { isGroupSelectOption, OptionType } from './useSelect'
import {
  defaultIsOptionSelectedCheck,
  defaultOptionEqualityCheck,
  getOptionAtIndex,
  getOptionIndex,
  getOptionsLength,
  indexOfFilterMatch,
  OptionEqualityCheck,
  OptionSelectedCheck,
  OptionsFilterFn,
  textMatchesSelectedOptions
} from '../utils/optionUtils'
import { Dispatch, MutableRefObject, useCallback, useMemo, useRef, useState } from 'react'
import {
  Action,
  initialDefaultSelectState,
  isAppendOptionsAction,
  isDecrementHighlightIndexAction,
  isIncrementHighlightIndexAction,
  isInputChangeAction,
  isOptionDeselectedAction,
  isOptionSelectedAction,
  isSetInputFocusedAction,
  isSetMenuOpenAction,
  isSetOptionsAction,
  isSetStateAction,
  SelectAction,
  SelectState
} from './reducerActions'
import { useLatestRef } from './internal/useLatestRef'

export interface UseSelectReducerOptionsBase<T, G = T> {
  /**
   * The no-highlight index allows for a value of -1, which does not highlight
   * anything in the list of options.
   *
   * Note, if this is true, it may seem to interact weirdly with cycleHighlightIndex
   * - where this will cause the index to go from 0 -> -1 -> max or max -> -1 -> 0.
   * @default false
   */
  allowNoHighlight?: boolean
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
  canSelectGroup?: boolean
  /** @default true when single selection, false when multiSelect */
  closeMenuOnSelection?: boolean
  /**
   * When the highlight index reached the maximum or minimum value, it will
   * cycle to the other value (i.e., 0 -> max or max -> 0)
   * @default true
   */
  cycleHighlightIndex?: boolean
  /**
   * Disables filtering the options (by label) when some text is input.
   * @default false (i.e., filter on text input)
   */
  disableFiltering?: boolean
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
   * Use null or an "identity function" to avoid filtering - likely desired in
   * an async select case.
   *
   * @default String#indexOf match will be used
   */
  filterFn?: OptionsFilterFn<T, G> | null
  /**
   * By default, when an item is selected and the input text matches
   * the label of the selected item, then filtering will not be done.
   */
  filterWhenSelected?: boolean
  /**
   * Will be (deep) merged with defaultSelectState.
   * @default defaultSelectState
   */
  initialState?: Partial<SelectState<T, G>>
  inputOptions?: {
    /**
     * If the user backspaces out a selected option then the option will be
     * completely deselected if this is true (i.e., the input will be reset
     * to an empty value). However, if this is false, the option will be
     * deselected, but the input text will incrementally be backspaced out.
     *
     * In the case of multi-select if there is no input value, but there are
     * selected options the last selected option will be removed.
     *
     * @default true
     */
    completelyRemoveSelectOnBackspace?: boolean
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
   * If multiple options should be allowed to be selected at a time.
   * @default false
   */
  multiSelect?: boolean
  /**
   * When an action occurs, the next state will be computed, and then it will
   * be passed to this function (if supplied). The nextState SHOULD NOT be
   * mutated directly, but should be immutably updated - if a different object
   * is returned then that object will be used, otherwise null or undefined
   * will result in the reducers nextState being returned. There will be some
   * cases where the previous state is returned
   *
   * Note, the is*Action methods can be used to check the action type for casting.
   */
  onStateChange?: (
    prevState: SelectState<T, G>,
    nextState: SelectState<T, G>,
    action: Action<SelectAction, Record<string, any>>
  ) => SelectState<T, G> | undefined | null
  /**
   * Provide function to determine if an option matches another option.
   * @default simple option.value === option.value check
   */
  optionEqualityCheck?: OptionEqualityCheck<T, G>
  /** @default true (i.e., opens the menu when the input is focused)  */
  showMenuOnFocus?: boolean
}

// In this case there is no group type, so we need to type it as any here to avoid
// a typing conflict on the union of UseSelectOptionsWithoutGroupSelect and
// UseSelectOptionsWithGroupSelect.
export interface UseSelectReducerOptionsWithoutGroupSelect<T>
  extends UseSelectReducerOptionsBase<T, any> {
  /**
   * If the group/groupLabel itself is selectable. If this is the case
   * then the highlight index will include the groupLabel itself. Note,
   * when a group is selected, then the GroupSelectOption will be returned.
   */
  canSelectGroup?: false
  // /**
  //  * When the user clicks an item in the dropdown, or when the user
  //  * selects an item with the arrow keys (i.e., highlightIndex > -1).
  //  *
  //  * This differs from 'onChange' in that it is when an option is actually
  //  * selected and not when some text input occurs.
  //  */
  // onSelect?: (value: string, selectedOption: SelectOption<T>) => void
}

export interface UseSelectReducerOptionsWithGroupSelect<T, G = T>
  extends UseSelectReducerOptionsBase<T, G> {
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
  // /**
  //  * When the user clicks an item in the dropdown, or when the user
  //  * selects an item with the arrow keys (i.e., highlightIndex > -1).
  //  *
  //  * The selected option may be a GroupSelectOption, you can use 'isGroupSelectOption'
  //  * to type guard/check the selected option if desired.
  //  */
  // onSelect?: (value: string, selectedOption: OptionType<T, G>) => void
}

export type UseSelectReducerOptions<T, G> =
  | UseSelectReducerOptionsWithoutGroupSelect<T>
  | UseSelectReducerOptionsWithGroupSelect<T, G>

// Just a helper to handle redundant behavior wherever visible options are set
function setVisibleOptions(
  nextState: SelectState<any, any>,
  nextVisibleOptions: OptionType<any, any>[],
  nextVisibleOptionsLengthRef: MutableRefObject<number>,
  canSelectGroup: boolean
) {
  nextState.visibleOptions = nextVisibleOptions
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
  nextVisibleOptionsLengthRef.current = getOptionsLength(
    nextVisibleOptions,
    canSelectGroup
  )
}

/**
 * This is used so that each check on the action type can return in line.
 * This helps with optimization so that unnecessary updates can be avoided.
 *
 * We have cases where we will kick off update events even though the state
 * will not have changed after the update event. (e.g., if someone clicks in
 * the menu when it is already open then we don't need to return a completely
 * new state since nothing should have changed).
 */
function finalStateHelper(
  prevState: SelectState<any>,
  nextState: SelectState<any>,
  onStateChange: UseSelectReducerOptions<any, any>['onStateChange'],
  action: Action<any, any>
) {
  return onStateChange?.(prevState, nextState, action) || nextState
}

function applyFilterFn<T>(
  inputVal: string,
  options: OptionType<T>[],
  filterFn?: OptionsFilterFn<T> | null
): OptionType<T>[] {
  return filterFn ? filterFn(inputVal, options) : options
}

function isHighlightIndexFullyDecremented(
  highlightIndex: number,
  allowNoHighlight?: boolean
) {
  return (
    (highlightIndex === 0 && !allowNoHighlight) ||
    (highlightIndex === -1 && allowNoHighlight)
  )
}

export function useSelectReducer<T, G = T>(
  options: UseSelectReducerOptions<T, G>
): [SelectState<T, G>, Dispatch<Action<SelectAction, object>>] {
  const {
    canSelect,
    disableSelection,
    disableFiltering,
    filterFn = indexOfFilterMatch,
    isSelectedCheck = defaultIsOptionSelectedCheck,
    onStateChange,
    multiSelect,
    // close menu by default when option is selected and not in multiSelect mode
    closeMenuOnSelection = !multiSelect,
    showMenuOnFocus = true,
    allowNoHighlight = false,
    cycleHighlightIndex = true,
    optionEqualityCheck = defaultOptionEqualityCheck,
    canSelectGroup
  } = options

  // optimization to avoid calculating the visible options length every time
  // (b/c grouping impacts the length would need to iterate through the options
  // every time to get the length)
  const visibleOptionsLengthRef = useRef<number>(0)

  // Also need to find the latest state
  const setNextOpts = (nextState: SelectState<any>, inputVal: string) => {
    if (
      nextState.selectedOptions &&
      textMatchesSelectedOptions(inputVal, nextState.selectedOptions)
    ) {
      // Right now, showing everything, b/c the input text matches a selected option.
      // In the future may want to adjust this to avoid showing all options when the
      // input matches a selected option. May have to add in more tracking to determine
      // if the user just selected the value and hasn't made any other input changes.
      setVisibleOptions(
        nextState,
        nextState.options,
        visibleOptionsLengthRef,
        !!canSelectGroup
      )
    } else if (!disableFiltering) {
      setVisibleOptions(
        nextState,
        applyFilterFn(inputVal, nextState.options, filterFn),
        visibleOptionsLengthRef,
        !!canSelectGroup
      )
    } else {
      // set to all as well??
      setVisibleOptions(
        nextState,
        nextState.options,
        visibleOptionsLengthRef,
        !!canSelectGroup
      )
    }
  }

  const setNextHighlightIndex = (
    prevOpt: OptionType<any>[],
    prevHighIdx: number,
    nextOpts: OptionType<any>[],
    findNextIndex: boolean,
    nextState: SelectState<any>
  ) => {
    let didFindLastIndex = false
    if (findNextIndex) {
      const prevHighlightOpt = getOptionAtIndex(prevOpt, prevHighIdx, canSelectGroup)
      if (prevHighlightOpt) {
        const nextHighlightIndex = getOptionIndex(
          nextOpts,
          prevHighlightOpt,
          canSelectGroup,
          optionEqualityCheck
        )
        if (nextHighlightIndex >= 0) {
          nextState.highlightIndex = nextHighlightIndex
          didFindLastIndex = true
        }
      }
    }
    if (!didFindLastIndex) {
      nextState.highlightIndex = -1
    }
  }

  function selectReducer<SA extends SelectAction, A extends Action<SA, object>>(
    state: SelectState<T, G>,
    action: A
  ): SelectState<T, G> {
    // Non-rerender conditions (unless user returns new state with their onStateChange handler)
    if (
      isDecrementHighlightIndexAction(action) &&
      isHighlightIndexFullyDecremented(state.highlightIndex, allowNoHighlight) &&
      !cycleHighlightIndex
    ) {
      return finalStateHelper(state, state, onStateChange, action)
    }
    if (
      isIncrementHighlightIndexAction(action) &&
      state.highlightIndex === visibleOptionsLengthRef.current - 1 &&
      !cycleHighlightIndex
    ) {
      return finalStateHelper(state, state, onStateChange, action)
    }
    if (
      isSetMenuOpenAction(action) &&
      state.inputState.showMenu === action.payload.open
    ) {
      return finalStateHelper(state, state, onStateChange, action)
    }

    // All of these will cause a re-render (unless user returns prevState from onStateChange handler)
    let nextState: SelectState<any> = { ...state }

    const handleInputChange = (
      value: string,
      showMenu = true,
      findNextIndex = true,
      fromSelection = false
    ) => {
      // check if backspaced
      if (
        state.selectedOptions.length > 0 &&
        // backspace condition
        value.length === state.inputState.value.length - 1 &&
        state.inputState.value.indexOf(value) === 0 &&
        !multiSelect
      ) {
        nextState.selectedOptions = [
          ...nextState.selectedOptions.slice(0, nextState.selectedOptions.length - 1)
        ]
        // This should not be called on multiSelect - the hook should handle calling deselect
        if (options.inputOptions?.completelyRemoveSelectOnBackspace) {
          value = ''
        }
      }
      nextState.inputState = { ...nextState.inputState, showMenu, value }
      if (fromSelection) {
        nextState.pseudoInputValue = ''
      } else {
        nextState.pseudoInputValue = value
      }
      setNextOpts(nextState, value)
      setNextHighlightIndex(
        state.visibleOptions,
        state.highlightIndex,
        nextState.visibleOptions,
        findNextIndex,
        nextState
      )
    }

    if (isInputChangeAction(action)) {
      // We do NOT auto-select when the user's input matches a label; however, if the user
      // has selected an option and then changes the input that was matching the option, the
      // option should be de-selected
      handleInputChange(action.payload.value)
    } else if (isOptionSelectedAction(action)) {
      const selectedOption = action.payload.option
      // make sure is selectable first
      if (!disableSelection || !(canSelect && canSelect(selectedOption))) {
        if (multiSelect && !isSelectedCheck(selectedOption, nextState.selectedOptions)) {
          nextState.selectedOptions = [...nextState.selectedOptions, selectedOption]
          nextState.highlightIndex = -1
          if (!action.payload.ignoreClearInputOnMultiSelect) {
            handleInputChange('', false, false, true)
          }
        } else if (!multiSelect) {
          nextState.selectedOptions = [selectedOption]
          handleInputChange(
            isGroupSelectOption(selectedOption)
              ? selectedOption.groupLabel
              : selectedOption.label,
            false,
            false,
            true
          )
        }
        let nextShowMenuState = nextState.inputState.showMenu
        const closeMenu = action.payload.closeMenu ?? closeMenuOnSelection
        if (nextShowMenuState && closeMenu) {
          nextShowMenuState = false
        }
        nextState.inputState = { ...nextState.inputState, showMenu: nextShowMenuState }
      }
    } else if (isOptionDeselectedAction(action)) {
      const curOptions = nextState.selectedOptions
      const { option } = action.payload
      const idx = getOptionIndex(curOptions, option, canSelectGroup, optionEqualityCheck)
      if (idx >= 0) {
        let nextShowMenuState = nextState.inputState.showMenu
        const closeMenu = action.payload.closeMenu
        if (nextShowMenuState && closeMenu) {
          nextShowMenuState = false
        }
        nextState.inputState = { ...nextState.inputState, showMenu: nextShowMenuState }
        if (!multiSelect && !isGroupSelectOption(option)) {
          nextState.inputState.value = ''
        }
        nextState.selectedOptions = [
          ...curOptions.splice(0, idx),
          ...curOptions.splice(idx + 1, curOptions.length)
        ]
      }
    } else if (isIncrementHighlightIndexAction(action)) {
      let didIncrement = false
      // TODO: need to constrain the incrementation by the amount of available
      if (nextState.highlightIndex < visibleOptionsLengthRef.current - 1) {
        didIncrement = true
        nextState.highlightIndex = nextState.highlightIndex + 1
      }
      if (cycleHighlightIndex && !didIncrement) {
        nextState.highlightIndex = 0
      }
    } else if (isDecrementHighlightIndexAction(action)) {
      let didDecrement = false
      if (
        (allowNoHighlight && state.highlightIndex > -1) ||
        (!allowNoHighlight && state.highlightIndex > 0)
      ) {
        didDecrement = true
        nextState.highlightIndex = nextState.highlightIndex - 1
      }
      // if it didn't decrement (we maxed out the decrement),
      // and cycling is allowed then we need to cycle
      if (cycleHighlightIndex && !didDecrement) {
        nextState.highlightIndex = visibleOptionsLengthRef.current - 1
      }
    } else if (isSetOptionsAction(action)) {
      const nextOptions = action.payload.options
      setNextHighlightIndex(
        state.options,
        state.highlightIndex,
        nextOptions,
        !!action.payload.attemptFindLastHighlightIndex,
        nextState
      )
      nextState.options = action.payload.options
      setNextOpts(nextState, nextState.inputState.value)
    } else if (isAppendOptionsAction(action)) {
      nextState.options = [...nextState.options, ...action.payload.options]
      setNextOpts(nextState, nextState.inputState.value)
    } else if (isSetMenuOpenAction(action)) {
      nextState.inputState = { ...nextState.inputState, showMenu: action.payload.open }
    } else if (isSetInputFocusedAction(action)) {
      const { menuOpen = showMenuOnFocus, focused } = action.payload
      nextState.inputState = {
        ...nextState.inputState,
        isInputFocused: focused,
        showMenu: menuOpen
      }
    } else if (isSetStateAction(action)) {
      nextState = action.payload.setState(state)
    }

    // Allows user to intercept and override any state changes, passing them the action.
    // If null/undefined is returned then the original nextState object will be used
    const manualOnStateChangeResp = onStateChange
      ? onStateChange(state, nextState, action)
      : nextState
    // may be null or undefined
    return manualOnStateChangeResp || nextState
  }

  const initialState = useMemo<SelectState<T, G>>(() => {
    const nextState = {
      ...initialDefaultSelectState,
      ...options.initialState,
      highlightIndex: allowNoHighlight ? -1 : 0,
      inputState: {
        ...initialDefaultSelectState.inputState,
        ...options.initialState?.inputState
      }
    }
    setNextOpts(nextState, nextState.inputState.value)
    return nextState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // This is a hack around the dispatch operation of useReducer. Dispatch of useReducer
  // always seems to trigger a re-render, which is unnecessary in certain situations
  // (e.g., the highlight index is at the max or minimum value)
  const [selectState, setSelectState] = useState<SelectState<T, G>>(initialState)
  const selectReducerRef = useLatestRef(selectReducer)
  const dispatch = useCallback((action: Action<SelectAction, object>) => {
    setSelectState((prevState) => selectReducerRef.current(prevState, action))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [selectState, dispatch]
}
