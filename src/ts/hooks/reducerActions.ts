import { ExtObj, OptionType } from '../types/optionTypes'

export interface SelectState<T, G = T, O extends ExtObj = ExtObj> {
  highlightIndex: number
  inputState: {
    isInputFocused: boolean
    showMenu: boolean
    value: string
  }
  options: OptionType<T, G, O>[]
  /**
   * This is not the value on the actual input, but the value that can be used
   * to manually filter/supply the options. E.g., when the user selects a value
   * in a non-multi select the input value will be the selected value, however
   * most of the time it is desirable to show the previously available options
   * when the input was empty ('').
   *
   * Effectively this value will be the same as the inputState.value except when
   * a value has been selected, and it exactly matches the selected label where
   * it will be an empty string (if the user then types)
   */
  pseudoInputValue: string
  selectedOptions: OptionType<T, G, O>[]
  visibleOptions: OptionType<T, G, O>[]
}

export const initialDefaultSelectState: SelectState<any, any, any> = {
  // This is actually dependent on the allowNoHighlight option (if true, this -1, else 0)
  // this is handled in the reducer initialization
  highlightIndex: -1,
  inputState: {
    isInputFocused: false,
    showMenu: false,
    value: ''
  },
  options: [],
  pseudoInputValue: '',
  selectedOptions: [],
  visibleOptions: []
}

export type SelectAction =
  | 'INPUT_CHANGE'
  | 'INCREMENT_HIGHLIGHT_INDEX'
  | 'DECREMENT_HIGHLIGHT_INDEX'
  | 'OPTION_SELECTED'
  | 'OPTION_DESELECTED'
  | 'SET_OPTIONS'
  | 'APPEND_OPTIONS'
  | 'SET_VISIBLE_OPTIONS'
  | 'SET_STATE'
  | 'SET_MENU_OPEN'
  | 'SET_INPUT_FOCUSED'

type ValueAsKey<Keys extends string> = { [K in Keys]: K }

export const SELECT_ACTIONS: ValueAsKey<SelectAction> = {
  APPEND_OPTIONS: 'APPEND_OPTIONS',
  DECREMENT_HIGHLIGHT_INDEX: 'DECREMENT_HIGHLIGHT_INDEX',
  INCREMENT_HIGHLIGHT_INDEX: 'INCREMENT_HIGHLIGHT_INDEX',
  INPUT_CHANGE: 'INPUT_CHANGE',
  OPTION_DESELECTED: 'OPTION_DESELECTED',
  OPTION_SELECTED: 'OPTION_SELECTED',
  SET_INPUT_FOCUSED: 'SET_INPUT_FOCUSED',
  SET_MENU_OPEN: 'SET_MENU_OPEN',
  SET_OPTIONS: 'SET_OPTIONS',
  SET_STATE: 'SET_STATE',
  SET_VISIBLE_OPTIONS: 'SET_VISIBLE_OPTIONS'
} as const

// Just used internally to create the various actions
export type Action<T extends SelectAction, Payload extends object> = {
  payload: Payload
  type: T
}

// creates a type predicate - hacked the typing to make possible
function isType<T extends SelectAction, Act extends Action<T, object>>(
  type: T
): (action: Action<SelectAction, object>) => action is Act {
  return ((action: any) => action.type === type) as any
}

export type InputChangeAction = Action<
  'INPUT_CHANGE',
  {
    value: string
    /**
     * There are many times that the input value will change, but it is
     * not b/c the field is actually focused, so need to opt into actually
     * displaying the menu on input change.
     *
     * NOTE: useSelect hook will set this to true if the input is focused
     * @default false
     */
    showMenu?: boolean
  }
>
export const isInputChangeAction = isType<'INPUT_CHANGE', InputChangeAction>(
  SELECT_ACTIONS.INPUT_CHANGE
)
export function makeInputChangeAction(
  payload: InputChangeAction['payload']
): InputChangeAction {
  return {
    payload,
    type: SELECT_ACTIONS.INPUT_CHANGE
  }
}

//
// OPTION_SELECTED
//
export type OptionSelectedAction<T, G = T, O extends ExtObj = ExtObj> = Action<
  'OPTION_SELECTED',
  {
    option: OptionType<T, G, O>
    /**
     * @default to whatever is provided in the reducer options (when multiSelect = false, single select = true)
     */
    closeMenu?: boolean
    /**
     * When multiSelect is true, by default, the input value will be reset to an empty string.
     * @default false (i.e., clear the input)
     */
    ignoreClearInputOnMultiSelect?: boolean
  }
>
export const isOptionSelectedAction = isType<
  'OPTION_SELECTED',
  OptionSelectedAction<any, any>
>(SELECT_ACTIONS.OPTION_SELECTED)
export function makeOptionSelectedAction<T, G, O extends ExtObj>(
  payload: OptionSelectedAction<T, G, O>['payload']
): OptionSelectedAction<T, G, O> {
  return {
    payload,
    type: SELECT_ACTIONS.OPTION_SELECTED
  }
}

//
// OPTION_DESELECTED
//

export type OptionDeselectedAction<T, G, O extends ExtObj> = Action<
  'OPTION_DESELECTED',
  {
    /** The option to remove from the selectedOptions array. */
    option: OptionType<T, G, O>
    /**
     * When deselecting an option the menu will NOT be closed by default, however
     * this can be supplied to override that behavior.
     * @default false
     */
    closeMenu?: boolean
  }
>
export const isOptionDeselectedAction = isType<
  'OPTION_DESELECTED',
  OptionDeselectedAction<any, any, ExtObj>
