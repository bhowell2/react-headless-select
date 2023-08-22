import {
  Dispatch,
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useLatestRef } from './internal/useLatestRef'
import {
  getElement,
  ScrollOptionsType,
  ScrollType,
  useScrollIntoView
} from './useScrollIntoView'
import { NOOP } from '../utils/noop'
import { useSelectReducer, UseSelectReducerOptions } from './selectReducer'
import {
  Action,
  makeAppendOptionsAction,
  makeDecrementHighlightIndexAction,
  makeIncrementHighlightIndexAction,
  makeInputChangeAction,
  makeOptionDeselectedAction,
  makeOptionSelectedAction,
  makeSetInputFocusedAction,
  makeSetMenuOpenAction,
  makeSetStateAction,
  SelectAction,
  SelectState,
  SetStateAction
} from './reducerActions'
import { getVerticalScrollPercentage } from '../utils/elementUtils'
import {
  defaultIsOptionSelectedCheck,
  defaultOptionEqualityCheck,
  getOptionAtIndex,
  indexOfFilterMatch,
  isGroupSelectOption
} from '../utils/optionUtils'
import { usePreviousVal } from './internal/usePreviousRef'
import { useSafeLayoutEffect } from './internal/useSafeLayoutEffect'
import { wrapFunction } from '../utils/wrapFunction'
import { ExtObj, GroupSelectOption, OptionType } from '../types/optionTypes'

export interface OptionProps<T, G = T, O extends ExtObj = ExtObj> {
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
  /** Set by isDisabled if provided. */
  isDisabled: boolean
  /**
   * When the keyboard is used to navigate the dropdown this specifies if
   * the highlight index is for the given item. This wraps the 'canSelectGroup'
   * functionality, so the consideration of highlighting/selecting is transparent
   * to the user.
   */
  isHighlighted: boolean
  /** Occurs when the item has actually been selected via click or enter. */
  isSelected: boolean
  /**
   * Removes the item from selection.
   * closeMenu defaults to false on multiSelect.
   * */
  onDeselect: (closeMenu?: boolean) => void
  /**
   * Selects the option.
   * closeMenu defaults to false on multiSelect.
   * */
  onSelect: (closeMenu?: boolean) => void
  /** The Group/SelectOption for this element. */
  option: OptionType<T, G, O>
  /** Props to be spread into each option. This includes spread to group options as well. */
  spreadProps: {
    /** Simply the option's label. Provided for accessibility. */
    ['aria-label']: string
    /** If the item is selected. Provided for accessibility. */
    ['aria-selected']: boolean
    // Passed when the object is highlighted
    ref?: MutableRefObject<any>
  }
  /**
   * The OptionProps for each of the group's options.
   * This prop can be checked to determine if the current option prop is for a
   * GroupSelectOption - containing the correct OptionProps for the group's options.
   * */
  groupOptions?: OptionProps<T, G, O>[]
}

function getHighlightCompletionPercentage(
  options: unknown[],
  highlightIndex: number
): number {
  if (options.length === 0 || highlightIndex === options.length - 1) return 1
  if (highlightIndex <= 0) return 0
  return highlightIndex / options.length
}

export interface UseSelectOptions<
  T,
  G = T,
  O extends ExtObj = ExtObj,
  ST extends ScrollType = 'scrollInto'
