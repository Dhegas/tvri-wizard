import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Save,
  FileText,
  Radio,
  Tv,
  Check,
  RotateCcw,
  Printer,
  Sparkles,
} from 'lucide-react';
import type {
  RundownProgramRow,
  RundownInsertRow,
  BroadcastSourceType,
  BroadcastSourceCategory,
  BroadcastAirType,
  InsertType,
  BroadcastCrewRosterItem,
  UserRole,
} from '../types';
import {
  MOCK_DAILY_RUNDOWNS,
  MOCK_PROGRAMS,
  MOCK_DUTY_SCHEDULE,
  MOCK_SPR_DOCUMENTS,
  MASTER_EMPLOYEES,
  getPolaAcaraForDateAndBlock,
  getDayNameFromDate,
} from '../data/mockData';
import {
  deriveBroadcastCrewRoster,
  checkStudioOverlapWarning,
  isTimeOverlapping,
} from '../utils/conflictDetector';
import { RundownPrintModal } from './RundownPrintModal';

interface RundownWizardProps {
  currentUserRole: UserRole;
  onClose: () => void;
  onOpenJadwalDinas?: () => void;
  initialDate?: string;
  initialBlock?: 'Pagi' | 'Sore';
}

const BROADCAST_SOURCES: BroadcastSourceType[] = [
  'Storage 3',
  'Playbox 3',
  'Playbox 4',
  'Live Studio 1',
  'Live Studio 2',
  'Live Studio 3',
  'Production 1',
  'Relay nasional',
  'Title Box',
];

const BROADCAST_LOCATIONS = [
  'Studio 1 (Utama - Live & Berita)',
  'Studio 2 (Musik & Budaya)',
  'Studio 3 (Podcast & Mimbar Agama)',
  'Ruang Master Control (MCR)',
  'Ruang Edit Pasca Produksi',
  'OB Van / Outdoor Broadcast',
  'Luar Lokasi',
];

const INSERT_TYPES: InsertType[] = [
  'ID',
  'Tinjauan',
  'Sting',
  'PSA atau promo',
  'Mini features',
  'Endtag',
];

// Helper to determine category from source
function getSourceCategory(source: BroadcastSourceType): BroadcastSourceCategory {
  if (source.startsWith('Live Studio')) return 'Live';
  if (source === 'Relay nasional') return 'Relay';
  if (source === 'Title Box') return 'Titlebox';
  return 'Playback';
}

function getCategoryColor(category: BroadcastSourceCategory): string {
  switch (category) {
    case 'Live':
      return '#F6B880';
    case 'Relay':
      return '#B5D1EE';
    case 'Playback':
      return '#D4D8DF';
    case 'Titlebox':
      return '#BFE0A8';
  }
}

