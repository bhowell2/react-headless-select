import { ExtObj, OptionType } from '../types/optionTypes';
export interface SelectState<T, G = T, O extends ExtObj = ExtObj> {
    highlightIndex: number;
    inputState: {
        isInputFocused: boolean;
        showMenu: boolean;
        value: string;
    };
    options: OptionType<T, G, O>[];
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
    pseudoInputValue: string;
    selectedOptions: OptionType<T, G, O>[];
    visibleOptions: OptionType<T, G, O>[];
}
export declare const initialDefaultSelectState: SelectState<any, any, any>;
export type SelectAction = 'INPUT_CHANGE' | 'INCREMENT_HIGHLIGHT_INDEX' | 'DECREMENT_HIGHLIGHT_INDEX' | 'OPTION_SELECTED' | 'OPTION_DESELECTED' | 'SET_OPTIONS' | 'APPEND_OPTIONS' | 'SET_VISIBLE_OPTIONS' | 'SET_STATE' | 'SET_MENU_OPEN' | 'SET_INPUT_FOCUSED';
type ValueAsKey<Keys extends string> = {
    [K in Keys]: K;
};
export declare const SELECT_ACTIONS: ValueAsKey<SelectAction>;
export type Action<T extends SelectAction, Payload extends object> = {
    payload: Payload;
    type: T;
};
export type InputChangeAction = Action<'INPUT_CHANGE', {
    value: string;
    /**
     * There are many times that the input value will change, but it is
     * not b/c the field is actually focused, so need to opt into actually
     * displaying the menu on input change.
     *
     * NOTE: useSelect hook will set this to true if the input is focused
     * @default false
     */
    showMenu?: boolean;
}>;
export declare const isInputChangeAction: (action: Action<SelectAction, object>) => action is InputChangeAction;
export declare function makeInputChangeAction(payload: InputChangeAction['payload']): InputChangeAction;
export type OptionSelectedAction<T, G = T, O extends ExtObj = ExtObj> = Action<'OPTION_SELECTED', {
    option: OptionType<T, G, O>;
    /**
     * @default to whatever is provided in the reducer options (when multiSelect = false, single select = true)
     */
    closeMenu?: boolean;
    /**
     * When multiSelect is true, by default, the input value will be reset to an empty string.
     * @default false (i.e., clear the input)
     */
    ignoreClearInputOnMultiSelect?: boolean;
}>;
export declare const isOptionSelectedAction: (action: Action<SelectAction, object>) => action is OptionSelectedAction<any, any, ExtObj>;
export declare function makeOptionSelectedAction<T, G, O extends ExtObj>(payload: OptionSelectedAction<T, G, O>['payload']): OptionSelectedAction<T, G, O>;
export type OptionDeselectedAction<T, G, O extends ExtObj> = Action<'OPTION_DESELECTED', {
    /** The option to remove from the selectedOptions array. */
    option: OptionType<T, G, O>;
    /**
     * When deselecting an option the menu will NOT be closed by default, however
     * this can be supplied to override that behavior.
     * @default false
     */
    closeMenu?: boolean;
}>;
export declare const isOptionDeselectedAction: (action: Action<SelectAction, object>) => action is OptionDeselectedAction<any, any, ExtObj>;
export declare function makeOptionDeselectedAction<T, G, O extends ExtObj>(payload: OptionDeselectedAction<T, G, O>['payload']): OptionDeselectedAction<T, G, O>;
export type IncrementHighlightIndexAction = Action<'INCREMENT_HIGHLIGHT_INDEX', {
    value: number;
}>;
export declare const isIncrementHighlightIndexAction: (action: Action<SelectAction, object>) => action is IncrementHighlightIndexAction;
export declare function makeIncrementHighlightIndexAction(incrementBy?: number): IncrementHighlightIndexAction;
export type DecrementHighlightIndexAction = Action<'DECREMENT_HIGHLIGHT_INDEX', {
    value: number;
}>;
export declare const isDecrementHighlightIndexAction: (action: Action<SelectAction, object>) => action is DecrementHighlightIndexAction;
export declare function makeDecrementHighlightIndexAction(decrementBy?: number): DecrementHighlightIndexAction;
export type SetOptionsAction = Action<'SET_OPTIONS', {
    options: OptionType<any, any, any>[];
    /**
     * Attempts to find the last highlight index before the set operation. This is
     * useful for when the highlight index is being reset.
     * @default false
     */
    attemptFindLastHighlightIndex?: boolean;
    /**
     * By default, the SET_OPTIONS action will reset the highlight index;
     * this can be avoided by setting this to true. (Consider using APPEND_OPTIONS
     * action instead.)
     * @default false (i.e., do not ignore reset)
     */
    ignoreHighlightIndexReset?: boolean;
}>;
export declare const isSetOptionsAction: (action: Action<SelectAction, object>) => action is SetOptionsAction;
export declare function makeSetOptionsAction(payload: SetOptionsAction['payload']): SetOptionsAction;
export type AppendOptionsAction<T = any, G = T> = Action<'APPEND_OPTIONS', {
    options: OptionType<T, G>[];
}>;
export declare const isAppendOptionsAction: (action: Action<SelectAction, object>) => action is AppendOptionsAction<any, any>;
export declare function makeAppendOptionsAction(options: AppendOptionsAction['payload']['options']): AppendOptionsAction;
export type SetMenuOpenAction = Action<'SET_MENU_OPEN', {
    open: boolean;
}>;
export declare const isSetMenuOpenAction: (action: Action<SelectAction, object>) => action is SetMenuOpenAction;
export declare function makeSetMenuOpenAction(open: boolean): SetMenuOpenAction;
export type SetInputFocusedAction = Action<'SET_INPUT_FOCUSED', {
    focused: boolean;
    /**
     * @default defaults to the showMenuOnFocus option (which is true by default)
     */
    menuOpen?: boolean;
}>;
export declare const isSetInputFocusedAction: (action: Action<SelectAction, object>) => action is SetInputFocusedAction;
export declare function makeSetInputFocusedAction(focused: boolean, menuOpen?: boolean): SetInputFocusedAction;
export type SetStateAction<T, G = T, O extends ExtObj = ExtObj> = Action<'SET_STATE', {
    /**
     * Allows for updating the state in any way.
     */
    setState: (state: SelectState<T, G, O>) => SelectState<T, G, O>;
}>;
export declare const isSetStateAction: (action: Action<SelectAction, object>) => action is SetStateAction<any, any, any>;
export declare function makeSetStateAction<T, G = T, O extends ExtObj = ExtObj>(setState: SetStateAction<T, G, O>['payload']['setState']): SetStateAction<T, G, O>;
export {};
