export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

export interface Reservation {
  id: string;
  patientId: string;
  service: string;
  practitioner: string | null;
  examination: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationListResponse {
  items: Reservation[];
}

export interface ReservationResponse {
  reservation: Reservation;
}

export interface ReservationQuery {
  date?: string;
  status?: ReservationStatus;
  patientId?: string;
}

export interface CreateReservationPayload {
  patientId: string;
  service: string;
  practitioner?: string | null;
  examination?: string | null;
  scheduledAt: string;
  durationMinutes: number;
}

export type UpdateReservationPayload = Partial<Omit<CreateReservationPayload, 'patientId'>> & {
  status?: ReservationStatus;
};
