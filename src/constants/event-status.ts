export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export const EVENT_STATUS_LABEL = {
  [EVENT_STATUS.DRAFT]: 'Draft',
  [EVENT_STATUS.PUBLISHED]: 'Published',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
  [EVENT_STATUS.ARCHIVED]: 'Archived',
};

export const EVENT_STATUS_VALUES = Object.values(EVENT_STATUS);
