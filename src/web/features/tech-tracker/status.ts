export type TechStatus = 'owned' | 'available' | 'locked';

export const STATUS_BADGE: Record<
  TechStatus,
  { label: string; variant: 'success' | 'default' | 'muted' }
> = {
  owned: { label: 'Owned', variant: 'success' },
  available: { label: 'Available', variant: 'default' },
  locked: { label: 'Locked', variant: 'muted' },
};
