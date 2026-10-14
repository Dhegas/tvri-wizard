// =====================================================================
// TVRI BALI WIZARD PENJADWALAN CREW — CORE DATA MODELS (SAD v1.1)
// Aligned with DESIGN (2).md: Empat Wizard, Penyiaran & Produksi
// =====================================================================

export type WizardType = 'jadwalDinas' | 'rundown' | 'spr' | 'penugasanSpr' | 'firstLogin';

export type UserRole = 'admin_program' | 'admin_teknik' | 'admin_berita' | 'super_admin' | 'crew';

export type BroadcastBlock = 'Pagi' | 'Sore' | 'Siang' | 'Malam';

// ---------------------------------------------------------------------
// 1. WIZARD 1 — JADWAL DINAS BULANAN (SUMBER KERABAT KERJA SIARAN)
// ---------------------------------------------------------------------

export type DutyJobGroup =
  | 'Teknisi Siaran'
  | 'Opr. Peralatan Teknik Studio'
  | 'Kamerawan'
  | 'Penata Suara'
  | 'Penata Cahaya'
  | 'Pemadu Gambar'
  | 'VTR/Editor'
  | 'Teknisi IT'
  | 'Chargen'
  | 'AC/Listrik'
  | 'Maintenance'
  | 'Job Program'; // PD Umum, Penata Acara

export type DutyTimeWindow = 'pagi' | 'sore' | 'seharian';

export interface DutyJobCodeDefinition {
  code: string;
  label: string;
  group: DutyJobGroup;
  window: DutyTimeWindow;
  timeRangeText: string;
}

export type DutyAvailabilityCode = 'L' | 'CT' | 'IZIN' | 'DL'; // Libur, Cuti, Izin, Dinas Luar

