import {
  defaultIsOptionSelectedCheck,
  defaultOptionEqualityCheck,
  flattenOptions,
  getOptionAtIndex,
  getOptionIndex,
  indexOfFilterMatch,
  isGroupSelectOption,
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
import { ExtObj, OptionType } from '../types/optionTypes'

type IsDisabledFn<T, G, O extends ExtObj> = (
  option: OptionType<T, G, O>,
  state: SelectState<T, G, O>
) => boolean

export interface UseSelectReducerOptions<T, G = T, O extends ExtObj = ExtObj> {
  /**
   * Allows for 'no-highlighting' to occur (i.e., highlightIndex = -1).
   *
   * Note: if this is true, it may seem to interact weirdly with cycleHighlightIndex
   * - where this will cause the index to go from 0 -> -1 -> max or max -> -1 -> 0.
   * @default false
   */
  allowNoHighlight?: boolean
  /**
   * If the group options should be selectable.
   * @default false
   */
  canSelectGroup?: boolean
  /** @default true when single selection, false when multiSelect */
  closeMenuOnSelection?: boolean
  /**
   * When the highlight index reached the maximum or minimum value, it will
   * cycle to the other value (i.e., 0 -> max or max -> 0).
   *
   * Note: in the case of allowNoHighlight, this will go from 0 -> -1 -> max,
   * but then go from max -> 0 (skipping -1)
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
  filterFn?: OptionsFilterFn<T, G, O> | null
  /**
   * By default, when an item is selected and the input text matches
   * the label of the selected item, then filtering will not be done.
   */
  filterWhenSelected?: boolean
  /**
   * Will be (deep) merged with defaultSelectState.
   * @default defaultSelectState
   */
  initialState?: Partial<SelectState<T, G, O>>
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
   * By default, all options are selectable, but this can be supplied
   * to disable selection of an option.
   *
   * This should return true if the option IS selectable; false otherwise.
   *
   * If an item is already selected then this will have no bearing.
   *
   * NOTE: should be memoized.
   *
   * @default undefined (i.e., all options are selectable)
   */
  isDisabled?: IsDisabledFn<T, G, O>
  /**
   * Allows to override the default implementation which checks if an
   * option was by using a triple equal check on the option's value
   * (i.e., OptionType#value).
   *
   * NOTE: should be memoized.
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
   * cases where the previous state is returned.
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

function setVisibleOptions(
  nextState: SelectState<any, any, any>,
  nextVisibleOptions: OptionType<any, any, any>[],
  flattenedVisibleOptionsRef: MutableRefObject<OptionType<any, any, any>[]>,
  canSelectGroup: boolean
) {
  nextState.visibleOptions = nextVisibleOptions
  flattenedVisibleOptionsRef.current = flattenOptions(nextVisibleOptions, canSelectGroup)
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
  prevState: SelectState<any, any, any>,
  nextState: SelectState<any, any, any>,
  onStateChange: UseSelectReducerOptions<any, any, any>['onStateChange'],
  action: Action<any, any>
) {
  return onStateChange?.(prevState, nextState, action) || nextState
}

function applyFilterFn<T, G = T, O extends ExtObj = ExtObj>(
  inputVal: string,
  options: OptionType<T, G, O>[],
  filterFn?: OptionsFilterFn<T, G, O> | null
): OptionType<T, G, O>[] {
  return filterFn ? filterFn(inputVal, options) : options
}

interface UseSelectReducerResult<T, G = T, O extends ExtObj = ExtObj> {
  dispatch: Dispatch<Action<SelectAction, object>>
  /** Used for quick highlight item lookup. */
  highlightItem: OptionType<T, G, O>
  selectState: SelectState<T, G, O>
}

export function useSelectReducer<T, G = T, O extends ExtObj = ExtObj>(
  options: UseSelectReducerOptions<T, G, O>
): UseSelectReducerResult<T, G, O> {
  const {
    disableSelection,
    disableFiltering,
    filterFn = indexOfFilterMatch as OptionsFilterFn<T, G, O>,
    isDisabled,
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

  // As a performance optimization and, honestly, a simplification in the next
  // highlight index calculation this is used to linearly iterate over the options
  // rather than having to go within a group's options each time the highlight
  // index is incremented . I.e., we pay the price to flatten the options once
  // (with a bit of extra space) rather than every increment/decrement of the
  // highlight index.
  const flattenedVisibleOptionsRef = useRef<OptionType<T, G, O>[]>([])

  // Also need to find the latest state
  const setNextOpts = (nextState: SelectState<T, G, O>, inputVal: string) => {
    if (
      (nextState.selectedOptions &&
        textMatchesSelectedOptions(inputVal, nextState.selectedOptions)) ||
      disableFiltering
    ) {
      setVisibleOptions(
        nextState,
        nextState.options,
        flattenedVisibleOptionsRef,
        !!canSelectGroup
      )
    } else {
      setVisibleOptions(
        nextState,
        applyFilterFn(inputVal, nextState.options, filterFn),
        flattenedVisibleOptionsRef,
        !!canSelectGroup
      )
    }
  }

  const incOrDecHighIdx = (
    currentIndex: number,
    increment: boolean,
    nextState: SelectState<T, G, O>,
    // track to make sure we don't end up in infinite loop
    didCycle = false
  ): void => {
    const flatOpts = flattenedVisibleOptionsRef.current
    // increment cycle case
    // at end and didn't already cycle
    if (increment && !didCycle && currentIndex === flatOpts.length - 1) {
      if (cycleHighlightIndex) {
        // can't simply set this to 0, b/c 0 could NOT be selectable, so now recursively
        // call this function starting at 0 and decrementing rather than incrementing
        return incOrDecHighIdx(0, true, nextState, true)
      }
      // nothing to be done here b/c it does not cycle and cannot be incremented anymore
      return
    }
    // decrement - cycle case
    if (
      !increment &&
      !didCycle &&
      ((allowNoHighlight && currentIndex === -1) ||
        (!allowNoHighlight && currentIndex === 0))
    ) {
      if (cycleHighlightIndex) {
        return incOrDecHighIdx(flatOpts.length - 1, false, nextState, true)
      }
      // nothing to be done here b/c it does not cycle and cannot be decremented anymore
      return
    }
    // Nothing is disabled, so can simply increment or decrement
    if (!isDisabled) {
      if (increment) {
        nextState.highlightIndex = didCycle ? currentIndex : currentIndex + 1
      } else {
        nextState.highlightIndex = didCycle ? currentIndex : currentIndex - 1
      }
      return
    }
    if (increment) {
      for (let i = didCycle ? currentIndex : currentIndex + 1; i < flatOpts.length; i++) {
        if (!isDisabled(flatOpts[i], nextState)) {
          nextState.highlightIndex = i
          return
        }
      }
      if (!didCycle && cycleHighlightIndex)
        return incOrDecHighIdx(0, true, nextState, true)
      // we have gotten to the end and not found anything...
    } else {
      // decrement
      for (let i = didCycle ? currentIndex : currentIndex - 1; i >= 0; i--) {
        if (!isDisabled(flatOpts[i], nextState)) {
          nextState.highlightIndex = i
          return
        }
      }
      if (!didCycle && cycleHighlightIndex)
        return incOrDecHighIdx(flatOpts.length - 1, false, nextState, true)
    }
    // cannot increment or decrement... do nothing
  }

  /**
   * Handles finding the next highlight index when the options change.
   * First this will attempt to find the previous option in the new
   * list of options, but if that cannot be found then it will try to
   * retain the highlightIndex by keeping it the same or moving it to
   * the next available option.
   *
   * NOTE: this is not the same thing as incrementing/decrementing the highlight index.
   */
  const findNextHighlightIndex = (
    prevOpt: OptionType<T, G, O>[],
    prevHighIdx: number,
    nextOpts: OptionType<T, G, O>[],
    findNextIndex: boolean,
    nextState: SelectState<T, G, O>
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
    // The previously highlighted option does not exist in the next options;
    // list; fallback to finding the next available highlight index
    if (!didFindLastIndex) {
      incOrDecHighIdx(0, true, nextState, true)
    }
  }

  function selectReducer<SA extends SelectAction, A extends Action<SA, object>>(
    state: SelectState<T, G, O>,
    action: A
  ): SelectState<T, G, O> {
    // Non-rerender conditions (unless user returns new state with their onStateChange handler)
    if (
      isSetMenuOpenAction(action) &&
      state.inputState.showMenu === action.payload.open
    ) {
      return finalStateHelper(state, state, onStateChange, action)
    }

    // All of these will cause a re-render (unless user returns prevState from onStateChange handler)
    let nextState: SelectState<any, any, any> = { ...state }

    const handleInputChange = (
      value: string,
      showMenu = false,
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
      findNextHighlightIndex(
        state.visibleOptions,
        state.highlightIndex,
        nextState.visibleOptions,
        findNextIndex,
        nextState
      )
    }

    //
    // INPUT CHANGE
    //
    if (isInputChangeAction(action)) {
      // We do NOT auto-select when the user's input matches a label; however, if the user
      // has selected an option and then changes the input that was matching the option, the
      // option should be de-selected
      handleInputChange(action.payload.value, action.payload.showMenu)
    }
    //
    // OPTION SELECTED
    //
    else if (isOptionSelectedAction(action)) {
      const selectedOption = action.payload.option as OptionType<T, G, O>
      const canSelectOption = isDisabled ? !isDisabled(selectedOption, state) : true
      if (!disableSelection && canSelectOption) {
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
    }
    //
    // OPTION DE-SELECTED
    //
    else if (isOptionDeselectedAction(action)) {
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
    }
    //
    // INCREMENT HIGHLIGHT INDEX
    //
    else if (isIncrementHighlightIndexAction(action)) {
      incOrDecHighIdx(state.highlightIndex, true, nextState)
    }
    //
    // DECREMENT HIGHLIGHT INDEX
    //
    else if (isDecrementHighlightIndexAction(action)) {
      incOrDecHighIdx(state.highlightIndex, false, nextState)
    }
    //
    // SET OPTIONS
    //
    else if (isSetOptionsAction(action)) {
      const nextOptions = action.payload.options
      findNextHighlightIndex(
        state.options,
        state.highlightIndex,
        nextOptions,
        !!action.payload.attemptFindLastHighlightIndex,
        nextState
      )
      nextState.options = action.payload.options
      setNextOpts(nextState, nextState.inputState.value)
    }
    //
    // APPEND OPTIONS
    //
    else if (isAppendOptionsAction(action)) {
      nextState.options = [...nextState.options, ...action.payload.options]
      setNextOpts(nextState, nextState.inputState.value)
    }
    //
    // SET MENU OPEN
    //
    else if (isSetMenuOpenAction(action)) {
      nextState.inputState = { ...nextState.inputState, showMenu: action.payload.open }
    }
    //
    // SET INPUT FOCUSED
    //
    else if (isSetInputFocusedAction(action)) {
      const { menuOpen = showMenuOnFocus, focused } = action.payload
      nextState.inputState = {
        ...nextState.inputState,
        isInputFocused: focused,
        showMenu: menuOpen
      }
    }
    //
    // SET STATE
    //
    else if (isSetStateAction(action)) {
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

  const initialState = useMemo<SelectState<T, G, O>>(() => {
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
    if (!allowNoHighlight) {
      // start at beginning and try to go forward
      incOrDecHighIdx(-1, true, nextState)
    }
    return nextState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // This is a hack around the dispatch operation of useReducer. Dispatch of useReducer
  // always seems to trigger a re-render, which is unnecessary in certain situations
  // (e.g., the highlight index is at the max or minimum value)
  const [selectState, setSelectState] = useState<SelectState<T, G, O>>(initialState)
  const selectReducerRef = useLatestRef(selectReducer)
  const dispatch = useCallback((action: Action<SelectAction, object>) => {
    setSelectState((prevState) => selectReducerRef.current(prevState, action))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return {
    dispatch,
    highlightItem: flattenedVisibleOptionsRef.current[selectState.highlightIndex],
    selectState
  }
}