> extends UseSelectReducerOptions<T, G, O> {
  /**
   * This does not need to be memoized, it is captured. The current state
   * will be passed to this, along with the current scroll percentage and
   * the scroll event.
   */
  onScroll?: (
    selectState: SelectState<T, G, O>,
    scrollPercentage: number,
    event: HTMLElementEventMap['scroll']
  ) => void
  /**
   * Search occurs when the enter key is pressed and no item has
   * been selected with the arrow keys (i.e., highlightIndex = -1).
   *
   * The current internal input value will be passed back. A 'search'
   * function is also passed back in UseSelectResult so that a search
   * can be triggered, where this function will be called as well.
   */
  onSearch?: (search: string) => void
  onSelect?: (option: OptionType<T, G, O>) => void
  scrollOptions?: {
    type: ST
    options?: ScrollOptionsType<ST>
  }
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

export interface UseSelectResult<
  T,
  G = T,
  O extends ExtObj = ExtObj,
  E extends HTMLElement = HTMLInputElement
> {
  dispatchAction: Dispatch<Action<SelectAction, object>>
  dispatchAppendOptions: (options: OptionType<T, G, O>[]) => void
  /**
   * Allows to manually update the state.
   */
  dispatchStateChange: Dispatch<SetStateAction<T, G, O>['payload']['setState']>
  /**
   * Provides the list of options to display. This is after filtering
   * and determining if it is highlighted or selected.
   */
  displayOptions: OptionProps<T, G, O>[]
  dropdownContainerProps: {
    onMouseEnter: () => void
    onMouseLeave: () => void
    ref: MutableRefObject<any>
  }
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
  /**
   * Triggers the onSearch call that is passed in as a prop. This occurs
   * when highlightIndex = -1 (i.e., nothing is highlighted) and the user
   * presses the 'Enter' key.
   *
   * NOTE: if allowNoHighlight = false then this will never be called.
   * */
  search: () => void
  /**
   * If item(s) are selected then they will be returned here. The most recently
   * selected item is also passed to onSelect if it is provided.
   */
  selectedOptions: OptionType<T, G, O>[]
  state: SelectState<T, G, O>
}

export function getDefaultOptions<
  T,
  G = T,
  O extends ExtObj = ExtObj,
  ST extends ScrollType = 'scrollInto'
>(options: UseSelectOptions<T, G, O, ST>): UseSelectOptions<T, G, O, ST> {
  return {
    allowNoHighlight: false,
    closeMenuOnSelection: !options.multiSelect,
    cycleHighlightIndex: true,
    filterFn: indexOfFilterMatch,
    isSelectedCheck: defaultIsOptionSelectedCheck,
    optionEqualityCheck: defaultOptionEqualityCheck,
    showMenuOnFocus: true,
    ...options,
    inputOptions: { completelyRemoveSelectOnBackspace: true, ...options.inputOptions }
  }
}

export function useSelect<
  T,
  G = T,
  O extends ExtObj = ExtObj,
  E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
  ST extends ScrollType = 'scrollInto'
>(options: UseSelectOptions<T, G, O, ST>): UseSelectResult<T, G, O, E> {
  const useSelectOptions = getDefaultOptions(options)
  const {
    canSelectGroup,
    isDisabled,
    isSelectedCheck,
    multiSelect,
    onScroll,
    onSearch,
    optionEqualityCheck,
    scrollOptions,
    showMenuOnFocus,
    value
  } = useSelectOptions

  const inputRef = useRef<E>()
  const isMouseInsideDropdown = useRef(false)
  /*
   * There's an edge case here where if a
   * */
  useSelectOptions.onStateChange = wrapFunction(
    useSelectOptions.onStateChange,
    (prevState, nextState) => {
      if (
        prevState.inputState.showMenu &&
        !nextState.inputState.showMenu &&
        isMouseInsideDropdown.current
      ) {
        isMouseInsideDropdown.current = false
      }
      return nextState
    }
  )

  const { dispatch, selectState } = useSelectReducer<T, G, O>(useSelectOptions)
  useEffect(() => {
    if (value !== undefined && selectState.inputState.value !== value) {
      dispatch(
        makeInputChangeAction({ showMenu: selectState.inputState.isInputFocused, value })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const { highlightIndex, selectedOptions, visibleOptions } = selectState

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
      case 'Backspace':
        const prevInputValue = selectState.inputState.value
        if (multiSelect && prevInputValue === '' && selectedOptions.length > 0) {
          // Remove last selected element in multi-select case (when input is empty).
          event.preventDefault()
          dispatch(
            makeOptionDeselectedAction({
              option: selectedOptions[selectedOptions.length - 1]
            })
          )
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!selectState.inputState.showMenu) {
          // the first time ArrowDown is pressed just show the menu and do not increment the highlightIndex
          dispatch(makeSetMenuOpenAction(true))
          return
        }
        dispatch(makeIncrementHighlightIndexAction())
        break
      case 'ArrowUp':
        event.preventDefault()
        // This seems sane enough, but there might be cases where the user does not
        // want to show the menu on arrow up.
        if (!selectState.inputState.showMenu) {
          dispatch(makeSetMenuOpenAction(true))
          return
        }
        dispatch(makeDecrementHighlightIndexAction())
        break
      case 'Enter':
        event.preventDefault()
        if (highlightIndex === -1) {
          onSearch?.(selectState.inputState.value)
        } else {
          const selected = getOptionAtIndex(
            visibleOptions,
            highlightIndex,
            canSelectGroup
          )
          // this shouldn't ever return null...
          if (selected) {
            dispatch(makeOptionSelectedAction({ option: selected }))
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        dispatch(makeSetMenuOpenAction(false))
        break
      default:
    }
  }

  // may have to change this to a set state to trigger re-render if user does not
  // set on initialization and doesn't rerender at this same level (maybe they pass
  // the ref down to another component that rerenders)
  // const dropdownContainerRef = useRef<HTMLElement>(null)
  const [dropdownContainer, setDropdownContainer] = useState<HTMLElement | undefined>()
  const highlightRef = useRef<HTMLElement>(null)
  const selectedRef = useRef<HTMLElement>(null)
  const prevState = usePreviousVal(selectState, true)
  const prevDropdownContainer = usePreviousVal(dropdownContainer)
  useScrollIntoView({
    child: highlightIndex === -1 ? selectedRef : highlightRef,
    container: dropdownContainer,
    disabled: !(
      selectState.highlightIndex !== prevState?.highlightIndex ||
      selectState.inputState.showMenu !== prevState?.inputState.showMenu ||
      dropdownContainer !== prevDropdownContainer
    ),
    options: scrollOptions?.options,
    type: scrollOptions?.type
  })
  const onScrollRef = useLatestRef(onScroll)
  const stateRef = useLatestRef(selectState)
  useEffect(() => {
    const container = getElement(dropdownContainer)
    if (container) {
      const scroll = (event: HTMLElementEventMap['scroll']) => {
        // calculate percentage scrolled
        onScrollRef.current?.(
          stateRef.current,
          getVerticalScrollPercentage(event.currentTarget as any),
          event
        )
      }
      container.addEventListener('scroll', scroll)
      return () => {
        container.removeEventListener('scroll', scroll)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownContainer])

  // useEffect(() => {
  //   if (!selectState.inputState.showMenu && isMouseInsideDropdown.current) {
  //     // reset this. there are cases where the menu will be
  //     isMouseInsideDropdown.current = false
  //   }
  // }, [selectState.inputState.showMenu])

  useEffect(() => {
    const input = inputRef.current
    if (input) {
      // want to avoid double dispatch here if the focusEvent occurs and then
      // the mouseDown event occurs. The field could be focused either by tabbing,
      // clicking, or even by JS calling .focus()
      const onFocus = () => {
        dispatch(makeSetInputFocusedAction(true))
      }
      const onBlur = () => {
        if (!isMouseInsideDropdown.current) {
          // need to make sure that the blur event is NOT occurring b/c the user is clicking
          // within the dropdown menu
          dispatch(makeSetInputFocusedAction(false, false))
        }
      }
      const onMouseDown = () => {
        dispatch(makeSetMenuOpenAction(true))
      }

      input.addEventListener('mousedown', onMouseDown)
      input.addEventListener('focus', onFocus)
      input.addEventListener('blur', onBlur)
      return () => {
        input.removeEventListener('mousedown', onMouseDown)
        input.removeEventListener('focus', onFocus)
        input.removeEventListener('blur', onBlur)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenuOnFocus, inputRef.current])

  const selectedCheckRef = useLatestRef(isSelectedCheck)
  const displayOptions = useMemo<OptionProps<T, G, O>[]>(() => {
    const selectedCheck = (option: OptionType<T, G, O>) => {
      if (selectedCheckRef.current)
        return selectedCheckRef.current(option, selectedOptions, optionEqualityCheck)
      return selectedOptions.includes(option)
    }
    const returnedDisplayOptions: OptionProps<T, G, O>[] = []
    let pos = 0

    const checkGroupOptions = (
      groupOption: GroupSelectOption<T, G, O>,
      groupAry: OptionProps<T, G, O>[],
      depth = 0
    ) => {
      const isGroupHighlighted = canSelectGroup ? highlightIndex === pos++ : false
      const isGroupSelected = canSelectGroup ? selectedCheck(groupOption) : false
      groupAry.push({
        depth,
        isDisabled: isDisabled ? isDisabled(groupOption, selectState) : false,
        isHighlighted: isGroupHighlighted,
        isSelected: isGroupSelected,
        onDeselect: (closeMenu) =>
          dispatch(makeOptionDeselectedAction({ closeMenu, option: groupOption })),
        onSelect: canSelectGroup
          ? (closeMenu) =>
              dispatch(makeOptionSelectedAction({ closeMenu, option: groupOption }))
          : NOOP,
        option: groupOption,
        spreadProps: {
          'aria-label': groupOption.groupLabel,
          'aria-selected': isGroupSelected,
          ref: isGroupHighlighted ? highlightRef : undefined
        }
      })
      const groupsOptionProps: OptionProps<any, any, any>[] = []
      const gOptions = groupOption.options
      for (let i = 0; i < gOptions.length; i++) {
        const opt = gOptions[i]
        if (isGroupSelectOption(opt)) {
          checkGroupOptions(opt, groupsOptionProps, depth + 1)
        } else {
          groupsOptionProps.push({
            depth: depth + 1,
            isDisabled: isDisabled ? isDisabled(opt, selectState) : false,
            isHighlighted: highlightIndex === pos,
            // may need to make lookup table instead of using array includes
            isSelected: selectedCheck(opt),
            onDeselect: (closeMenu) =>
              dispatch(makeOptionDeselectedAction({ closeMenu, option: opt })),
            onSelect: (closeMenu) =>
              dispatch(makeOptionSelectedAction({ closeMenu, option: opt })),
            option: opt,
            spreadProps: {
              'aria-label': opt.label,
              'aria-selected': highlightIndex === pos,
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
        checkGroupOptions(option as any, returnedDisplayOptions)
      } else {
        returnedDisplayOptions.push({
          depth: 0,
          isDisabled: isDisabled ? isDisabled(option, selectState) : false,
          isHighlighted: highlightIndex === pos,
          isSelected: selectedCheck(option),
          onDeselect: (closeMenu) =>
            dispatch(makeOptionDeselectedAction({ closeMenu, option })),
          onSelect: (closeMenu) =>
            dispatch(makeOptionSelectedAction({ closeMenu, option })),
          option: option,
          spreadProps: {
            'aria-label': option.label,
            'aria-selected': highlightIndex === pos,
            ref: highlightIndex === pos ? highlightRef : undefined
          }
        })
        pos++
      }
    }

    return returnedDisplayOptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDisabled,
    canSelectGroup,
    highlightIndex,
    selectedOptions,
    dispatch,
    visibleOptions
  ])

  const firstRun = useRef(true)
  useSafeLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (selectedOptions && selectedOptions.length > 0 && options.onSelect) {
      options.onSelect(selectedOptions[selectedOptions.length - 1])
    }
  }, [selectedOptions])

  return {
    dispatchAction: (action: Action<SelectAction, object>) => dispatch(action),
    dispatchAppendOptions: (opts) => dispatch(makeAppendOptionsAction(opts)),
    dispatchStateChange: (action) => dispatch(makeSetStateAction(action)),
    displayOptions,
    dropdownContainerProps: {
      onMouseEnter: () => {
        isMouseInsideDropdown.current = true
      },
      onMouseLeave: () => {
        isMouseInsideDropdown.current = false
      },
      ref: setDropdownContainer as any
    },
    highlightCompletionPercent: getHighlightCompletionPercentage(
      displayOptions,
      highlightIndex
    ),
    highlightIndex,
    inputProps: {
      onChange: (event: ChangeEvent<E>) =>
        dispatch(makeInputChangeAction({ showMenu: true, value: event.target.value })),
      onKeyDown: keydownHandler,
      ref: inputRef as MutableRefObject<E>,
      value: selectState.inputState.value
    },
    search: () => {
      if (onSearch) {
        onSearch(selectState.inputState.value)
      }
    },
    selectedOptions,
    state: selectState
  }
}
