import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type'> {
  step?: number | string;
  min?: number;
  max?: number;
}

export const NumberField: React.FC<NumberFieldProps> = (props) => {
  return <TextField type="number" {...props} />;
};
