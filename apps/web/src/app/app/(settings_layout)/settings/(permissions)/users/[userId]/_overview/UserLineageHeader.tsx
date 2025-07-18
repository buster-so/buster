import React from 'react';
import type { OrganizationUser } from '@buster/server-shared/organization';
import { HeaderExplanation } from '@/components/features/PermissionComponents';

export const UserLineageHeader = React.memo(
  ({ className = '', user }: { className?: string; user: OrganizationUser }) => {
    return (
      <HeaderExplanation
        className={className}
        title={'Dataset access & lineage'}
        description={`View ${user.name}’s access to all available datasets. Lineage is provided to show where access originates from.`}
      />
    );
  }
);

UserLineageHeader.displayName = 'UserLineageHeader';
