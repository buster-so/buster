import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { formOptions } from '@tanstack/react-form';
import React from 'react';
import { useAppForm, withForm } from './useFormBaseHooks';

const formOpts = formOptions({
  defaultValues: {
    firstName: 'John',
    lastName: 'Doe'
  },
  onSubmit: fn()
});

const ChildForm = withForm({
  ...formOpts,
  // Optional, but adds props to the `render` function outside of `form`
  props: {
    title: 'Child Form'
  },
  render: ({ form, title }) => {
    return (
      <div>
        <p className="text-lg font-bold text-red-500">{title}</p>
        <form.AppField
          name="firstName"
          children={(field) => <field.TextField label="First Name" />}
        />
      </div>
    );
  }
});

const FormTest = () => {
  const form = useAppForm({
    ...formOpts
  });

  return (
    <form className="flex flex-col gap-2" onSubmit={form.handleSubmit}>
      <ChildForm form={form} title="Child Form" />
      <form.AppField name="lastName" children={(field) => <field.TextField label="Last Name" />} />

      <form.AppForm>
        <form.SubscribeButton submitLabel="Submit" />
      </form.AppForm>
    </form>
  );
};

const meta: Meta<typeof FormTest> = {
  title: 'UI/Forms/FormBase',
  component: FormTest,
  parameters: {
    layout: 'centered'
  },
  args: {
    onChange: fn()
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[300px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof FormTest>;

export const Default: Story = {};
