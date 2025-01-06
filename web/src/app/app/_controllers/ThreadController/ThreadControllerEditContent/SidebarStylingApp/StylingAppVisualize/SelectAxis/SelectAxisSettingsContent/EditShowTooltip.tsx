import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Switch } from 'antd';

export const EditShowTooltip: React.FC<{
  disableTooltip: boolean;
  onChangeDisableTooltip: (value: boolean) => void;
}> = React.memo(
  ({ disableTooltip, onChangeDisableTooltip }) => {
    return (
      <LabelAndInput label="Disable tooltip">
        <div className="flex justify-end">
          <Switch defaultChecked={disableTooltip} onChange={onChangeDisableTooltip} />
        </div>
      </LabelAndInput>
    );
  },
  (prevProps, nextProps) => {
    return true;
  }
);
EditShowTooltip.displayName = 'EditShowTooltip';
