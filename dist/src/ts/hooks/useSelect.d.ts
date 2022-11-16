import { Dispatch, SetStateAction, ChangeEventHandler, KeyboardEventHandler, MutableRefObject } from 'react';
import { Either } from '../types/typeUtils';
export interface SelectOption<T> {
    label: string;
    value: T;
    /**
     * This or the UseSelectOptions#canSelect function can be used
     * to disable selection of an option. Note if this is provided
     * it will override the canSelect function.
     *
     * @default false (i.e., this option can be selected)
     */
    disableSelection?: boolean;
}
export interface GroupSelectOption<T, G = T> {
    groupLabel: string;
    /**
     * Options can be a combination of SelectOptions and GroupSelectOptions
     * (allowing for nested grouping).
     * */
    options: OptionType<T, G>[];
    value: G;
    /**
     * This or the UseSelectOptions#canSelect function can be used
     * to disable selection of an option. Note if this is provided
     * it will override the canSelect function.
     *
     * @default false (i.e., this option can be selected)
     */
    disableSelection?: boolean;
}
export declare type OptionType<T, G = T> = Either<SelectOption<T>, GroupSelectOption<T, G>>;
export declare function isGroupSelectOption<T, G = T>(option: OptionType<T, G>): option is GroupSelectOption<T, G>;
export declare type OptionSelectedCheck<T, G = T> = (option: OptionType<T, G>, selectedOptions: OptionType<T, G>[]) => boolean;
/** Passed the current input value and filters the available options as desired. */
export declare type OptionsFilterFn<T, G = T> = (val: string, options: OptionType<T, G>[]) => OptionType<T, G>[];
interface UseSelectOptionsCommon<T, G = T> {
    /**
     * The options to potentially display (note, these will be filtered
     * with the 'filterFn' prop if the input value changes).
     *
     * NOTE: this should be memoized.
     */
    options: OptionType<T, G>[];
    /**
     * If multiple options should be allowed to be selected at a time.
     * @default false
     */
    allowMultiSelect?: boolean;
    /**
     * By default, all options are selectable, but this can be supplied
     * to disable selection of an option.
     *
     * This should return true if the option IS selectable; false otherwise.
     *
     * If an item is already selected then this will have no bearing.
     *
     * Note: this should be memoized.
     *
     * @default undefined (i.e., all options are selectable)
     */
    canSelect?: (option: OptionType<T, G>) => boolean;
    /**
     * Disables filtering the options (by label) when some text is input.
     * @default false (i.e., filter on text input)
     */
    disableFiltering?: boolean;
    /**
     * Disable initially highlighting the first item in the display options
     * @default false
     * */
    disableInitialHighlight?: boolean;
    /**
     * When the visibleOptions change (e.g., from typing in the input) an attempt
     * is made to find the last highlighted option in the new visible options array
     * and change the highlightIndex to the new index of the previously highlighted
     * option. Setting this to true will cause the highlight index to always be reset
     * when the visibleOptions change.
     *
     * @default false (i.e., recalculate highlight index on change)
     */
    disableRecalculateHighlightIndex?: boolean;
    /**
     * Disables selection of all items via click and/or highlight selection.
     * @default false (i.e., selection is NOT disabled)
     */
    disableSelection?: boolean;
    /**
     * Uses the input value to filter options. If the text matches a groupLabel,
     * all of the group's options will be shown. By default, this will use a
     * strict indexOf match (i.e., the string exists in some form as a label
     * in the options).
     *
     * NOTE: this should be memoized.
     * @default String#indexOf match will be used
     *
     * TODO: implement fuzzy search
     */
    filterFn?: OptionsFilterFn<T, G>;
    /**
     * By default, when an item is selected and the input text matches
     * the label of the selected item, then filtering will not be done.
     */
    filterWhenSelected?: boolean;
    initialOptions?: {
        selectedOptions?: OptionType<T, G>[];
    };
    /**
     * Allows to override the default implementation which checks if an
     * option was by using a triple equal check on the option's value
     * (i.e., OptionType#value).
     *
     * Note: should be memoized.
     */
    isSelectedCheck?: OptionSelectedCheck<T, G>;
    /**
     * This is called when the input value changes for the input field.
     * useSelect maintains its own internal state for values, but the one
     * provided overrides the internal value (resetting it on any change).
     */
    onChange?: (value: string) => void;
    /**
     * Search occurs when the enter key is pressed and no item has
     * been selected with the arrow keys (i.e., highlightIndex = -1).
     *
     * The current internal input value will be passed back. A 'search'
     * function is also passed back in UseSelectResult so that a search
     * can be triggered, where this function will be called as well.
     */
    onSearch?: (search: string) => void;
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
export interface UseSelectOptionsWithoutGroupSelect<T> extends UseSelectOptionsCommon<T, any> {
    /**
     * If the group/groupLabel itself is selectable. If this is the case
     * then the highlight index will include the groupLabel itself. Note,
     * when a group is selected, then the GroupSelectOption will be returned.
     */
    canSelectGroup?: false;
    /**
     * When the user clicks an item in the dropdown, or when the user
     * selects an item with the arrow keys (i.e., highlightIndex > -1).
     *
     * This differs from 'onChange' in that it is when an option is actually
     * selected and not when some text input occurs.
     */
    onSelect?: (value: string, selectedOption: SelectOption<T>) => void;
}
export interface UseSelectOptionsWithGroupSelect<T, G = T> extends UseSelectOptionsCommon<T, G> {
    /**
     * If the group/groupLabel itself is selectable. If this is the case
     * then the highlight index will include the groupLabel itself. Note,
     * when a group is selected, the GroupSelectOption will be returned.
     *
     * Currently, this allows for selecting a group within a group (that has
     * already been selected) - the user could disable this behavior on their
     * end if it is not desired, but it may be that nested groups aren't really
     * ever even used anyway.
     */
    canSelectGroup?: true;
    /**
     * When the user clicks an item in the dropdown, or when the user
     * selects an item with the arrow keys (i.e., highlightIndex > -1).
     *
     * The selected option may be a GroupSelectOption, you can use 'isGroupSelectOption'
     * to type guard/check the selected option if desired.
     */
    onSelect?: (value: string, selectedOption: OptionType<T, G>) => void;
}
export declare type UseSelectOptions<T, G> = UseSelectOptionsWithoutGroupSelect<T> | UseSelectOptionsWithGroupSelect<T, G>;
export interface OptionProps<T, G = T> {
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
    /**
     * When the keyboard is used to navigate the dropdown this specifies if
     * the highlight index is for the given item. This wraps the 'canSelectGroup'
     * functionality, so the consideration of highlighting/selecting is transparent
     * to the user.
     */
    isHighlighted: boolean;
    /** Occurs when the item has actually been selected via click or enter. */
    isSelected: boolean;
    /** Removes the item from selection. */
    onDeselect: () => void;
    /** Selects the option. */
    onSelect: () => void;
    /** The Group/SelectOption for this element. */
    option: OptionType<T, G>;
    /** Props to be spread into each option. This includes spread to group options as well.*/
    spreadProps: {
        /** Simply the option's label. Provided for accessibility. */
        ['aria-label']: string;
        ref?: MutableRefObject<any>;
    };
    /**
     * The OptionProps for each of the group's options.
     * This prop can be checked to determine if the current option prop is for a
     * GroupSelectOption - containing the correct OptionProps for the group's options.
     * */
    groupOptions?: OptionProps<T, G>[];
}
export interface UseSelectResult<T, G = T, E extends HTMLElement = HTMLInputElement> {
    /**
     * Provides the list of options to display. This is after filtering
     * and determining if it is highlighted or selected.
     */
    displayOptions: OptionProps<T, G>[];
    /**
     * To be set on the displayOptions parent container to check if the
     * highlighted index is out of bounds so that it will be scrolled into
     * view.
     * */
    dropdownContainerRef: MutableRefObject<any>;
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
    /** Props to be spread into the input field for this async select. */
    inputProps: {
        onChange: ChangeEventHandler<E>;
        onKeyDown: KeyboardEventHandler<E>;
        ref: MutableRefObject<E>;
        value: string;
    };
    /** If the input has been focused. */
    isInputFocused: boolean;
    /** Triggers the onSearch call that is passed in as a prop. */
    search: () => void;
    /**
     * If item(s) are selected then they will be returned here. The most recently
     * selected item is also passed to onSelect if it is provided.
     */
    selectedOptions: OptionType<T, G>[];
    /**
     * This gives the user the ability to manually set the selected options.
     * Be careful with this as it
     */
    setSelectedOptions: Dispatch<SetStateAction<OptionType<T, G>[]>>;
    /**
     * This handles the accessibility considerations of when to show the menu and
     * the user can conditionally display their menu based on this value.
     * E.g., showMenu && <DropDown/>
     */
    showMenu: boolean;
}
export declare function useSelect<T, G = T, E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(useSelectOptions: UseSelectOptions<T, G>): UseSelectResult<T, G, E>;
export {};
