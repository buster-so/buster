import { createFormHookContexts } from '@tanstack/react-form';
import { Label } from '../label/LabelBase';
import { Input } from '../inputs';
import { InputPassword } from '../inputs/InputPassword';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons';
import type { ReactNode } from 'react';
import { Text } from '../typography';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export function LabelWrapper({
  label,
  children,
  direction = 'row',
  className = '',
  labelClassName = '',
  htmlFor
}: {
  label: string | null;
  children: ReactNode;
  direction?: 'row' | 'column';
  className?: string;
  labelClassName?: string;
  htmlFor?: string;
}) {
  if (label === null) return <>{children}</>;

  return (
    <div
      className={cn(
        'label-wrapper flex gap-x-4 gap-y-2',
        direction === 'row' ? 'flex-row items-center' : 'flex-col justify-start',
        className
      )}>
      <Label
        className={cn(
          'truncate',
          direction === 'row' ? 'min-w-fit flex-grow' : 'w-full',
          labelClassName
        )}
        htmlFor={htmlFor}>
        {label}
      </Label>

      {children}
    </div>
  );
}

export function TextField({
  label,
  direction = 'row',
  className = '',
  labelClassName = '',
  type,
  placeholder
}: {
  label: string | null;
  direction?: 'row' | 'column';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  type?: Parameters<typeof Input>[0]['type'];
}) {
  const field = useFieldContext<string>();
  const {
    name,
    state: {
      value,
      meta: { errors, isTouched }
    }
  } = field;
  const error = errors?.[0]?.message;
  const isFormSubmitted = field.form.state.submissionAttempts > 1;
  const showError = !!error && (isFormSubmitted || isTouched);

  const InputComponent = (
    <div className={cn('relative flex w-full flex-col', className)}>
      <Input
        id={name}
        className={cn('w-full flex-shrink')}
        value={value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        type={type}
        placeholder={placeholder}
      />
      {showError && (
        <Text className="mt-0.5 text-left" size={'sm'} variant={'danger'}>
          {error}
        </Text>
      )}
    </div>
  );

  if (label === null) return InputComponent;

  return (
    <LabelWrapper
      label={label}
      direction={direction}
      labelClassName={labelClassName}
      htmlFor={field.name}>
      {InputComponent}
    </LabelWrapper>
  );
}

export function NumberField(props: Parameters<typeof TextField>[0]) {
  const field = useFieldContext<number>();
  const isFormSubmitted = field.form.state.submissionAttempts > 1;
  const {
    name,
    state: {
      value,
      meta: { errors, isTouched }
    }
  } = field;
  const error = errors?.[0]?.message;

  const showError = !!error && (isFormSubmitted || isTouched);

  const InputComponent = (
    <div className={cn('relative flex w-full flex-col', props.className)}>
      <Input
        id={name}
        className={cn('w-full flex-shrink')}
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value === '' ? 0 : Number(e.target.value);
          field.handleChange(val);
        }}
        type="number"
        placeholder={props.placeholder}
      />
      {showError && (
        <Text className="mt-0.5 text-left" size={'sm'} variant={'danger'}>
          {error}
        </Text>
      )}
    </div>
  );

  if (props.label === null) return InputComponent;

  return (
    <LabelWrapper
      label={props.label}
      direction={props.direction}
      labelClassName={props.labelClassName}
      htmlFor={field.name}>
      {InputComponent}
    </LabelWrapper>
  );
}

export function PasswordField({
  label,
  direction,
  className,
  inputClassName,
  labelClassName,
  placeholder
}: Parameters<typeof TextField>[0]) {
  const field = useFieldContext<string>();
  const {
    name,
    state: {
      value,
      meta: { errors, isTouched }
    }
  } = field;
  const error = errors?.[0]?.message;
  const isFormSubmitted = field.form.state.submissionAttempts > 1;
  const showError = !!error && (isFormSubmitted || isTouched);

  const InputComponent = (
    <div className={cn('relative flex w-full flex-col', className)}>
      <InputPassword
        id={name}
        className={cn('flex-shrink', inputClassName)}
        value={value || ''}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
      />
      {showError && (
        <Text className="mt-0.5 text-left" size={'sm'} variant={'danger'}>
          {error}
        </Text>
      )}
    </div>
  );

  if (label === null) return InputComponent;

  return (
    <LabelWrapper
      label={label}
      direction={direction}
      className={className}
      labelClassName={labelClassName}
      htmlFor={field.name}>
      {InputComponent}
    </LabelWrapper>
  );
}

export function MultipleInlineFields({
  children,
  direction = 'row',
  label,
  labelClassName = '',
  className = ''
}: {
  direction?: 'row' | 'column';
  label: string;
  labelClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <LabelWrapper
      label={label}
      direction={direction}
      labelClassName={labelClassName}
      className={className}>
      <div className="flex w-full flex-grow gap-2">{children}</div>
    </LabelWrapper>
  );
}

export function SubscribeButton({
  submitLabel,
  useResetButton = true,
  disableIfNotChanged = false
}: {
  submitLabel: string;
  useResetButton?: boolean;
  disableIfNotChanged?: boolean;
}) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}>
      {([canSubmit, isSubmitting]) => (
        <div className="flex w-full justify-end space-x-2">
          {useResetButton && (
            <Button variant="ghost" type="reset" onClick={() => form.reset()}>
              Reset
            </Button>
          )}
          <Button
            variant="black"
            type="submit"
            disabled={!canSubmit || (disableIfNotChanged && !form.state.isDirty)}
            loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form.Subscribe>
  );
}
