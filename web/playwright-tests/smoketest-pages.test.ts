import { BusterRoutes, createBusterRoute } from '@/routes';
import { expect, test } from '@playwright/test';

// Define routes
const homePage = createBusterRoute({
  route: BusterRoutes.APP_HOME
});
const loginPage = createBusterRoute({
  route: BusterRoutes.AUTH_LOGIN
});

test.describe('Authentication Flow', () => {
  test('should redirect when cookies are cleared', async ({ page, context }) => {
    // First visit home page
    await page.goto(homePage);
    await expect(page).toHaveURL(homePage);

    // Clear cookies to remove authentication
    await context.clearCookies();

    // Try to access the protected home page again
    await page.goto(homePage);
    await page.waitForTimeout(25);

    // Should be redirected away from the protected route
    await expect(page).not.toHaveURL(homePage);
    await expect(page).toHaveURL(loginPage);
  });

  test('go to home page', async ({ page }) => {
    await page.goto(homePage);

    //for 100 milliseconds
    await page.waitForTimeout(10);

    await expect(page).toHaveURL(homePage);
  });
});

test.describe('Asset Route Redirects', () => {
  // Routes that need testing from assetRedirectRecord
  const routesToTest = {
    metricChart: createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_CHART,
      metricId: 'test-metric-id'
    }),
    metricResults: createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_RESULTS,
      metricId: 'test-metric-id'
    }),
    metricFile: createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_FILE__HIDDEN,
      metricId: 'test-metric-id'
    }),
    metricVersion: createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
      metricId: 'test-metric-id',
      versionNumber: 1
    }),
    dashboard: createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: 'test-dashboard-id'
    }),
    dashboardFile: createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID_FILE,
      dashboardId: 'test-dashboard-id'
    }),
    dashboardVersion: createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER,
      dashboardId: 'test-dashboard-id',
      versionNumber: 1
    }),
    chat: createBusterRoute({
      route: BusterRoutes.APP_CHAT
    }),
    chatId: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: 'test-chat-id'
    }),
    chatMetric: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id'
    }),
    chatMetricChart: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id'
    }),
    chatMetricResults: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id'
    }),
    chatMetricFile: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id'
    }),
    chatMetricVersion: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id',
      versionNumber: 1
    }),
    chatDashboard: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
      chatId: 'test-chat-id',
      dashboardId: 'test-dashboard-id'
    }),
    chatDashboardFile: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE,
      chatId: 'test-chat-id',
      dashboardId: 'test-dashboard-id'
    }),
    chatDashboardVersion: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      chatId: 'test-chat-id',
      dashboardId: 'test-dashboard-id',
      versionNumber: 1
    })
  };

  for (const [routeName, routeUrl] of Object.entries(routesToTest)) {
    test(`should redirect from ${routeName} when not authenticated`, async ({ page, context }) => {
      // First visit home page
      await page.goto(homePage);
      await expect(page).toHaveURL(homePage);

      // Clear cookies to remove authentication
      await context.clearCookies();

      // Try to access the protected route
      await page.goto(routeUrl);

      // Should be redirected away from the protected route
      await expect(page).not.toHaveURL(routeUrl);
    });
  }
});

test.describe('Public Pages - No Redirect', () => {
  // Routes that should be accessible without authentication
  const publicRoutes = {
    login: createBusterRoute({
      route: BusterRoutes.AUTH_LOGIN
    }),
    resetPassword: createBusterRoute({
      route: BusterRoutes.AUTH_RESET_PASSWORD
    }),
    resetPasswordEmail: createBusterRoute({
      route: BusterRoutes.AUTH_RESET_PASSWORD_EMAIL
    }),
    confirmEmail: createBusterRoute({
      route: BusterRoutes.AUTH_CONFIRM_EMAIL
    }),
    // Add embed routes
    embedMetric: createBusterRoute({
      route: BusterRoutes.EMBED_METRIC_ID,
      metricId: 'test-metric-id'
    }),
    embedDashboard: createBusterRoute({
      route: BusterRoutes.EMBED_DASHBOARD_ID,
      dashboardId: 'test-dashboard-id'
    })
  };

  for (const [routeName, routeUrl] of Object.entries(publicRoutes)) {
    test(`should not redirect from public route ${routeName} when not authenticated`, async ({
      page,
      context
    }) => {
      // Clear cookies to ensure user is not authenticated
      await context.clearCookies();

      // Try to access the public route
      await page.goto(routeUrl);

      // Should NOT be redirected away from the public route
      await expect(page).toHaveURL(routeUrl);
    });
  }
});

test.describe('Authenticated Page', () => {
  //this is just a smoke tests for now
  const authenticatedPages = {
    home: createBusterRoute({
      route: BusterRoutes.APP_HOME
    }),
    metricList: createBusterRoute({
      route: BusterRoutes.APP_METRIC
    }),
    dashboardList: createBusterRoute({
      route: BusterRoutes.APP_DASHBOARDS
    }),
    chat: createBusterRoute({
      route: BusterRoutes.APP_CHAT
    }),
    chatId: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: 'test-chat-id'
    }),
    chatIdMetricId: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID,
      chatId: 'test-chat-id',
      metricId: 'test-metric-id'
    }),
    chatIdDashboardId: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
      chatId: 'test-chat-id',
      dashboardId: 'test-dashboard-id'
    }),
    chatIdDashboardIdVersionNumber: createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      chatId: 'test-chat-id',
      dashboardId: 'test-dashboard-id',
      versionNumber: 1
    }),
    settings: createBusterRoute({
      route: BusterRoutes.SETTINGS
    }),
    settingsGeneral: createBusterRoute({
      route: BusterRoutes.SETTINGS_API_KEYS
    })
  };

  //make sure we are chad
  test('make sure we are chad', async ({ page }) => {
    await page.goto(homePage);

    //assert the chad@buster.so is found on the page somewhere
    await expect(page.locator('html')).toContainText('chad@buster.so');
  });

  for (const [routeName, routeUrl] of Object.entries(authenticatedPages)) {
    test(`should redirect from ${routeName} when not authenticated`, async ({ page, context }) => {
      await page.goto(routeUrl);

      await expect(page).toHaveURL(routeUrl);
    });
  }
});
