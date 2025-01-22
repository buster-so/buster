import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads/threadConfigInterfaces';
import React, { useState } from 'react';
import { LabelAndInput } from '../Common';
import { CollapseDelete } from '../Common/CollapseDelete';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ColorPicker, Divider, Input, InputNumber, Switch } from 'antd';
import { AppMaterialIcons } from '@/components';
import { ChartEncodes, GoalLine } from '@/components/charts';
import { v4 as uuidv4 } from 'uuid';
import { useMemoizedFn, useSet } from 'ahooks';
import { ColumnMetaData } from '@/api/buster_rest';

interface LoopGoalLine extends GoalLine {
  id: string;
}

export const EditGoalLine: React.FC<{
  goalLines: IBusterThreadMessageChartConfig['goalLines'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  columnMetadata: ColumnMetaData[] | undefined;
  selectedAxis: ChartEncodes;
}> = React.memo(
  ({ goalLines, onUpdateChartConfig, columnMetadata, selectedAxis }) => {
    const [goals, setGoals] = useState<LoopGoalLine[]>(
      goalLines.map((goal) => ({ ...goal, id: uuidv4() }))
    );
    const [newGoalIds, { add: addNewGoalId }] = useSet<string>();

    const yAxisKeys = selectedAxis.y;

    const onAddGoalLine = useMemoizedFn(() => {
      const yAxisKey = yAxisKeys[0];
      const yAxisMetadata = columnMetadata?.find((meta) => meta.name === yAxisKey);
      const yAxisValue: number =
        yAxisMetadata?.max_value && typeof yAxisMetadata.max_value === 'number'
          ? Math.round(yAxisMetadata?.max_value * 0.85)
          : 200;

      const newGoalLine: Required<LoopGoalLine> = {
        id: uuidv4(),
        show: true,
        value: yAxisValue,
        showGoalLineLabel: true,
        goalLineLabel: null,
        goalLineColor: null
      };

      addNewGoalId(newGoalLine.id);
      setGoals((prev) => {
        const newGoals = [...prev, newGoalLine];
        onUpdateGoalLines(newGoals);
        return newGoals;
      });
    });

    const onUpdateGoalLines = useMemoizedFn((goals: LoopGoalLine[]) => {
      const newGoals = goals.map(({ id, ...rest }) => ({
        ...rest
      }));

      requestAnimationFrame(() => {
        onUpdateChartConfig({ goalLines: newGoals });
      });
    });

    const onDeleteGoalLine = useMemoizedFn((id: string) => {
      setGoals((prev) => {
        const newGoals = prev.filter((goal) => goal.id !== id);
        onUpdateGoalLines(newGoals);
        return newGoals;
      });
    });

    const onUpdateExisitingGoalLine = useMemoizedFn((goal: LoopGoalLine) => {
      setGoals((prev) => {
        const newGoals = prev.map((g) => (g.id === goal.id ? goal : g));
        onUpdateGoalLines(newGoals);
        return newGoals;
      });
    });

    return (
      <div className="flex flex-col space-y-2.5">
        <LabelAndInput label="Goal line">
          <div className="flex items-center justify-end">
            <Button onClick={onAddGoalLine} type="text" icon={<AppMaterialIcons icon="add" />}>
              Add goal line
            </Button>
          </div>
        </LabelAndInput>

        <AnimatePresence mode="popLayout" initial={false}>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              layout="position"
              layoutId={goal.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: 'auto',
                transition: {
                  height: { type: 'spring', bounce: 0.2, duration: 0.6 },
                  opacity: { duration: 0.2 }
                }
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -5,
                transition: {
                  height: { duration: 0.2 },
                  opacity: { duration: 0.2 }
                }
              }}>
              <EditGoalLineItem
                goal={goal}
                onDeleteGoalLine={onDeleteGoalLine}
                onUpdateExisitingGoalLine={onUpdateExisitingGoalLine}
                isNewGoal={newGoalIds.has(goal.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  },
  () => {
    return true;
  }
);
EditGoalLine.displayName = 'EditGoalLine';

const EditGoalLineItem: React.FC<{
  goal: LoopGoalLine;
  isNewGoal: boolean;
  onUpdateExisitingGoalLine: (goal: LoopGoalLine) => void;
  onDeleteGoalLine: (id: string) => void;
}> = ({ goal, isNewGoal, onUpdateExisitingGoalLine, onDeleteGoalLine }) => {
  return (
    <CollapseDelete
      initialOpen={isNewGoal}
      title={
        goal.showGoalLineLabel ? goal.goalLineLabel || `Goal: ${goal.value}` : `Goal: ${goal.value}`
      }
      onDelete={() => onDeleteGoalLine(goal.id)}>
      <GoalLineItemContent goal={goal} onUpdateExisitingGoalLine={onUpdateExisitingGoalLine} />
    </CollapseDelete>
  );
};

const GoalLineItemContent: React.FC<{
  goal: LoopGoalLine;
  onUpdateExisitingGoalLine: (goal: LoopGoalLine) => void;
}> = React.memo(({ goal, onUpdateExisitingGoalLine }) => {
  const { show, value, showGoalLineLabel, goalLineLabel, goalLineColor } = goal;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-2.5 p-2.5">
        <LabelAndInput label="Show goal line">
          <div className="flex w-full justify-end">
            <Switch
              defaultChecked={show}
              onChange={(checked) => onUpdateExisitingGoalLine({ ...goal, show: checked })}
            />
          </div>
        </LabelAndInput>

        <LabelAndInput label="Goal line value">
          <div className="flex w-full justify-end">
            <InputNumber
              className="min-w-[120px]"
              defaultValue={value}
              onChange={(value) => onUpdateExisitingGoalLine({ ...goal, value: value as number })}
            />
          </div>
        </LabelAndInput>

        <LabelAndInput label="Goal line color">
          <div className="flex w-full items-center justify-end">
            <ColorPicker
              size="small"
              value={goalLineColor}
              defaultValue={'#000000'}
              onChangeComplete={(color) => {
                const hexColor = color.toHexString();
                onUpdateExisitingGoalLine({ ...goal, goalLineColor: hexColor });
              }}
              onClear={() => {
                onUpdateExisitingGoalLine({ ...goal, goalLineColor: null });
              }}
            />
          </div>
        </LabelAndInput>
      </div>

      <Divider />

      <div className="flex flex-col space-y-2.5 p-2.5">
        <LabelAndInput label="Show line label">
          <div className="flex w-full justify-end">
            <Switch
              defaultChecked={showGoalLineLabel}
              onChange={(checked) =>
                onUpdateExisitingGoalLine({ ...goal, showGoalLineLabel: checked })
              }
            />
          </div>
        </LabelAndInput>

        {showGoalLineLabel && (
          <LabelAndInput label="Goal line label">
            <div className="flex w-full justify-end">
              <Input
                className="w-full"
                defaultValue={goalLineLabel || ''}
                placeholder="Goal"
                onChange={(e) =>
                  onUpdateExisitingGoalLine({ ...goal, goalLineLabel: e.target.value })
                }
              />
            </div>
          </LabelAndInput>
        )}
      </div>
    </div>
  );
});
GoalLineItemContent.displayName = 'GoalLineItemContent';