>(SELECT_ACTIONS.OPTION_DESELECTED)
export function makeOptionDeselectedAction<T, G, O extends ExtObj>(
  payload: OptionDeselectedAction<T, G, O>['payload']
): OptionDeselectedAction<T, G, O> {
  return {
    payload,
    type: SELECT_ACTIONS.OPTION_DESELECTED
  }
}

//
// INCREMENT_HIGHLIGHT_INDEX
//

export type IncrementHighlightIndexAction = Action<
  'INCREMENT_HIGHLIGHT_INDEX',
  {
    value: number
  }
>
export const isIncrementHighlightIndexAction = isType<
  'INCREMENT_HIGHLIGHT_INDEX',
  IncrementHighlightIndexAction
>(SELECT_ACTIONS.INCREMENT_HIGHLIGHT_INDEX)
export function makeIncrementHighlightIndexAction(
  incrementBy = 1
): IncrementHighlightIndexAction {
  return {
    payload: {
      value: incrementBy
    },
    type: SELECT_ACTIONS.INCREMENT_HIGHLIGHT_INDEX
  }
}

//
// DECREMENT_HIGHLIGHT_INDEX
//

export type DecrementHighlightIndexAction = Action<
  'DECREMENT_HIGHLIGHT_INDEX',
  {
    value: number
  }
>
export const isDecrementHighlightIndexAction = isType<
  'DECREMENT_HIGHLIGHT_INDEX',
  DecrementHighlightIndexAction
>(SELECT_ACTIONS.DECREMENT_HIGHLIGHT_INDEX)

export function makeDecrementHighlightIndexAction(
  decrementBy = 1
): DecrementHighlightIndexAction {
  return {
    payload: {
      value: decrementBy
    },
    type: SELECT_ACTIONS.DECREMENT_HIGHLIGHT_INDEX
  }
}

//
// SET_OPTIONS
//

export type SetOptionsAction = Action<
  'SET_OPTIONS',
  {
    options: OptionType<any, any, any>[]
    /**
     * Attempts to find the last highlight index before the set operation. This is
     * useful for when the highlight index is being reset.
     * @default false
     */
    attemptFindLastHighlightIndex?: boolean
    /**
     * By default, the SET_OPTIONS action will reset the highlight index;
     * this can be avoided by setting this to true. (Consider using APPEND_OPTIONS
     * action instead.)
     * @default false (i.e., do not ignore reset)
     */
    ignoreHighlightIndexReset?: boolean
  }
>
export const isSetOptionsAction = isType<'SET_OPTIONS', SetOptionsAction>(
  SELECT_ACTIONS.SET_OPTIONS
)
export function makeSetOptionsAction(
  payload: SetOptionsAction['payload']
): SetOptionsAction {
  return {
    payload,
    type: SELECT_ACTIONS.SET_OPTIONS
  }
}

//
// APPEND_OPTIONS
//

export type AppendOptionsAction<T = any, G = T> = Action<
  'APPEND_OPTIONS',
  {
    options: OptionType<T, G>[]
  }
>
export const isAppendOptionsAction = isType<'APPEND_OPTIONS', AppendOptionsAction>(
  SELECT_ACTIONS.APPEND_OPTIONS
)
export function makeAppendOptionsAction(
  options: AppendOptionsAction['payload']['options']
): AppendOptionsAction {
  return {
    payload: {
      options
    },
    type: SELECT_ACTIONS.APPEND_OPTIONS
  }
}

//
// SET_INPUT_STATE
//
// export type SetInputStateAction<T, G = T> = Action<'SET_INPUT_STATE', {
//   value: Partial<SelectState<T, G>['inputState']>
// }>
// export function makeSetInputStateAction<T, G = T>()

//
// SET_MENU_OPEN
//
export type SetMenuOpenAction = Action<
  'SET_MENU_OPEN',
  {
    open: boolean
  }
>
export const isSetMenuOpenAction = isType<'SET_MENU_OPEN', SetMenuOpenAction>(
  SELECT_ACTIONS.SET_MENU_OPEN
)
export function makeSetMenuOpenAction(open: boolean): SetMenuOpenAction {
  return {
    payload: {
      open
    },
    type: SELECT_ACTIONS.SET_MENU_OPEN
  }
}

//
// SET_INPUT_FOCUSED
//
export type SetInputFocusedAction = Action<
  'SET_INPUT_FOCUSED',
  {
    focused: boolean
    /**
     * @default defaults to the showMenuOnFocus option (which is true by default)
     */
    menuOpen?: boolean
  }
>
export const isSetInputFocusedAction = isType<'SET_INPUT_FOCUSED', SetInputFocusedAction>(
  SELECT_ACTIONS.SET_INPUT_FOCUSED
)
export function makeSetInputFocusedAction(
  focused: boolean,
  menuOpen?: boolean
): SetInputFocusedAction {
  return {
    payload: {
      focused,
      menuOpen
    },
    type: SELECT_ACTIONS.SET_INPUT_FOCUSED
  }
}

//
// SET_STATE
//

export type SetStateAction<T, G = T, O extends ExtObj = ExtObj> = Action<
  'SET_STATE',
  {
    /**
     * Allows for updating the state in any way.
     */
    setState: (state: SelectState<T, G, O>) => SelectState<T, G, O>
  }
>
export const isSetStateAction = isType<'SET_STATE', SetStateAction<any, any, any>>(
  SELECT_ACTIONS.SET_STATE
)
export function makeSetStateAction<T, G = T, O extends ExtObj = ExtObj>(
  setState: SetStateAction<T, G, O>['payload']['setState']
): SetStateAction<T, G, O> {
  return {
    payload: {
      setState
    },
    type: SELECT_ACTIONS.SET_STATE
  }
}
