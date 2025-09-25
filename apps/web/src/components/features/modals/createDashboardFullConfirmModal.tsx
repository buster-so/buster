import { MAX_NUMBER_OF_ITEMS_ON_DASHBOARD } from '@buster/server-shared/dashboards';
import { cn } from '@/lib/classMerge';
import { Text } from '../../ui/typography/Text';
import { Title } from '../../ui/typography/Title';

export const createDashboardFullConfirmModal = ({
  availableSlots,
  metricsToActuallyAdd,
  metricsToAdd,
}: {
  availableSlots: number;
  metricsToActuallyAdd: { id: string; name: string }[];
  metricsToAdd: { id: string; name: string }[];
}) => {
  return (
    <div className="relative">
      <div className="max-h-[55vh] space-y-5 overflow-auto p-0 pb-5">
        <div className="rounded border border-gray-100 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-900">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Only <span className="text-foreground font-semibold">{availableSlots}</span> metrics can
            be added to stay within the limit of{' '}
            <span className="text-foreground font-semibold">
              {MAX_NUMBER_OF_ITEMS_ON_DASHBOARD}
            </span>{' '}
            metrics.
          </Text>
        </div>

        <div className="ml-2.5 space-y-6">
          <div>
            <Title size="h5" variant="primary" className="mb-3">
              Will be added
            </Title>
            <ul className="space-y-2">
              {metricsToActuallyAdd.map((metric) => (
                <li key={metric.id} className="flex items-center gap-2">
                  <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                  <Text className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                    {metric.name}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          {metricsToAdd.length > availableSlots && (
            <div>
              <Title size="h5" variant="danger" className="mb-3">
                Will not be added
              </Title>
              <ul className="space-y-2">
                {metricsToAdd.slice(availableSlots).map((metric) => (
                  <li key={metric.id} className="flex items-center gap-2">
                    <div className="bg-danger-foreground h-1.5 w-1.5 rounded-full" />
                    <Text
                      className={cn(
                        'text-sm font-medium transition-colors duration-200',
                        'text-danger/80 hover:text-danger'
                      )}
                    >
                      {metric.name}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="from-background pointer-events-none absolute right-0 bottom-[-2px] left-0 h-8 w-full bg-gradient-to-t to-transparent" />
    </div>
  );
};
