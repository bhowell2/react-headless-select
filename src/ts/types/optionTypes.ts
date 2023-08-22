// Extended object type alias
import { Either } from './typeUtils'

export type ExtObj = Record<string, unknown>

/**
 * ExtraOptProps are to provide additional properties to the
 */
export type SelectOption<T, ExtraOptProps extends ExtObj = ExtObj> = {
  label: string
  value: T
} & ExtraOptProps

export type GroupSelectOption<T, G = T, O extends ExtObj = ExtObj> = {
  groupLabel: string
  /**
   * Options can be a combination of SelectOptions and GroupSelectOptions
   * (allowing for nested grouping).
   * */
  options: OptionType<T, G, O>[]
  value: G
} & O

export type OptionType<T, G = T, O extends ExtObj = ExtObj> = Either<
  SelectOption<T, O>,
  GroupSelectOption<T, G, O>
>
