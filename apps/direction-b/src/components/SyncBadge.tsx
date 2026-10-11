import React from 'react';
import type { SyncTable } from '@revivex/backend';
import { CloudStatusChip } from '@revivex/design-system';
import { useSync } from '../sync/SyncContext';

export default function SyncBadge({ table, clientId }: { table: SyncTable; clientId: string }) {
  const { cloudState, statusFor } = useSync();
  if (cloudState !== 'active') return null;
  return <CloudStatusChip status={statusFor(table, clientId)} />;
}
