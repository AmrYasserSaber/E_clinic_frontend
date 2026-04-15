import { AppointmentStatus } from '../../models/domain.models';

export type QueueStatusUiKey = AppointmentStatus | 'IN_PROGRESS';

export type QueueStatusUi = Readonly<{
  label: string;
  helper: string;
  className: string;
}>;

export const QUEUE_STATUS_UI: Readonly<Record<QueueStatusUiKey, QueueStatusUi>> = {
  REQUESTED: {
    label: 'Requested',
    helper: 'Awaiting confirmation.',
    className: 'text-on-surface-variant',
  },
  CONFIRMED: {
    label: 'Confirmed',
    helper: 'Scheduled and expected to arrive.',
    className: 'text-(--color-primary)',
  },
  CHECKED_IN: {
    label: 'Checked in',
    helper: 'Patient is waiting in the clinic.',
    className: 'text-(--color-primary)',
  },
  IN_PROGRESS: {
    label: 'In progress',
    helper: 'Consultation is currently ongoing.',
    className: 'text-(--color-primary)',
  },
  COMPLETED: {
    label: 'Completed',
    helper: 'Consultation is finished.',
    className: 'text-(--color-secondary)',
  },
  CANCELLED: {
    label: 'Cancelled',
    helper: 'Appointment was cancelled.',
    className: 'text-error',
  },
  NO_SHOW: {
    label: 'No-show',
    helper: 'Patient did not arrive.',
    className: 'text-error',
  },
};
