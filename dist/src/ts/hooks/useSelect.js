"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelect = exports.isGroupSelectOption = void 0;
const react_1 = require("react");
const useCurrentValueRef_1 = require("./internal/useCurrentValueRef");
const useSafeLayoutEffect_1 = require("./internal/useSafeLayoutEffect");
const useScrollIntoView_1 = __importDefault(require("./useScrollIntoView"));
const noop_1 = require("../utils/noop");
const useSelectUtils_1 = require("./useSelectUtils");
function isGroupSelectOption(option) {
    return 'groupLabel' in option;
}
exports.isGroupSelectOption = isGroupSelectOption;
const defaultIsOptionSelectedCheck = (option, selectedOptions) => (selectedOptions === null || selectedOptions === void 0 ? void 0 : selectedOptions.find((selected) => selected.value === option.value)) !== undefined;
/**
 * Basic matching function that uses indexOf to match the label or groupLabel.
 * If the groupLabel matches then all GroupSelectionOption#options will be returned,
 * otherwise each group's options will be checked and if any match then the
 * GroupSelectOption will be returned with only the matching options.
 * */
function indexOfFilterMatch(val, options) {
    if (val === '') {
        return options;
    }
    const result = [];
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (isGroupSelectOption(option)) {
            if (option.groupLabel.indexOf(val) >= 0) {
                result.push(option);
            }
            else {
                // currently, this will only return SelectOptions since the group's options
                const groupFilteredOptions = indexOfFilterMatch(val, option.options);
                if (groupFilteredOptions.length > 0) {
                    result.push({
                        groupLabel: option.groupLabel,
                        options: groupFilteredOptions
                    });
                }
            }
        }
        else if (option.label.indexOf(val) >= 0) {
            result.push(option);
        }
    }
    return result;
}
function textMatchesSelectedOptions(text, selectedOptions) {
    for (let i = 0; i < selectedOptions.length; i++) {
        const option = selectedOptions[i];
        if ((isGroupSelectOption(option) && text === option.groupLabel) ||
            (!isGroupSelectOption(option) && text === option.label)) {
            return true;
        }
    }
    return false;
}
/**
 * This is called when some change occurs in the input. Currently, this
 * will set the highlight index to -1 when there are no options and it
 * will always keep the highlight index at -1 thereafter.
 */
