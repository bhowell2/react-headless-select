"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSetStateAction = exports.isSetStateAction = exports.makeSetInputFocusedAction = exports.isSetInputFocusedAction = exports.makeSetMenuOpenAction = exports.isSetMenuOpenAction = exports.makeAppendOptionsAction = exports.isAppendOptionsAction = exports.makeSetOptionsAction = exports.isSetOptionsAction = exports.makeDecrementHighlightIndexAction = exports.isDecrementHighlightIndexAction = exports.makeIncrementHighlightIndexAction = exports.isIncrementHighlightIndexAction = exports.makeOptionDeselectedAction = exports.isOptionDeselectedAction = exports.makeOptionSelectedAction = exports.isOptionSelectedAction = exports.makeInputChangeAction = exports.isInputChangeAction = exports.SELECT_ACTIONS = exports.initialDefaultSelectState = void 0;
exports.initialDefaultSelectState = {
    // This is actually dependent on the allowNoHighlight option (if true, this -1, else 0)
    // this is handled in the reducer initialization
    highlightIndex: -1,
    inputState: {
        isInputFocused: false,
        showMenu: false,
        value: ''
    },
    options: [],
    pseudoInputValue: '',
    selectedOptions: [],
    visibleOptions: []
};
exports.SELECT_ACTIONS = {
    APPEND_OPTIONS: 'APPEND_OPTIONS',
    DECREMENT_HIGHLIGHT_INDEX: 'DECREMENT_HIGHLIGHT_INDEX',
    INCREMENT_HIGHLIGHT_INDEX: 'INCREMENT_HIGHLIGHT_INDEX',
    INPUT_CHANGE: 'INPUT_CHANGE',
    OPTION_DESELECTED: 'OPTION_DESELECTED',
    OPTION_SELECTED: 'OPTION_SELECTED',
    SET_INPUT_FOCUSED: 'SET_INPUT_FOCUSED',
    SET_MENU_OPEN: 'SET_MENU_OPEN',
    SET_OPTIONS: 'SET_OPTIONS',
    SET_STATE: 'SET_STATE',
    SET_VISIBLE_OPTIONS: 'SET_VISIBLE_OPTIONS'
};
// creates a type predicate - hacked the typing to make possible
function isType(type) {
    return ((action) => action.type === type);
}
exports.isInputChangeAction = isType(exports.SELECT_ACTIONS.INPUT_CHANGE);
function makeInputChangeAction(payload) {
    return {
        payload,
        type: exports.SELECT_ACTIONS.INPUT_CHANGE
    };
}
exports.makeInputChangeAction = makeInputChangeAction;
exports.isOptionSelectedAction = isType(exports.SELECT_ACTIONS.OPTION_SELECTED);
function makeOptionSelectedAction(payload) {
    return {
        payload,
        type: exports.SELECT_ACTIONS.OPTION_SELECTED
    };
}
exports.makeOptionSelectedAction = makeOptionSelectedAction;
exports.isOptionDeselectedAction = isType(exports.SELECT_ACTIONS.OPTION_DESELECTED);
function makeOptionDeselectedAction(payload) {
    return {
        payload,
        type: exports.SELECT_ACTIONS.OPTION_DESELECTED
    };
}
exports.makeOptionDeselectedAction = makeOptionDeselectedAction;
exports.isIncrementHighlightIndexAction = isType(exports.SELECT_ACTIONS.INCREMENT_HIGHLIGHT_INDEX);
function makeIncrementHighlightIndexAction(incrementBy = 1) {
    return {
        payload: {
            value: incrementBy
        },
        type: exports.SELECT_ACTIONS.INCREMENT_HIGHLIGHT_INDEX
    };
}
exports.makeIncrementHighlightIndexAction = makeIncrementHighlightIndexAction;
exports.isDecrementHighlightIndexAction = isType(exports.SELECT_ACTIONS.DECREMENT_HIGHLIGHT_INDEX);
function makeDecrementHighlightIndexAction(decrementBy = 1) {
    return {
        payload: {
            value: decrementBy
        },
        type: exports.SELECT_ACTIONS.DECREMENT_HIGHLIGHT_INDEX
    };
}
exports.makeDecrementHighlightIndexAction = makeDecrementHighlightIndexAction;
exports.isSetOptionsAction = isType(exports.SELECT_ACTIONS.SET_OPTIONS);
function makeSetOptionsAction(payload) {
    return {
        payload,
        type: exports.SELECT_ACTIONS.SET_OPTIONS
    };
}
exports.makeSetOptionsAction = makeSetOptionsAction;
exports.isAppendOptionsAction = isType(exports.SELECT_ACTIONS.APPEND_OPTIONS);
function makeAppendOptionsAction(options) {
    return {
        payload: {
            options
        },
        type: exports.SELECT_ACTIONS.APPEND_OPTIONS
    };
}
exports.makeAppendOptionsAction = makeAppendOptionsAction;
exports.isSetMenuOpenAction = isType(exports.SELECT_ACTIONS.SET_MENU_OPEN);
function makeSetMenuOpenAction(open) {
    return {
        payload: {
            open
        },
        type: exports.SELECT_ACTIONS.SET_MENU_OPEN
    };
}
exports.makeSetMenuOpenAction = makeSetMenuOpenAction;
exports.isSetInputFocusedAction = isType(exports.SELECT_ACTIONS.SET_INPUT_FOCUSED);
function makeSetInputFocusedAction(focused, menuOpen) {
    return {
        payload: {
            focused,
            menuOpen
        },
        type: exports.SELECT_ACTIONS.SET_INPUT_FOCUSED
    };
}
exports.makeSetInputFocusedAction = makeSetInputFocusedAction;
exports.isSetStateAction = isType(exports.SELECT_ACTIONS.SET_STATE);
function makeSetStateAction(setState) {
    return {
        payload: {
            setState
        },
        type: exports.SELECT_ACTIONS.SET_STATE
    };
}
exports.makeSetStateAction = makeSetStateAction;
