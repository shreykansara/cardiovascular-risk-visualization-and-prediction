import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export type FieldProps = TextFieldProps;
export const Field: React.FC<FieldProps> = (props) => {
  return <TextField {...props} />;
};
