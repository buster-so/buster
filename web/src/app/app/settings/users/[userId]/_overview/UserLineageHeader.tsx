import React from 'react';
import { HeaderExplanation } from '@/app/app/_components/PermissionComponents';
import type { OrganizationUser } from '@/api/buster_rest';

export const UserLineageHeader = React.memo(
  ({ className = '', user }: { className?: string; user: OrganizationUser }) => {
    return (
      <HeaderExplanation
        className={className}
        title={`Dataset access & lineage`}
        description={`View ${user.name}’s access to all available datasets. Lineage is provided to show where access originates from.`}
      />
    );
  }
);

UserLineageHeader.displayName = 'UserLineageHeader';
