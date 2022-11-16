"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAsyncSelect = void 0;
const useSelect_1 = require("./useSelect");
const react_1 = require("react");
const useCurrentValueRef_1 = require("./internal/useCurrentValueRef");
/**
 * Wrapper around useSelect that provides common async functionality.
 */
function useAsyncSelect(options) {
    const { fetchOnMount = false, fetchOptions, fetchNextPercentage, fetchNextWithRemaining, initialOptions = [] } = options;
    const [internalState, setInternalState] = (0, react_1.useState)({
        hasMore: true,
        internalOptions: initialOptions,
        isFetching: false,
        page: 0
    });
    // manages the options here
    const useSelectResult = (0, useSelect_1.useSelect)(Object.assign(Object.assign({}, options), { disableFiltering: true, options: internalState.internalOptions }));
    const stateFetchValRef = (0, useCurrentValueRef_1.useCurrentValueRef)({
        fetchOptions,
        inputValue: useSelectResult.inputProps.value,
        internalState
    });
    const internalFetchOptions = (0, react_1.useCallback)((page = 0) => {
        const capturedInputVal = stateFetchValRef.current.inputValue;
        const resultsFn = (result) => {
            setInternalState((curState) => (Object.assign(Object.assign({}, curState), { isFetching: true })));
            result
                .then((res) => {
                // we need to check if the current input value is the same as the capturedInputVal
                if (capturedInputVal === stateFetchValRef.current.inputValue) {
                    // if page > 0 we append, unless res.reset is true
                    const shouldAppend = page > 0 && !res.reset;
                    setInternalState((curState) => (Object.assign(Object.assign({}, curState), { hasMore: !!res.hasMore, internalOptions: shouldAppend
                            ? [...curState.internalOptions, ...res.options]
                            : res.options, isFetching: false })));
                } // captured input value is not the same as current, so more results should be coming?
                // TODO: implement rudimentary caching for this? maybe no need as the user
                //  could use react-query or something for this and manage themselves
            })
                .catch(() => {
                // what to do with error?
                setInternalState((curState) => (Object.assign(Object.assign({}, curState), { isFetching: false })));
            });
        };
        stateFetchValRef.current.fetchOptions({
            inputValue: stateFetchValRef.current.inputValue,
            page,
            resultsFn
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    (0, react_1.useEffect)(() => {
        if (fetchOnMount) {
            internalFetchOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // To avoid running on mount
    const isFirstRunRef = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        if (!isFirstRunRef.current &&
            internalState.hasMore &&
            useSelectResult.showMenu &&
            ((fetchNextPercentage !== undefined &&
                fetchNextPercentage > 0 &&
                fetchNextPercentage <= 1 &&
                useSelectResult.highlightCompletionPercent >= fetchNextPercentage) ||
                (fetchNextWithRemaining !== undefined &&
                    fetchNextWithRemaining >=
                        internalState.internalOptions.length - useSelectResult.highlightIndex) ||
                internalState.internalOptions.length - 1 === useSelectResult.highlightIndex) &&
            !internalState.isFetching) {
            internalFetchOptions(internalState.page + 1);
        }
        isFirstRunRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        useSelectResult.highlightCompletionPercent,
        useSelectResult.showMenu,
        fetchNextPercentage,
        internalFetchOptions,
        internalState.hasMore,
        internalState.internalOptions.length,
        internalState.isFetching,
        useSelectResult.highlightIndex,
        fetchNextWithRemaining
    ]);
    (0, react_1.useEffect)(() => {
        if (!isFirstRunRef.current) {
            internalFetchOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useSelectResult.inputProps.value]);
    return Object.assign(Object.assign({}, useSelectResult), { isFetching: internalState.isFetching });
}
exports.useAsyncSelect = useAsyncSelect;
