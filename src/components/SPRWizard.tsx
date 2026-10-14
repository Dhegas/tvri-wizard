import React, { useState, useMemo } from 'react';
import {
  Film,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Printer,
  Sparkles,
  RotateCcw,
  Radio,
  Send,
  XCircle,
} from 'lucide-react';
import type {
  SPRDocument,
  SPRStatus,
  ProductionActivityItem,
  ProductionActivityType,
  ProductionCrewNeed,
  EquipmentSystemType,
  UserRole,
} from '../types';
import {
  MOCK_PROGRAMS,
  MOCK_LOCATIONS,
  MASTER_EMPLOYEES,
  MOCK_SPR_DOCUMENTS,
} from '../data/mockData';
import {
  checkStudioOverlapWarning,
} from '../utils/conflictDetector';
import { SPRPrintModal } from './SPRPrintModal';

interface SPRWizardProps {
  currentUserRole: UserRole;
  onClose: () => void;
  onSubmitSPR: (spr: SPRDocument) => void;
  existingSpr?: SPRDocument | null;
  initialProgramFromPola?: { programName: string; format: string; duration: string } | null;
}

// 22 Official TVRI Bali Professions
const OFFICIAL_PROFESSIONS = [
  'Kamerawan',
  'Penata Suara',
  'Penata Cahaya',
  'T.D',
  'Switcher',
  'Maintenance',
  'CCU/VE',
  'VTR/Editor',
  'Chargen',
  'Op. LED',
  'Listrik Op',
  'IT',
  'MC',
  'UM',
  'Penata Rias',
  'Penata Artistik',
  'Dekor',
  'Op. Jib Crane',
  'Pemasaran',
  'Peralatan',
  'SNG',
  'Pengemudi',
];

const ACTIVITY_PHASES: ProductionActivityType[] = [
  'Survei',
  'Production Meeting',
  'Hunting',
  'Setting peralatan',
  'Produksi',
  'Pasca produksi',
  'On air',
];

