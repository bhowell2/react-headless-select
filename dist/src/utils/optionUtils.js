"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIsOptionSelectedCheck = exports.getOptionIndex = exports.getOptionAtIndex = exports.flattenOptions = exports.getOptionsLength = exports.textMatchesSelectedOptions = exports.indexOfFilterMatch = exports.defaultOptionEqualityCheck = exports.isGroupSelectOption = void 0;
function isGroupSelectOption(option) {
    return 'groupLabel' in option;
}
exports.isGroupSelectOption = isGroupSelectOption;
const defaultOptionEqualityCheck = (a, b) => a.value === b.value;
exports.defaultOptionEqualityCheck = defaultOptionEqualityCheck;
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
exports.indexOfFilterMatch = indexOfFilterMatch;
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
exports.textMatchesSelectedOptions = textMatchesSelectedOptions;
/**
 * Calculates the selectable option length, respecting the canSelectGroup option
 * (which increments the length by 1 per group).
 */
function getOptionsLength(options, canSelectGroup = false) {
    if (!options)
        return 0;
    let count = 0;
    // similar to the others we need to handle this recursively
    function countGroupOptions(groupSelectOption) {
        if (canSelectGroup) {
            count++;
        }
        for (let i = 0; i < groupSelectOption.options.length; i++) {
            const opt = groupSelectOption.options[i];
            if (isGroupSelectOption(opt)) {
                countGroupOptions(opt);
            }
            else {
                count++;
            }
        }
    }
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (isGroupSelectOption(option)) {
            countGroupOptions(option);
        }
        else {
            count++;
        }
    }
    return count;
}
exports.getOptionsLength = getOptionsLength;
function flattenOptions(options, canSelectGroup) {
    const res = [];
    // small optimization, if we did not encounter a group can just use
    // the same options array.
    let encounteredGroup = false;
    function flattenGroup(groupOption) {
        encounteredGroup = true;
        const gOpts = groupOption.options;
        if (canSelectGroup) {
            res.push(groupOption);
        }
        for (let i = 0; i < gOpts.length; i++) {
            const opt = gOpts[i];
            if (isGroupSelectOption(opt)) {
                flattenGroup(opt);
            }
            else {
                res.push(opt);
            }
        }
    }
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (isGroupSelectOption(opt)) {
            flattenGroup(opt);
        }
        else {
            res.push(opt);
        }
    }
    return encounteredGroup ? res : options;
}
exports.flattenOptions = flattenOptions;
/**
 * Retrieves the option at the specified index - respecting grouping.
 * Usually this will return a SelectOption, but if GroupSelect is enabled then a
 * GroupSelectOption may be returned.
 */
function getOptionAtIndex(options, index, canSelectGroup = false) {
    let pos = 0;
    // easier to make inner function here to be used recursively to capture pos variable,
    // rather than having some weird return signature to update the current pos
    function handleGroupOptions(groupOption) {
        if (canSelectGroup) {
            if (pos === index)
                return groupOption;
            pos++;
        }
        for (let j = 0; j < groupOption.options.length; j++) {
            const opt = groupOption.options[j];
            if (isGroupSelectOption(opt)) {
                const res = handleGroupOptions(opt);
                if (res)
                    return res;
            }
            else {
                if (pos === index)
                    return opt;
                pos++;
            }
        }
        return null;
    }
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (isGroupSelectOption(option)) {
            const res = handleGroupOptions(option);
            if (res)
                return res;
        }
        else {
            if (pos === index)
                return option;
            pos++;
        }
    }
    return null;
}
exports.getOptionAtIndex = getOptionAtIndex;
/**
 * Goes through the options and returns the index of the provided
 * option if it exists in the list; -1 is returned if the option
 * is not found in the array.
 */
function getOptionIndex(options, optionToFind, canSelectGroup = false, equalityCheck = exports.defaultOptionEqualityCheck) {
    let pos = 0;
    function handleGroupOptions(groupOption) {
        if (canSelectGroup) {
            if (equalityCheck(optionToFind, groupOption)) {
                return pos;
            }
            pos++;
        }
        for (let i = 0; i < groupOption.options.length; i++) {
            const opt = groupOption.options[i];
            if (isGroupSelectOption(opt)) {
                const res = handleGroupOptions(opt);
                if (res >= 0)
                    return res;
            }
            else {
                if (equalityCheck(optionToFind, opt))
                    return pos;
                pos++;
            }
        }
        return -1;
    }
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (isGroupSelectOption(opt)) {
            const res = handleGroupOptions(opt);
            if (res >= 0)
                return res;
        }
        else {
            if (equalityCheck(optionToFind, opt))
                return pos;
            pos++;
        }
    }
    return -1;
}
exports.getOptionIndex = getOptionIndex;
const defaultIsOptionSelectedCheck = (option, currentlySelectedOptions, equalityCheck = exports.defaultOptionEqualityCheck) => (currentlySelectedOptions === null || currentlySelectedOptions === void 0 ? void 0 : currentlySelectedOptions.find((selected) => equalityCheck(option, selected))) !==
    undefined;
exports.defaultIsOptionSelectedCheck = defaultIsOptionSelectedCheck;
