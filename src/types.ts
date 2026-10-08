export type WizardType = 'wizardA' | 'wizardB' | 'firstLogin';

export type UserRole = 'admin_program' | 'admin_teknik' | 'crew';

export type RequestStatus = 'Diajukan' | 'Ditugaskan' | 'Bentrok' | 'Diproses' | 'Selesai' | 'Draf';

export type BroadcastBlock = 'Pagi' | 'Siang' | 'Sore' | 'Malam';

export interface RundownRow {
  id: string;
  studio: string;
  programName: string;
  startTime: string;
  endTime: string;
  division: string;
  notes?: string;
  hasOverlap?: boolean;
  overlapReason?: string;
}

export interface RoleNeedItem {
  role: string;
  count: number;
  requestedNames?: string[];
}

export interface KerabatKerjaItem {
  peran: string;
  personil: string;
  kuota: number;
  namaList?: string[];
}

export interface ProgramDemand {
  id: string;
  programName: string;
  startTime: string;
  endTime: string;
  notes?: string;
  roles: { role: string; count: number; requestedNamesText?: string; requestedNames?: string[] }[];
  overlapWarning?: string;
}

export interface CrewCandidate {
  id: string;
  name: string;
  initials: string;
  role: string;
  division: string;
  nip: string;
  phone: string;
  avatarBg?: string;
  available: boolean;
  unavailableReason?: string;
}

export interface CrewRequest {
  id: string;
  requestNumber: string;
  date: string;
  block: BroadcastBlock;
  programName: string;
  timeRange: string;
  rolesNeeded: RoleNeedItem[];
  status: RequestStatus;
  requesterName: string;
  createdAt: string;
  notes: string;
  sourceDocument?: string;
  kerabatKerja?: KerabatKerjaItem[];
}

export interface AssignmentConflict {
  crewName: string;
  role: string;
  date: string;
  time: string;
  program: string;
  reason: string;
}

export interface SavedAssignment {
  requestId: string;
  programName: string;
  date: string;
  timeRange: string;
  crew: {
    candidateId: string;
    name: string;
    role: string;
    secondaryRole?: string;
    nip: string;
  }[];
  spNumber?: string;
  createdAt: string;
}
