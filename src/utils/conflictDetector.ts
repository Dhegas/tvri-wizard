// =====================================================================
// UNIVERSAL CONFLICT ENGINE & SCHEDULING VALIDATOR (SAD v1.1)
// Aligned with DESIGN (2).md: Cross-domain conflict detection
// (Jadwal Dinas Penyiaran <--> Kegiatan SPR Produksi <--> Ketersediaan)
// =====================================================================

import type {
  DutySchedule,
  SPRDocument,
  Employee,
  BroadcastCrewRosterItem,
  ScheduleConflict,
  DutyTimeWindow,
  DutyAvailabilityCode,
  DutyCellState,
  DutyScheduleCheckResult,
  DutyScheduleIssue,
  DutyGroupSummary,
  DutyJobGroup,
  ProductionActivityItem,
  SPRAssignmentSlot,
} from '../types';

/**
 * Standard Duty Time Windows in WITA
 */
export const DUTY_TIME_WINDOWS: Record<DutyTimeWindow, { start: string; end: string; label: string }> = {
  pagi: { start: '06:00:00', end: '16:00:00', label: 'Dinas Pagi (06:00 – 16:00)' },
  sore: { start: '16:00:00', end: '24:00:00', label: 'Dinas Sore (16:00 – 24:00)' },
  seharian: { start: '06:00:00', end: '24:00:00', label: 'Dinas Seharian (06:00 – 24:00)' },
};

/**
 * Job Code mapping to Broadcast Roster Roles and Time Windows
 */
export interface JobCodeMeta {
  code: string;
  roleName: string;
  group: DutyJobGroup;
  window: DutyTimeWindow;
  standardTime: string;
}

export const OFFICIAL_JOB_CODES: Record<string, JobCodeMeta> = {
  // Pengarah Teknik
  TDP: { code: 'TDP', roleName: 'Pengarah Teknik Pagi', group: 'Teknisi Siaran', window: 'pagi', standardTime: '06:00 - 16:00' },
  TDM: { code: 'TDM', roleName: 'Pengarah Teknik Sore', group: 'Teknisi Siaran', window: 'sore', standardTime: '16:00 - 24:00' },

  // Master Control / CCU
  MCR1: { code: 'MCR1', roleName: 'Master Control / CCU Pagi', group: 'Opr. Peralatan Teknik Studio', window: 'pagi', standardTime: '06:00 - 16:00' },
  MCR2: { code: 'MCR2', roleName: 'Master Control / CCU Sore', group: 'Opr. Peralatan Teknik Studio', window: 'sore', standardTime: '16:00 - 24:00' },

  // Kamerawan
  CAM1: { code: 'CAM1', roleName: 'Kamerawan Pagi', group: 'Kamerawan', window: 'pagi', standardTime: '06:00 - 16:00' },
  CAM2: { code: 'CAM2', roleName: 'Kamerawan Sore', group: 'Kamerawan', window: 'sore', standardTime: '16:00 - 24:00' },

  // Pemadu Gambar (Switcher)
  SW1: { code: 'SW1', roleName: 'Pemadu Gambar Pagi', group: 'Pemadu Gambar', window: 'pagi', standardTime: '06:00 - 16:00' },
  SW2: { code: 'SW2', roleName: 'Pemadu Gambar Sore', group: 'Pemadu Gambar', window: 'sore', standardTime: '16:00 - 24:00' },

  // Penata Suara (Audio)
  AU1: { code: 'AU1', roleName: 'Penata Suara Pagi', group: 'Penata Suara', window: 'pagi', standardTime: '06:00 - 16:00' },
  AU2: { code: 'AU2', roleName: 'Penata Suara Sore', group: 'Penata Suara', window: 'sore', standardTime: '16:00 - 24:00' },

  // VTR Operator
  VTR1: { code: 'VTR1', roleName: 'VTR. OP Pagi', group: 'VTR/Editor', window: 'pagi', standardTime: '06:00 - 16:00' },
  VTR2: { code: 'VTR2', roleName: 'VTR. OP Sore', group: 'VTR/Editor', window: 'sore', standardTime: '16:00 - 24:00' },

  // Penata Cahaya (Lighting)
  LGT1: { code: 'LGT1', roleName: 'Penata Cahaya Pagi', group: 'Penata Cahaya', window: 'pagi', standardTime: '06:00 - 16:00' },
  LGT2: { code: 'LGT2', roleName: 'Penata Cahaya Sore', group: 'Penata Cahaya', window: 'sore', standardTime: '16:00 - 24:00' },

  // IT & Transmisi
  IT1: { code: 'IT1', roleName: 'Teknisi IT / LED Pagi', group: 'Teknisi IT', window: 'pagi', standardTime: '06:00 - 16:00' },
  IT2: { code: 'IT2', roleName: 'Teknisi IT / LED Sore', group: 'Teknisi IT', window: 'sore', standardTime: '16:00 - 24:00' },

  // Chargen (Penata Aksara)
  CG1: { code: 'CG1', roleName: 'Penata Aksara Pagi', group: 'Chargen', window: 'pagi', standardTime: '06:00 - 16:00' },
  CG2: { code: 'CG2', roleName: 'Penata Aksara Sore', group: 'Chargen', window: 'sore', standardTime: '16:00 - 24:00' },

  // AC / Listrik (SAD v1.1 Kelompok 10)
  AC1: { code: 'AC1', roleName: 'Teknisi AC/Listrik Pagi', group: 'AC/Listrik', window: 'pagi', standardTime: '06:00 - 16:00' },
  AC2: { code: 'AC2', roleName: 'Teknisi AC/Listrik Sore', group: 'AC/Listrik', window: 'sore', standardTime: '16:00 - 24:00' },

  // OB Van & Rangkap
  OB1: { code: 'OB1', roleName: 'Operator OB Van Pagi', group: 'Opr. Peralatan Teknik Studio', window: 'pagi', standardTime: '06:00 - 16:00' },
  OB2: { code: 'OB2', roleName: 'Operator OB Van Sore', group: 'Opr. Peralatan Teknik Studio', window: 'sore', standardTime: '16:00 - 24:00' },
  'OB/TDM': { code: 'OB/TDM', roleName: 'Rangkap OB Van & TDM', group: 'Teknisi Siaran', window: 'sore', standardTime: '16:00 - 24:00' },

  // Program Division Jobs
  PDU: { code: 'PDU', roleName: 'PD. Umum', group: 'Job Program', window: 'pagi', standardTime: '06:00 - 16:00' },
  PAC: { code: 'PAC', roleName: 'Penata Acara', group: 'Job Program', window: 'pagi', standardTime: '06:00 - 16:00' },

  // Status Harian
  U: { code: 'U', roleName: 'Umum / Administrasi', group: 'Maintenance', window: 'seharian', standardTime: '08:00 - 16:00' },
  ADM: { code: 'ADM', roleName: 'Administrasi Teknik', group: 'Maintenance', window: 'seharian', standardTime: '08:00 - 16:00' },
  MT: { code: 'MT', roleName: 'Maintenance Studio', group: 'Maintenance', window: 'seharian', standardTime: '08:00 - 16:00' },
};

