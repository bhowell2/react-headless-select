import { OptionType, UseSelectOptionsWithGroupSelect, UseSelectOptionsWithoutGroupSelect, UseSelectResult } from './useSelect';
export interface FetchResult<T, G = T> {
    options: OptionType<T, G>[];
    /**
     * If there are more options that can be fetched for the current input value.
     * @default false (i.e., there no more options to fetch)
     */
    hasMore?: boolean;
    /**
     * By default, this will be handled automatically based on the input
     * value and the paging value. I.e., when the input value changes then
     * the options will be reset, but when the fetch request is made for
     * pagination the returned options will be appended.
     *
     * Undefined  - use the default
     * false      - do not reset, regardless of default
     * true       - reset all options
     *
     * @default undefined
     */
    reset?: boolean;
}
export interface FetchOptionsArgs<T, G = T> {
    /**
     * Whatever the inputValue currently is. Every change in the inputValue will
     * result in a call to 'fetchOptions'. Because the 'resultsFn' is provided the
     * user can debounce calls to the resultsFn.
     *
     * Note: whenever the inputValue changes, the page is reset to 0.
     */
    inputValue: string;
    /**
     * Whenever the inputValue changes the page is reset to 0 and whenever the
     * user increments the highlightIndex 'fetchOptions' will be called when
     * the highlightIndex increases past the 'fetchNextPercentage'.
     *
     * Note: whenever the inputValue changes, the page is reset to 0.
     */
    page: number;
    /**
     * Function that should be called with the results of the query. By default,
     * if the query is from a change in the inputValue then the options will be
     * reset with the result and if the query is from an increase in the page
     * then the results will be appended.
     *
     * It should be noted that this function captures the inputValue and therefore
     * if the latest function is not called it will not match up with the inputValue.
     */
    resultsFn: (results: Promise<FetchResult<T, G>>) => void;
}
declare type UseSelectOptionsOmittedOptions<T, G> = Omit<UseSelectOptionsWithoutGroupSelect<T>, 'options'> | Omit<UseSelectOptionsWithGroupSelect<T, G>, 'options'>;
declare type FetchNextOptions = {
    /**
     * If supplied, will fetch more at the highlightCompletionPercentage.
     * Acceptable range is 0.01 - 1. A value of 0 will be treated as
     */
    fetchNextPercentage?: number;
    fetchNextWithRemaining?: never;
} | {
    fetchNextPercentage?: never;
    /**
     * If supplied will call fetchOptions when the number of options remaining
     * (after the highlightIndex) is less than or equal to this amount. (e.g.,
     * if this value is 3 and there are 10 options, when the highlightIndex
     * becomes 7 fetchOptions will be called).
     */
    fetchNextWithRemaining?: number;
};
export declare type UseAsyncSelectOptions<T, G = T> = UseSelectOptionsOmittedOptions<T, G> & {
    /**
     * Retrieves the options to be supplied to useSelect.
     * Initially the signature of this may seem weird, but it allows
     * the user much more control of the actual fetch operation (e.g.,
     * debouncing). The function that is supplied can be called with
     * the result of the query to update the options.
     * */
    fetchOptions: (options: FetchOptionsArgs<T, G>) => void;
    /**
     * If the options should be fetched when the component mounts, rather
     * than the first time that the input is focused.
     */
    fetchOnMount?: boolean;
    /**
     * Initial options to display to the user, will not call fetchOptions
     * on initial mount/focus if this is supplied (will call fetchOptions
     * when the user increases the highlight index).
     */
    initialOptions?: OptionType<T, G>[];
} & /**
   * Only one or the other of fetchNextPercentage or fetchNextWithRemaining can
   * be supplied
   */ FetchNextOptions;
export interface UseAsyncSelectResult<T, G = T> extends UseSelectResult<T, G> {
    /** True when fetchOptions is called until it returns a result. False otherwise. */
    isFetching: boolean;
}
/**
 * Wrapper around useSelect that provides common async functionality.
 */
export declare function useAsyncSelect<T, G = T>(options: UseAsyncSelectOptions<T, G>): UseAsyncSelectResult<T, G>;
export {};