export interface DutyCellState {
  primaryCode: string;
  secondaryCode?: string; // Rangkap profesi yang diizinkan (misal OB/TDM)
  availability?: DutyAvailabilityCode;
  reason?: string;
  notes?: string;
  hasWarning?: boolean;
  warningMessage?: string;
  hasConflict?: boolean;
  conflictMessage?: string;
  isSpecialException?: boolean; // Pengecualian Ketua Tim
  exceptionReason?: string;
  changeReason?: string; // Wajib bila jadwal sudah terbit
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface DutyAuditItem {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  date: string;
  previousCode: string;
  newCode: string;
  reason: string;
  changedBy: string;
}

export interface DutyAvailabilityRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: DutyAvailabilityCode;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export interface DutyScheduleIssue {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  category: 'bentrok_waktu' | 'ketersediaan' | 'rangkap' | 'jeda_istirahat' | 'beban_shift';
  severity: 'pemblokir' | 'peringatan';
  message: string;
  group: DutyJobGroup;
  exceptionReason?: string;
}

export interface DutyGroupSummary {
  group: DutyJobGroup;
  totalSlots: number;
  assignedSlots: number;
  emptySlots: number;
  warningCount: number;
}

export interface DutyScheduleCheckResult {
  blockers: DutyScheduleIssue[];
  warnings: DutyScheduleIssue[];
  unassignedByGroup: DutyGroupSummary[];
  totalAssignments: number;
  totalEmpty: number;
  canPublish: boolean;
}

export interface DutySchedule {
  id: string;
  month: string; // YYYY-MM
  status: 'draf' | 'terbit';
  publishedAt?: string;
  publishedBy?: string;
  // Map of pegawaiId -> Map of date 'YYYY-MM-DD' -> DutyCellState
  assignments: Record<string, Record<string, DutyCellState>>;
  availabilityRecords?: DutyAvailabilityRecord[];
  auditTrail?: DutyAuditItem[];
  totalAssignments: number;
  warningCount: number;
  blockerCount: number;
  unassignedCount: number;
}

// ---------------------------------------------------------------------
// 2. WIZARD 2 — RUNDOWN HARIAN PENYIARAN (SAD v1.1: TANPA MINTA KRU)
// ---------------------------------------------------------------------

export type BroadcastSourceType =
  | 'Storage 3'
  | 'Playbox 3'
  | 'Playbox 4'
  | 'Live Studio 1'
  | 'Live Studio 2'
  | 'Live Studio 3'
  | 'Production 1'
  | 'Relay nasional'
  | 'Title Box'
  | 'OB Van';

export type BroadcastSourceCategory = 'Live' | 'Relay' | 'Playback' | 'Titlebox';

export type BroadcastAirType = 'Live' | 'Rerun';

export type InsertType =
  | 'ID'
  | 'Tinjauan'
  | 'Sting'
  | 'PSA atau promo'
  | 'Mini features'
  | 'Endtag';

export interface RundownInsertRow {
  id: string;
  jenis: InsertType;
  jamMulai: string; // hh:mm:ss (timecode)
  durasi: string; // h:mm:ss
  jamSelesai: string;
  sumber: BroadcastSourceType;
}

export interface RundownProgramRow {
  id: string;
  mataAcara: string;
  tayang: BroadcastAirType;
  jamMulai: string; // hh:mm:ss
  durasi: string; // h:mm:ss
  jamSelesai: string;
  sumber: BroadcastSourceType;
  sumberCategory: BroadcastSourceCategory;
  lokasi?: string;
  catatan?: string;
  fromPolaAcara?: boolean;
  sisipanList: RundownInsertRow[];
  hasWarning?: boolean;
  warningMessage?: string;
  hasOverlap?: boolean;
}

export interface BroadcastCrewRosterItem {
  peran: string; // Pengarah Teknik, Master Control / CCU, Kamerawan, dll.
  personil: string; // Nama terisi otomatis dari Jadwal Dinas, atau 'Pemberitaan', atau '(Belum ada petugas)'
  statusPetugas: 'terisi' | 'belum_ada' | 'pemberitaan' | 'nama_tampil';
  sourceJobCode?: string;
  namaTampil?: string; // Khusus Penata Rias dan Penata Artistik
}

export interface DailyRundown {
  id: string;
  tanggal: string; // YYYY-MM-DD
  blok: 'Pagi' | 'Sore'; // Pagi 06:00-16:00, Sore 16:00-24:00 WITA
  status: 'draf' | 'tersimpan';
  savedAt?: string;
  sourceType: 'Pola Acara' | 'Mulai Kosong';
  programs: RundownProgramRow[];
  kerabatKerjaSiaran: BroadcastCrewRosterItem[];
  warnings: string[];
}

// ---------------------------------------------------------------------
// 2.1 MASTER POLA ACARA PENYIARAN (BROADCAST SCHEDULE GRID)
// ---------------------------------------------------------------------

export type BroadcastDay =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export type PolaKategoriType =
  | 'NEWS'
  | 'BUDAYA'
  | 'SPORT'
  | 'KIDS'
  | 'HIBURAN'
  | 'PENDIDIKAN'
  | 'RELAY JAKARTA'
  | 'PUJA TRISANDYA'
  | 'KERJASAMA'
  | 'Berita'
  | 'Budaya & Seni'
  | 'Relay Nasional'
  | 'Dokumenter'
  | 'Anak & Edukasi'
  | 'Agama'
  | 'Hiburan & Musik';

export interface PolaAcaraItem {
  id: string;
  hari: BroadcastDay | 'Setiap Hari' | 'Senin - Jumat' | 'Sabtu - Minggu';
  blok: 'Pagi' | 'Siang' | 'Sore' | 'Malam';
  jamMulai: string; // hh:mm:ss
  jamSelesai: string; // hh:mm:ss
  durasi: string; // h:mm:ss
  namaProgram: string;
  formatAcara: string; // Berita, Talkshow, Magazine, Budaya & Seni, Hiburan, Mimbar Agama, Anak, Dokumenter, Relay
  kategori: PolaKategoriType;
  sumber: BroadcastSourceType;
  sumberCategory: BroadcastSourceCategory;
  lokasiStudio?: string;
  isLive: boolean;
  kebutuhanKru: boolean; // True jika butuh kru studio/produksi
  estimasiKru?: number; // Perkiraan personil yang biasa dibutuhkan
  defaultSistemAlat?: 'Studio' | 'ENG' | 'EFP' | 'OB Van';
  deskripsi?: string;
  catatanTeknis?: string;
  sisipanDefault?: RundownInsertRow[];
}

export interface PolaGridSlot {
  id: string;
  jamMulai: string;
  jamSelesai: string;
  durasi: string;
  senin: { title: string; category: PolaKategoriType; notes?: string };
  selasa: { title: string; category: PolaKategoriType; notes?: string };
  rabu: { title: string; category: PolaKategoriType; notes?: string };
  kamis: { title: string; category: PolaKategoriType; notes?: string };
  jumat: { title: string; category: PolaKategoriType; notes?: string };
  sabtu: { title: string; category: PolaKategoriType; notes?: string };
  minggu: { title: string; category: PolaKategoriType; notes?: string };
}

// ---------------------------------------------------------------------
// 3. WIZARD 3 — SPR (SURAT PERMINTAAN KERABAT KERJA & PERALATAN PRODUKSI)
// ---------------------------------------------------------------------

export type SPRStatus =
  | 'Draf'
  | 'Menunggu Program'
  | 'Diajukan'
  | 'Ditugaskan sebagian'
  | 'Ditugaskan lengkap'
  | 'Selesai'
  | 'Dibatalkan'
  | 'Ditolak';

export type ProductionActivityType =
  | 'Survei'
  | 'Production Meeting'
  | 'Hunting'
  | 'Setting peralatan'
  | 'Produksi'
  | 'Pasca produksi'
  | 'On air';

export interface ProductionActivityItem {
  id: string;
  jenis: ProductionActivityType;
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // hh:mm:ss
  jamSelesai: string; // hh:mm:ss
  lokasi?: string;
  catatanCrew?: string;
  hasWarning?: boolean;
  warningMessage?: string;
}

export interface ProductionCrewNeed {
  profesi: string; // Kamerawan, Penata Cahaya, Penata Suara, Switcher, dll.
  jumlah: number; // stepper 0 sampai 10
  catatan?: string;
}

export type EquipmentSystemType = 'Studio' | 'ENG' | 'EFP' | 'OB Van';

export interface ProductionEquipment {
  sistem: EquipmentSystemType;
  jumlahKamera?: number; // stepper 1 sampai 8 bila Studio/EFP/OB Van
  keterangan?: string;
}

export interface SPRRevision {
  versi: number;
  tanggalRevisi: string;
  catatanRevisi: string;
  perbedaan: string[];
}

export interface SPRDocument {
  id: string;
  nomorSurat?: string;
  versi: number;
  programName: string;
  judul: string;
  jenisKegiatan: 'Peninjauan' | 'Produksi' | 'Rekaman' | 'Siaran langsung';
  formatAcara: string;
  durasi: string; // h:mm:ss
  pengisiAcara?: string;
  produser: string;
  divisiPeminta: 'Program' | 'Berita';
  isMendesak: boolean;
  status: SPRStatus;
  createdAt: string;
  catatanRevisi?: string;
  alasanPenolakan?: string;
  kegiatanList: ProductionActivityItem[];
  kebutuhanCrewList: ProductionCrewNeed[];
  sistemPeralatan: ProductionEquipment;
  riwayatRevisi?: SPRRevision[];
  totalCrewNeeded: number;
  totalCrewAssigned: number;
}

// ---------------------------------------------------------------------
// 4. WIZARD 4 — PENUGASAN SPR (DIVISI TEKNIK: SURAT PENUNJUKAN)
// ---------------------------------------------------------------------

export interface SPRAssignmentSlot {
  id: string;
  profesi: string;
  slotNumber: number; // e.g. slot 1 dari 3
  totalSlots: number;
  assignedCrewId?: string;
  assignedCrewName?: string;
  assignedCrewNip?: string;
  assignedCrewDivision?: string;
  secondaryRole?: string;
  status: 'terisi' | 'kosong';
  hanyaKegiatanTertentu?: string[]; // id ProductionActivityItem
}

export interface SPRAssignmentDocument {
  sprId: string;
  suratPenunjukanNomor?: string;
  status: 'Ditugaskan sebagian' | 'Ditugaskan lengkap';
  assignedSlots: SPRAssignmentSlot[];
  publishedAt?: string;
  qrVerificationCode?: string;
  warnings: string[];
}

// ---------------------------------------------------------------------
// 5. CROSS-SCHEDULE CONFLICT ENGINE & CANDIDATE POOL
// ---------------------------------------------------------------------

export type ConflictSeverity = 'pemblokir' | 'peringatan';

export type ConflictCategory =
  | 'overlap_penyiaran'
  | 'overlap_produksi'
  | 'jeda_istirahat'
  | 'ketersediaan_cuti'
  | 'studio_ganda';

export interface ScheduleConflict {
  crewId: string;
  crewName: string;
  category: ConflictCategory;
  severity: ConflictSeverity;
  date: string;
  timeRange: string;
  detail: string;
  conflictingItemName: string;
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
  // SAD v1.1 Availability & Workload metrics
  ketersediaanHariIni?: DutyAvailabilityCode;
  bebanTugasHariIni?: number; // e.g. "1 tugas pada tanggal ini"
  tugasAktifDeskripsi?: string;
  heldJobCodes?: string[]; // Job codes this candidate is qualified for
}

// ---------------------------------------------------------------------
// 5.1 MASTER DATA MODELS (SAD v1.1)
// ---------------------------------------------------------------------

export interface Employee {
  id: string;
  name: string;
  initials: string;
  nip: string;
  golongan?: string;
  division: 'Teknik' | 'Program' | 'Berita';
  subDivision?: string;
  phone: string;
  jobCodes: string[]; // e.g. ['CAM1', 'CAM2', 'SW1']
  isActive: boolean;
  avatarBg?: string;
}

export interface ProgramMaster {
  id: string;
  name: string;
  division: 'Program' | 'Berita';
  defaultFormat: string;
  defaultDuration: string; // h:mm:ss
  defaultLocation?: string;
  defaultSource?: BroadcastSourceType;
  defaultBroadcastType: BroadcastAirType;
}

export interface LocationMaster {
  id: string;
  name: string;
  type: 'studio' | 'control_room' | 'field' | 'editing';
}

export interface DoubleDutyRule {
  primaryCode: string;
  secondaryCode: string;
  isAllowed: boolean;
  requiresTeamLeadException?: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------
// 6. LEGACY COMPATIBILITY MODELS (Untuk komponen eksisting)
// ---------------------------------------------------------------------

export type RequestStatus =
  | 'Diajukan'
  | 'Ditugaskan'
  | 'Bentrok'
  | 'Diproses'
  | 'Selesai'
  | 'Draf'
  | 'Dikirim ke Program';

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
  returnedToProgramAt?: string;
  isCompletedRundown?: boolean;
  programType?: 'penyiaran' | 'produksi';
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