/**
 * Double Duty Pairing Rules
 */
export interface DoubleDutyRuleInfo {
  pair: [string, string];
  allowed: boolean;
  requiresException: boolean;
  reason: string;
}

export const DOUBLE_DUTY_RULES: DoubleDutyRuleInfo[] = [
  // Pasangan yang diizinkan (Warning informatif)
  { pair: ['OB1', 'TDP'], allowed: true, requiresException: false, reason: 'Rangkap OB Van dan TDP siaran pagi diizinkan untuk operasional studio luar.' },
  { pair: ['OB2', 'TDM'], allowed: true, requiresException: false, reason: 'Rangkap OB Van dan TDM siaran sore (OB/TDM) diizinkan.' },
  { pair: ['SW1', 'TDP'], allowed: true, requiresException: false, reason: 'Rangkap Pemadu Gambar dan Pengarah Teknik pagi diizinkan.' },
  { pair: ['AU1', 'VTR1'], allowed: true, requiresException: false, reason: 'Rangkap Audio dan VTR pagi diizinkan pada siaran reguler.' },
  { pair: ['IT1', 'CG1'], allowed: true, requiresException: false, reason: 'Rangkap IT dan Chargen pagi diizinkan.' },

  // Pasangan yang dilarang (Memerlukan pengecualian Ketua Tim)
  { pair: ['TDM', 'CAM1'], allowed: false, requiresException: true, reason: 'TDM dan CAM1 tidak boleh dirangkap karena tugas kamera dan pengarah teknik berbenturan.' },
  { pair: ['TDP', 'CAM2'], allowed: false, requiresException: true, reason: 'TDP dan CAM2 tidak boleh dirangkap karena jendela waktu beririsan dan peran kamera memerlukan konsentrasi penuh.' },
  { pair: ['MCR1', 'CAM1'], allowed: false, requiresException: true, reason: 'MCR1 dan CAM1 tidak boleh dirangkap karena ruang kendali dan studio terpisah.' },
  { pair: ['SW1', 'AU1'], allowed: false, requiresException: true, reason: 'Pemadu Gambar dan Penata Suara tidak dapat dirangkap saat siaran berlangsung.' },
];

/**
 * Checks double duty compatibility between primary and secondary job codes
 */
export function checkDoubleDutyCompatibility(primaryCode: string, secondaryCode?: string): {
  allowed: boolean;
  requiresException: boolean;
  reason?: string;
} {
  if (!secondaryCode) {
    return { allowed: true, requiresException: false };
  }

  // Check defined rules
  for (const rule of DOUBLE_DUTY_RULES) {
    if (
      (rule.pair[0] === primaryCode && rule.pair[1] === secondaryCode) ||
      (rule.pair[1] === primaryCode && rule.pair[0] === secondaryCode)
    ) {
      return {
        allowed: rule.allowed,
        requiresException: rule.requiresException,
        reason: rule.reason,
      };
    }
  }

  // Default heuristic: If both are active broadcast jobs and windows overlap, require exception
  const meta1 = OFFICIAL_JOB_CODES[primaryCode];
  const meta2 = OFFICIAL_JOB_CODES[secondaryCode];
  if (meta1 && meta2 && meta1.window === meta2.window) {
    return {
      allowed: false,
      requiresException: true,
      reason: `${primaryCode} dan ${secondaryCode} memiliki waktu dinas yang sama (${meta1.window}) dan memerlukan pengecualian Ketua Tim.`,
    };
  }

  return { allowed: true, requiresException: false };
}

