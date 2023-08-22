"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelectReducer = void 0;
const optionUtils_1 = require("../utils/optionUtils");
const react_1 = require("react");
const reducerActions_1 = require("./reducerActions");
const useLatestRef_1 = require("./internal/useLatestRef");
function setVisibleOptions(nextState, nextVisibleOptions, flattenedVisibleOptionsRef, canSelectGroup) {
    nextState.visibleOptions = nextVisibleOptions;
    flattenedVisibleOptionsRef.current = (0, optionUtils_1.flattenOptions)(nextVisibleOptions, canSelectGroup);
}
/**
 * This is used so that each check on the action type can return in line.
 * This helps with optimization so that unnecessary updates can be avoided.
 *
 * We have cases where we will kick off update events even though the state
 * will not have changed after the update event. (e.g., if someone clicks in
 * the menu when it is already open then we don't need to return a completely
 * new state since nothing should have changed).
 */
function finalStateHelper(prevState, nextState, onStateChange, action) {
    return (onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange(prevState, nextState, action)) || nextState;
}
function applyFilterFn(inputVal, options, filterFn) {
    return filterFn ? filterFn(inputVal, options) : options;
}
function useSelectReducer(options) {
    const { disableSelection, disableFiltering, filterFn = optionUtils_1.indexOfFilterMatch, isDisabled, isSelectedCheck = optionUtils_1.defaultIsOptionSelectedCheck, onStateChange, multiSelect, 
    // close menu by default when option is selected and not in multiSelect mode
    closeMenuOnSelection = !multiSelect, showMenuOnFocus = true, allowNoHighlight = false, cycleHighlightIndex = true, optionEqualityCheck = optionUtils_1.defaultOptionEqualityCheck, canSelectGroup } = options;
    // As a performance optimization and, honestly, a simplification in the next
    // highlight index calculation this is used to linearly iterate over the options
    // rather than having to go within a group's options each time the highlight
    // index is incremented . I.e., we pay the price to flatten the options once
    // (with a bit of extra space) rather than every increment/decrement of the
    // highlight index.
    const flattenedVisibleOptionsRef = (0, react_1.useRef)([]);
    // Also need to find the latest state
    const setNextOpts = (nextState, inputVal) => {
        if ((nextState.selectedOptions &&
            (0, optionUtils_1.textMatchesSelectedOptions)(inputVal, nextState.selectedOptions)) ||
            disableFiltering) {
            setVisibleOptions(nextState, nextState.options, flattenedVisibleOptionsRef, !!canSelectGroup);
        }
        else {
            setVisibleOptions(nextState, applyFilterFn(inputVal, nextState.options, filterFn), flattenedVisibleOptionsRef, !!canSelectGroup);
        }
    };
    const incOrDecHighIdx = (currentIndex, increment, nextState, 
    // track to make sure we don't end up in infinite loop
    didCycle = false) => {
        const flatOpts = flattenedVisibleOptionsRef.current;
        // increment cycle case
        // at end and didn't already cycle
        if (increment && !didCycle && currentIndex === flatOpts.length - 1) {
            if (cycleHighlightIndex) {
                // can't simply set this to 0, b/c 0 could NOT be selectable, so now recursively
                // call this function starting at 0 and decrementing rather than incrementing
                return incOrDecHighIdx(0, true, nextState, true);
            }
            // nothing to be done here b/c it does not cycle and cannot be incremented anymore
            return;
        }
        // decrement - cycle case
        if (!increment &&
            !didCycle &&
            ((allowNoHighlight && currentIndex === -1) ||
                (!allowNoHighlight && currentIndex === 0))) {
            if (cycleHighlightIndex) {
                return incOrDecHighIdx(flatOpts.length - 1, false, nextState, true);
            }
            // nothing to be done here b/c it does not cycle and cannot be decremented anymore
            return;
        }
        // Nothing is disabled, so can simply increment or decrement
        if (!isDisabled) {
            if (increment) {
                nextState.highlightIndex = didCycle ? currentIndex : currentIndex + 1;
            }
            else {
                nextState.highlightIndex = didCycle ? currentIndex : currentIndex - 1;
            }
            return;
        }
        if (increment) {
            for (let i = didCycle ? currentIndex : currentIndex + 1; i < flatOpts.length; i++) {
                if (!isDisabled(flatOpts[i], nextState)) {
                    nextState.highlightIndex = i;
                    return;
                }
            }
            if (!didCycle && cycleHighlightIndex)
                return incOrDecHighIdx(0, true, nextState, true);
            // we have gotten to the end and not found anything...
        }
        else {
            // decrement
            for (let i = didCycle ? currentIndex : currentIndex - 1; i >= 0; i--) {
                if (!isDisabled(flatOpts[i], nextState)) {
                    nextState.highlightIndex = i;
                    return;
                }
            }
            if (!didCycle && cycleHighlightIndex)
                return incOrDecHighIdx(flatOpts.length - 1, false, nextState, true);
        }
        // cannot increment or decrement... do nothing
    };
    /**
     * Handles finding the next highlight index when the options change.
     * First this will attempt to find the previous option in the new
     * list of options, but if that cannot be found then it will try to
     * retain the highlightIndex by keeping it the same or moving it to
     * the next available option.
     *
     * NOTE: this is not the same thing as incrementing/decrementing the highlight index.
     */
    const findNextHighlightIndex = (prevOpt, prevHighIdx, nextOpts, findNextIndex, nextState) => {
        let didFindLastIndex = false;
        if (findNextIndex) {
            const prevHighlightOpt = (0, optionUtils_1.getOptionAtIndex)(prevOpt, prevHighIdx, canSelectGroup);
            if (prevHighlightOpt) {
                const nextHighlightIndex = (0, optionUtils_1.getOptionIndex)(nextOpts, prevHighlightOpt, canSelectGroup, optionEqualityCheck);
                if (nextHighlightIndex >= 0) {
                    nextState.highlightIndex = nextHighlightIndex;
                    didFindLastIndex = true;
                }
            }
        }
        // The previously highlighted option does not exist in the next options;
        // list; fallback to finding the next available highlight index
        if (!didFindLastIndex) {
            incOrDecHighIdx(0, true, nextState, true);
        }
    };
    function selectReducer(state, action) {
        var _a;
        // Non-rerender conditions (unless user returns new state with their onStateChange handler)
        if ((0, reducerActions_1.isSetMenuOpenAction)(action) &&
            state.inputState.showMenu === action.payload.open) {
            return finalStateHelper(state, state, onStateChange, action);
        }
        // All of these will cause a re-render (unless user returns prevState from onStateChange handler)
        let nextState = Object.assign({}, state);
        const handleInputChange = (value, showMenu = false, findNextIndex = true, fromSelection = false) => {
            var _a;
            // check if backspaced
            if (state.selectedOptions.length > 0 &&
                // backspace condition
                value.length === state.inputState.value.length - 1 &&
                state.inputState.value.indexOf(value) === 0 &&
                !multiSelect) {
                nextState.selectedOptions = [
                    ...nextState.selectedOptions.slice(0, nextState.selectedOptions.length - 1)
                ];
                // This should not be called on multiSelect - the hook should handle calling deselect
                if ((_a = options.inputOptions) === null || _a === void 0 ? void 0 : _a.completelyRemoveSelectOnBackspace) {
                    value = '';
                }
            }
            nextState.inputState = Object.assign(Object.assign({}, nextState.inputState), { showMenu, value });
            if (fromSelection) {
                nextState.pseudoInputValue = '';
            }
            else {
                nextState.pseudoInputValue = value;
            }
            setNextOpts(nextState, value);
            findNextHighlightIndex(state.visibleOptions, state.highlightIndex, nextState.visibleOptions, findNextIndex, nextState);
        };
        //
        // INPUT CHANGE
        //
        if ((0, reducerActions_1.isInputChangeAction)(action)) {
            // We do NOT auto-select when the user's input matches a label; however, if the user
            // has selected an option and then changes the input that was matching the option, the
            // option should be de-selected
            handleInputChange(action.payload.value, action.payload.showMenu);
        }
        //
        // OPTION SELECTED
        //
        else if ((0, reducerActions_1.isOptionSelectedAction)(action)) {
            const selectedOption = action.payload.option;
            const canSelectOption = isDisabled ? !isDisabled(selectedOption, state) : true;
            if (!disableSelection && canSelectOption) {
                if (multiSelect && !isSelectedCheck(selectedOption, nextState.selectedOptions)) {
                    nextState.selectedOptions = [...nextState.selectedOptions, selectedOption];
                    nextState.highlightIndex = -1;
                    if (!action.payload.ignoreClearInputOnMultiSelect) {
                        handleInputChange('', false, false, true);
                    }
                }
                else if (!multiSelect) {
                    nextState.selectedOptions = [selectedOption];
                    handleInputChange((0, optionUtils_1.isGroupSelectOption)(selectedOption)
                        ? selectedOption.groupLabel
                        : selectedOption.label, false, false, true);
                }
                let nextShowMenuState = nextState.inputState.showMenu;
                const closeMenu = (_a = action.payload.closeMenu) !== null && _a !== void 0 ? _a : closeMenuOnSelection;
                if (nextShowMenuState && closeMenu) {
                    nextShowMenuState = false;
                }
                nextState.inputState = Object.assign(Object.assign({}, nextState.inputState), { showMenu: nextShowMenuState });
            }
        }
        //
        // OPTION DE-SELECTED
        //
        else if ((0, reducerActions_1.isOptionDeselectedAction)(action)) {
            const curOptions = nextState.selectedOptions;
            const { option } = action.payload;
            const idx = (0, optionUtils_1.getOptionIndex)(curOptions, option, canSelectGroup, optionEqualityCheck);
            if (idx >= 0) {
                let nextShowMenuState = nextState.inputState.showMenu;
                const closeMenu = action.payload.closeMenu;
                if (nextShowMenuState && closeMenu) {
                    nextShowMenuState = false;
                }
                nextState.inputState = Object.assign(Object.assign({}, nextState.inputState), { showMenu: nextShowMenuState });
                if (!multiSelect && !(0, optionUtils_1.isGroupSelectOption)(option)) {
                    nextState.inputState.value = '';
                }
                nextState.selectedOptions = [
                    ...curOptions.splice(0, idx),
                    ...curOptions.splice(idx + 1, curOptions.length)
                ];
            }
        }
        //
        // INCREMENT HIGHLIGHT INDEX
        //
        else if ((0, reducerActions_1.isIncrementHighlightIndexAction)(action)) {
            incOrDecHighIdx(state.highlightIndex, true, nextState);
        }
        //
        // DECREMENT HIGHLIGHT INDEX
        //
        else if ((0, reducerActions_1.isDecrementHighlightIndexAction)(action)) {
            incOrDecHighIdx(state.highlightIndex, false, nextState);
        }
        //
        // SET OPTIONS
        //
        else if ((0, reducerActions_1.isSetOptionsAction)(action)) {
            const nextOptions = action.payload.options;
            findNextHighlightIndex(state.options, state.highlightIndex, nextOptions, !!action.payload.attemptFindLastHighlightIndex, nextState);
            nextState.options = action.payload.options;
            setNextOpts(nextState, nextState.inputState.value);
        }
        //
        // APPEND OPTIONS
        //
        else if ((0, reducerActions_1.isAppendOptionsAction)(action)) {
            nextState.options = [...nextState.options, ...action.payload.options];
            setNextOpts(nextState, nextState.inputState.value);
        }
        //
        // SET MENU OPEN
        //
        else if ((0, reducerActions_1.isSetMenuOpenAction)(action)) {
            nextState.inputState = Object.assign(Object.assign({}, nextState.inputState), { showMenu: action.payload.open });
        }
        //
        // SET INPUT FOCUSED
        //
        else if ((0, reducerActions_1.isSetInputFocusedAction)(action)) {
            const { menuOpen = showMenuOnFocus, focused } = action.payload;
            nextState.inputState = Object.assign(Object.assign({}, nextState.inputState), { isInputFocused: focused, showMenu: menuOpen });
        }
        //
        // SET STATE
        //
        else if ((0, reducerActions_1.isSetStateAction)(action)) {
            nextState = action.payload.setState(state);
        }
        // Allows user to intercept and override any state changes, passing them the action.
        // If null/undefined is returned then the original nextState object will be used
        const manualOnStateChangeResp = onStateChange
            ? onStateChange(state, nextState, action)
            : nextState;
        // may be null or undefined
        return manualOnStateChangeResp || nextState;
    }
    const initialState = (0, react_1.useMemo)(() => {
        var _a;
        const nextState = Object.assign(Object.assign(Object.assign({}, reducerActions_1.initialDefaultSelectState), options.initialState), { highlightIndex: allowNoHighlight ? -1 : 0, inputState: Object.assign(Object.assign({}, reducerActions_1.initialDefaultSelectState.inputState), (_a = options.initialState) === null || _a === void 0 ? void 0 : _a.inputState) });
        setNextOpts(nextState, nextState.inputState.value);
        if (!allowNoHighlight) {
            // start at beginning and try to go forward
            incOrDecHighIdx(-1, true, nextState);
        }
        return nextState;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // This is a hack around the dispatch operation of useReducer. Dispatch of useReducer
    // always seems to trigger a re-render, which is unnecessary in certain situations
    // (e.g., the highlight index is at the max or minimum value)
    const [selectState, setSelectState] = (0, react_1.useState)(initialState);
    const selectReducerRef = (0, useLatestRef_1.useLatestRef)(selectReducer);
    const dispatch = (0, react_1.useCallback)((action) => {
        setSelectState((prevState) => selectReducerRef.current(prevState, action));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return {
        dispatch,
        highlightItem: flattenedVisibleOptionsRef.current[selectState.highlightIndex],
        selectState
    };
}
exports.useSelectReducer = useSelectReducer;
