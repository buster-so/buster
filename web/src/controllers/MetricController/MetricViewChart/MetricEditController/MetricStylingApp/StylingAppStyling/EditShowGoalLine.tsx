import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useState } from 'react';
import { LabelAndInput } from '../Common';
import { CollapseDelete } from '../Common/CollapseDelete';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/buttons';
import { ColorPicker } from '@/components/ui/color-picker';
import { Separator } from '@/components/ui/seperator';
import { Input } from '@/components/ui/inputs';
import { InputNumber } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/switch';
import { Plus } from '@/components/ui/icons';
import { ChartEncodes, GoalLine } from '@/api/asset_interfaces/metric/charts';
import { v4 as uuidv4 } from 'uuid';
import { useMemoizedFn, useSet } from '@/hooks';
import { ColumnMetaData } from '@/api/asset_interfaces';

interface LoopGoalLine extends GoalLine {
  id: string;
}

export const EditGoalLine: React.FC<{
  goalLines: IBusterMetricChartConfig['goalLines'];
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  columnMetadata: ColumnMetaData[] | undefined;
  selectedAxis: ChartEncodes;
}> = React.memo(({ goalLines, onUpdateChartConfig, columnMetadata, selectedAxis }) => {
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
          <Button onClick={onAddGoalLine} variant="ghost" prefix={<Plus />}>
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
});
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
              checked={show}
              onCheckedChange={(checked) => onUpdateExisitingGoalLine({ ...goal, show: checked })}
            />
          </div>
        </LabelAndInput>

        <LabelAndInput label="Goal line value">
          <div className="flex w-full justify-end">
            <InputNumber
              className="min-w-[120px]"
              value={value}
              onChange={(value) => onUpdateExisitingGoalLine({ ...goal, value: value as number })}
            />
          </div>
        </LabelAndInput>

        <LabelAndInput label="Goal line color">
          <div className="flex w-full items-center justify-end">
            <ColorPicker
              value={goalLineColor}
              onChangeComplete={(color) => {
                const hexColor = color;
                onUpdateExisitingGoalLine({ ...goal, goalLineColor: hexColor });
              }}
            />
          </div>
        </LabelAndInput>
      </div>

      <Separator />

      <div className="flex flex-col space-y-2.5 p-2.5">
        <LabelAndInput label="Show line label">
          <div className="flex w-full justify-end">
            <Switch
              checked={showGoalLineLabel}
              onCheckedChange={(checked) =>
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
                value={goalLineLabel || ''}
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