/**
 * Parses time string (HH:MM or HH:MM:SS) into minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

/**
 * Checks if two time intervals [s1, e1] and [s2, e2] overlap
 */
export function isTimeOverlapping(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Formats availability code into user-friendly explanation
 */
export function formatAvailabilityReason(code: DutyAvailabilityCode): string {
  switch (code) {
    case 'CT':
      return 'Cuti Tahunan';
    case 'L':
      return 'Hari Libur / Lepas Piket';
    case 'IZIN':
      return 'Izin Resmi';
    case 'DL':
      return 'Dinas Luar Kota';
    default:
      return 'Tidak tersedia';
  }
}

/**
 * Result of crew candidate availability evaluation
 */
export interface SingleCandidateEvaluationResult {
  candidateId: string;
  name: string;
  available: boolean;
  statusType: 'available' | 'warning' | 'exception_needed' | 'unavailable';
  statusLabel: string;
  reason?: string;
  conflicts: ScheduleConflict[];
  workloadToday: number;
}

/**
 * Universal Conflict Checker for Assigning Crew to Production Activities (SAD v1.1 Wizard 4)
 */
export function evaluateCandidateAvailability(
  crew: Employee,
  targetDate: string, // YYYY-MM-DD
  targetStartTime: string, // HH:MM:SS
  targetEndTime: string, // HH:MM:SS
  dutySchedule: DutySchedule | null,
  allSPRs: SPRDocument[],
  currentSprId?: string
): SingleCandidateEvaluationResult {
  const conflicts: ScheduleConflict[] = [];
  let workloadToday = 0;
  let statusType: 'available' | 'warning' | 'exception_needed' | 'unavailable' = 'available';
  let statusLabel = 'Tersedia';
  let primaryReason = '';

  // 1. Check availability in Duty Schedule (Leaves / Libur / Cuti / DL)
  if (dutySchedule?.assignments[crew.id]?.[targetDate]) {
    const cell = dutySchedule.assignments[crew.id][targetDate];

    // Check Leave/Availability
    if (cell.availability) {
      const reasonText = formatAvailabilityReason(cell.availability);
      conflicts.push({
        crewId: crew.id,
        crewName: crew.name,
        category: 'ketersediaan_cuti',
        severity: 'pemblokir',
        date: targetDate,
        timeRange: 'Seharian',
        detail: `${crew.name} sedang ${reasonText} pada tanggal ini.`,
        conflictingItemName: reasonText,
      });
      statusType = 'unavailable';
      statusLabel = 'Tidak tersedia';
      primaryReason = reasonText;
    }

    // Check Broadcast Duty Window overlap
    if (cell.primaryCode && OFFICIAL_JOB_CODES[cell.primaryCode]) {
      workloadToday += 1;
      const jobMeta = OFFICIAL_JOB_CODES[cell.primaryCode];
      const win = DUTY_TIME_WINDOWS[jobMeta.window];

      if (isTimeOverlapping(targetStartTime, targetEndTime, win.start, win.end)) {
        const detailMsg = `Sudah bertugas sebagai ${cell.primaryCode} (${jobMeta.roleName}) pada siaran ${jobMeta.window}, ${win.start.substring(0, 5)} sampai ${win.end.substring(0, 5)}.`;
        conflicts.push({
          crewId: crew.id,
          crewName: crew.name,
          category: 'overlap_penyiaran',
          severity: 'pemblokir',
          date: targetDate,
          timeRange: `${win.start.substring(0, 5)} - ${win.end.substring(0, 5)}`,
          detail: detailMsg,
          conflictingItemName: `Jadwal Dinas ${cell.primaryCode}`,
        });
        statusType = 'unavailable';
        statusLabel = 'Tidak tersedia';
        primaryReason = detailMsg;
      }
    }
  }

  // 2. Check Overlap with other Production SPRs
  if (statusType !== 'unavailable') {
    for (const spr of allSPRs) {
      if (spr.id === currentSprId) continue;
      if (spr.status === 'Dibatalkan' || spr.status === 'Ditolak') continue;

      for (const act of spr.kegiatanList) {
        if (act.tanggal === targetDate) {
          const isAssigned = spr.kebutuhanCrewList.some((need) =>
            need.profesi === crew.division || crew.jobCodes.includes(need.profesi)
          );

          if (isAssigned && isTimeOverlapping(targetStartTime, targetEndTime, act.jamMulai, act.jamSelesai)) {
            workloadToday += 1;
            const conflictDetail = `Sudah bertugas pada Produksi ${spr.judul || spr.programName}, ${act.jamMulai.substring(0, 5)} sampai ${act.jamSelesai.substring(0, 5)}.`;
            conflicts.push({
              crewId: crew.id,
              crewName: crew.name,
              category: 'overlap_produksi',
              severity: 'pemblokir',
              date: targetDate,
              timeRange: `${act.jamMulai.substring(0, 5)} - ${act.jamSelesai.substring(0, 5)}`,
              detail: conflictDetail,
              conflictingItemName: `Produksi ${spr.programName}`,
            });
            statusType = 'unavailable';
            statusLabel = 'Tidak tersedia';
            primaryReason = conflictDetail;
            break;
          }
        }
      }
      if (statusType === 'unavailable') break;
    }
  }

  // 3. Check Rest Period Rule (< 5 hours rest between night shift and morning production)
  if (statusType !== 'unavailable' && dutySchedule) {
    const prevDateObj = new Date(targetDate);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];

    const prevCell = dutySchedule.assignments[crew.id]?.[prevDateStr];
    if (prevCell?.primaryCode) {
      const prevJob = OFFICIAL_JOB_CODES[prevCell.primaryCode];
      if (prevJob?.window === 'sore') {
        const targetStartMins = timeToMinutes(targetStartTime);
        if (targetStartMins < 5 * 60) {
          const restHrs = (targetStartMins / 60).toFixed(1);
          const restMsg = `Jeda istirahat hanya ${restHrs} jam setelah dinas malam kemarin (${prevCell.primaryCode}).`;
          conflicts.push({
            crewId: crew.id,
            crewName: crew.name,
            category: 'jeda_istirahat',
            severity: 'peringatan',
            date: targetDate,
            timeRange: targetStartTime,
            detail: restMsg,
            conflictingItemName: 'Aturan Beban Jeda Istirahat',
          });
          statusType = 'warning';
          statusLabel = 'Tersedia dengan peringatan';
          primaryReason = restMsg;
        }
      }
    }
  }

  return {
    candidateId: crew.id,
    name: crew.name,
    available: statusType !== 'unavailable',
    statusType,
    statusLabel,
    reason: primaryReason,
    conflicts,
    workloadToday,
  };
}

