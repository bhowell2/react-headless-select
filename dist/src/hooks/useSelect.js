"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelect = exports.getDefaultOptions = void 0;
const react_1 = require("react");
const useLatestRef_1 = require("./internal/useLatestRef");
const useScrollIntoView_1 = require("./useScrollIntoView");
const noop_1 = require("../utils/noop");
const selectReducer_1 = require("./selectReducer");
const reducerActions_1 = require("./reducerActions");
const elementUtils_1 = require("../utils/elementUtils");
const optionUtils_1 = require("../utils/optionUtils");
const usePreviousRef_1 = require("./internal/usePreviousRef");
const useSafeLayoutEffect_1 = require("./internal/useSafeLayoutEffect");
const wrapFunction_1 = require("../utils/wrapFunction");
function getHighlightCompletionPercentage(options, highlightIndex) {
    if (options.length === 0 || highlightIndex === options.length - 1)
        return 1;
    if (highlightIndex <= 0)
        return 0;
    return highlightIndex / options.length;
}
function getDefaultOptions(options) {
    return Object.assign(Object.assign({ allowNoHighlight: false, closeMenuOnSelection: !options.multiSelect, cycleHighlightIndex: true, filterFn: optionUtils_1.indexOfFilterMatch, isSelectedCheck: optionUtils_1.defaultIsOptionSelectedCheck, optionEqualityCheck: optionUtils_1.defaultOptionEqualityCheck, showMenuOnFocus: true }, options), { inputOptions: Object.assign({ completelyRemoveSelectOnBackspace: true }, options.inputOptions) });
}
exports.getDefaultOptions = getDefaultOptions;
function useSelect(options) {
    const useSelectOptions = getDefaultOptions(options);
    const { canSelectGroup, isDisabled, isSelectedCheck, multiSelect, onScroll, onSearch, optionEqualityCheck, scrollOptions, showMenuOnFocus, value } = useSelectOptions;
    const inputRef = (0, react_1.useRef)();
    const isMouseInsideDropdown = (0, react_1.useRef)(false);
    /*
     * There's an edge case here where if a
     * */
    useSelectOptions.onStateChange = (0, wrapFunction_1.wrapFunction)(useSelectOptions.onStateChange, (prevState, nextState) => {
        if (prevState.inputState.showMenu &&
            !nextState.inputState.showMenu &&
            isMouseInsideDropdown.current) {
            isMouseInsideDropdown.current = false;
        }
        return nextState;
    });
    const { dispatch, selectState } = (0, selectReducer_1.useSelectReducer)(useSelectOptions);
    (0, react_1.useEffect)(() => {
        if (value !== undefined && selectState.inputState.value !== value) {
            dispatch((0, reducerActions_1.makeInputChangeAction)({ showMenu: selectState.inputState.isInputFocused, value }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    const { highlightIndex, selectedOptions, visibleOptions } = selectState;
    const keydownHandler = (event) => {
        // default is only prevented for the case statements, otherwise want the default to bubble up
        // (e.g., maybe user uses ctrl-p or ctrl-r)
        if (event.shiftKey) {
            // if shift key is held do not highlight
            return;
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
            return;
        }
        switch (event.key) {
            case 'Backspace':
                const prevInputValue = selectState.inputState.value;
                if (multiSelect && prevInputValue === '' && selectedOptions.length > 0) {
                    // Remove last selected element in multi-select case (when input is empty).
                    event.preventDefault();
                    dispatch((0, reducerActions_1.makeOptionDeselectedAction)({
                        option: selectedOptions[selectedOptions.length - 1]
                    }));
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!selectState.inputState.showMenu) {
                    // the first time ArrowDown is pressed just show the menu and do not increment the highlightIndex
                    dispatch((0, reducerActions_1.makeSetMenuOpenAction)(true));
                    return;
                }
                dispatch((0, reducerActions_1.makeIncrementHighlightIndexAction)());
                break;
            case 'ArrowUp':
                event.preventDefault();
                // This seems sane enough, but there might be cases where the user does not
                // want to show the menu on arrow up.
                if (!selectState.inputState.showMenu) {
                    dispatch((0, reducerActions_1.makeSetMenuOpenAction)(true));
                    return;
                }
                dispatch((0, reducerActions_1.makeDecrementHighlightIndexAction)());
                break;
            case 'Enter':
                event.preventDefault();
                if (highlightIndex === -1) {
                    onSearch === null || onSearch === void 0 ? void 0 : onSearch(selectState.inputState.value);
                }
                else {
                    const selected = (0, optionUtils_1.getOptionAtIndex)(visibleOptions, highlightIndex, canSelectGroup);
                    // this shouldn't ever return null...
                    if (selected) {
                        dispatch((0, reducerActions_1.makeOptionSelectedAction)({ option: selected }));
                    }
                }
                break;
            case 'Escape':
                event.preventDefault();
                dispatch((0, reducerActions_1.makeSetMenuOpenAction)(false));
                break;
            default:
        }
    };
    // may have to change this to a set state to trigger re-render if user does not
    // set on initialization and doesn't rerender at this same level (maybe they pass
    // the ref down to another component that rerenders)
    // const dropdownContainerRef = useRef<HTMLElement>(null)
    const [dropdownContainer, setDropdownContainer] = (0, react_1.useState)();
    const highlightRef = (0, react_1.useRef)(null);
    const selectedRef = (0, react_1.useRef)(null);
    const prevState = (0, usePreviousRef_1.usePreviousVal)(selectState, true);
    const prevDropdownContainer = (0, usePreviousRef_1.usePreviousVal)(dropdownContainer);
    (0, useScrollIntoView_1.useScrollIntoView)({
        child: highlightIndex === -1 ? selectedRef : highlightRef,
        container: dropdownContainer,
        disabled: !(selectState.highlightIndex !== (prevState === null || prevState === void 0 ? void 0 : prevState.highlightIndex) ||
            selectState.inputState.showMenu !== (prevState === null || prevState === void 0 ? void 0 : prevState.inputState.showMenu) ||
            dropdownContainer !== prevDropdownContainer),
        options: scrollOptions === null || scrollOptions === void 0 ? void 0 : scrollOptions.options,
        type: scrollOptions === null || scrollOptions === void 0 ? void 0 : scrollOptions.type
    });
    const onScrollRef = (0, useLatestRef_1.useLatestRef)(onScroll);
    const stateRef = (0, useLatestRef_1.useLatestRef)(selectState);
    (0, react_1.useEffect)(() => {
        const container = (0, useScrollIntoView_1.getElement)(dropdownContainer);
        if (container) {
            const scroll = (event) => {
                var _a;
                // calculate percentage scrolled
                (_a = onScrollRef.current) === null || _a === void 0 ? void 0 : _a.call(onScrollRef, stateRef.current, (0, elementUtils_1.getVerticalScrollPercentage)(event.currentTarget), event);
            };
            container.addEventListener('scroll', scroll);
            return () => {
                container.removeEventListener('scroll', scroll);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdownContainer]);
    // useEffect(() => {
    //   if (!selectState.inputState.showMenu && isMouseInsideDropdown.current) {
    //     // reset this. there are cases where the menu will be
    //     isMouseInsideDropdown.current = false
    //   }
    // }, [selectState.inputState.showMenu])
    (0, react_1.useEffect)(() => {
        const input = inputRef.current;
        if (input) {
            // want to avoid double dispatch here if the focusEvent occurs and then
            // the mouseDown event occurs. The field could be focused either by tabbing,
            // clicking, or even by JS calling .focus()
            const onFocus = () => {
                dispatch((0, reducerActions_1.makeSetInputFocusedAction)(true));
            };
            const onBlur = () => {
                if (!isMouseInsideDropdown.current) {
                    // need to make sure that the blur event is NOT occurring b/c the user is clicking
                    // within the dropdown menu
                    dispatch((0, reducerActions_1.makeSetInputFocusedAction)(false, false));
                }
            };
            const onMouseDown = () => {
                dispatch((0, reducerActions_1.makeSetMenuOpenAction)(true));
            };
            input.addEventListener('mousedown', onMouseDown);
            input.addEventListener('focus', onFocus);
            input.addEventListener('blur', onBlur);
            return () => {
                input.removeEventListener('mousedown', onMouseDown);
                input.removeEventListener('focus', onFocus);
                input.removeEventListener('blur', onBlur);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMenuOnFocus, inputRef.current]);
    const selectedCheckRef = (0, useLatestRef_1.useLatestRef)(isSelectedCheck);
    const displayOptions = (0, react_1.useMemo)(() => {
        const selectedCheck = (option) => {
            if (selectedCheckRef.current)
                return selectedCheckRef.current(option, selectedOptions, optionEqualityCheck);
            return selectedOptions.includes(option);
        };
        const returnedDisplayOptions = [];
        let pos = 0;
        const checkGroupOptions = (groupOption, groupAry, depth = 0) => {
            const isGroupHighlighted = canSelectGroup ? highlightIndex === pos++ : false;
            const isGroupSelected = canSelectGroup ? selectedCheck(groupOption) : false;
            groupAry.push({
                depth,
                isDisabled: isDisabled ? isDisabled(groupOption, selectState) : false,
                isHighlighted: isGroupHighlighted,
                isSelected: isGroupSelected,
                onDeselect: (closeMenu) => dispatch((0, reducerActions_1.makeOptionDeselectedAction)({ closeMenu, option: groupOption })),
                onSelect: canSelectGroup
                    ? (closeMenu) => dispatch((0, reducerActions_1.makeOptionSelectedAction)({ closeMenu, option: groupOption }))
                    : noop_1.NOOP,
                option: groupOption,
                spreadProps: {
                    'aria-label': groupOption.groupLabel,
                    'aria-selected': isGroupSelected,
                    ref: isGroupHighlighted ? highlightRef : undefined
                }
            });
            const groupsOptionProps = [];
            const gOptions = groupOption.options;
            for (let i = 0; i < gOptions.length; i++) {
                const opt = gOptions[i];
                if ((0, optionUtils_1.isGroupSelectOption)(opt)) {
                    checkGroupOptions(opt, groupsOptionProps, depth + 1);
                }
                else {
                    groupsOptionProps.push({
                        depth: depth + 1,
                        isDisabled: isDisabled ? isDisabled(opt, selectState) : false,
                        isHighlighted: highlightIndex === pos,
                        // may need to make lookup table instead of using array includes
                        isSelected: selectedCheck(opt),
                        onDeselect: (closeMenu) => dispatch((0, reducerActions_1.makeOptionDeselectedAction)({ closeMenu, option: opt })),
                        onSelect: (closeMenu) => dispatch((0, reducerActions_1.makeOptionSelectedAction)({ closeMenu, option: opt })),
                        option: opt,
                        spreadProps: {
                            'aria-label': opt.label,
                            'aria-selected': highlightIndex === pos,
                            ref: highlightIndex === pos ? highlightRef : undefined
                        }
                    });
                    pos++;
                }
            }
            groupAry[groupAry.length - 1].groupOptions = groupsOptionProps;
        };
        for (let i = 0; i < visibleOptions.length; i++) {
            const option = visibleOptions[i];
            if ((0, optionUtils_1.isGroupSelectOption)(option)) {
                checkGroupOptions(option, returnedDisplayOptions);
            }
            else {
                returnedDisplayOptions.push({
                    depth: 0,
                    isDisabled: isDisabled ? isDisabled(option, selectState) : false,
                    isHighlighted: highlightIndex === pos,
                    isSelected: selectedCheck(option),
                    onDeselect: (closeMenu) => dispatch((0, reducerActions_1.makeOptionDeselectedAction)({ closeMenu, option })),
                    onSelect: (closeMenu) => dispatch((0, reducerActions_1.makeOptionSelectedAction)({ closeMenu, option })),
                    option: option,
                    spreadProps: {
                        'aria-label': option.label,
                        'aria-selected': highlightIndex === pos,
                        ref: highlightIndex === pos ? highlightRef : undefined
                    }
                });
                pos++;
            }
        }
        return returnedDisplayOptions;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isDisabled,
        canSelectGroup,
        highlightIndex,
        selectedOptions,
        dispatch,
        visibleOptions
    ]);
    const firstRun = (0, react_1.useRef)(true);
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if (selectedOptions && selectedOptions.length > 0 && options.onSelect) {
            options.onSelect(selectedOptions[selectedOptions.length - 1]);
        }
    }, [selectedOptions]);
    return {
        dispatchAction: (action) => dispatch(action),
        dispatchAppendOptions: (opts) => dispatch((0, reducerActions_1.makeAppendOptionsAction)(opts)),
        dispatchStateChange: (action) => dispatch((0, reducerActions_1.makeSetStateAction)(action)),
        displayOptions,
        dropdownContainerProps: {
            onMouseEnter: () => {
                isMouseInsideDropdown.current = true;
            },
            onMouseLeave: () => {
                isMouseInsideDropdown.current = false;
            },
            ref: setDropdownContainer
        },
        highlightCompletionPercent: getHighlightCompletionPercentage(displayOptions, highlightIndex),
        highlightIndex,
        inputProps: {
            onChange: (event) => dispatch((0, reducerActions_1.makeInputChangeAction)({ showMenu: true, value: event.target.value })),
            onKeyDown: keydownHandler,
            ref: inputRef,
            value: selectState.inputState.value
        },
        search: () => {
            if (onSearch) {
                onSearch(selectState.inputState.value);
            }
        },
        selectedOptions,
        state: selectState
    };
}
exports.useSelect = useSelect;