// Convert "HH:MM:SS" or "H:MM:SS" to total seconds
function timecodeToSeconds(tc: string): number {
  if (!tc) return 0;
  const parts = tc.split(':').map((p) => parseInt(p, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
}

// Convert seconds to "HH:MM:SS"
function secondsToTimecode(secs: number): string {
  const safeSecs = Math.max(0, secs);
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = safeSecs % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Add duration (e.g., "0:24:00") to start (e.g., "16:00:00")
function addDuration(start: string, duration: string): string {
  const startSec = timecodeToSeconds(start);
  const durSec = timecodeToSeconds(duration);
  return secondsToTimecode(startSec + durSec);
}

// Initial Pola Acara programs for Pagi and Sore using official October 2026 Pola Acara
function generatePolaAcaraPrograms(block: 'Pagi' | 'Sore', date: string = '2026-10-12'): RundownProgramRow[] {
  return getPolaAcaraForDateAndBlock(date, block);
}

export function _legacyGeneratePolaAcaraPrograms(block: 'Pagi' | 'Sore'): RundownProgramRow[] {
  if (block === 'Pagi') {
    return [
      {
        id: 'pola-pagi-1',
        mataAcara: 'Warta Nusantara Pagi',
        tayang: 'Live',
        jamMulai: '06:00:00',
        durasi: '0:30:00',
        jamSelesai: '06:30:00',
        sumber: 'Live Studio 1',
        sumberCategory: 'Live',
        lokasi: 'Studio 1 (Utama - Live & Berita)',
        catatan: 'Live news pembuka siaran pagi TVRI Bali',
        fromPolaAcara: true,
        sisipanList: [
          { id: 'ins-p-1', jenis: 'ID', jamMulai: '06:00:00', durasi: '0:00:15', jamSelesai: '06:00:15', sumber: 'Storage 3' },
          { id: 'ins-p-2', jenis: 'Endtag', jamMulai: '06:29:45', durasi: '0:00:15', jamSelesai: '06:30:00', sumber: 'Storage 3' },
        ],
      },
      {
        id: 'pola-pagi-2',
        mataAcara: 'Nyurya Sewana',
        tayang: 'Rerun',
        jamMulai: '06:30:00',
        durasi: '0:30:00',
        jamSelesai: '07:00:00',
        sumber: 'Storage 3',
        sumberCategory: 'Playback',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-3',
        mataAcara: 'Gatra Bali Pagi',
        tayang: 'Live',
        jamMulai: '07:00:00',
        durasi: '0:30:00',
        jamSelesai: '07:30:00',
        sumber: 'Live Studio 1',
        sumberCategory: 'Live',
        lokasi: 'Studio 1 (Utama - Live & Berita)',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-4',
        mataAcara: 'Semeton Dewata',
        tayang: 'Rerun',
        jamMulai: '07:30:00',
        durasi: '0:30:00',
        jamSelesai: '08:00:00',
        sumber: 'Playbox 3',
        sumberCategory: 'Playback',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-5',
        mataAcara: 'Antar Nusa',
        tayang: 'Live',
        jamMulai: '08:00:00',
        durasi: '1:00:00',
        jamSelesai: '09:00:00',
        sumber: 'Relay nasional',
        sumberCategory: 'Relay',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-6',
        mataAcara: 'Mimbar Agama Hindu',
        tayang: 'Rerun',
        jamMulai: '11:00:00',
        durasi: '0:30:00',
        jamSelesai: '11:30:00',
        sumber: 'Storage 3',
        sumberCategory: 'Playback',
        lokasi: 'Studio 3 (Podcast & Mimbar Agama)',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-7',
        mataAcara: 'Seputar Bali Siang',
        tayang: 'Live',
        jamMulai: '11:30:00',
        durasi: '0:30:00',
        jamSelesai: '12:00:00',
        sumber: 'Live Studio 1',
        sumberCategory: 'Live',
        lokasi: 'Studio 1 (Utama - Live & Berita)',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-pagi-8',
        mataAcara: 'Indonesia Siang',
        tayang: 'Live',
        jamMulai: '12:00:00',
        durasi: '1:00:00',
        jamSelesai: '13:00:00',
        sumber: 'Relay nasional',
        sumberCategory: 'Relay',
        fromPolaAcara: true,
        sisipanList: [],
      },
    ];
  } else {
    // Sore Block (16:00 - 24:00 WITA)
    return [
      {
        id: 'pola-sore-1',
        mataAcara: 'Balivision',
        tayang: 'Live',
        jamMulai: '16:00:00',
        durasi: '0:24:00',
        jamSelesai: '16:24:00',
        sumber: 'Live Studio 2',
        sumberCategory: 'Live',
        lokasi: 'Studio 2 (Musik & Budaya)',
        catatan: 'Segmen dialog seni kerajinan perak Celuk',
        fromPolaAcara: true,
        sisipanList: [
          { id: 'ins-s-1', jenis: 'ID', jamMulai: '16:00:00', durasi: '0:00:15', jamSelesai: '16:00:15', sumber: 'Storage 3' },
          { id: 'ins-s-2', jenis: 'Sting', jamMulai: '16:12:00', durasi: '0:00:10', jamSelesai: '16:12:10', sumber: 'Storage 3' },
          { id: 'ins-s-3', jenis: 'Endtag', jamMulai: '16:23:45', durasi: '0:00:15', jamSelesai: '16:24:00', sumber: 'Storage 3' },
        ],
      },
      {
        id: 'pola-sore-2',
        mataAcara: 'Mimbar Agama Budha',
        tayang: 'Live',
        jamMulai: '16:30:00',
        durasi: '0:25:00',
        jamSelesai: '16:55:00',
        sumber: 'Live Studio 3',
        sumberCategory: 'Live',
        lokasi: 'Studio 3 (Podcast & Mimbar Agama)',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-sore-3',
        mataAcara: 'Bali Hari Ini',
        tayang: 'Live',
        jamMulai: '17:00:00',
        durasi: '0:48:00',
        jamSelesai: '17:48:00',
        sumber: 'Live Studio 1',
        sumberCategory: 'Live',
        lokasi: 'Studio 1 (Utama - Live & Berita)',
        catatan: 'Live news utama TVRI Stasiun Bali',
        fromPolaAcara: true,
        sisipanList: [
          { id: 'ins-s-4', jenis: 'ID', jamMulai: '17:00:00', durasi: '0:00:30', jamSelesai: '17:00:30', sumber: 'Storage 3' },
          { id: 'ins-s-5', jenis: 'PSA atau promo', jamMulai: '17:25:00', durasi: '0:01:00', jamSelesai: '17:26:00', sumber: 'Playbox 4' },
        ],
      },
      {
        id: 'pola-sore-4',
        mataAcara: 'Puja Tri Sandhya & Kidung Suci',
        tayang: 'Rerun',
        jamMulai: '18:00:00',
        durasi: '0:15:00',
        jamSelesai: '18:15:00',
        sumber: 'Storage 3',
        sumberCategory: 'Playback',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-sore-5',
        mataAcara: 'Indonesia Bicara',
        tayang: 'Live',
        jamMulai: '19:30:00',
        durasi: '1:00:00',
        jamSelesai: '20:30:00',
        sumber: 'Relay nasional',
        sumberCategory: 'Relay',
        fromPolaAcara: true,
        sisipanList: [],
      },
      {
        id: 'pola-sore-6',
        mataAcara: 'Title Box & Penutup Siaran',
        tayang: 'Rerun',
        jamMulai: '23:45:00',
        durasi: '0:15:00',
        jamSelesai: '24:00:00',
        sumber: 'Title Box',
        sumberCategory: 'Titlebox',
        fromPolaAcara: true,
        sisipanList: [],
      },
    ];
  }
}

export const RundownWizard: React.FC<RundownWizardProps> = ({
  currentUserRole,
  onClose,
  onOpenJadwalDinas,
  initialDate = '2026-10-12',
  initialBlock = 'Sore',
}) => {
  // Stepper State: R1 -> R2 -> R3 -> R4 -> SUCCESS
  const [currentStep, setCurrentStep] = useState<'R1' | 'R2' | 'R3' | 'R4' | 'SUCCESS'>('R1');

  // R1 State
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedBlock, setSelectedBlock] = useState<'Pagi' | 'Sore'>(initialBlock);
  const [sourceType, setSourceType] = useState<'Pola Acara' | 'Mulai Kosong'>('Pola Acara');

  // R2 Programs State
  const [programs, setPrograms] = useState<RundownProgramRow[]>(() =>
    generatePolaAcaraPrograms(initialBlock)
  );

  // R3 Folded cards state (which programs have inserts expanded)
  const [expandedInserts, setExpandedInserts] = useState<Record<string, boolean>>({
    'pola-sore-1': true,
    'pola-sore-3': true,
  });

  // R4 Kerabat Kerja Siaran Nama Tampil
  const [namaTampilRias, setNamaTampilRias] = useState<string>('Pande Ketut Muliasih, Dwi Indah Ayu');
  const [namaTampilArtistik, setNamaTampilArtistik] = useState<string>('Luthfi Quasimah Widoyo');

  // Modal for Viewing Full Kerabat Kerja in Success State
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  // Modal for Printing Official TVRI Bali Rundown Sheet
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Check if rundown for selectedDate and selectedBlock exists
  const existingRundown = useMemo(() => {
    return MOCK_DAILY_RUNDOWNS.find(
      (r) => r.tanggal === selectedDate && r.blok === selectedBlock
    );
  }, [selectedDate, selectedBlock]);

  // Date validation: past date check
  const isPastDate = useMemo(() => {
    const today = '2026-10-12'; // Current system anchor date
    return selectedDate < today;
  }, [selectedDate]);

  // Block time boundary limits
  const blockStartSec = selectedBlock === 'Pagi' ? timecodeToSeconds('06:00:00') : timecodeToSeconds('16:00:00');
  const blockEndSec = selectedBlock === 'Pagi' ? timecodeToSeconds('16:00:00') : timecodeToSeconds('24:00:00');
  const totalBlockSec = blockEndSec - blockStartSec;

  // Handle source choice on R1
  const handleProceedFromR1 = () => {
    if (sourceType === 'Pola Acara') {
      if (existingRundown) {
        setPrograms(existingRundown.programs);
      } else {
        setPrograms(getPolaAcaraForDateAndBlock(selectedDate, selectedBlock));
      }
    } else {
      // Mulai Kosong
      setPrograms([
        {
          id: `row-new-${Date.now()}`,
          mataAcara: '',
          tayang: 'Live',
          jamMulai: selectedBlock === 'Pagi' ? '06:00:00' : '16:00:00',
          durasi: '0:30:00',
          jamSelesai: selectedBlock === 'Pagi' ? '06:30:00' : '16:30:00',
          sumber: 'Live Studio 1',
          sumberCategory: 'Live',
          lokasi: 'Studio 1 (Utama - Live & Berita)',
          sisipanList: [],
        },
      ]);
    }
    setCurrentStep('R2');
  };

  // Add new program row in R2
  const handleAddProgram = () => {
    const lastRow = programs[programs.length - 1];
    const newStartTime = lastRow ? lastRow.jamSelesai : (selectedBlock === 'Pagi' ? '06:00:00' : '16:00:00');
    const defaultDur = '0:30:00';
    const newEndTime = addDuration(newStartTime, defaultDur);

    const newProg: RundownProgramRow = {
      id: `row-${Date.now()}`,
      mataAcara: '',
      tayang: 'Live',
      jamMulai: newStartTime,
      durasi: defaultDur,
      jamSelesai: newEndTime,
      sumber: 'Live Studio 1',
      sumberCategory: 'Live',
      lokasi: 'Studio 1 (Utama - Live & Berita)',
      sisipanList: [],
    };

    setPrograms((prev) => [...prev, newProg]);
  };

  // Delete program row in R2
  const handleDeleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  // Reorder row up or down (WCAG 2.5.7 accessibility)
  const handleMoveProgram = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === programs.length - 1) return;

    const newArr = [...programs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setPrograms(newArr);
  };

  // Update field of a program
  const handleUpdateProgram = (id: string, updates: Partial<RundownProgramRow>) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };

        // Recalculate end time if jamMulai or durasi changed
        if (updates.jamMulai || updates.durasi) {
          updated.jamSelesai = addDuration(updated.jamMulai, updated.durasi);
        }

        // Recalculate category if sumber changed
        if (updates.sumber) {
          updated.sumberCategory = getSourceCategory(updates.sumber);
          // Auto-fill lokasi if Live Studio
          if (updates.sumber === 'Live Studio 1') {
            updated.lokasi = 'Studio 1 (Utama - Live & Berita)';
          } else if (updates.sumber === 'Live Studio 2') {
            updated.lokasi = 'Studio 2 (Musik & Budaya)';
          } else if (updates.sumber === 'Live Studio 3') {
            updated.lokasi = 'Studio 3 (Podcast & Mimbar Agama)';
          }
        }

        return updated;
      })
    );
  };

  // R3 Add standard inserts to a program
  const handleAddStandardInserts = (programId: string) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== programId) return p;
        const pStartSec = timecodeToSeconds(p.jamMulai);
        const pEndSec = timecodeToSeconds(p.jamSelesai);
        const pMidSec = pStartSec + Math.floor((pEndSec - pStartSec) / 2);

        const standardSet: RundownInsertRow[] = [
          {
            id: `ins-${Date.now()}-1`,
            jenis: 'ID',
            jamMulai: p.jamMulai,
            durasi: '0:00:15',
            jamSelesai: secondsToTimecode(pStartSec + 15),
            sumber: 'Storage 3',
          },
          {
            id: `ins-${Date.now()}-2`,
            jenis: 'Sting',
            jamMulai: secondsToTimecode(pMidSec),
            durasi: '0:00:10',
            jamSelesai: secondsToTimecode(pMidSec + 10),
            sumber: 'Storage 3',
          },
          {
            id: `ins-${Date.now()}-3`,
            jenis: 'Endtag',
            jamMulai: secondsToTimecode(pEndSec - 15),
            durasi: '0:00:15',
            jamSelesai: p.jamSelesai,
            sumber: 'Storage 3',
          },
        ];

        return { ...p, sisipanList: standardSet };
      })
    );
    setExpandedInserts((prev) => ({ ...prev, [programId]: true }));
  };

  // R3 Add custom insert to program
  const handleAddManualInsert = (programId: string) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== programId) return p;
        const lastInsert = p.sisipanList[p.sisipanList.length - 1];
        const start = lastInsert ? lastInsert.jamSelesai : p.jamMulai;
        const dur = '0:00:30';
        const newInsert: RundownInsertRow = {
          id: `ins-manual-${Date.now()}`,
          jenis: 'PSA atau promo',
          jamMulai: start,
          durasi: dur,
          jamSelesai: addDuration(start, dur),
          sumber: 'Storage 3',
        };
        return { ...p, sisipanList: [...p.sisipanList, newInsert] };
      })
    );
    setExpandedInserts((prev) => ({ ...prev, [programId]: true }));
  };

  // R3 Delete insert
  const handleDeleteInsert = (programId: string, insertId: string) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== programId) return p;
        return {
          ...p,
          sisipanList: p.sisipanList.filter((ins) => ins.id !== insertId),
        };
      })
    );
  };

  // Validate R2 programs and detect blockers/warnings
  const analyzedPrograms = useMemo(() => {
    return programs.map((p, idx) => {
      let isOverlap = false;
      let overlapMsg = '';
      let warningMsg = '';

      // 1. Check internal overlap with other programs
      for (let j = 0; j < programs.length; j++) {
        if (idx !== j) {
          const other = programs[j];
          if (isTimeOverlapping(p.jamMulai, p.jamSelesai, other.jamMulai, other.jamSelesai)) {
            isOverlap = true;
            overlapMsg = `Bertumpuk dengan ${other.mataAcara || 'Program lain'} (${other.jamMulai.slice(0, 5)} sampai ${other.jamSelesai.slice(0, 5)}).`;
            break;
          }
        }
      }

      // 2. Check Studio Overlap with SPR productions (SAD v1.1 line 714)
      if (p.lokasi) {
        const studioOverlap = checkStudioOverlapWarning(
          p.lokasi,
          selectedDate,
          p.jamMulai,
          p.jamSelesai,
          MOCK_SPR_DOCUMENTS
        );
        if (studioOverlap) {
          warningMsg = studioOverlap;
        }
      }

      // 3. Cross-division warning (SAD v1.1 line 715)
      // Divisi Berita has evening bulletin at 17:00
      if (
        isTimeOverlapping(p.jamMulai, p.jamSelesai, '17:00:00', '18:00:00') &&
        p.mataAcara !== 'Bali Hari Ini' &&
        p.mataAcara !== 'Seputar Bali Siang'
      ) {
        warningMsg = (warningMsg ? `${warningMsg} • ` : '') + 'Divisi Berita memiliki Berita Sore pada jam ini.';
      }

      // 4. Incomplete state
      const isIncomplete = !p.mataAcara || !p.sumber || (p.tayang === 'Live' && !p.lokasi);

      return {
        ...p,
        hasOverlap: isOverlap,
        overlapMessage: overlapMsg,
        hasWarning: Boolean(warningMsg),
        warningMessage: warningMsg,
        isIncomplete,
      };
    });
  }, [programs, selectedDate]);

  // Overall check of R2 completeness & blockers
  const r2Stats = useMemo(() => {
    const total = analyzedPrograms.length;
    const completed = analyzedPrograms.filter((p) => !p.isIncomplete).length;
    const blockers = analyzedPrograms.filter((p) => p.hasOverlap);
    const warnings = analyzedPrograms.filter((p) => p.hasWarning);

    // Check gaps between rows (SAD v1.1 line 716)
    const gaps: { afterProgram: string; gapTime: string }[] = [];
    for (let i = 0; i < programs.length - 1; i++) {
      const curEndSec = timecodeToSeconds(programs[i].jamSelesai);
      const nextStartSec = timecodeToSeconds(programs[i + 1].jamMulai);
      if (nextStartSec > curEndSec) {
        const gapSec = nextStartSec - curEndSec;
        gaps.push({
          afterProgram: programs[i].mataAcara || `Baris ${i + 1}`,
          gapTime: secondsToTimecode(gapSec),
        });
      }
    }

    return {
      total,
      completed,
      hasBlocker: blockers.length > 0 || completed < total,
      blockerMessages: blockers.map((b) => b.overlapMessage),
      warningMessages: warnings.map((w) => w.warningMessage!),
      gaps,
    };
  }, [analyzedPrograms, programs]);

  // Derive Automatic Kerabat Kerja Siaran from Jadwal Dinas (R4)
  const rosterItems: BroadcastCrewRosterItem[] = useMemo(() => {
    const rawRoster = deriveBroadcastCrewRoster(
      selectedDate,
      selectedBlock,
      MOCK_DUTY_SCHEDULE,
      MASTER_EMPLOYEES
    );

    // Apply custom "Nama tampil" for Penata Rias and Penata Artistik
    return rawRoster.map((item) => {
      if (item.peran === 'Penata Rias') {
        return {
          ...item,
          personil: namaTampilRias || '(Belum diisi)',
          namaTampil: namaTampilRias,
        };
      }
      if (item.peran === 'Penata Artistik') {
        return {
          ...item,
          personil: namaTampilArtistik || '(Belum diisi)',
          namaTampil: namaTampilArtistik,
        };
      }
      return item;
    });
  }, [selectedDate, selectedBlock, namaTampilRias, namaTampilArtistik]);

  // Total inserts count across all programs
  const totalInsertsCount = useMemo(() => {
    return programs.reduce((acc, p) => acc + (p.sisipanList?.length || 0), 0);
  }, [programs]);

  return (
    <div className="panel-summary" style={{ maxWidth: 1200, margin: '0 auto', padding: 0 }}>
      {/* Top Modal / Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--divider)',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'var(--primary-container)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tv size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Wizard 2: Rundown Harian Penyiaran
              </h2>
              <span
                style={{
                  backgroundColor: currentStep === 'SUCCESS' ? 'var(--success-container)' : 'var(--primary-container)',
                  color: currentStep === 'SUCCESS' ? 'var(--on-success-container)' : 'var(--on-primary-container)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {currentStep === 'SUCCESS' ? 'Tersimpan' : 'Draf Siaran'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Alur penyusunan rundown program penyiaran harian (Kerabat Kerja Siaran terisi otomatis dari Jadwal Dinas)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="button-secondary"
          style={{ height: 34, fontSize: 13, padding: '0 12px' }}
        >
          Tutup
        </button>
      </div>

      {/* 4-Step Stepper Header */}
      {currentStep !== 'SUCCESS' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderBottom: '1px solid var(--divider)',
            backgroundColor: '#F8FAFC',
          }}
        >
          {[
            { id: 'R1', label: '1. Tanggal, Blok & Sumber' },
            { id: 'R2', label: '2. Mata Acara' },
            { id: 'R3', label: '3. Baris Sisipan' },
            { id: 'R4', label: '4. Tinjau & Kerabat Kerja' },
          ].map((st, i) => {
            const stepOrder = ['R1', 'R2', 'R3', 'R4'];
            const curIdx = stepOrder.indexOf(currentStep);
            const isCurrent = currentStep === st.id;
            const isDone = curIdx > i;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (curIdx > i) setCurrentStep(st.id as any);
                }}
                disabled={!isDone && !isCurrent}
                style={{
                  padding: '12px 14px',
                  border: 'none',
                  borderBottom: isCurrent ? '3px solid var(--primary)' : '3px solid transparent',
                  backgroundColor: isCurrent ? '#FFFFFF' : 'transparent',
                  textAlign: 'left',
                  cursor: isDone ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone ? <Check size={13} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--primary)' : isDone ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP BODY */}
      <div style={{ padding: '24px' }}>
        {/* ===================================================================
            STEP R1: TANGGAL, BLOK & SUMBER (SAD v1.1 lines 677-690)
            =================================================================== */}
        {currentStep === 'R1' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Warning if Date is in Past */}
            {isPastDate && (
              <div className="notice-warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Peringatan Tanggal Lewat:</strong> Tanggal ini sudah lewat ({selectedDate}). Perubahan akan tercatat di audit log resmi.
                </div>
              </div>
            )}

            {/* Info Notice if Rundown Already Exists */}
            {existingRundown && (
              <div className="notice-info" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Info size={18} />
                  <div>
                    <strong>Rundown Tersedia:</strong> Rundown {selectedBlock.toLowerCase()} untuk tanggal{' '}
                    <strong>{selectedDate}</strong> sudah ada ({existingRundown.programs.length} program tersimpan).
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="button-primary"
                    style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                    onClick={() => {
                      setPrograms(existingRundown.programs);
                      setCurrentStep('R2');
                    }}
                  >
                    Lanjutkan Rundown Itu
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                    onClick={() => setSelectedBlock(selectedBlock === 'Pagi' ? 'Sore' : 'Pagi')}
                  >
                    Pilih Blok Lain
                  </button>
                </div>
              </div>
            )}

            {/* Grid 1: Tanggal Siaran & Blok Siaran */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              {/* Field 1: Tanggal Siaran */}
              <div className="panel-summary" style={{ padding: 18 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>
                  Tanggal Siaran <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="input-default"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '100%', height: 42 }}
                  />
                </div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  Default hari siaran TVRI Stasiun Bali
                </span>
              </div>

              {/* Field 2: Blok Siaran (2 Selectable Cards) */}
              <div className="panel-summary" style={{ padding: 18 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>
                  Pilih Blok Siaran <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Card Pagi */}
                  <div
                    onClick={() => setSelectedBlock('Pagi')}
                    style={{
                      border: selectedBlock === 'Pagi' ? '2px solid var(--primary)' : '1px solid var(--divider)',
                      backgroundColor: selectedBlock === 'Pagi' ? 'var(--primary-container)' : '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                        Blok Pagi
                      </span>
                      <Radio size={16} color={selectedBlock === 'Pagi' ? 'var(--primary)' : 'var(--muted)'} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                      06:00 – 16:00 WITA
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      10 jam durasi siaran • Berita & Budaya
                    </div>
                  </div>

                  {/* Card Sore */}
                  <div
                    onClick={() => setSelectedBlock('Sore')}
                    style={{
                      border: selectedBlock === 'Sore' ? '2px solid var(--primary)' : '1px solid var(--divider)',
                      backgroundColor: selectedBlock === 'Sore' ? 'var(--primary-container)' : '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                        Blok Sore
                      </span>
                      <Radio size={16} color={selectedBlock === 'Sore' ? 'var(--primary)' : 'var(--muted)'} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                      16:00 – 24:00 WITA
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      8 jam durasi siaran • Prime Time & Berita Utama
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 3: Sumber Baris (Pola Acara vs Mulai Kosong) */}
            <div className="panel-summary" style={{ padding: 18 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 12 }}>
                Pilihan Sumber Baris Rundown <span style={{ color: 'var(--error)' }}>*</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Opsi 1: Mulai dari Pola Acara */}
                <div
                  onClick={() => setSourceType('Pola Acara')}
                  style={{
                    border: sourceType === 'Pola Acara' ? '2px solid var(--primary)' : '1px solid var(--divider)',
                    backgroundColor: sourceType === 'Pola Acara' ? '#F4F7FF' : '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={18} color="var(--primary)" />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                        Mulai dari Pola Acara
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'var(--success-container)',
                        color: 'var(--on-success-container)',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      Rekomendasi
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Memuat mata acara resmi terjadwal sesuai pola acara stasiun tanpa mengetik dari nol.
                  </p>

                  {/* Pratinjau Pola Acara */}
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 12px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 6,
                      border: '1px solid var(--divider)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                      Pratinjau: {getDayNameFromDate(selectedDate)}, {selectedDate} (Pola Acara Resmi TVRI Bali)
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {getPolaAcaraForDateAndBlock(selectedDate, selectedBlock).length} mata acara terdaftar
                    </span>
                  </div>
                </div>

                {/* Opsi 2: Mulai Kosong */}
                <div
                  onClick={() => setSourceType('Mulai Kosong')}
                  style={{
                    border: sourceType === 'Mulai Kosong' ? '2px solid var(--primary)' : '1px solid var(--divider)',
                    backgroundColor: sourceType === 'Mulai Kosong' ? '#F4F7FF' : '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="var(--muted)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                      Mulai Kosong
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Menyusun susunan siaran dari lembar kosong untuk program ad-hoc atau siaran luar biasa.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="button-primary"
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
                onClick={handleProceedFromR1}
              >
                <span>Lanjut ke Mata Acara (R2)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP R2: MATA ACARA (SAD v1.1 lines 691-734)
            =================================================================== */}
        {currentStep === 'R2' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Horizontal Time Strip */}
            <div className="time-strip-card">
              <div className="time-strip-header">
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>
                    Strip Waktu Siaran &mdash; Blok {selectedBlock} ({selectedDate})
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                    {programs.length} program terjadwal
                  </span>
                </div>

                {/* Legend */}
                <div className="time-strip-legend">
                  <div className="time-strip-legend-item">
                    <div className="time-strip-legend-dot" style={{ backgroundColor: '#F6B880' }} />
                    <span>Live Studio</span>
                  </div>
                  <div className="time-strip-legend-item">
                    <div className="time-strip-legend-dot" style={{ backgroundColor: '#B5D1EE' }} />
                    <span>Relay Nasional</span>
                  </div>
                  <div className="time-strip-legend-item">
                    <div className="time-strip-legend-dot" style={{ backgroundColor: '#D4D8DF' }} />
                    <span>Playback / Storage</span>
                  </div>
                  <div className="time-strip-legend-item">
                    <div className="time-strip-legend-dot" style={{ backgroundColor: '#BFE0A8' }} />
                    <span>Title Box</span>
                  </div>
                </div>
              </div>

              {/* Visual Strip Track */}
              <div className="time-strip-track">
                {analyzedPrograms.map((prog) => {
                  const pStartSec = timecodeToSeconds(prog.jamMulai);
                  const pEndSec = timecodeToSeconds(prog.jamSelesai);
                  const durSec = Math.max(0, pEndSec - pStartSec);
                  const widthPct = Math.max(2, (durSec / totalBlockSec) * 100);

                  return (
                    <div
                      key={prog.id}
                      className={`time-strip-segment ${prog.hasOverlap ? 'has-overlap' : prog.hasWarning ? 'has-warning' : ''}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: prog.hasOverlap ? '#F87171' : getCategoryColor(prog.sumberCategory),
                      }}
                      title={`${prog.mataAcara || 'Program Baru'}, ${prog.jamMulai} - ${prog.jamSelesai} (${prog.sumber})${prog.warningMessage ? ` • Peringatan: ${prog.warningMessage}` : ''}`}
                    >
                      <span>{prog.mataAcara || '...'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Time Ruler */}
              <div className="time-strip-ruler">
                {selectedBlock === 'Pagi' ? (
                  <>
                    <span>06:00</span>
                    <span>08:00</span>
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                  </>
                ) : (
                  <>
                    <span>16:00</span>
                    <span>17:00</span>
                    <span>18:00</span>
                    <span>19:00</span>
                    <span>20:00</span>
                    <span>21:00</span>
                    <span>22:00</span>
                    <span>23:00</span>
                    <span>24:00</span>
                  </>
                )}
              </div>
            </div>

            {/* Blockers & Gaps Banners if any */}
            {r2Stats.blockerMessages.length > 0 && (
              <div className="notice-error">
                <AlertCircle size={20} />
                <div>
                  <strong>Pemblokir Jadwal:</strong> Ada program bertumpuk dalam rundown ini.
                  <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                    {r2Stats.blockerMessages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {r2Stats.gaps.length > 0 && (
              <div className="notice-warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Celah Waktu Siaran (Gap):</strong> Ditemukan jeda waktu antar program:
                  <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                    {r2Stats.gaps.map((g, i) => (
                      <li key={i}>
                        Ada celah {g.gapTime} setelah {g.afterProgram}.
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Bar (Top of Table) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleAddProgram}
                  style={{ height: 38, fontSize: 13, padding: '0 16px', gap: 6 }}
                >
                  <Plus size={16} /> Tambah Mata Acara
                </button>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: r2Stats.completed === r2Stats.total ? 'var(--success)' : 'var(--muted)',
                    fontWeight: 600,
                  }}
                >
                  {r2Stats.completed} dari {r2Stats.total} baris lengkap
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Urutan baris dapat dipindah menggunakan tombol <strong>Naik / Turun</strong>.
              </div>
            </div>

            {/* List of Program Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analyzedPrograms.map((prog, index) => (
                <div
                  key={prog.id}
                  className={`rundown-item-row ${prog.hasOverlap ? 'has-blocker' : prog.hasWarning ? 'has-warning' : prog.isIncomplete ? 'is-incomplete' : ''}`}
                >
                  {/* Top Bar of Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      borderBottom: '1px solid #F1F5F9',
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Order and Reorder Buttons (WCAG 2.5.7) */}
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: '#E2E8F0',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {index + 1}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="reorder-action-btn"
                          disabled={index === 0}
                          onClick={() => handleMoveProgram(index, 'up')}
                          title="Pindahkan baris ke atas (WCAG 2.5.7)"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="reorder-action-btn"
                          disabled={index === programs.length - 1}
                          onClick={() => handleMoveProgram(index, 'down')}
                          title="Pindahkan baris ke bawah (WCAG 2.5.7)"
                        >
                          <ChevronDown size={15} />
                        </button>
                      </div>

                      {/* Source tag & Badges */}
                      {prog.fromPolaAcara && (
                        <span
                          style={{
                            fontSize: 11,
                            backgroundColor: '#E2E8F0',
                            color: 'var(--ink)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          Dari Pola Acara
                        </span>
                      )}

                      {prog.isIncomplete && (
                        <span
                          style={{
                            fontSize: 11,
                            backgroundColor: 'var(--warning-container)',
                            color: 'var(--on-warning-container)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          Perlu dilengkapi
                        </span>
                      )}

                      {prog.sisipanList && prog.sisipanList.length > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            backgroundColor: 'var(--primary-container)',
                            color: 'var(--on-primary-container)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          {prog.sisipanList.length} sisipan
                        </span>
                      )}
                    </div>

                    {/* Delete Row */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(prog.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                      }}
                      title="Hapus baris program ini"
                    >
                      <Trash2 size={15} /> Hapus
                    </button>
                  </div>

                  {/* Input Fields Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1fr 1.3fr 1.8fr 1.3fr 1.8fr 2fr',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    {/* Mata Acara Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Mata Acara <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        list={`prog-list-${prog.id}`}
                        className="input-default"
                        value={prog.mataAcara}
                        placeholder="Ketik / pilih program"
                        onChange={(e) => handleUpdateProgram(prog.id, { mataAcara: e.target.value })}
                        style={{ width: '100%', height: 36, fontSize: 13 }}
                      />
                      <datalist id={`prog-list-${prog.id}`}>
                        {MOCK_PROGRAMS.map((mp) => (
                          <option key={mp.id} value={mp.name} />
                        ))}
                      </datalist>
                    </div>

                    {/* Tayang Field (Live / Rerun) */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Tayang <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        className="input-default"
                        value={prog.tayang}
                        onChange={(e) =>
                          handleUpdateProgram(prog.id, { tayang: e.target.value as BroadcastAirType })
                        }
                        style={{ width: '100%', height: 36, fontSize: 13 }}
                      >
                        <option value="Live">Live</option>
                        <option value="Rerun">Rerun</option>
                      </select>
                    </div>

                    {/* Jam Mulai Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Jam Mulai <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-default"
                        value={prog.jamMulai}
                        onChange={(e) => handleUpdateProgram(prog.id, { jamMulai: e.target.value })}
                        style={{ width: '100%', height: 36, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                      />
                    </div>

                    {/* Durasi Field + Quick Chips */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600 }}>
                          Durasi <span style={{ color: 'var(--error)' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="quick-chip"
                            onClick={() => handleUpdateProgram(prog.id, { durasi: '0:10:00' })}
                          >
                            0:10
                          </button>
                          <button
                            type="button"
                            className="quick-chip"
                            onClick={() => handleUpdateProgram(prog.id, { durasi: '0:30:00' })}
                          >
                            0:30
                          </button>
                          <button
                            type="button"
                            className="quick-chip"
                            onClick={() => handleUpdateProgram(prog.id, { durasi: '1:00:00' })}
                          >
                            1:00
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="input-default"
                        value={prog.durasi}
                        onChange={(e) => handleUpdateProgram(prog.id, { durasi: e.target.value })}
                        style={{ width: '100%', height: 36, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                      />
                    </div>

                    {/* Jam Selesai Field (Read Only) */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Jam Selesai
                      </label>
                      <div
                        className="slot-time"
                        style={{
                          width: '100%',
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {prog.jamSelesai}
                      </div>
                    </div>

                    {/* Sumber Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Sumber <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        className="input-default"
                        value={prog.sumber}
                        onChange={(e) =>
                          handleUpdateProgram(prog.id, { sumber: e.target.value as BroadcastSourceType })
                        }
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      >
                        {BROADCAST_SOURCES.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lokasi Field */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Lokasi {prog.tayang === 'Live' && <span style={{ color: 'var(--error)' }}>*</span>}
                      </label>
                      <select
                        className="input-default"
                        value={prog.lokasi || ''}
                        onChange={(e) => handleUpdateProgram(prog.id, { lokasi: e.target.value })}
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      >
                        <option value="">-- Pilih Lokasi --</option>
                        {BROADCAST_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row Inline Alerts (Overlap Blocker & Studio Overlap Warning) */}
                  {prog.hasOverlap && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '6px 12px',
                        backgroundColor: 'var(--error-container)',
                        color: 'var(--on-error-container)',
                        borderRadius: 4,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AlertCircle size={15} />
                      <strong>Pemblokir:</strong> {prog.overlapMessage}
                    </div>
                  )}

                  {prog.hasWarning && !prog.hasOverlap && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '6px 12px',
                        backgroundColor: 'var(--warning-container)',
                        color: 'var(--on-warning-container)',
                        borderRadius: 4,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AlertTriangle size={15} />
                      <strong>Peringatan Jadwal:</strong> {prog.warningMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Step Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('R1')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Tanggal & Blok
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={r2Stats.hasBlocker}
                onClick={() => setCurrentStep('R3')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
                title={r2Stats.hasBlocker ? 'Selesaikan pemblokir dan lengkapi baris program dahulu' : 'Lanjut ke baris sisipan'}
              >
                <span>Lanjut ke Baris Sisipan (R3)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP R3: BARIS SISIPAN (SAD v1.1 lines 735-753)
            =================================================================== */}
        {currentStep === 'R3' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Baris Sisipan Program (ID, Sting, Promo, Endtag)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Kelola baris sisipan di dalam tiap program. Sisipan dapat ditambahkan secara otomatis lewat &quot;Tambah Sisipan Standar&quot;.
                </p>
              </div>

              <span
                style={{
                  backgroundColor: 'var(--primary-container)',
                  color: 'var(--on-primary-container)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 12,
                }}
              >
                Total {totalInsertsCount} sisipan aktif
              </span>
            </div>

            {/* Program Folding Accordions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {programs.map((prog, pIdx) => {
                const isExpanded = expandedInserts[prog.id];
                const insertList = prog.sisipanList || [];

                return (
                  <div
                    key={prog.id}
                    style={{
                      border: '1px solid var(--divider)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFFFF',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Program Header */}
                    <div
                      style={{
                        padding: '14px 18px',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setExpandedInserts((prev) => ({ ...prev, [prog.id]: !isExpanded }))
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-container)',
                            color: 'var(--primary)',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {pIdx + 1}
                        </span>

                        <div>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--ink)' }}>
                            {prog.mataAcara || 'Program Tanpa Judul'}
                          </strong>
                          <span
                            style={{
                              marginLeft: 8,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8125rem',
                              color: 'var(--muted)',
                            }}
                          >
                            {prog.jamMulai} &mdash; {prog.jamSelesai} ({prog.durasi})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            backgroundColor: insertList.length > 0 ? '#E2E8F0' : '#F1F5F9',
                            color: insertList.length > 0 ? 'var(--ink)' : 'var(--muted)',
                            fontSize: 12,
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          {insertList.length} sisipan
                        </span>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddStandardInserts(prog.id);
                          }}
                          className="button-secondary"
                          style={{ height: 30, fontSize: 11, padding: '0 8px', cursor: 'pointer' }}
                        >
                          + Tambah Sisipan Standar
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddManualInsert(prog.id);
                          }}
                          className="button-secondary"
                          style={{ height: 30, fontSize: 11, padding: '0 8px', cursor: 'pointer' }}
                        >
                          + Sisipan Manual
                        </div>

                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Inserts Body (if expanded) */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--divider)' }}>
                        {insertList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>
                            Belum ada sisipan. Tambah sisipan standar atau lanjut tanpa sisipan.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--divider)', color: 'var(--muted)' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Jenis Sisipan</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Jam Mulai</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Durasi</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Jam Selesai</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Sumber</th>
                                <th style={{ textAlign: 'center', padding: '6px 8px', width: 60 }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {insertList.map((ins) => (
                                <tr key={ins.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '8px' }}>
                                    <select
                                      className="input-default"
                                      value={ins.jenis}
                                      onChange={(e) => {
                                        const val = e.target.value as InsertType;
                                        setPrograms((prev) =>
                                          prev.map((p) => {
                                            if (p.id !== prog.id) return p;
                                            return {
                                              ...p,
                                              sisipanList: p.sisipanList.map((item) =>
                                                item.id === ins.id ? { ...item, jenis: val } : item
                                              ),
                                            };
                                          })
                                        );
                                      }}
                                      style={{ height: 32, fontSize: 12 }}
                                    >
                                      {INSERT_TYPES.map((it) => (
                                        <option key={it} value={it}>
                                          {it}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <input
                                      type="text"
                                      className="input-default"
                                      value={ins.jamMulai}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPrograms((prev) =>
                                          prev.map((p) => {
                                            if (p.id !== prog.id) return p;
                                            return {
                                              ...p,
                                              sisipanList: p.sisipanList.map((item) =>
                                                item.id === ins.id
                                                  ? { ...item, jamMulai: val, jamSelesai: addDuration(val, item.durasi) }
                                                  : item
                                              ),
                                            };
                                          })
                                        );
                                      }}
                                      style={{ height: 32, fontFamily: 'var(--font-mono)', fontSize: 12, width: 100 }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <input
                                      type="text"
                                      className="input-default"
                                      value={ins.durasi}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPrograms((prev) =>
                                          prev.map((p) => {
                                            if (p.id !== prog.id) return p;
                                            return {
                                              ...p,
                                              sisipanList: p.sisipanList.map((item) =>
                                                item.id === ins.id
                                                  ? { ...item, durasi: val, jamSelesai: addDuration(item.jamMulai, val) }
                                                  : item
                                              ),
                                            };
                                          })
                                        );
                                      }}
                                      style={{ height: 32, fontFamily: 'var(--font-mono)', fontSize: 12, width: 90 }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{ins.jamSelesai}</td>
                                  <td style={{ padding: '8px' }}>
                                    <select
                                      className="input-default"
                                      value={ins.sumber}
                                      onChange={(e) => {
                                        const val = e.target.value as BroadcastSourceType;
                                        setPrograms((prev) =>
                                          prev.map((p) => {
                                            if (p.id !== prog.id) return p;
                                            return {
                                              ...p,
                                              sisipanList: p.sisipanList.map((item) =>
                                                item.id === ins.id ? { ...item, sumber: val } : item
                                              ),
                                            };
                                          })
                                        );
                                      }}
                                      style={{ height: 32, fontSize: 12 }}
                                    >
                                      {BROADCAST_SOURCES.map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInsert(prog.id, ins.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                      }}
                                      title="Hapus sisipan"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('R2')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Mata Acara
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={() => setCurrentStep('R4')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
              >
                <span>Lanjut ke Tinjau Rundown (R4)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP R4: TINJAU & KERABAT KERJA SIARAN (SAD v1.1 lines 754-773)
            =================================================================== */}
        {currentStep === 'R4' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Rundown Summary Card */}
            <div className="panel-summary" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Ringkasan Rundown Siaran {selectedBlock} &mdash; {selectedDate}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Penyelenggaraan Siaran TVRI Stasiun Bali
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 6,
                      border: '1px solid var(--divider)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Program</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{programs.length}</div>
                  </div>

                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 6,
                      border: '1px solid var(--divider)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Sisipan</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{totalInsertsCount}</div>
                  </div>

                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 6,
                      border: '1px solid var(--divider)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Jam Pertama</div>
                    <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      {programs[0]?.jamMulai || '--:--'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 6,
                      border: '1px solid var(--divider)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Jam Terakhir</div>
                    <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      {programs[programs.length - 1]?.jamSelesai || '--:--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Strip Read-Only Preview */}
              <div className="time-strip-track" style={{ height: 28 }}>
                {analyzedPrograms.map((prog) => {
                  const pStartSec = timecodeToSeconds(prog.jamMulai);
                  const pEndSec = timecodeToSeconds(prog.jamSelesai);
                  const durSec = Math.max(0, pEndSec - pStartSec);
                  const widthPct = Math.max(2, (durSec / totalBlockSec) * 100);

                  return (
                    <div
                      key={prog.id}
                      className="time-strip-segment"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: getCategoryColor(prog.sumberCategory),
                        fontSize: 10,
                      }}
                      title={`${prog.mataAcara}: ${prog.jamMulai} - ${prog.jamSelesai}`}
                    >
                      {prog.mataAcara}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warnings Alert with Jump "Perbaiki" buttons if any warnings */}
            {r2Stats.warningMessages.length > 0 && (
              <div className="notice-warning" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={20} />
                  <div>
                    <strong>Peringatan Terdeteksi:</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: '0.8125rem' }}>
                      {r2Stats.warningMessages.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setCurrentStep('R2')}
                  style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                >
                  Perbaiki di R2
                </button>
              </div>
            )}

            {/* Kerabat Kerja Siaran (HANYA BACA - Otomatis dari Jadwal Dinas) */}
            <div className="panel-summary" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Kerabat Kerja Siaran (Hanya Baca)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Terisi otomatis dari <strong>Jadwal Dinas Bulanan ({selectedDate})</strong> yang jendela waktunya beririsan dengan Blok {selectedBlock}.
                    Tidak memerlukan pengisian kuota kru.
                  </p>
                </div>

                {currentUserRole === 'admin_teknik' && onOpenJadwalDinas && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={onOpenJadwalDinas}
                    style={{ height: 32, fontSize: 12, padding: '0 10px', gap: 4 }}
                  >
                    <Calendar size={14} /> Buka Jadwal Dinas
                  </button>
                )}
              </div>

              {/* Roster Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }}>
                <table className="kerabat-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No</th>
                      <th style={{ width: 220 }}>Peran Penyiaran</th>
                      <th>Personil Ditugaskan (Otomatis dari Jadwal Dinas)</th>
                      <th style={{ width: 120 }}>Kode / Sumber</th>
                      <th style={{ width: 120 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterItems.map((item, idx) => {
                      const isUnassigned = item.statusPetugas === 'belum_ada';
                      const isNews = item.statusPetugas === 'pemberitaan';
                      const isNamaTampil = item.statusPetugas === 'nama_tampil';

                      return (
                        <tr key={item.peran}>
                          <td style={{ color: 'var(--muted)', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.peran}</td>
                          <td>
                            {isNamaTampil ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="text"
                                  className="input-default"
                                  value={item.peran === 'Penata Rias' ? namaTampilRias : namaTampilArtistik}
                                  onChange={(e) => {
                                    if (item.peran === 'Penata Rias') {
                                      setNamaTampilRias(e.target.value);
                                    } else {
                                      setNamaTampilArtistik(e.target.value);
                                    }
                                  }}
                                  placeholder="Ketik nama tampil..."
                                  style={{ height: 32, fontSize: 13, width: 320 }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--muted)' }}>(Nama tampil manual)</span>
                              </div>
                            ) : isNews ? (
                              <span style={{ fontWeight: 600, color: '#B91C1C' }}>Pemberitaan</span>
                            ) : isUnassigned ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--error)', fontStyle: 'italic' }}>
                                  Belum ada petugas di Jadwal Dinas
                                </span>
                                {currentUserRole === 'admin_program' && (
                                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                    (Hubungi Admin Teknik)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <strong style={{ color: 'var(--ink)' }}>{item.personil}</strong>
                            )}
                          </td>
                          <td>
                            {item.sourceJobCode ? (
                              <span
                                style={{
                                  backgroundColor: '#E2E8F0',
                                  color: 'var(--ink)',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {item.sourceJobCode}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: 12 }}>&mdash;</span>
                            )}
                          </td>
                          <td>
                            {isUnassigned ? (
                              <span
                                style={{
                                  backgroundColor: 'var(--error-container)',
                                  color: 'var(--on-error-container)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                Belum Terisi
                              </span>
                            ) : isNews ? (
                              <span
                                style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#991B1B',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                Divisi Berita
                              </span>
                            ) : isNamaTampil ? (
                              <span
                                style={{
                                  backgroundColor: 'var(--primary-container)',
                                  color: 'var(--on-primary-container)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                Nama Tampil
                              </span>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: 'var(--success-container)',
                                  color: 'var(--on-success-container)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                Terisi Otomatis
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('R3')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Sisipan
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Secondary: Cetak Lembar Resmi Rundown PDF/A4 */}
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowPrintModal(true)}
                  style={{ height: 42, padding: '0 16px', gap: 6 }}
                  title="Cetak atau unduh lembar resmi Rundown Penyelenggaraan Siaran TVRI Bali"
                >
                  <Printer size={16} />
                  <span>Cetak Lembar Resmi Rundown (A4)</span>
                </button>

                {/* Primary Action: Simpan Rundown */}
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setCurrentStep('SUCCESS')}
                  style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
                >
                  <Save size={16} />
                  <span>Simpan Rundown</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUCCESS SCREEN (SAD v1.1 line 772)
            =================================================================== */}
        {currentStep === 'SUCCESS' && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--success-container)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink)' }}>
              Rundown {selectedBlock.toLowerCase()} {selectedDate} tersimpan.
            </h2>

            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Rundown penyiaran telah berhasil disimpan di sistem. Daftar Kerabat Kerja Siaran disinkronkan secara real-time dari Jadwal Dinas Bulanan.
            </p>

            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                border: '1px solid var(--divider)',
                marginBottom: 28,
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Tanggal & Blok</span>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                  {selectedDate} ({selectedBlock})
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Mata Acara & Sisipan</span>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                  {programs.length} Acara • {totalInsertsCount} Sisipan
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Sinkronisasi Kru</span>
                <strong style={{ fontSize: 13, color: 'var(--success)' }}>
                  15 Peran Terhubung
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowPrintModal(true)}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <Printer size={16} /> Cetak Lembar Resmi (A4)
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowRosterModal(true)}
                style={{ height: 42, padding: '0 16px', gap: 6 }}
              >
                <Tv size={16} /> Kerabat Kerja Siaran
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setCurrentStep('R1');
                  setSelectedDate('2026-10-13');
                }}
                style={{ height: 42, padding: '0 16px', gap: 6 }}
              >
                <RotateCcw size={16} /> Susun Lain
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={onClose}
                style={{ height: 42, padding: '0 18px' }}
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CETAK LEMBAR RESMI RUNDOWN (A4) */}
      <RundownPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        date={selectedDate}
        block={selectedBlock}
        programs={programs}
        rosterItems={rosterItems}
      />

      {/* MODAL: LIHAT KERABAT KERJA SIARAN (dari success screen) */}
      {showRosterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Kerabat Kerja Penyelenggaraan Siaran
                </h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  TVRI Stasiun Bali &bull; Blok {selectedBlock} &bull; {selectedDate}
                </span>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowRosterModal(false)}
                style={{ height: 32, padding: '0 10px' }}
              >
                Tutup
              </button>
            </div>

            <table className="kerabat-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Peran Penyiaran</th>
                  <th>Personil Ditugaskan</th>
                  <th>Kode Shift</th>
                </tr>
              </thead>
              <tbody>
                {rosterItems.map((r, i) => (
                  <tr key={r.peran}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.peran}</td>
                    <td>{r.personil}</td>
                    <td>
                      {r.sourceJobCode ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                          {r.sourceJobCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RundownWizard;