export const SPRWizard: React.FC<SPRWizardProps> = ({
  currentUserRole,
  onClose,
  onSubmitSPR,
  existingSpr = null,
  initialProgramFromPola = null,
}) => {
  // Stepper: S1 -> S2 -> S3 -> S4 -> SUCCESS
  const [currentStep, setCurrentStep] = useState<'S1' | 'S2' | 'S3' | 'S4' | 'SUCCESS'>('S1');

  // S1 State (Produksi)
  const isEditingRevision = Boolean(existingSpr && existingSpr.versi >= 1);
  const currentVersion = existingSpr ? existingSpr.versi + (isEditingRevision ? 1 : 0) : 1;

  const [programName, setProgramName] = useState<string>(
    initialProgramFromPola?.programName || existingSpr?.programName || 'Dialog Budaya Bali'
  );
  const [judul, setJudul] = useState<string>(
    initialProgramFromPola
      ? `${initialProgramFromPola.programName}: Produksi Reguler Pola Acara`
      : existingSpr?.judul || 'Dialog Budaya Bali: Harmoni dan Pelestarian Desa Adat'
  );
  const [jenisKegiatan, setJenisKegiatan] = useState<'Peninjauan' | 'Produksi' | 'Rekaman' | 'Siaran langsung'>(
    existingSpr?.jenisKegiatan || 'Produksi'
  );
  const [formatAcara, setFormatAcara] = useState<string>(
    initialProgramFromPola?.format || existingSpr?.formatAcara || 'Dialog'
  );
  const [durasi, setDurasi] = useState<string>(
    initialProgramFromPola?.duration || existingSpr?.durasi || '0:30:00'
  );
  const [pengisiAcara, setPengisiAcara] = useState<string>(
    existingSpr?.pengisiAcara || 'Alfina Lutfa Azizah, S.Sos. dan Umu Afifah, S.Ag.'
  );
  const [produser, setProduser] = useState<string>(existingSpr?.produser || 'Eryawan Srimartono');
  const [isMendesak, setIsMendesak] = useState<boolean>(existingSpr?.isMendesak || false);
  const [catatanRevisi, setCatatanRevisi] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');

  // Divisi Peminta (Program vs Berita)
  const divisiPeminta: 'Program' | 'Berita' =
    currentUserRole === 'admin_berita' ? 'Berita' : 'Program';

  // S2 State (Kegiatan List)
  const [kegiatanList, setKegiatanList] = useState<ProductionActivityItem[]>(() => {
    if (existingSpr?.kegiatanList && existingSpr.kegiatanList.length > 0) {
      return existingSpr.kegiatanList;
    }
    return [
      {
        id: `act-${Date.now()}-1`,
        jenis: 'Produksi',
        tanggal: '2026-10-14',
        jamMulai: '13:30:00',
        jamSelesai: '16:00:00',
        lokasi: 'Studio 3 (Podcast & Mimbar Agama)',
        catatanCrew: 'Dialog utama studio',
      },
      {
        id: `act-${Date.now()}-2`,
        jenis: 'Setting peralatan',
        tanggal: '2026-10-14',
        jamMulai: '11:00:00',
        jamSelesai: '13:00:00',
        lokasi: 'Studio 3 (Podcast & Mimbar Agama)',
        catatanCrew: 'Tata lighting & audio check',
      },
    ];
  });

  // S3 State (Kebutuhan Kru per Profesi & Sistem Peralatan)
  const [kebutuhanCrewList, setKebutuhanCrewList] = useState<ProductionCrewNeed[]>(() => {
    if (existingSpr?.kebutuhanCrewList && existingSpr.kebutuhanCrewList.length > 0) {
      return existingSpr.kebutuhanCrewList;
    }
    return [
      { profesi: 'Kamerawan', jumlah: 3, catatan: '2 kamera pedestal, 1 jimmy jib' },
      { profesi: 'Penata Suara', jumlah: 2, catatan: '4 clip-on wireless' },
      { profesi: 'Penata Cahaya', jumlah: 1, catatan: 'Setting warm ambiance' },
      { profesi: 'T.D', jumlah: 1 },
      { profesi: 'Switcher', jumlah: 1 },
      { profesi: 'CCU/VE', jumlah: 1 },
      { profesi: 'VTR/Editor', jumlah: 1 },
      { profesi: 'Chargen', jumlah: 1 },
      { profesi: 'Listrik Op', jumlah: 1 },
      { profesi: 'Op. LED', jumlah: 1 },
      { profesi: 'Penata Rias', jumlah: 1 },
      { profesi: 'Penata Artistik', jumlah: 1 },
      { profesi: 'Dekor', jumlah: 3 },
    ];
  });

  const [sistemPeralatan, setSistemPeralatan] = useState<{
    sistem: EquipmentSystemType;
    jumlahKamera: number;
    keterangan: string;
  }>(() => {
    if (existingSpr?.sistemPeralatan) {
      return {
        sistem: existingSpr.sistemPeralatan.sistem,
        jumlahKamera: existingSpr.sistemPeralatan.jumlahKamera || 3,
        keterangan: existingSpr.sistemPeralatan.keterangan || '',
      };
    }
    return {
      sistem: 'Studio',
      jumlahKamera: 3,
      keterangan: 'Setup Studio lengkap dengan teleprompter & audio snake',
    };
  });

  // Modal Cetak Dokumen Fisik SPR
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Total crew needed counter
  const totalCrewNeeded = useMemo(() => {
    return kebutuhanCrewList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  }, [kebutuhanCrewList]);

  // S2 Add/Delete Activity
  const handleAddKegiatan = () => {
    const lastItem = kegiatanList[kegiatanList.length - 1];
    const newDate = lastItem ? lastItem.tanggal : '2026-10-14';
    const newItem: ProductionActivityItem = {
      id: `act-${Date.now()}`,
      jenis: 'Pasca produksi',
      tanggal: newDate,
      jamMulai: '09:00:00',
      jamSelesai: '12:00:00',
      lokasi: 'Ruang Edit Pasca Produksi',
      catatanCrew: 'Editing & mastering',
    };
    setKegiatanList((prev) => [...prev, newItem]);
  };

  const handleDeleteKegiatan = (id: string) => {
    if (kegiatanList.length <= 1) return;
    setKegiatanList((prev) => prev.filter((k) => k.id !== id));
  };

  const handleMoveKegiatan = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === kegiatanList.length - 1) return;
    const newArr = [...kegiatanList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setKegiatanList(newArr);
  };

  const handleUpdateKegiatan = (id: string, updates: Partial<ProductionActivityItem>) => {
    setKegiatanList((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        return { ...k, ...updates };
      })
    );
  };

  // S3 Crew Quota Stepper Handler
  const handleSetCrewCount = (profesi: string, count: number) => {
    const safeCount = Math.max(0, Math.min(10, count));
    setKebutuhanCrewList((prev) => {
      const exists = prev.find((p) => p.profesi.toLowerCase() === profesi.toLowerCase());
      if (exists) {
        if (safeCount === 0) {
          // Keep it with 0 or remove
          return prev.map((p) =>
            p.profesi.toLowerCase() === profesi.toLowerCase() ? { ...p, jumlah: 0 } : p
          );
        }
        return prev.map((p) =>
          p.profesi.toLowerCase() === profesi.toLowerCase() ? { ...p, jumlah: safeCount } : p
        );
      } else {
        if (safeCount > 0) {
          return [...prev, { profesi, jumlah: safeCount }];
        }
        return prev;
      }
    });
  };

  // S3 Crew Note Update
  const handleSetCrewNote = (profesi: string, note: string) => {
    setKebutuhanCrewList((prev) =>
      prev.map((p) => (p.profesi.toLowerCase() === profesi.toLowerCase() ? { ...p, catatan: note } : p))
    );
  };

  // Analyze S2 studio warnings
  const analyzedKegiatan = useMemo(() => {
    return kegiatanList.map((act) => {
      let warningMsg = '';
      if (act.lokasi) {
        const warn = checkStudioOverlapWarning(
          act.lokasi,
          act.tanggal,
          act.jamMulai,
          act.jamSelesai,
          MOCK_SPR_DOCUMENTS,
          existingSpr?.id
        );
        if (warn) warningMsg = warn;
      }
      return {
        ...act,
        hasWarning: Boolean(warningMsg),
        warningMessage: warningMsg,
      };
    });
  }, [kegiatanList, existingSpr]);

  // Construct current SPR document object
  const currentSprDocument: SPRDocument = useMemo(() => {
    return {
      id: existingSpr?.id || `spr-2026-10-${Date.now().toString().slice(-4)}`,
      nomorSurat: existingSpr?.nomorSurat || `SPR/${divisiPeminta.toUpperCase()}/2026/10/0${Math.floor(Math.random() * 80 + 20)}`,
      versi: currentVersion,
      programName,
      judul,
      jenisKegiatan,
      formatAcara,
      durasi,
      pengisiAcara,
      produser,
      divisiPeminta,
      isMendesak,
      status: currentUserRole === 'admin_berita' ? 'Menunggu Program' : 'Diajukan',
      createdAt: existingSpr?.createdAt || '2026-10-12 10:00:00',
      catatanRevisi: catatanRevisi || undefined,
      kegiatanList,
      kebutuhanCrewList: kebutuhanCrewList.filter((n) => n.jumlah > 0),
      sistemPeralatan: {
        sistem: sistemPeralatan.sistem,
        jumlahKamera: sistemPeralatan.sistem === 'Studio' ? sistemPeralatan.jumlahKamera : undefined,
        keterangan: sistemPeralatan.keterangan || undefined,
      },
      totalCrewNeeded,
      totalCrewAssigned: existingSpr?.totalCrewAssigned || 0,
    };
  }, [
    existingSpr,
    currentVersion,
    programName,
    judul,
    jenisKegiatan,
    formatAcara,
    durasi,
    pengisiAcara,
    produser,
    divisiPeminta,
    isMendesak,
    catatanRevisi,
    kegiatanList,
    kebutuhanCrewList,
    sistemPeralatan,
    totalCrewNeeded,
    currentUserRole,
  ]);

  // Validation
  const s1Valid = Boolean(programName.trim() && judul.trim() && durasi.trim() && produser.trim());
  const s2Valid = kegiatanList.length > 0 && kegiatanList.every((k) => k.jamSelesai > k.jamMulai);
  const s3Valid = totalCrewNeeded > 0;

  // Handle final submission in S4
  const handleFinalSubmit = () => {
    let finalStatus: SPRStatus = currentSprDocument.status;
    if (currentUserRole === 'admin_berita') {
      finalStatus = 'Menunggu Program';
    } else if (existingSpr?.status === 'Menunggu Program' && currentUserRole === 'admin_program') {
      finalStatus = 'Diajukan';
    } else {
      finalStatus = 'Diajukan';
    }

    const sprToSubmit: SPRDocument = {
      ...currentSprDocument,
      status: finalStatus,
    };
    onSubmitSPR(sprToSubmit);
    setCurrentStep('SUCCESS');
  };

  const handleRejectSPR = () => {
    if (!rejectReason.trim()) {
      setRejectError('Tulis alasan penolakan agar Berita dapat memperbaikinya.');
      return;
    }
    const rejectedSpr: SPRDocument = {
      ...currentSprDocument,
      status: 'Ditolak',
      alasanPenolakan: rejectReason.trim(),
    };
    onSubmitSPR(rejectedSpr);
    setShowRejectModal(false);
    setCurrentStep('SUCCESS');
  };

  return (
    <div className="panel-summary" style={{ maxWidth: 1200, margin: '0 auto', padding: 0 }}>
      {/* Top Header Bar */}
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
              backgroundColor: '#EDE9FE',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Film size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Wizard 3: SPR (Surat Permintaan Kerabat Kerja & Peralatan)
              </h2>
              <span
                style={{
                  backgroundColor: isMendesak ? '#FEE2E2' : '#EDE9FE',
                  color: isMendesak ? '#991B1B' : '#6D28D9',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {isMendesak ? 'Prioritas Mendesak' : `Versi ${currentVersion}`}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Permintaan kerabat kerja dan peralatan produksi langsung ke Divisi Teknik &bull; Divisi Peminta:{' '}
              <strong style={{ color: 'var(--ink)' }}>{divisiPeminta}</strong>
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

      {/* Stepper Header (S1 to S4) */}
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
            { id: 'S1', label: '1. Detail Produksi' },
            { id: 'S2', label: '2. Tahapan Kegiatan' },
            { id: 'S3', label: '3. Kebutuhan Kru & Alat' },
            { id: 'S4', label: '4. Tinjau & Kirim SPR' },
          ].map((st, i) => {
            const stepOrder = ['S1', 'S2', 'S3', 'S4'];
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
                  borderBottom: isCurrent ? '3px solid #7C3AED' : '3px solid transparent',
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
                    backgroundColor: isDone ? 'var(--success)' : isCurrent ? '#7C3AED' : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#7C3AED' : isDone ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP CONTENT BODY */}
      <div style={{ padding: '24px' }}>
        {/* ===================================================================
            STEP S1: DETAIL PRODUKSI (SAD v1.1 lines 780-798)
            =================================================================== */}
        {currentStep === 'S1' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {isEditingRevision && (
              <div className="notice-info">
                <Sparkles size={18} />
                <div>
                  <strong>Membuat Revisi Kebutuhan (Versi {currentVersion}):</strong> Perubahan kuota kru atau tahapan kegiatan akan dicatat sebagai revisi baru tanpa menimpa versi sebelumnya.
                </div>
              </div>
            )}

            {/* Grid 1: Program & Judul */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 16 }}>
              {/* Program Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Mata Acara <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  list="spr-programs-list"
                  className="input-default"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Pilih atau tulis nama acara..."
                  style={{ width: '100%', height: 40 }}
                />
                <datalist id="spr-programs-list">
                  {MOCK_PROGRAMS.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                  <option value="Mimbar Agama Islam" />
                  <option value="Jelajah Dewata" />
                  <option value="Gelar Seni Remaja" />
                  <option value="Liputan Khusus" />
                </datalist>
              </div>

              {/* Judul Produksi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Judul Produksi / Episode <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-default"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Islam dan Etika Menjaga Alam (Episode 28)..."
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            </div>

            {/* Grid 2: Jenis Kegiatan & Format Acara */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
              {/* Jenis Kegiatan (4 Choices) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Jenis Kegiatan <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {(['Peninjauan', 'Produksi', 'Rekaman', 'Siaran langsung'] as const).map((jk) => (
                    <button
                      key={jk}
                      type="button"
                      onClick={() => setJenisKegiatan(jk)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: jenisKegiatan === jk ? '2px solid #7C3AED' : '1px solid var(--divider)',
                        backgroundColor: jenisKegiatan === jk ? '#EDE9FE' : '#FFFFFF',
                        color: jenisKegiatan === jk ? '#6D28D9' : 'var(--ink)',
                        fontWeight: jenisKegiatan === jk ? 700 : 500,
                        fontSize: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {jk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Acara */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Format Acara <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-default"
                  value={formatAcara}
                  onChange={(e) => setFormatAcara(e.target.value)}
                  placeholder="Contoh: Dialog, Talkshow, Dokumenter..."
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            </div>

            {/* Grid 3: Durasi, Pengisi Acara, Produser */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr', gap: 16 }}>
              {/* Durasi */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Durasi <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="quick-chip" onClick={() => setDurasi('0:30:00')}>
                      0:30
                    </button>
                    <button type="button" className="quick-chip" onClick={() => setDurasi('1:00:00')}>
                      1:00
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="input-default"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  style={{ width: '100%', height: 40, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Pengisi Acara */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Pengisi Acara / Narasumber
                </label>
                <input
                  type="text"
                  className="input-default"
                  value={pengisiAcara}
                  onChange={(e) => setPengisiAcara(e.target.value)}
                  placeholder="Nama pembicara / narasumber..."
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Produser */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Produser Penanggung Jawab <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  className="input-default"
                  value={produser}
                  onChange={(e) => setProduser(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                >
                  {MASTER_EMPLOYEES.filter((e) => e.division === 'Program' || e.division === 'Berita').map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.division})
                    </option>
                  ))}
                  <option value="Eryawan Srimartono">Eryawan Srimartono (Program)</option>
                  <option value="Adolf / Wiryoga">Adolf / Wiryoga (Pelaksana)</option>
                </select>
              </div>
            </div>

            {/* Toggle Saklar Mendesak (SAD v1.1 line 791) */}
            <div
              style={{
                backgroundColor: isMendesak ? '#FEF2F2' : '#F8FAFC',
                border: isMendesak ? '1px solid #FCA5A5' : '1px solid var(--divider)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.9375rem', color: isMendesak ? '#991B1B' : 'var(--ink)' }}>
                    Tandai Sebagai Permintaan Mendesak (Urgent)
                  </strong>
                  {isMendesak && (
                    <span
                      style={{
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      Prioritas Tinggi
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Bila diaktifkan, Divisi Teknik akan menerima notifikasi khusus yang menonjol di konsol penugasan.
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isMendesak}
                  onChange={(e) => setIsMendesak(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Mendesak</span>
              </label>
            </div>

            {/* Field Catatan Revisi bila mengedit revisi */}
            {isEditingRevision && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Catatan Revisi Kebutuhan
                </label>
                <input
                  type="text"
                  className="input-default"
                  value={catatanRevisi}
                  onChange={(e) => setCatatanRevisi(e.target.value)}
                  placeholder="Contoh: Penyesuaian kebutuhan setelah survei lokasi lapangan..."
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            )}

            {/* Bottom Step Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="button-primary"
                disabled={!s1Valid}
                onClick={() => setCurrentStep('S2')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8, backgroundColor: '#7C3AED' }}
              >
                <span>Lanjut ke kegiatan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP S2: TAHAPAN KEGIATAN PRODUKSI (SAD v1.1 lines 799-820)
            =================================================================== */}
        {currentStep === 'S2' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Jadwal & Lokasi Tahapan Kegiatan Produksi
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Menyatakan kapan dan di mana setiap kegiatan berlangsung agar Teknik dapat memeriksa bentrok per kegiatan.
                </p>
              </div>

              <button
                type="button"
                className="button-primary"
                onClick={handleAddKegiatan}
                style={{ height: 36, fontSize: 13, padding: '0 14px', gap: 6, backgroundColor: '#7C3AED' }}
              >
                <Plus size={15} /> Tambah Kegiatan
              </button>
            </div>

            {/* List of Production Activity Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analyzedKegiatan.map((act, index) => (
                <div
                  key={act.id}
                  className={`rundown-item-row ${act.hasWarning ? 'has-warning' : ''}`}
                  style={{ padding: 14 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      borderBottom: '1px solid #F1F5F9',
                      paddingBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: '#EDE9FE',
                          color: '#7C3AED',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {index + 1}
                      </span>
                      <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Tahap {act.jenis}</strong>

                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button
                          type="button"
                          className="reorder-action-btn"
                          disabled={index === 0}
                          onClick={() => handleMoveKegiatan(index, 'up')}
                          title="Naikkan urutan"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="reorder-action-btn"
                          disabled={index === kegiatanList.length - 1}
                          onClick={() => handleMoveKegiatan(index, 'down')}
                          title="Turunkan urutan"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={kegiatanList.length <= 1}
                      onClick={() => handleDeleteKegiatan(act.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: kegiatanList.length <= 1 ? '#CBD5E1' : 'var(--error)',
                        cursor: kegiatanList.length <= 1 ? 'not-allowed' : 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                      }}
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>

                  {/* Grid Fields */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 2fr 2fr',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    {/* Jenis Kegiatan */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Jenis Tahap <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        className="input-default"
                        value={act.jenis}
                        onChange={(e) =>
                          handleUpdateKegiatan(act.id, {
                            jenis: e.target.value as ProductionActivityType,
                          })
                        }
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      >
                        {ACTIVITY_PHASES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tanggal */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Tanggal <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="input-default"
                        value={act.tanggal}
                        onChange={(e) => handleUpdateKegiatan(act.id, { tanggal: e.target.value })}
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      />
                    </div>

                    {/* Jam Mulai */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Mulai <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-default"
                        value={act.jamMulai}
                        onChange={(e) => handleUpdateKegiatan(act.id, { jamMulai: e.target.value })}
                        style={{ width: '100%', height: 36, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                      />
                    </div>

                    {/* Jam Selesai */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Selesai <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-default"
                        value={act.jamSelesai}
                        onChange={(e) => handleUpdateKegiatan(act.id, { jamSelesai: e.target.value })}
                        style={{ width: '100%', height: 36, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                      />
                    </div>

                    {/* Lokasi */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Tempat / Lokasi
                      </label>
                      <input
                        type="text"
                        list="loc-master-list"
                        className="input-default"
                        value={act.lokasi || ''}
                        onChange={(e) => handleUpdateKegiatan(act.id, { lokasi: e.target.value })}
                        placeholder="Pilih lokasi..."
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      />
                      <datalist id="loc-master-list">
                        {MOCK_LOCATIONS.map((loc) => (
                          <option key={loc.id} value={loc.name} />
                        ))}
                        <option value="Studio 3 TVRI Bali" />
                        <option value="Ruang VTR" />
                        <option value="Desa Tenganan Karangasem" />
                        <option value="Lapangan Renon Denpasar" />
                      </datalist>
                    </div>

                    {/* Catatan Crew */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        Catatan Crew / Keterangan
                      </label>
                      <input
                        type="text"
                        className="input-default"
                        value={act.catatanCrew || ''}
                        onChange={(e) => handleUpdateKegiatan(act.id, { catatanCrew: e.target.value })}
                        placeholder="Contoh: Editor, Kamera lapangan..."
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                      />
                    </div>
                  </div>

                  {/* Warning Notice if studio conflict */}
                  {act.hasWarning && (
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
                      <strong>Peringatan Pemakaian Studio:</strong> {act.warningMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('S1')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Detail Produksi
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={!s2Valid}
                onClick={() => setCurrentStep('S3')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8, backgroundColor: '#7C3AED' }}
              >
                <span>Lanjut ke kebutuhan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP S3: KEBUTUHAN CREW & PERALATAN (SAD v1.1 lines 821-845)
            =================================================================== */}
        {currentStep === 'S3' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Bagian 1: Kebutuhan Kru per Profesi */}
            <div className="panel-summary" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Bagian 1: Kebutuhan Kerabat Kerja per Profesi
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Atur jumlah kuota kru (0 sampai 10) sesuai formulir resmi SPR TVRI Bali.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Total {totalCrewNeeded} posisi kru diminta
                </div>
              </div>

              {/* Grid of Profession Cards with Steppers (0 - 10) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                {OFFICIAL_PROFESSIONS.map((profesi) => {
                  const item = kebutuhanCrewList.find(
                    (p) => p.profesi.toLowerCase() === profesi.toLowerCase()
                  );
                  const count = item?.jumlah || 0;
                  const isSelected = count > 0;

                  return (
                    <div
                      key={profesi}
                      style={{
                        border: isSelected ? '1.5px solid #7C3AED' : '1px solid var(--divider)',
                        backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                          {profesi}
                        </span>

                        {/* Stepper Buttons (0 - 10) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleSetCrewCount(profesi, count - 1)}
                            disabled={count <= 0}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 4,
                              border: '1px solid var(--divider)',
                              backgroundColor: '#FFFFFF',
                              cursor: count <= 0 ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              fontSize: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            -
                          </button>

                          <span
                            style={{
                              width: 24,
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: 14,
                              color: isSelected ? '#7C3AED' : 'var(--muted)',
                            }}
                          >
                            {count}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSetCrewCount(profesi, count + 1)}
                            disabled={count >= 10}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 4,
                              border: '1px solid #7C3AED',
                              backgroundColor: '#EDE9FE',
                              color: '#6D28D9',
                              cursor: count >= 10 ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              fontSize: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Optional Note per Profession if Selected */}
                      {isSelected && (
                        <input
                          type="text"
                          className="input-default"
                          value={item?.catatan || ''}
                          onChange={(e) => handleSetCrewNote(profesi, e.target.value)}
                          placeholder="Catatan khusus (opsional)..."
                          style={{ height: 28, fontSize: 11, marginTop: 2 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bagian 2: Sistem Peralatan Operasional */}
            <div className="panel-summary" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 12px', color: 'var(--ink)' }}>
                Bagian 2: Sistem Peralatan Operasional Produksi
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {(['Studio', 'ENG', 'EFP', 'OB Van'] as const).map((sys) => {
                  const isSelected = sistemPeralatan.sistem === sys;
                  return (
                    <div
                      key={sys}
                      onClick={() => setSistemPeralatan((prev) => ({ ...prev, sistem: sys }))}
                      style={{
                        border: isSelected ? '2px solid #7C3AED' : '1px solid var(--divider)',
                        backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                          {sys}
                        </span>
                        <Radio size={16} color={isSelected ? '#7C3AED' : 'var(--muted)'} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {sys === 'Studio'
                          ? 'Studio Multi-camera'
                          : sys === 'ENG'
                          ? 'Electronic News Gathering (1 Cam)'
                          : sys === 'EFP'
                          ? 'Electronic Field Production (2 Cam)'
                          : 'Outdoor Broadcast Van (3 Cam)'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Jumlah Kamera (Stepper if Studio) & Keterangan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                {sistemPeralatan.sistem === 'Studio' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Jumlah Kamera Studio <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setSistemPeralatan((prev) => ({
                            ...prev,
                            jumlahKamera: Math.max(1, prev.jumlahKamera - 1),
                          }))
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          border: '1px solid var(--divider)',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, width: 30, textAlign: 'center' }}>
                        {sistemPeralatan.jumlahKamera}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSistemPeralatan((prev) => ({
                            ...prev,
                            jumlahKamera: Math.min(8, prev.jumlahKamera + 1),
                          }))
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          border: '1px solid #7C3AED',
                          backgroundColor: '#EDE9FE',
                          color: '#6D28D9',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        +
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Kamera Studio</span>
                    </div>
                  </div>
                )}

                <div style={{ gridColumn: sistemPeralatan.sistem === 'Studio' ? 'auto' : '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Keterangan Tambahan Peralatan
                  </label>
                  <input
                    type="text"
                    className="input-default"
                    value={sistemPeralatan.keterangan}
                    onChange={(e) =>
                      setSistemPeralatan((prev) => ({ ...prev, keterangan: e.target.value }))
                    }
                    placeholder="Contoh: Teleprompter, wireless lavalier mic, lighting warm..."
                    style={{ width: '100%', height: 38 }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('S2')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Tahapan Kegiatan
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={!s3Valid}
                onClick={() => setCurrentStep('S4')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8, backgroundColor: '#7C3AED' }}
              >
                <span>Lanjut ke tinjauan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP S4: TINJAU DAN KIRIM SPR (SAD v1.1 lines 846-864)
            =================================================================== */}
        {currentStep === 'S4' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* SPR Summary Card */}
            <div className="panel-summary" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Ringkasan Permintaan Kerabat Kerja & Peralatan Produksi
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Nomor Surat: <strong>{currentSprDocument.nomorSurat}</strong> &bull; Versi {currentSprDocument.versi}
                  </div>
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
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total Kru Diminta</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#7C3AED' }}>{totalCrewNeeded}</div>
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
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tahapan</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{kegiatanList.length}</div>
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
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Sistem Alat</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{sistemPeralatan.sistem}</div>
                  </div>
                </div>
              </div>

              {/* Grid Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  backgroundColor: 'var(--surface)',
                  padding: 14,
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>Mata Acara</span>
                  <strong>{programName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>Format & Durasi</span>
                  <strong>{formatAcara} ({durasi})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>Produser</span>
                  <strong>{produser}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>Divisi Peminta</span>
                  <strong>{divisiPeminta}</strong>
                </div>
              </div>

              {/* Table of Crew Needs */}
              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  Daftar Kebutuhan Posisi Kru:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {kebutuhanCrewList
                    .filter((n) => n.jumlah > 0)
                    .map((item) => (
                      <div
                        key={item.profesi}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--divider)',
                          borderRadius: 6,
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item.profesi}</span>
                        <span
                          style={{
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                          }}
                        >
                          {item.jumlah} orang
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Official Notice */}
              <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', borderTop: '1px solid var(--divider)', paddingTop: 10 }}>
                * Catatan: Nomor surat resmi diisi Administrasi Tata Usaha sebelum dicetak. Salinan untuk arsip dikirim ke Kepala Sub. Bagian Tata Usaha.
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('S3')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Kebutuhan
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Tolak SPR (Admin Program evaluating SPR Berita, SAD v1.1 line 858) */}
                {currentUserRole === 'admin_program' && existingSpr?.status === 'Menunggu Program' && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setRejectReason('');
                      setRejectError('');
                      setShowRejectModal(true);
                    }}
                    style={{ height: 42, padding: '0 16px', gap: 6, color: 'var(--error)', borderColor: 'var(--error)' }}
                    title="Tolak SPR Berita dan kembalikan dengan alasan"
                  >
                    <XCircle size={16} />
                    <span>Tolak SPR</span>
                  </button>
                )}

                {/* Cetak Lembar Fisik SPR */}
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowPrintModal(true)}
                  style={{ height: 42, padding: '0 16px', gap: 6 }}
                  title="Cetak lembar fisik SPR resmi format TVRI Bali"
                >
                  <Printer size={16} />
                  <span>Cetak Lembar Fisik SPR (A4)</span>
                </button>

                {/* Primary Action Button based on Role (SAD v1.1 lines 854-860) */}
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleFinalSubmit}
                  style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8, backgroundColor: '#7C3AED' }}
                >
                  <Send size={16} />
                  <span>
                    {currentUserRole === 'admin_berita'
                      ? 'Kirim ke Program'
                      : isEditingRevision
                      ? 'Kirim revisi ke Teknik'
                      : existingSpr?.status === 'Menunggu Program'
                      ? 'Teruskan ke Teknik'
                      : 'Kirim ke Teknik'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUCCESS SCREEN (SAD v1.1 line 863)
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
                backgroundColor: currentSprDocument.status === 'Ditolak' ? 'var(--error-container)' : 'var(--success-container)',
                color: currentSprDocument.status === 'Ditolak' ? 'var(--error)' : 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              {currentSprDocument.status === 'Ditolak' ? <AlertTriangle size={36} /> : <CheckCircle2 size={36} />}
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink)' }}>
              {currentSprDocument.status === 'Ditolak'
                ? 'SPR ditolak dan dikembalikan ke Berita.'
                : currentUserRole === 'admin_berita'
                ? 'SPR menunggu Program meneruskannya.'
                : 'Permintaan crew terkirim ke Teknik.'}
            </h2>

            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              {currentSprDocument.status === 'Ditolak'
                ? `Alasan penolakan: "${currentSprDocument.alasanPenolakan}". Admin Berita dapat melihat alasan ini dan melakukan perbaikan.`
                : `Dokumen SPR untuk produksi ${judul} telah berhasil dikirim. ${currentUserRole === 'admin_berita' ? 'Admin Program dapat meneruskannya ke Teknik.' : 'Divisi Teknik dapat segera memproses plotting penugasan kru di Wizard 4.'}`}
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
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Nomor SPR</span>
                <strong style={{ fontSize: 12, color: 'var(--ink)' }}>{currentSprDocument.nomorSurat}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Kebutuhan Kru</span>
                <strong style={{ fontSize: 13, color: '#7C3AED' }}>{totalCrewNeeded} Posisi</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Status Siklus</span>
                <strong style={{ fontSize: 13, color: 'var(--success)' }}>{currentSprDocument.status}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowPrintModal(true)}
                style={{ height: 42, padding: '0 20px', gap: 6, backgroundColor: '#7C3AED' }}
              >
                <Printer size={16} /> Cetak Lembar Fisik (A4)
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setCurrentStep('S1');
                  setProgramName('Program Produksi Baru');
                  setJudul('');
                }}
                style={{ height: 42, padding: '0 18px', gap: 6 }}
              >
                <RotateCcw size={16} /> Buat SPR Lain
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={onClose}
                style={{ height: 42, padding: '0 20px' }}
              >
                Selesai & Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CETAK LEMBAR FISIK RESMI SPR (A4) */}
      <SPRPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        spr={currentSprDocument}
      />

      {/* MODAL: TOLAK SPR BERITA (SAD v1.1 line 858) */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 140,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--error-container)',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                Tolak Pengajuan SPR Berita
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 16px' }}>
              Tulis alasan penolakan agar Berita dapat memperbaikinya.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                Alasan Penolakan <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                className="input-default"
                rows={4}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                placeholder="Tulis alasan penolakan agar Berita dapat memperbaikinya..."
                style={{ width: '100%', minHeight: 90, padding: 10, fontSize: '0.875rem' }}
              />
              {rejectError && (
                <div style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: 4, fontWeight: 500 }}>
                  {rejectError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowRejectModal(false)}
                style={{ height: 38, padding: '0 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={handleRejectSPR}
                style={{ height: 38, padding: '0 18px', backgroundColor: 'var(--error)', color: '#FFFFFF' }}
              >
                Konfirmasi Tolak SPR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SPRWizard;
