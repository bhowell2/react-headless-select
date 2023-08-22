// import { OptionType, useSelect, UseSelectOptions, UseSelectResult } from './useSelect'
// import { useCallback, useEffect, useRef, useState } from 'react'
// import { useLatestRef } from './internal/useLatestRef'
//
// export interface FetchResult<T, G = T> {
//   options: OptionType<T, G>[]
//   /**
//    * If there are more options that can be fetched for the current input value.
//    * @default false (i.e., there no more options to fetch)
//    */
//   hasMore?: boolean
//   /**
//    * By default, this will be handled automatically based on the input
//    * value and the paging value. I.e., when the input value changes then
//    * the options will be reset, but when the fetch request is made for
//    * pagination the returned options will be appended.
//    *
//    * Undefined  - use the default
//    * false      - do not reset, regardless of default
//    * true       - reset all options
//    *
//    * @default undefined
//    */
//   reset?: boolean
// }
//
// export interface FetchOptionsArgs<T, G = T> {
//   /**
//    * Whatever the inputValue currently is. Every change in the inputValue will
//    * result in a call to 'fetchOptions'. Because the 'resultsFn' is provided the
//    * user can debounce calls to the resultsFn.
//    *
//    * Note: whenever the inputValue changes, the page is reset to 0.
//    */
//   inputValue: string
//   /**
//    * Whenever the inputValue changes the page is reset to 0 and whenever the
//    * user increments the highlightIndex 'fetchOptions' will be called when
//    * the highlightIndex increases past the 'fetchNextPercentage'.
//    *
//    * Note: whenever the inputValue changes, the page is reset to 0.
//    */
//   page: number
//   /**
//    * Function that should be called with the results of the query. By default,
//    * if the query is from a change in the inputValue then the options will be
//    * reset with the result and if the query is from an increase in the page
//    * then the results will be appended.
//    *
//    * It should be noted that this function captures the inputValue and therefore
//    * if the latest function is not called it will not match up with the inputValue.
//    */
//   resultsFn: (results: Promise<FetchResult<T, G>>) => void
// }
//
// // Need to do this b/c omitting 'options' from the union of UseSelectOptions
// // does not correctly type the union
// // type UseSelectOptionsOmittedOptions<T, G> =
// //   | Omit<UseSelectOptionsWithoutGroupSelect<T>, 'options'>
// //   | Omit<UseSelectOptionsWithGroupSelect<T, G>, 'options'>
//
// type FetchNextOptions =
//   | {
//       /**
//        * If supplied, will fetch more at the highlightCompletionPercentage.
//        * Acceptable range is 0.01 - 1. A value of 0 will be treated as
//        */
//       fetchNextPercentage?: number
//       fetchNextWithRemaining?: never
//     }
//   | {
//       fetchNextPercentage?: never
//       /**
//        * If supplied will call fetchOptions when the number of options remaining
//        * (after the highlightIndex) is less than or equal to this amount. (e.g.,
//        * if this value is 3 and there are 10 options, when the highlightIndex
//        * becomes 7 fetchOptions will be called).
//        */
//       fetchNextWithRemaining?: number
//     }
//
// export type UseAsyncSelectOptions<T, G = T> = UseSelectOptions<T, G> & {
//   /**
//    * Retrieves the options to be supplied to useSelect.
//    * Initially the signature of this may seem weird, but it allows
//    * the user much more control of the actual fetch operation (e.g.,
//    * debouncing). The function that is supplied can be called with
//    * the result of the query to update the options.
//    * */
//   fetchOptions: (options: FetchOptionsArgs<T, G>) => void
//   /**
//    * If the options should be fetched when the component mounts, rather
//    * than the first time that the input is focused.
//    */
//   fetchOnMount?: boolean
//   // /**
//   //  * Initial options to display to the user, will not call fetchOptions
//   //  * on initial mount/focus if this is supplied (will call fetchOptions
//   //  * when the user increases the highlight index).
//   //  */
//   // initialOptions?: OptionType<T, G>[]
// } & /**
//    * Only one or the other of fetchNextPercentage or fetchNextWithRemaining can
//    * be supplied
//    */ FetchNextOptions
//
// export interface UseAsyncSelectResult<T, G = T> extends UseSelectResult<T, G> {
//   /** True when fetchOptions is called until it returns a result. False otherwise. */
//   isFetching: boolean
// }
//
// interface InternalState<T, G> {
//   hasMore: boolean
//   // internalOptions: OptionType<T, G>[]
//   isFetching: boolean
//   /**
//    * Page is incremented when fetchNextPercentage/fetchNextWithRemaining is reached
//    * and page is reset to 0 when the input changes (from typing or selection).
//    */
//   page: number
// }
//
// /**
//  * Wrapper around useSelect that provides common async functionality.
//  */
// export function useAsyncSelect<T, G = T>(
//   options: UseAsyncSelectOptions<T, G>
// ): UseAsyncSelectResult<T, G> {
//   const {
//     fetchNextPercentage,
//     fetchNextWithRemaining,
//     fetchOnMount = false,
//     fetchOptions
//     // initialOptions = []
//   } = options
//   const [internalState, setInternalState] = useState<InternalState<T, G>>({
//     hasMore: true,
//     // internalOptions: initialOptions,
//     isFetching: false,
//     page: 0
//   })
//   // manages the options here
//   const useSelectResult = useSelect<T, G>({
//     ...options,
//     disableFiltering: true
//     // options: internalState.internalOptions
//   })
//   const stateFetchValRef = useLatestRef({
//     fetchOptions,
//     inputValue: useSelectResult.inputProps.value,
//     internalState
//   })
//
//   const internalFetchOptions = useCallback((page: number) => {
//     const capturedInputVal = stateFetchValRef.current.inputValue
//     const resultsFn: FetchOptionsArgs<T, G>['resultsFn'] = (result) => {
//       setInternalState((curState) => ({ ...curState, isFetching: true, page }))
//       result
//         .then((res) => {
//           // we need to check if the current input value is the same as the capturedInputVal
//           if (capturedInputVal === stateFetchValRef.current.inputValue) {
//             // if page > 0 we append, unless res.reset is true
//             const shouldAppend = page > 0 && !res.reset
//             setInternalState((curState) => ({
//               ...curState,
//               hasMore: !!res.hasMore,
//               // internalOptions: shouldAppend
//               //   ? [...curState.internalOptions, ...res.options]
//               //   : res.options,
//               isFetching: false
//             }))
//           } // captured input value is not the same as current, so more results should be coming?
//           // TODO: implement rudimentary caching for this? maybe no need as the user
//           //  could use react-query or something for this and manage themselves
//         })
//         .catch(() => {
//           // what to do with error?
//           setInternalState((curState) => ({ ...curState, isFetching: false }))
//         })
//     }
//     stateFetchValRef.current.fetchOptions({
//       inputValue: stateFetchValRef.current.inputValue,
//       page,
//       resultsFn
//     })
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])
//
//   useEffect(() => {
//     if (fetchOnMount) {
//       internalFetchOptions(0)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])
//
//   // To avoid running on mount
//   const isFirstRunRef = useRef(true)
//   useEffect(() => {
//     const fetchPercentageReached =
//       fetchNextPercentage !== undefined &&
//       fetchNextPercentage > 0 &&
//       fetchNextPercentage <= 1 &&
//       useSelectResult.highlightCompletionPercent >= fetchNextPercentage
//     const fetchNextWithRemainingReached =
//       fetchNextWithRemaining !== undefined &&
//       fetchNextWithRemaining >=
//         useSelectResult.state.visibleOptions.length - useSelectResult.highlightIndex
//     const reachedEnd =
//       useSelectResult.state.visibleOptions.length - 1 === useSelectResult.highlightIndex
//     if (
//       !isFirstRunRef.current &&
//       internalState.hasMore &&
//       useSelectResult.state.inputState.showMenu &&
//       (fetchPercentageReached || fetchNextWithRemainingReached || reachedEnd) &&
//       !internalState.isFetching
//     ) {
//       internalFetchOptions(internalState.page + 1)
//     }
//     isFirstRunRef.current = false
//   }, [
//     useSelectResult.highlightCompletionPercent,
//     useSelectResult.state.inputState.showMenu,
//     fetchNextPercentage,
//     internalFetchOptions,
//     internalState.hasMore,
//     internalState.isFetching,
//     useSelectResult.highlightIndex,
//     fetchNextWithRemaining
//   ])
//
//   useEffect(() => {
//     if (!isFirstRunRef.current) {
//       internalFetchOptions(0)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [useSelectResult.inputProps.value])
//
//   return {
//     ...useSelectResult,
//     isFetching: internalState.isFetching
//   }
// }
export {}
