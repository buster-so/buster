import type { HealthCheckResponse } from '@buster/server-shared/healthcheck';
import type { User } from '@supabase/supabase-js';
import { createFileRoute } from '@tanstack/react-router';
import { useHealthcheck } from '@/api/buster_rest/healthcheck/queryRequests';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import type { RustApiError } from '@/api/errors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/CardBase';
import { Text } from '@/components/ui/typography/Text';
import { useAppVersionMeta } from '@/context/AppVersion/useAppVersion';
import { getSupabaseUser } from '@/integrations/supabase/getSupabaseUserClient';
import { formatDate } from '@/lib/date';

export const Route = createFileRoute('/healthcheck')({
  component: RouteComponent,
  beforeLoad: async () => {
    const supabaseUser = await getSupabaseUser();
    return { supabaseUser };
  },
  loader: async ({ context }) => {
    await prefetchGetMyUserInfo(context.queryClient);
    const { supabaseUser } = context;
    return { supabaseUser };
  },
});

function RouteComponent() {
  const { data, isLoading, error } = useHealthcheck();
  const supabaseUser = Route.useLoaderData().supabaseUser;
  const user = useGetUserBasicInfo();
  const appVersionData = useAppVersionMeta();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return <ErrorState error={new Error('No data received')} />;
  }

  return (
    <HealthcheckDashboard
      data={data}
      supabaseUser={supabaseUser}
      user={user}
      appVersionData={appVersionData}
    />
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen  flex items-center justify-center">
      <Card className="text-center max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <Text variant="secondary" size="base">
            Checking system health...
          </Text>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error }: { error: Error | RustApiError }) {
  return (
    <div className="min-h-screen  flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <CardTitle>Health Check Failed</CardTitle>
              <CardDescription>Unable to retrieve system status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <Text variant="secondary" size="sm">
              {error.message}
            </Text>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthcheckDashboard({
  data,
  supabaseUser,
  user,
  appVersionData,
}: {
  data: HealthCheckResponse;
  supabaseUser: Pick<User, 'email' | 'is_anonymous'>;
  user: ReturnType<typeof useGetUserBasicInfo>;
  appVersionData: ReturnType<typeof useAppVersionMeta>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-gray-700 bg-gray-200';
      case 'degraded':
      case 'warn':
        return 'text-gray-600 bg-gray-100';
      case 'unhealthy':
      case 'fail':
        return 'text-gray-800 bg-gray-300';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'degraded':
      case 'warn':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'unhealthy':
      case 'fail':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDate({ date: timestamp, format: 'LLL' });
  };

  return (
    <div className="min-h-screen  p-6 flex flex-col gap-4 items-center">
      <div className="w-full max-w-5xl flex flex-col gap-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-1">
          <Text size="4xl" className="font-bold">
            System Health Dashboard
          </Text>
          <Text variant="secondary" size="lg">
            Real-time monitoring of system components
          </Text>
        </div>

        {/* User Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Supabase User Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                Supabase User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(supabaseUser, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* User Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                User Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-md p-4 h-full">
                {user ? (
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                ) : (
                  <Text variant="secondary" className="h-full" size="sm">
                    No user data available
                  </Text>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Status Card */}
        <Card>
          <CardContent size="default">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mr-6 ${getStatusColor(
                    data.status
                  )}`}
                >
                  {getStatusIcon(data.status)}
                </div>
                <div className="flex flex-col">
                  <Text size="3xl" className="font-semibold capitalize">
                    {data.status}
                  </Text>
                  <Text variant="secondary" size="lg">
                    Overall System Status
                  </Text>
                </div>
              </div>
              <div className="text-right flex flex-col gap-0">
                <Text variant="tertiary" size="sm" className="mb-0">
                  Last checked
                </Text>
                <Text className="font-medium" size="lg">
                  {formatTimestamp(data.timestamp)}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent size="default">
              <div className="flex items-center py-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Text variant="tertiary" size="sm" className="">
                    Uptime
                  </Text>
                  <Text size="xl" className="font-semibold">
                    {formatUptime(data.uptime)}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent size="default">
              <div className="flex items-center py-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"
                    />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Text variant="tertiary" size="sm" className="">
                    Server Version
                  </Text>
                  <Text size="xl" className="font-semibold">
                    {data.version}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent size="default">
              <div className="flex items-center py-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Text variant="tertiary" size="sm" className="">
                    Environment
                  </Text>
                  <Text size="xl" className="font-semibold capitalize">
                    {data.environment}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent size="default">
              <div className="flex items-center py-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Text variant="tertiary" size="sm" className="">
                    App Builds
                  </Text>
                  <Text size="sm" className="font-mono">
                    Browser: {appVersionData.browserBuild || 'N/A'}
                  </Text>

                  <Text variant="tertiary" size="xs" className="">
                    Server: {appVersionData.buildId}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Checks */}
        <Card>
          <CardHeader size="default">
            <CardTitle>Component Health Checks</CardTitle>
          </CardHeader>
          <CardContent size="default">
            <div className="space-y-3">
              {Object.entries(data.checks).map(([componentName, check]) => (
                <div key={componentName} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getStatusColor(
                          check.status
                        )}`}
                      >
                        {getStatusIcon(check.status)}
                      </div>
                      <div className="flex flex-col gap-0">
                        <Text className="font-medium capitalize" size="lg">
                          {componentName}
                        </Text>
                        {check.message && (
                          <Text variant="secondary" size="sm" className="">
                            {check.message}
                          </Text>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {check.responseTime && (
                        <Text variant="tertiary" size="sm" className="mt-2 mr-3">
                          {check.responseTime}ms
                        </Text>
                      )}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          check.status
                        )}`}
                      >
                        {check.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Text variant="tertiary" size="sm">
            System health is monitored continuously. Data refreshes about every 30 seconds.
          </Text>
        </div>
      </div>
    </div>
  );
}
