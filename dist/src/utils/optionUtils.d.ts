import { ExtObj, GroupSelectOption, OptionType, SelectOption } from '../types/optionTypes';
export declare function isGroupSelectOption<T, G = T, O extends ExtObj = ExtObj>(option: OptionType<T, G, O>): option is GroupSelectOption<T, G, O>;
/**
 * Used to determine if two options are the same. This is used in some
 * reconciliation-type processes (e.g., finding last highlight index in
 * a new array of options).
 */
export type OptionEqualityCheck<T, G = T, O extends ExtObj = ExtObj> = (a: OptionType<T, G, O>, b: OptionType<T, G, O>) => boolean;
export declare const defaultOptionEqualityCheck: OptionEqualityCheck<any>;
/** Passed the current input value and filters the available options as desired. */
export type OptionsFilterFn<T, G = T, O extends ExtObj = ExtObj> = (val: string, options: OptionType<T, G, O>[]) => OptionType<T, G, O>[];
type OptTypeOrSelectOptType<T, G = T, O extends ExtObj = ExtObj> = OptionType<T, G, O> | SelectOption<T, O>;
/**
 * Basic matching function that uses indexOf to match the label or groupLabel.
 * If the groupLabel matches then all GroupSelectionOption#options will be returned,
 * otherwise each group's options will be checked and if any match then the
 * GroupSelectOption will be returned with only the matching options.
 * */
export declare function indexOfFilterMatch<T, G = T, Ext extends ExtObj = ExtObj>(val: string, options: OptTypeOrSelectOptType<T, G, Ext>[]): OptTypeOrSelectOptType<T, G, Ext>[];
export declare function textMatchesSelectedOptions(text: string, selectedOptions: OptionType<unknown>[]): boolean;
/**
 * Calculates the selectable option length, respecting the canSelectGroup option
 * (which increments the length by 1 per group).
 */
export declare function getOptionsLength(options?: OptionType<unknown>[], canSelectGroup?: boolean): number;
export declare function flattenOptions<T, G>(options: OptionType<T, G>[], canSelectGroup: boolean): OptionType<T, G>[];
/**
 * Retrieves the option at the specified index - respecting grouping.
 * Usually this will return a SelectOption, but if GroupSelect is enabled then a
 * GroupSelectOption may be returned.
 */
export declare function getOptionAtIndex<T, G = T, O extends ExtObj = ExtObj>(options: OptionType<T, G, O>[], index: number, canSelectGroup?: boolean): OptionType<T, G, O> | null;
/**
 * Goes through the options and returns the index of the provided
 * option if it exists in the list; -1 is returned if the option
 * is not found in the array.
 */
export declare function getOptionIndex<T, G = T>(options: OptionType<T, G>[], optionToFind: OptionType<T, G>, canSelectGroup?: boolean, equalityCheck?: OptionEqualityCheck<T, G>): number;
export type OptionSelectedCheck<T, G = T, O extends ExtObj = ExtObj> = (option: OptionType<T, G, O>, selectedOptions: OptionType<T, G, O>[], equalityCheck?: OptionEqualityCheck<T, G, O>) => boolean;
export declare const defaultIsOptionSelectedCheck: OptionSelectedCheck<any>;
export {};
