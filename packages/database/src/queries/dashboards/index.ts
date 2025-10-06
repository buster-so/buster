export {
  getChatDashboardFiles,
  type DashboardFileContext,
  type DashboardFile,
} from './dashboards';

export {
  getDashboardTitle,
  GetDashboardTitleInputSchema,
  type GetDashboardTitleInput,
} from './get-dashboard-title';

export {
  getDashboardById,
  GetDashboardByIdInputSchema,
  type GetDashboardByIdInput,
} from './get-dashboard-by-id';

export { updateDashboard } from './update-dashboard';

export {
  getCollectionsAssociatedWithDashboard,
  type AssociatedCollection,
} from './get-collections-associated-with-dashboard';
