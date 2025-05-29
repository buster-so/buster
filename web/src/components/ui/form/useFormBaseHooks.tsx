import { createFormHook } from '@tanstack/react-form';
import {
  fieldContext,
  formContext,
  NumberField,
  PasswordField,
  SubscribeButton,
  TextField
} from './FormBase';

const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
    PasswordField
  },

  formComponents: {
    SubscribeButton
  },
  fieldContext,
  formContext
});

export { useAppForm, withForm };
