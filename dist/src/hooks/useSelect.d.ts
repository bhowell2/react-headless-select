import { Dispatch, ChangeEventHandler, KeyboardEventHandler, MutableRefObject } from 'react';
import { ScrollOptionsType, ScrollType } from './useScrollIntoView';
import { UseSelectReducerOptions } from './selectReducer';
import { Action, SelectAction, SelectState, SetStateAction } from './reducerActions';
import { ExtObj, OptionType } from '../types/optionTypes';
export interface OptionProps<T, G = T, O extends ExtObj = ExtObj> {
    /**
     * Provides the group-nested depth of the option.
     * Options that are not grouped will have a depth of 0 and
     * options that are grouped will have a depth of the parent
     * group option + 1.
     *
     * E.g.
     * The first GroupOption will have a depth of 0 and its options
     * will have a depth of 1 - if any of those nested options are
     * also a GroupOption then their options will have a depth of 2.
     */
    depth: number;
    /** Set by isDisabled if provided. */
    isDisabled: boolean;
    /**
     * When the keyboard is used to navigate the dropdown this specifies if
     * the highlight index is for the given item. This wraps the 'canSelectGroup'
     * functionality, so the consideration of highlighting/selecting is transparent
     * to the user.
     */
    isHighlighted: boolean;
    /** Occurs when the item has actually been selected via click or enter. */
    isSelected: boolean;
    /**
     * Removes the item from selection.
     * closeMenu defaults to false on multiSelect.
     * */
    onDeselect: (closeMenu?: boolean) => void;
    /**
     * Selects the option.
     * closeMenu defaults to false on multiSelect.
     * */
    onSelect: (closeMenu?: boolean) => void;
    /** The Group/SelectOption for this element. */
    option: OptionType<T, G, O>;
    /** Props to be spread into each option. This includes spread to group options as well. */
    spreadProps: {
        /** Simply the option's label. Provided for accessibility. */
        ['aria-label']: string;
        /** If the item is selected. Provided for accessibility. */
        ['aria-selected']: boolean;
        ref?: MutableRefObject<any>;
    };
    /**
     * The OptionProps for each of the group's options.
     * This prop can be checked to determine if the current option prop is for a
     * GroupSelectOption - containing the correct OptionProps for the group's options.
     * */
    groupOptions?: OptionProps<T, G, O>[];
}
export interface UseSelectOptions<T, G = T, O extends ExtObj = ExtObj, ST extends ScrollType = 'scrollInto'> extends UseSelectReducerOptions<T, G, O> {
    /**
     * This does not need to be memoized, it is captured. The current state
     * will be passed to this, along with the current scroll percentage and
     * the scroll event.
     */
    onScroll?: (selectState: SelectState<T, G, O>, scrollPercentage: number, event: HTMLElementEventMap['scroll']) => void;
    /**
     * Search occurs when the enter key is pressed and no item has
     * been selected with the arrow keys (i.e., highlightIndex = -1).
     *
     * The current internal input value will be passed back. A 'search'
     * function is also passed back in UseSelectResult so that a search
     * can be triggered, where this function will be called as well.
     */
    onSearch?: (search: string) => void;
    onSelect?: (option: OptionType<T, G, O>) => void;
    scrollOptions?: {
        type: ST;
        options?: ScrollOptionsType<ST>;
    };
    /**
     * If showMenu should be true when the input is initially focused.
     * @default false (i.e., do not automatically show on focus)
     */
    showMenuOnFocus?: boolean;
    /**
     * If value is provided and differs from the internal value (which
     * simply mirrors the text input value) the internal value will be
     * updated to reflect this value.
     */
    value?: string;
}
export interface UseSelectResult<T, G = T, O extends ExtObj = ExtObj, E extends HTMLElement = HTMLInputElement> {
    dispatchAction: Dispatch<Action<SelectAction, object>>;
    dispatchAppendOptions: (options: OptionType<T, G, O>[]) => void;
    /**
     * Allows to manually update the state.
     */
    dispatchStateChange: Dispatch<SetStateAction<T, G, O>['payload']['setState']>;
    /**
     * Provides the list of options to display. This is after filtering
     * and determining if it is highlighted or selected.
     */
    displayOptions: OptionProps<T, G, O>[];
    dropdownContainerProps: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        ref: MutableRefObject<any>;
    };
    /**
     * Returns value 0-1 of highlightIndex's percentage completion of the
     * display options length.
     * E.g., displayOptions.length = 5, highlightIndex = 3, completion = 0.6
     */
    highlightCompletionPercent: number;
    /**
     * -1 means no highlight, while 0 is the first element.
     * This can be used to determine when more item should be fetched.
     */
    highlightIndex: number;
    /** Props to be spread into the input field for this select. */
    inputProps: {
        onChange: ChangeEventHandler<E>;
        onKeyDown: KeyboardEventHandler<E>;
        ref: MutableRefObject<E>;
        value: string;
    };
    /**
     * Triggers the onSearch call that is passed in as a prop. This occurs
     * when highlightIndex = -1 (i.e., nothing is highlighted) and the user
     * presses the 'Enter' key.
     *
     * NOTE: if allowNoHighlight = false then this will never be called.
     * */
    search: () => void;
    /**
     * If item(s) are selected then they will be returned here. The most recently
     * selected item is also passed to onSelect if it is provided.
     */
    selectedOptions: OptionType<T, G, O>[];
    state: SelectState<T, G, O>;
}
export declare function getDefaultOptions<T, G = T, O extends ExtObj = ExtObj, ST extends ScrollType = 'scrollInto'>(options: UseSelectOptions<T, G, O, ST>): UseSelectOptions<T, G, O, ST>;
export declare function useSelect<T, G = T, O extends ExtObj = ExtObj, E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement, ST extends ScrollType = 'scrollInto'>(options: UseSelectOptions<T, G, O, ST>): UseSelectResult<T, G, O, E>;
