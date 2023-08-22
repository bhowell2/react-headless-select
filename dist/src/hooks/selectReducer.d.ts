import { OptionEqualityCheck, OptionSelectedCheck, OptionsFilterFn } from '../utils/optionUtils';
import { Dispatch } from 'react';
import { Action, SelectAction, SelectState } from './reducerActions';
import { ExtObj, OptionType } from '../types/optionTypes';
type IsDisabledFn<T, G, O extends ExtObj> = (option: OptionType<T, G, O>, state: SelectState<T, G, O>) => boolean;
export interface UseSelectReducerOptions<T, G = T, O extends ExtObj = ExtObj> {
    /**
     * Allows for 'no-highlighting' to occur (i.e., highlightIndex = -1).
     *
     * Note: if this is true, it may seem to interact weirdly with cycleHighlightIndex
     * - where this will cause the index to go from 0 -> -1 -> max or max -> -1 -> 0.
     * @default false
     */
    allowNoHighlight?: boolean;
    /**
     * If the group options should be selectable.
     * @default false
     */
    canSelectGroup?: boolean;
    /** @default true when single selection, false when multiSelect */
    closeMenuOnSelection?: boolean;
    /**
     * When the highlight index reached the maximum or minimum value, it will
     * cycle to the other value (i.e., 0 -> max or max -> 0).
     *
     * Note: in the case of allowNoHighlight, this will go from 0 -> -1 -> max,
     * but then go from max -> 0 (skipping -1)
     * @default true
     */
    cycleHighlightIndex?: boolean;
    /**
     * Disables filtering the options (by label) when some text is input.
     * @default false (i.e., filter on text input)
     */
    disableFiltering?: boolean;
    /**
     * When the visibleOptions change (e.g., from typing in the input) an attempt
     * is made to find the last highlighted option in the new visible options array
     * and change the highlightIndex to the new index of the previously highlighted
     * option. Setting this to true will cause the highlight index to always be reset
     * when the visibleOptions change.
     *
     * @default false (i.e., recalculate highlight index on change)
     */
    disableRecalculateHighlightIndex?: boolean;
    /**
     * Disables selection of all items via click and/or highlight selection.
     * @default false (i.e., selection is NOT disabled)
     */
    disableSelection?: boolean;
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
    filterFn?: OptionsFilterFn<T, G, O> | null;
    /**
     * By default, when an item is selected and the input text matches
     * the label of the selected item, then filtering will not be done.
     */
    filterWhenSelected?: boolean;
    /**
     * Will be (deep) merged with defaultSelectState.
     * @default defaultSelectState
     */
    initialState?: Partial<SelectState<T, G, O>>;
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
        completelyRemoveSelectOnBackspace?: boolean;
    };
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
    isDisabled?: IsDisabledFn<T, G, O>;
    /**
     * Allows to override the default implementation which checks if an
     * option was by using a triple equal check on the option's value
     * (i.e., OptionType#value).
     *
     * NOTE: should be memoized.
     */
    isSelectedCheck?: OptionSelectedCheck<T, G>;
    /**
     * If multiple options should be allowed to be selected at a time.
     * @default false
     */
    multiSelect?: boolean;
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
    onStateChange?: (prevState: SelectState<T, G>, nextState: SelectState<T, G>, action: Action<SelectAction, Record<string, any>>) => SelectState<T, G> | undefined | null;
    /**
     * Provide function to determine if an option matches another option.
     * @default simple option.value === option.value check
     */
    optionEqualityCheck?: OptionEqualityCheck<T, G>;
    /** @default true (i.e., opens the menu when the input is focused)  */
    showMenuOnFocus?: boolean;
}
interface UseSelectReducerResult<T, G = T, O extends ExtObj = ExtObj> {
    dispatch: Dispatch<Action<SelectAction, object>>;
    /** Used for quick highlight item lookup. */
    highlightItem: OptionType<T, G, O>;
    selectState: SelectState<T, G, O>;
}
export declare function useSelectReducer<T, G = T, O extends ExtObj = ExtObj>(options: UseSelectReducerOptions<T, G, O>): UseSelectReducerResult<T, G, O>;
export {};