/**
 * VALIDATE DUTY CELL ASSIGNMENT IN J2 (Jadwal Dinas Grid)
 * Enforces SAD v1.1 rules: Leaves, SPR overlaps, Prohibited double roles, Rest periods, Change reasons.
 */
export interface DutyCellValidationResult {
  isValid: boolean;
  isBlocker: boolean;
  hasWarning: boolean;
  errorMessage?: string;
  warningMessage?: string;
  requiresTeamLeadException?: boolean;
  cellState: DutyCellState;
}

export function validateDutyCellAssignment(
  employee: Employee,
  targetDate: string,
  primaryCode: string,
  secondaryCode?: string,
  currentSchedule?: DutySchedule | null,
  allSPRs: SPRDocument[] = [],
  isSpecialException: boolean = false,
  exceptionReason?: string,
  changeReason?: string
): DutyCellValidationResult {
  // If clearing the cell
  if (!primaryCode) {
    return {
      isValid: true,
      isBlocker: false,
      hasWarning: false,
      cellState: { primaryCode: '' },
    };
  }

  // 1. Check if employee is on leave / libur / izin / DL on targetDate
  const existingCell = currentSchedule?.assignments[employee.id]?.[targetDate];
  if (existingCell?.availability) {
    const availText = formatAvailabilityReason(existingCell.availability);
    return {
      isValid: false,
      isBlocker: true,
      hasWarning: false,
      errorMessage: `${employee.name} berstatus ${availText} pada ${targetDate}. Pengisian ditolak.`,
      cellState: existingCell,
    };
  }

  // 2. Check if primaryCode is among qualified codes for employee (or status codes U, ADM, MT)
  const isStatusKode = ['U', 'ADM', 'MT'].includes(primaryCode);
  if (!isStatusKode && !employee.jobCodes.includes(primaryCode)) {
    return {
      isValid: false,
      isBlocker: true,
      hasWarning: false,
      errorMessage: `Pegawai ini belum memiliki job ${primaryCode}. Super Admin dapat menambahkannya di master data.`,
      cellState: existingCell || { primaryCode: '' },
    };
  }

  // 3. Check conflict with Production SPR activities
  const jobMeta = OFFICIAL_JOB_CODES[primaryCode];
  if (jobMeta) {
    const win = DUTY_TIME_WINDOWS[jobMeta.window];
    for (const spr of allSPRs) {
      if (spr.status === 'Dibatalkan' || spr.status === 'Ditolak') continue;
      for (const act of spr.kegiatanList) {
        if (act.tanggal === targetDate) {
          const isAssigned = spr.kebutuhanCrewList.some((need) =>
            need.profesi === employee.division || employee.jobCodes.includes(need.profesi)
          );
          if (isAssigned && isTimeOverlapping(win.start, win.end, act.jamMulai, act.jamSelesai)) {
            const conflictMsg = `${employee.name} sudah bertugas pada Produksi ${spr.judul || spr.programName}, ${act.jamMulai.substring(0, 5)} sampai ${act.jamSelesai.substring(0, 5)}. Pilih kode lain.`;
            return {
              isValid: false,
              isBlocker: true,
              hasWarning: false,
              errorMessage: conflictMsg,
              cellState: existingCell || { primaryCode: '' },
            };
          }
        }
      }
    }
  }

  // 4. Check Double Duty pairing rules
  let warningMessage = '';
  let hasWarning = false;
  if (secondaryCode) {
    const doubleDutyCheck = checkDoubleDutyCompatibility(primaryCode, secondaryCode);
    if (!doubleDutyCheck.allowed) {
      if (!isSpecialException) {
        return {
          isValid: false,
          isBlocker: true,
          hasWarning: false,
          requiresTeamLeadException: true,
          errorMessage: doubleDutyCheck.reason || `${primaryCode} dan ${secondaryCode} tidak boleh dirangkap karena waktunya beririsan.`,
          cellState: existingCell || { primaryCode: '' },
        };
      } else {
        hasWarning = true;
        warningMessage = `Rangkap dengan pengecualian Ketua Tim: ${exceptionReason || doubleDutyCheck.reason}`;
      }
    } else if (doubleDutyCheck.reason) {
      hasWarning = true;
      warningMessage = doubleDutyCheck.reason;
    }
  }

  // 5. Check Workload rules: Rest period (< 5 hours after night shift yesterday)
  if (currentSchedule) {
    const prevDateObj = new Date(targetDate);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];
    const prevCell = currentSchedule.assignments[employee.id]?.[prevDateStr];

    if (prevCell?.primaryCode && OFFICIAL_JOB_CODES[prevCell.primaryCode]?.window === 'sore') {
      if (jobMeta?.window === 'pagi') {
        hasWarning = true;
        const restWarning = `Jeda istirahat ${employee.name} kurang dari 5 jam setelah dinas malam (${prevCell.primaryCode}) kemarin.`;
        warningMessage = warningMessage ? `${warningMessage} | ${restWarning}` : restWarning;
      }
    }
  }

  // 6. Check Change reason if schedule is already published
  if (currentSchedule?.status === 'terbit' && !changeReason && existingCell?.primaryCode !== primaryCode) {
    // If schedule is published, reason is mandatory
    return {
      isValid: false,
      isBlocker: true,
      hasWarning: false,
      errorMessage: 'Tulis alasan perubahan agar tercatat pada audit jadwal terbit.',
      cellState: existingCell || { primaryCode: '' },
    };
  }

  return {
    isValid: true,
    isBlocker: false,
    hasWarning,
    warningMessage,
    cellState: {
      primaryCode,
      secondaryCode,
      hasWarning,
      warningMessage: hasWarning ? warningMessage : undefined,
      isSpecialException: isSpecialException || undefined,
      exceptionReason: isSpecialException ? exceptionReason : undefined,
      changeReason,
      modifiedAt: new Date().toISOString(),
    },
  };
}