function getHighlightIndexOnInputChange(currentHighlightIndex, visibleOptions) {
    if (visibleOptions.length === 0)
        return -1;
    return currentHighlightIndex > 0 ? 0 : -1;
}
function getHighlightCompletionPercentage(options, highlightIndex) {
    if (options.length === 0 || highlightIndex === options.length - 1)
        return 1;
    if (highlightIndex <= 0)
        return 0;
    return highlightIndex / options.length;
}
function useSelect(useSelectOptions) {
    const { allowMultiSelect = false, canSelect, disableFiltering = false, disableInitialHighlight, disableRecalculateHighlightIndex = false, disableSelection = false, filterFn = indexOfFilterMatch, filterWhenSelected, initialOptions, isSelectedCheck = defaultIsOptionSelectedCheck, onChange, onSearch, onSelect, options, showMenuOnFocus = false, value } = useSelectOptions;
    const canSelectGroup = useSelectOptions
        .canSelectGroup;
    const inputRef = (0, react_1.useRef)();
    const [internalValue, setInternalValue] = (0, react_1.useState)(value !== null && value !== void 0 ? value : '');
    const [highlightIndex, setHighlightIndex] = (0, react_1.useState)(disableInitialHighlight ? -1 : 0);
    const [selectedOptions, setSelectedOptions] = (0, react_1.useState)((initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.selectedOptions) || []);
    // State derived directly from the input element
    const [inputRelatedState, setInputRelatedState] = (0, react_1.useState)({
        isInputFocused: false,
        showMenu: false
    });
    // Options visible after filtering
    const [visibleOptions, setVisibleOptions] = (0, react_1.useState)(options);
    (0, react_1.useEffect)(() => setVisibleOptions(options), [options]);
    /*
     * Don't want to make this calculation on every iteration as it is somewhat
     * expensive and unnecessary. This is b/c we allow nested grouping and,
     * optionally, selection of the groups themselves; otherwise we could just
     * use the visibleOptions.length and be done with it. In the future may want
     * to consider an optimization option that specifies that nested grouping
     * does not occur. This would simplify and improve the performance of the
     * highlightIndex calculation in the displayOptions calculation (i.e., could
     * simply increment and decrement).
     * */
    const visibleOptionsLength = (0, react_1.useMemo)(() => (0, useSelectUtils_1.getOptionsLength)(visibleOptions, canSelectGroup), [visibleOptions, canSelectGroup]);
    // allows for comparing the
    const prevVisibleOptionsRef = (0, react_1.useRef)();
    // if visible options change, reset highlight index
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        /*
         * When changing the highlight index we want to find the last option
         * and if it is still in the visibleOptions then we will
         * */
        if (!disableRecalculateHighlightIndex &&
            prevVisibleOptionsRef.current &&
            visibleOptions !== prevVisibleOptionsRef.current &&
            highlightIndex >= 0) {
            const lastHighlightOption = (0, useSelectUtils_1.getOptionAtIndex)(prevVisibleOptionsRef.current, highlightIndex);
            if (lastHighlightOption) {
                const nextHighlightIndex = (0, useSelectUtils_1.getOptionIndex)(visibleOptions, lastHighlightOption);
                setHighlightIndex(nextHighlightIndex);
            }
            else {
                setHighlightIndex(getHighlightIndexOnInputChange(highlightIndex, visibleOptions));
            }
        }
        // this makes it so this does not run on mount and override the initial highlight index
        else if (prevVisibleOptionsRef.current) {
            setHighlightIndex(getHighlightIndexOnInputChange(highlightIndex, visibleOptions));
        }
        prevVisibleOptionsRef.current = visibleOptions;
    }, [visibleOptions, disableInitialHighlight]);
    (0, react_1.useEffect)(() => {
        // currently, only doing simple calculation
        if (internalValue === '' ||
            // if there's an item selected AND don't filter when selected
            // AND the current text equals the selected option's label then
            // show all options
            (selectedOptions &&
                !filterWhenSelected &&
                textMatchesSelectedOptions(internalValue, selectedOptions))) {
            // show everything
            setVisibleOptions(options);
        }
        else if (!disableFiltering) {
            setVisibleOptions(filterFn(internalValue, options));
        }
    }, [
        disableFiltering,
        filterFn,
        filterWhenSelected,
        internalValue,
        options,
        selectedOptions
    ]);
    const onChangePropsRef = (0, useCurrentValueRef_1.useCurrentValueRef)(onChange);
    const onChangeInternal = (0, react_1.useCallback)((val) => {
        var _a;
        setInternalValue(val);
        (_a = onChangePropsRef.current) === null || _a === void 0 ? void 0 : _a.call(onChangePropsRef, val);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // In the case that the value provided changes, then it is assumed to be controlled
    // externally and thus the updated value should be reflected internally.
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (internalValue !== value && value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);
    const internalValueRef = (0, useCurrentValueRef_1.useCurrentValueRef)(internalValue);
    const onSelectPropsRef = (0, useCurrentValueRef_1.useCurrentValueRef)(onSelect);
    /*
     * Selection could occur when the item is highlighted and the 'enter'
     * key is pressed, or selection could occur when the user clicks on
     * an actual item in the dropdown menu.
     */
    const onSelectionInternal = (0, react_1.useCallback)((option) => {
        var _a;
        if (!disableSelection &&
            !option.disableSelection &&
            // if canSelect is not provided then this is true, otherwise we check if it can be selected
            (!canSelect || canSelect(option))) {
            setSelectedOptions((prevOpts) => {
                if (allowMultiSelect && !isSelectedCheck(option, prevOpts)) {
                    return [...prevOpts, option];
                }
                return [option];
            });
            // currently, only handling NON-group selection here
            // and only setting onChangeInternal when multi-select is not available
            if (!allowMultiSelect) {
                onChangeInternal(isGroupSelectOption(option) ? option.groupLabel : option.label);
            }
            setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { showMenu: false })));
            setHighlightIndex((0, useSelectUtils_1.getOptionIndex)(visibleOptions, option, canSelectGroup));
            (_a = onSelectPropsRef.current) === null || _a === void 0 ? void 0 : _a.call(onSelectPropsRef, internalValueRef.current, option);
        }
    }, [
        allowMultiSelect,
        canSelect,
        canSelectGroup,
        disableSelection,
        internalValueRef,
        isSelectedCheck,
        onChangeInternal,
        onSelectPropsRef,
        visibleOptions
    ]);
    const onDeselectInternal = (0, react_1.useCallback)((option) => {
        setSelectedOptions((curOptions) => {
            const idx = curOptions.indexOf(option);
            if (idx >= 0) {
                // similar to how onSelectInternal handles selection, we need to remove
                // the option from the "value" if it is de-selected
                if (!allowMultiSelect && !isGroupSelectOption(option)) {
                    onChangeInternal('');
                }
                return [
                    ...curOptions.splice(0, idx),
                    ...curOptions.splice(idx + 1, curOptions.length)
                ];
            }
            return curOptions;
        });
    }, [allowMultiSelect, onChangeInternal]);
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
            case 'ArrowDown':
                if (!inputRelatedState.showMenu) {
                    // the first time ArrowDown is pressed just show the menu and do not increment the highlightIndex
                    setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { showMenu: true })));
                    return;
                }
                event.preventDefault();
                if (highlightIndex < visibleOptionsLength - 1) {
                    setHighlightIndex(highlightIndex + 1);
                }
                break;
            case 'ArrowUp':
                if (!inputRelatedState.isInputFocused) {
                    setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { showMenu: true })));
                    return;
                }
                event.preventDefault();
                // allowed to go all the way to -1, which means nothing is selected (0 being first item)
                if (highlightIndex > -1) {
                    setHighlightIndex(highlightIndex - 1);
                }
                break;
            case 'Enter':
                event.preventDefault();
                if (highlightIndex === -1) {
                    onSearch === null || onSearch === void 0 ? void 0 : onSearch(internalValue);
                }
                else {
                    const selected = (0, useSelectUtils_1.getOptionAtIndex)(visibleOptions, highlightIndex, canSelectGroup);
                    // this shouldn't ever return null...
                    if (selected) {
                        onSelectionInternal(selected);
                    }
                }
                break;
            case 'Escape':
                setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { showMenu: false })));
                event.preventDefault();
                break;
            default:
        }
    };
    (0, react_1.useEffect)(() => {
        if (inputRef.current) {
            const input = inputRef.current;
            const onFocus = () => {
                setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { isInputFocused: true, showMenu: showMenuOnFocus })));
            };
            const onBlur = () => setInputRelatedState((cur) => (Object.assign(Object.assign({}, cur), { isInputFocused: false, showMenu: false })));
            input.addEventListener('focus', onFocus);
            input.addEventListener('blur', onBlur);
            return () => {
                input.removeEventListener('focus', onFocus);
                input.removeEventListener('blur', onBlur);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMenuOnFocus, inputRef.current]);
    const dropdownContainerRef = (0, react_1.useRef)(null);
    const highlightRef = (0, react_1.useRef)(null);
    const selectedRef = (0, react_1.useRef)(null);
    (0, useScrollIntoView_1.default)(dropdownContainerRef, highlightIndex === -1 ? selectedRef : highlightRef);
    const displayOptions = (0, react_1.useMemo)(() => {
        const returnedDisplayOptions = [];
        let pos = 0;
        const checkGroupOptions = (groupOption, groupAry, depth = 0) => {
            const isGroupHighlighted = canSelectGroup ? highlightIndex === pos++ : false;
            const isGroupSelected = canSelectGroup
                ? selectedOptions.includes(groupOption)
                : false;
            groupAry.push({
                depth,
                isHighlighted: isGroupHighlighted,
                isSelected: isGroupSelected,
                onDeselect: () => onDeselectInternal(groupOption),
                onSelect: canSelectGroup ? () => onSelectionInternal(groupOption) : noop_1.NOOP,
                option: groupOption,
                spreadProps: {
                    'aria-label': groupOption.groupLabel,
                    ref: isGroupHighlighted ? highlightRef : undefined
                }
            });
            const groupsOptionProps = [];
            const gOptions = groupOption.options;
            for (let i = 0; i < gOptions.length; i++) {
                const opt = gOptions[i];
                if (isGroupSelectOption(opt)) {
                    checkGroupOptions(opt, groupsOptionProps, depth + 1);
                }
                else {
                    groupsOptionProps.push({
                        depth: depth + 1,
                        isHighlighted: highlightIndex === pos,
                        // may need to make lookup table instead of using array includes
                        isSelected: selectedOptions.includes(opt),
                        onDeselect: () => onDeselectInternal(opt),
                        onSelect: () => onSelectionInternal(opt),
                        option: opt,
                        spreadProps: {
                            'aria-label': opt.label,
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
            if (isGroupSelectOption(option)) {
                checkGroupOptions(option, returnedDisplayOptions);
            }
            else {
                returnedDisplayOptions.push({
                    depth: 0,
                    isHighlighted: highlightIndex === pos,
                    isSelected: selectedOptions.includes(option),
                    onDeselect: () => onDeselectInternal(option),
                    onSelect: () => onSelectionInternal(option),
                    option: option,
                    spreadProps: {
                        'aria-label': option.label,
                        ref: highlightIndex === pos ? highlightRef : undefined
                    }
                });
                pos++;
            }
        }
        return returnedDisplayOptions;
    }, [
        visibleOptions,
        canSelectGroup,
        highlightIndex,
        selectedOptions,
        onSelectionInternal,
        onDeselectInternal
    ]);
    return {
        displayOptions,
        dropdownContainerRef,
        highlightCompletionPercent: getHighlightCompletionPercentage(displayOptions, highlightIndex),
        highlightIndex,
        inputProps: {
            onChange: (event) => onChangeInternal(event.target.value),
            onKeyDown: keydownHandler,
            ref: inputRef,
            value: internalValue
        },
        isInputFocused: inputRelatedState.isInputFocused,
        search: () => {
            if (onSearch) {
                // reset highlight index when search is used
                setHighlightIndex(-1);
                onSearch === null || onSearch === void 0 ? void 0 : onSearch(internalValue);
            }
        },
        selectedOptions,
        setSelectedOptions,
        showMenu: inputRelatedState.showMenu
    };
}
exports.useSelect = useSelect;
