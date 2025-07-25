import { type User, and, db, eq, isNull, organizations } from '@buster/database';
import type {
  AddApprovedDomainRequest,
  AddApprovedDomainsResponse,
} from '@buster/server-shared/security';
import { DomainService } from './domain-service';
import {
  checkAdminPermissions,
  fetchOrganization,
  validateUserOrganization,
} from './security-utils';

const domainService = new DomainService();

export async function addApprovedDomainsHandler(
  request: AddApprovedDomainRequest,
  user: User
): Promise<AddApprovedDomainsResponse> {
  // Validate user organization and permissions
  const userOrg = await validateUserOrganization(user.id);
  checkAdminPermissions(userOrg.role);

  // Fetch current organization
  const org = await fetchOrganization(userOrg.organizationId);
  const currentDomains = org.domains || [];

  // Merge domains using domain service
  const updatedDomains = domainService.mergeDomains(currentDomains, request.domains);

  // Update organization with new domains
  await updateOrganizationDomains(userOrg.organizationId, updatedDomains);

  // Return formatted response
  return domainService.formatDomainsResponse(updatedDomains, org.createdAt);
}

async function updateOrganizationDomains(organizationId: string, domains: string[]): Promise<void> {
  await db
    .update(organizations)
    .set({
      domains,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)));
}