/**
 * RUN COMPREHENSIVE J3 HEALTH CHECK FOR JADWAL DINAS (SAD v1.1 J3)
 * Produces the exact 3 sections: Perlu diperbaiki, Perlu diperhatikan, Belum terisi.
 */
export function runDutyScheduleHealthCheck(
  schedule: DutySchedule,
  employees: Employee[],
  allSPRs: SPRDocument[] = []
): DutyScheduleCheckResult {
  const blockers: DutyScheduleIssue[] = [];
  const warnings: DutyScheduleIssue[] = [];

  const groupCounts: Record<DutyJobGroup, { total: number; assigned: number; empty: number; warningCount: number }> = {
    'Teknisi Siaran': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Opr. Peralatan Teknik Studio': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Kamerawan': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Penata Suara': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Penata Cahaya': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Pemadu Gambar': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'VTR/Editor': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Teknisi IT': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Chargen': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'AC/Listrik': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Maintenance': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
    'Job Program': { total: 0, assigned: 0, empty: 0, warningCount: 0 },
  };

  let totalAssignments = 0;
  let totalEmpty = 0;

  // Extract month year days
  const [yearStr, monthStr] = schedule.month.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  employees.forEach((emp) => {
    // Determine employee primary group
    let primaryGroup: DutyJobGroup = 'Teknisi Siaran';
    if (emp.division === 'Program') {
      primaryGroup = 'Job Program';
    } else if (emp.jobCodes.length > 0) {
      const firstCode = emp.jobCodes[0];
      if (OFFICIAL_JOB_CODES[firstCode]) {
        primaryGroup = OFFICIAL_JOB_CODES[firstCode].group;
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearStr}-${monthStr.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const cell = schedule.assignments[emp.id]?.[dateStr];

      groupCounts[primaryGroup].total += 1;

      if (!cell || (!cell.primaryCode && !cell.availability)) {
        groupCounts[primaryGroup].empty += 1;
        totalEmpty += 1;
      } else if (cell.availability) {
        // Availability code (L, CT, IZIN, DL)
        if (cell.primaryCode) {
          blockers.push({
            id: `issue-blk-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            category: 'ketersediaan',
            severity: 'pemblokir',
            message: `${emp.name} ditugaskan sebagai ${cell.primaryCode} padahal sedang ${formatAvailabilityReason(cell.availability)}.`,
            group: primaryGroup,
          });
        }
      } else if (cell.primaryCode) {
        totalAssignments += 1;
        groupCounts[primaryGroup].assigned += 1;

        // Check SPR production conflict
        const jobMeta = OFFICIAL_JOB_CODES[cell.primaryCode];
        if (jobMeta) {
          const win = DUTY_TIME_WINDOWS[jobMeta.window];
          for (const spr of allSPRs) {
            if (spr.status === 'Dibatalkan' || spr.status === 'Ditolak') continue;
            for (const act of spr.kegiatanList) {
              if (act.tanggal === dateStr) {
                const isAssigned = spr.kebutuhanCrewList.some((need) =>
                  need.profesi === emp.division || emp.jobCodes.includes(need.profesi)
                );
                if (isAssigned && isTimeOverlapping(win.start, win.end, act.jamMulai, act.jamSelesai)) {
                  blockers.push({
                    id: `issue-blk-spr-${emp.id}-${dateStr}`,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    date: dateStr,
                    category: 'bentrok_waktu',
                    severity: 'pemblokir',
                    message: `${emp.name} (${cell.primaryCode}) bentrok dengan Produksi ${spr.judul || spr.programName} (${act.jamMulai.substring(0, 5)} - ${act.jamSelesai.substring(0, 5)}).`,
                    group: primaryGroup,
                  });
                }
              }
            }
          }
        }

        // Check Warnings
        if (cell.hasWarning || cell.warningMessage) {
          groupCounts[primaryGroup].warningCount += 1;
          warnings.push({
            id: `issue-warn-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeName: emp.name,
            date: dateStr,
            category: cell.isSpecialException ? 'rangkap' : 'jeda_istirahat',
            severity: 'peringatan',
            message: cell.warningMessage || `Peringatan penugasan ${cell.primaryCode}`,
            group: primaryGroup,
            exceptionReason: cell.exceptionReason,
          });
        }
      }
    }
  });

  const unassignedByGroup: DutyGroupSummary[] = Object.entries(groupCounts).map(([groupName, counts]) => ({
    group: groupName as DutyJobGroup,
    totalSlots: counts.total,
    assignedSlots: counts.assigned,
    emptySlots: counts.empty,
    warningCount: counts.warningCount,
  }));

  return {
    blockers,
    warnings,
    unassignedByGroup,
    totalAssignments,
    totalEmpty,
    canPublish: blockers.length === 0,
  };
}

/**
 * DERIVES KERABAT KERJA SIARAN AUTOMATICALLY FROM JADWAL DINAS (SAD v1.1 R4)
 */
export function deriveBroadcastCrewRoster(
  targetDate: string,
  block: 'Pagi' | 'Sore',
  dutySchedule: DutySchedule | null,
  employees: Employee[]
): BroadcastCrewRosterItem[] {
  const rosterTemplates: { peran: string; jobCodes: string[]; isSpecial?: 'pemberitaan' | 'nama_tampil' }[] = [
    { peran: 'Pengarah Teknik', jobCodes: block === 'Pagi' ? ['TDP'] : ['TDM'] },
    { peran: 'Master Control / CCU', jobCodes: block === 'Pagi' ? ['MCR1'] : ['MCR2'] },
    { peran: 'Kamerawan', jobCodes: block === 'Pagi' ? ['CAM1'] : ['CAM2'] },
    { peran: 'Pemadu Gambar', jobCodes: block === 'Pagi' ? ['SW1'] : ['SW2'] },
    { peran: 'Penata Suara', jobCodes: block === 'Pagi' ? ['AU1'] : ['AU2'] },
    { peran: 'VTR. OP', jobCodes: block === 'Pagi' ? ['VTR1'] : ['VTR2'] },
    { peran: 'Penata Cahaya', jobCodes: block === 'Pagi' ? ['LGT1'] : ['LGT2'] },
    { peran: 'Teknisi IT / LED', jobCodes: block === 'Pagi' ? ['IT1'] : ['IT2'] },
    { peran: 'Penata Aksara', jobCodes: block === 'Pagi' ? ['CG1'] : ['CG2'] },
    { peran: 'PD. Umum', jobCodes: ['PDU'] },
    { peran: 'Penata Acara', jobCodes: ['PAC'] },
    { peran: 'PD. BHI / GB / BV', jobCodes: [], isSpecial: 'pemberitaan' },
    { peran: 'Penyiar BHI / GB / BV', jobCodes: [], isSpecial: 'pemberitaan' },
    { peran: 'Penata Rias', jobCodes: [], isSpecial: 'nama_tampil' },
    { peran: 'Penata Artistik', jobCodes: [], isSpecial: 'nama_tampil' },
  ];

  return rosterTemplates.map((template) => {
    if (template.isSpecial === 'pemberitaan') {
      return {
        peran: template.peran,
        personil: 'Pemberitaan',
        statusPetugas: 'pemberitaan',
      };
    }

    if (template.isSpecial === 'nama_tampil') {
      return {
        peran: template.peran,
        personil: '(Nama tampil)',
        statusPetugas: 'nama_tampil',
      };
    }

    if (dutySchedule?.assignments) {
      const assignedCrewNames: string[] = [];
      let foundCode = '';

      for (const emp of employees) {
        const cell = dutySchedule.assignments[emp.id]?.[targetDate];
        if (cell?.primaryCode && template.jobCodes.includes(cell.primaryCode)) {
          assignedCrewNames.push(emp.name);
          foundCode = cell.primaryCode;
        }
      }

      if (assignedCrewNames.length > 0) {
        return {
          peran: template.peran,
          personil: assignedCrewNames.join(', '),
          statusPetugas: 'terisi',
          sourceJobCode: foundCode,
        };
      }
    }

    return {
      peran: template.peran,
      personil: 'Belum ada petugas',
      statusPetugas: 'belum_ada',
    };
  });
}

/**
 * Checks for Studio Overlap between productions and broadcasts
 */
export function checkStudioOverlapWarning(
  studioLocation: string,
  targetDate: string,
  startTime: string,
  endTime: string,
  allSPRs: SPRDocument[],
  excludeSprId?: string
): string | null {
  if (!studioLocation || !studioLocation.toLowerCase().includes('studio')) {
    return null;
  }

  for (const spr of allSPRs) {
    if (spr.id === excludeSprId) continue;
    if (spr.status === 'Dibatalkan' || spr.status === 'Ditolak') continue;

    for (const act of spr.kegiatanList) {
      if (
        act.tanggal === targetDate &&
        act.lokasi?.toLowerCase() === studioLocation.toLowerCase() &&
        isTimeOverlapping(startTime, endTime, act.jamMulai, act.jamSelesai)
      ) {
        return `${studioLocation} juga dipakai Produksi ${spr.judul || spr.programName} pada ${act.jamMulai.substring(0, 5)} sampai ${act.jamSelesai.substring(0, 5)}.`;
      }
    }
  }

  return null;
}

/**
 * EVALUATE CANDIDATES FOR SPR ASSIGNMENT (SAD v1.1 P2)
 * Ranks candidates per profession according to availability, broadcast shift overlap, leave, and workload.
 */
export interface CandidateEvaluationResult {
  candidate: Employee;
  status: 'tersedia' | 'tersedia_peringatan' | 'perlu_pengecualian' | 'tidak_tersedia';
  statusLabel: string;
  reason?: string;
  bebanTugasHariIni: number;
  conflictingTaskDetail?: string;
  canBeAssigned: boolean;
  requiresException: boolean;
}

export function evaluateSPRCandidates(
  profesi: string,
  activityItems: ProductionActivityItem[],
  employees: Employee[],
  currentDutySchedule: DutySchedule | null,
  allSPRs: SPRDocument[],
  currentSprId: string,
  currentAssignments: SPRAssignmentSlot[] = [],
  currentSlotId?: string
): CandidateEvaluationResult[] {
  const normalizedProfesi = profesi.toLowerCase();

  const eligibleEmployees = employees.filter((emp) => {
    if (emp.division !== 'Teknik') return false;
    const subDiv = (emp.subDivision || '').toLowerCase();
    const codes = emp.jobCodes.map((c) => c.toLowerCase());

    if (normalizedProfesi.includes('kamera')) {
      return codes.some((c) => c.startsWith('cam')) || subDiv.includes('kamera');
    }
    if (normalizedProfesi.includes('suara') || normalizedProfesi.includes('audio')) {
      return codes.some((c) => c.startsWith('au')) || subDiv.includes('audio') || subDiv.includes('suara');
    }
    if (normalizedProfesi.includes('cahaya')) {
      return codes.some((c) => c.startsWith('lgt')) || subDiv.includes('cahaya');
    }
    if (normalizedProfesi === 't.d' || normalizedProfesi.includes('pengarah teknik') || normalizedProfesi === 'td') {
      return codes.some((c) => c.startsWith('td')) || subDiv.includes('teknik siaran');
    }
    if (normalizedProfesi.includes('switch') || normalizedProfesi.includes('pemadu gambar')) {
      return codes.some((c) => c.startsWith('sw')) || subDiv.includes('switching');
    }
    if (normalizedProfesi.includes('maintenance')) {
      return codes.includes('mt') || codes.includes('maint') || subDiv.includes('maintenance');
    }
    if (normalizedProfesi.includes('ccu') || normalizedProfesi.includes('ve')) {
      return codes.includes('ccu') || codes.includes('ve') || codes.some((c) => c.startsWith('mcr'));
    }
    if (normalizedProfesi.includes('vtr') || normalizedProfesi.includes('editor')) {
      return codes.some((c) => c.startsWith('vtr')) || codes.includes('edt') || subDiv.includes('editor');
    }
    if (normalizedProfesi.includes('chargen') || normalizedProfesi.includes('cg')) {
      return codes.some((c) => c.startsWith('cg'));
    }
    if (normalizedProfesi.includes('led')) {
      return codes.includes('led') || codes.some((c) => c.startsWith('cg'));
    }
    if (normalizedProfesi.includes('listrik') || normalizedProfesi.includes('genset') || normalizedProfesi.includes('ac')) {
      return codes.includes('ac') || codes.includes('eng1') || codes.includes('eng2') || subDiv.includes('listrik');
    }
    if (normalizedProfesi.includes('it')) {
      return codes.some((c) => c.startsWith('it')) || subDiv.includes('it');
    }
    if (normalizedProfesi === 'mc' || normalizedProfesi === 'm c' || normalizedProfesi.includes('master control')) {
      return codes.some((c) => c.startsWith('mcr'));
    }

    return true;
  });

  const results: CandidateEvaluationResult[] = [];

  for (const emp of eligibleEmployees) {
    let status: 'tersedia' | 'tersedia_peringatan' | 'perlu_pengecualian' | 'tidak_tersedia' = 'tersedia';
    let statusLabel = 'Tersedia';
    let reason = 'Tersedia';
    let conflictingTaskDetail = '';
    let canBeAssigned = true;
    let requiresException = false;
    let bebanTugasHariIni = 0;

    const alreadyAssignedInThisSPR = currentAssignments.find(
      (slot) => slot.id !== currentSlotId && slot.assignedCrewId === emp.id
    );

    if (alreadyAssignedInThisSPR) {
      status = 'tersedia_peringatan';
      statusLabel = 'Peringatan Rangkap';
      reason = `Merangkap dengan ${alreadyAssignedInThisSPR.profesi} (Slot ${alreadyAssignedInThisSPR.slotNumber})`;
      requiresException = false;
      canBeAssigned = true;
    }

    const primaryAct = activityItems.find((a) => a.jenis === 'Produksi') || activityItems[0];
    const targetDate = primaryAct ? primaryAct.tanggal : '2026-10-12';

    if (currentDutySchedule) {
      for (const act of activityItems) {
        const cell = currentDutySchedule.assignments[emp.id]?.[act.tanggal];
        if (cell?.availability) {
          const availText = formatAvailabilityReason(cell.availability);
          status = 'tersedia_peringatan';
          statusLabel = `Peringatan: ${availText}`;
          reason = `Tercatat ${availText} pada ${act.tanggal} (tetap dapat ditugaskan)`;
          canBeAssigned = true;
          conflictingTaskDetail = `${emp.name} berstatus ${availText}`;
          break;
        }
      }
    }

    if (currentDutySchedule) {
      for (const act of activityItems) {
        const cell = currentDutySchedule.assignments[emp.id]?.[act.tanggal];
        if (cell?.primaryCode) {
          const jobMeta = OFFICIAL_JOB_CODES[cell.primaryCode];
          if (jobMeta) {
            const win = DUTY_TIME_WINDOWS[jobMeta.window];
            bebanTugasHariIni += 1;
            if (isTimeOverlapping(win.start, win.end, act.jamMulai, act.jamSelesai)) {
              status = 'tersedia_peringatan';
              statusLabel = 'Peringatan: Dinas Siaran';
              reason = `Jadwal shift dinas siaran: ${cell.primaryCode} (${win.start.slice(0, 5)} - ${win.end.slice(0, 5)})`;
              conflictingTaskDetail = `Dinas Siaran ${cell.primaryCode} (${win.start.slice(0, 5)} - ${win.end.slice(0, 5)})`;
              canBeAssigned = true;
              break;
            }
          }
        }
      }
    }

    for (const spr of allSPRs) {
      if (spr.id === currentSprId) continue;
      if (spr.status === 'Dibatalkan' || spr.status === 'Ditolak') continue;

      const hasAssignmentInSpr = spr.kebutuhanCrewList.some(
        (need) => need.profesi === emp.division || emp.jobCodes.includes(need.profesi)
      );

      for (const actOther of spr.kegiatanList) {
        if (actOther.tanggal === targetDate) {
          bebanTugasHariIni += 1;
        }
        for (const actMy of activityItems) {
          if (actOther.tanggal === actMy.tanggal) {
            if (isTimeOverlapping(actMy.jamMulai, actMy.jamSelesai, actOther.jamMulai, actOther.jamSelesai)) {
              if (hasAssignmentInSpr || spr.totalCrewAssigned > 0) {
                status = 'tersedia_peringatan';
                statusLabel = 'Peringatan: Acara Lain';
                reason = `Sudah bertugas pada ${spr.judul || spr.programName} (${actOther.jamMulai.slice(0, 5)} - ${actOther.jamSelesai.slice(0, 5)})`;
                conflictingTaskDetail = `Produksi ${spr.judul || spr.programName} (${actOther.jamMulai.slice(0, 5)} - ${actOther.jamSelesai.slice(0, 5)})`;
                canBeAssigned = true;
                break;
              }
            }
          }
        }
        if (conflictingTaskDetail) break;
      }
      if (conflictingTaskDetail) break;
    }

    if (currentDutySchedule && primaryAct) {
      const prevDateObj = new Date(primaryAct.tanggal);
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevDateStr = prevDateObj.toISOString().split('T')[0];
      const prevCell = currentDutySchedule.assignments[emp.id]?.[prevDateStr];

      if (prevCell?.primaryCode && OFFICIAL_JOB_CODES[prevCell.primaryCode]?.window === 'sore') {
        const actStartMin = timeToMinutes(primaryAct.jamMulai);
        if (actStartMin < 11 * 60) {
          status = 'tersedia_peringatan';
          statusLabel = 'Peringatan: Jeda Istirahat';
          reason = `Jeda istirahat 4 jam setelah dinas malam (${prevCell.primaryCode}) kemarin`;
        }
      }
    }

    results.push({
      candidate: emp,
      status,
      statusLabel,
      reason,
      bebanTugasHariIni,
      conflictingTaskDetail,
      canBeAssigned,
      requiresException,
    });
  }

  const statusWeight: Record<string, number> = {
    tersedia: 1,
    tersedia_peringatan: 2,
    perlu_pengecualian: 3,
    tidak_tersedia: 4,
  };

  return results.sort((a, b) => {
    const diff = statusWeight[a.status] - statusWeight[b.status];
    if (diff !== 0) return diff;
    return a.bebanTugasHariIni - b.bebanTugasHariIni;
  });
}

