import {
  NumericFormat,
} from 'react-number-format'

import type {
  ComponentProps,
} from 'react'


type NumericFormatProps =
  ComponentProps<
    typeof NumericFormat
  >


interface NumericInputProps
  extends Omit<
    NumericFormatProps,
    | 'type'
    | 'onValueChange'
    | 'isAllowed'
  > {
  minimum?: number
  maximum?: number
  integer?: boolean

  onNumericValueChange?: (
    value: number,
  ) => void

  onTextValueChange?: (
    value: string,
  ) => void
}


function NumericInput({
  minimum,
  maximum,
  integer = false,
  onNumericValueChange,
  onTextValueChange,
  decimalScale,
  allowNegative,
  thousandSeparator = ',',
  ...props
}: NumericInputProps) {
  return (
    <NumericFormat
      {...props}
      type="text"
      inputMode={
        integer
          ? 'numeric'
          : 'decimal'
      }
      thousandSeparator={
        thousandSeparator
      }
      decimalScale={
        integer
          ? 0
          : decimalScale
      }
      allowNegative={
        allowNegative ??
        (
          minimum === undefined ||
          minimum < 0
        )
      }
      isAllowed={values => {
        const value =
          values.floatValue

        if (value === undefined) {
          return true
        }

        if (
          minimum !== undefined &&
          value < minimum
        ) {
          return false
        }

        if (
          maximum !== undefined &&
          value > maximum
        ) {
          return false
        }

        if (
          integer &&
          !Number.isInteger(value)
        ) {
          return false
        }

        return true
      }}
      onValueChange={values => {
        onTextValueChange?.(
          values.value,
        )

        if (
          values.floatValue !==
          undefined
        ) {
          onNumericValueChange?.(
            values.floatValue,
          )
        }
      }}
    />
  )
}


export default NumericInput