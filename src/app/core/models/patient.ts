export const PATIENT_STATUSES = [
  'WAITING',
  'IN_PROGRESS',
  'IN_EXAMINATION',
  'WAITING_RESULT',
  'READY_FOR_DISCHARGE',
  'DISCHARGED',
  'TRANSFERRED',
  'CANCELLED',
] as const;

export type PatientStatus = (typeof PATIENT_STATUSES)[number];
export type PatientSex = 'FEMALE' | 'MALE' | 'OTHER' | 'UNKNOWN';

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours de prise en charge',
  IN_EXAMINATION: 'En examen',
  WAITING_RESULT: 'En attente de résultat',
  READY_FOR_DISCHARGE: 'Prêt pour sortie',
  DISCHARGED: 'Sorti',
  TRANSFERRED: 'Transféré',
  CANCELLED: 'Annulé ou non présenté',
};

export const PATIENT_SEX_LABELS: Record<PatientSex, string> = {
  FEMALE: 'Femme',
  MALE: 'Homme',
  OTHER: 'Autre',
  UNKNOWN: 'Non renseigné',
};

export interface Patient {
  id: string;
  recordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: PatientSex;
  phone: string;
  address: string | null;
  arrivalReason: string;
  urgencyLevel: number;
  status: PatientStatus;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PatientListResponse {
  items: Patient[];
  pagination: PatientPagination;
}

export interface PatientResponse {
  patient: Patient;
}

export interface PatientQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PatientStatus;
}

export const PATIENT_STATUS_TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  WAITING: ['IN_PROGRESS', 'TRANSFERRED', 'CANCELLED'],
  IN_PROGRESS: [
    'IN_EXAMINATION',
    'WAITING_RESULT',
    'READY_FOR_DISCHARGE',
    'TRANSFERRED',
    'CANCELLED',
  ],
  IN_EXAMINATION: [
    'IN_PROGRESS',
    'WAITING_RESULT',
    'READY_FOR_DISCHARGE',
    'TRANSFERRED',
    'CANCELLED',
  ],
  WAITING_RESULT: [
    'IN_PROGRESS',
    'IN_EXAMINATION',
    'READY_FOR_DISCHARGE',
    'TRANSFERRED',
    'CANCELLED',
  ],
  READY_FOR_DISCHARGE: ['IN_PROGRESS', 'DISCHARGED', 'TRANSFERRED'],
  DISCHARGED: [],
  TRANSFERRED: [],
  CANCELLED: [],
};
