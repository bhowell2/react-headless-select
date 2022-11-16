import { OptionType } from './useSelect';
/**
 * Calculates the selectable option length, respecting the canSelectGroup option
 * (which increments the length by 1 per group).
 */
export declare function getOptionsLength(options?: OptionType<unknown>[], canSelectGroup?: boolean): number;
/**
 * Retrieves the option at the specified index - respecting grouping.
 * Usually this will return a SelectOption, but if GroupSelect is enabled then a
 * GroupSelectOption may be returned.
 */
export declare function getOptionAtIndex<T, G = T>(options: OptionType<T, G>[], index: number, canSelectGroup?: boolean): OptionType<T, G> | null;
/**
 * Goes through the options and returns the index of the provided
 * option if it exists in the list; -1 is returned if the option
 * is not found in the array.
 */
export declare function getOptionIndex<T, G = T>(options: OptionType<T, G>[], optionToFind: OptionType<T, G>, canSelectGroup?: boolean): number;
