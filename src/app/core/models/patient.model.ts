export const patientStatuses = {
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours de prise en charge',
  IN_EXAMINATION: 'En examen',
  WAITING_RESULT: 'En attente de résultat',
  READY_FOR_DISCHARGE: 'Prêt pour sortie',
  DISCHARGED: 'Sorti',
  TRANSFERRED: 'Transféré',
  CANCELLED: 'Annulé ou non présenté',
} as const;

export type PatientStatus = keyof typeof patientStatuses;
export const statusOptions = Object.keys(patientStatuses) as PatientStatus[];

export interface PatientFields {
  recordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  phone: string;
  residence: string;
  arrivalReason: string;
  priority: string;
  comments: string | null;
}

export interface PatientSummary extends Pick<PatientFields,
  'recordNumber' | 'firstName' | 'lastName' | 'phone' | 'priority'> {
  id: string;
  status: PatientStatus;
}

export interface Patient extends PatientFields, PatientSummary {}

export interface PatientDetail extends Patient {
  statusHistory: {
    id: string;
    actorId: string;
    actor: { email: string };
    previousStatus: PatientStatus;
    nextStatus: PatientStatus;
    changedAt: string;
  }[];
}

export interface PatientPage {
  items: PatientSummary[];
  page: number;
  pageSize: number;
  total: number;
}
