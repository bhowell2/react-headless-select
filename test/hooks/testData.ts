import { OptionType } from '../../src/ts/hooks/useSelect'

export const fourGroupOptions = [
  {
    label: 'four.1',
    value: 'four.1'
  },
  {
    label: 'four.2',
    value: 'four.2'
  },
  {
    label: 'four.3',
    value: 'four.3'
  },
  {
    label: 'four.4',
    value: 'four.4'
  }
]
export const testOptions: OptionType<string>[] = [
  {
    label: 'one',
    value: 'one'
  },
  {
    label: 'two',
    value: 'two'
  },
  {
    label: 'three',
    value: 'three'
  },
  {
    groupLabel: 'four',
    options: fourGroupOptions,
    value: '4'
  },
  {
    label: 'five',
    value: 'five'
  }
]
// note the -1 is b/c four is not selectable
export const totalSelectableOptionsNoGroupSelectLength =
  testOptions.length - 1 + fourGroupOptions.length
export const totalSelectableOptionsWithGroupSelectLength =
  totalSelectableOptionsNoGroupSelectLength + 1

export const nestedGroupedOptions: OptionType<string>[] = [
  {
    groupLabel: '0',
    options: [
      {
        groupLabel: '0.0',
        options: [
          {
            groupLabel: '0.0.0',
            options: [
              {
                label: '0.0.0.0',
                value: '0.0.0.0'
              }
            ],
            value: '0.0.0'
          }
        ],
        value: '0.0'
      },
      {
        label: '0.1',
        value: '0.1'
      }
    ],
    value: '0'
  },
  {
    label: '1',
    value: '1'
  },
  {
    groupLabel: '2',
    options: [
      {
        groupLabel: '2.0',
        options: [
          {
            label: '2.0.0',
            value: '2.0.0'
          }
        ],
        value: '2.0'
      }
    ],
    value: '2'
  }
]
