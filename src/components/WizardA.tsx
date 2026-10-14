import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Radio,
  FileUp,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';
import { Stepper } from './Stepper';
import type { StepItem } from './Stepper';
import { AlertBanner } from './AlertBanner';
import { StatusBadge } from './StatusBadge';
import type { BroadcastBlock, ProgramDemand, CrewRequest, RoleNeedItem, KerabatKerjaItem } from '../types';
import { parseCommaNames } from '../utils/crewParser';
import { INITIAL_RUNDOWN } from '../data/mockData';

const WIZARD_A_STEPS: StepItem[] = [
  { id: 1, label: 'Tanggal & Blok' },
  { id: 2, label: 'Baris Program' },
  { id: 3, label: 'Kebutuhan Peran' },
  { id: 4, label: 'Tinjau & Kirim' },
];

const AVAILABLE_ROLES = [
  'Pengarah Teknik',
  'Kamerawan',
  'Master Control / CCU',
  'Pemadu Gambar',
  'Penata Suara',
  'VTR. OP',
  'Penata Cahaya',
  'Penata Aksara',
  'Teknisi IT / LED',
  'Transmisi',
  'Penata Rias',
  'Penata Acara',
  'Penata Artistik',
  'PD. Umum',
  'Kameramen',
  'Audio Engineer',
  'Switcher / TD',
  'Lighting Director',
  'Floor Director',
];

// Sample authentic TVRI Bali data from Rundown Siaran Pagi (21 September 2026)
const TVRI_BALI_SAMPLE: {
  documentTitle: string;
  date: string;
  dateDisplay: string;
  block: BroadcastBlock;
  programs: ProgramDemand[];
  kerabatKerja: KerabatKerjaItem[];
  totalTechnicalCrew: number;
  supervisor: string;
  supervisorTitle: string;
  supervisorNip: string;
} = {
  documentTitle: 'RUNDOWN PENYELENGARAAN SIARAN PAGI TVRI BALI',
  date: '2026-09-21',
  dateDisplay: 'Senin, 21 September 2026',
  block: 'Pagi' as BroadcastBlock,
  programs: [
    {
      id: 'prog-tvri-1',
      programName: 'Antar Nusa (Host Bali - Live Bali-NTB-NTT)',
      startTime: '09:00',
      endTime: '11:00',
      notes: 'Siaran langsung utama relay regional Bali-NTB-NTT. Format dialog studio & peliputan live.',
      roles: [
        { role: 'Pengarah Teknik', count: 1 },
        { role: 'Kamerawan', count: 3 },
        { role: 'Pemadu Gambar', count: 2 },
        { role: 'Penata Suara', count: 2 },
      ],
    },
    {
      id: 'prog-tvri-2',
      programName: 'Gatra Bali (Warta Berita Utama)',
      startTime: '16:00',
      endTime: '16:30',
      notes: 'Produksi Studio 1 (Production 1) siaran berita lokal petang.',
      roles: [
        { role: 'Master Control / CCU', count: 2 },
        { role: 'VTR. OP', count: 1 },
        { role: 'Penata Cahaya', count: 1 },
        { role: 'Penata Aksara', count: 1 },
      ],
    },
    {
      id: 'prog-tvri-3',
      programName: 'Nyurya Sewana & Inspirasi Indonesia',
      startTime: '06:07',
      endTime: '07:00',
      notes: 'Magazine budaya & kerohanian Playbox 4 / Ruang STL.',
      roles: [
        { role: 'Teknisi IT / LED', count: 1 },
        { role: 'Transmisi', count: 3 },
      ],
    },
    {
      id: 'prog-tvri-4',
      programName: 'Musikpedia & Rumah Budaya',
      startTime: '11:00',
      endTime: '13:00',
      notes: 'Playbox 3 / Ruang Editing in-house taping & playback.',
      roles: [],
    },
  ],
  kerabatKerja: [
    { peran: 'PD. Umum', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Master Control / CCU', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 2 },
    { peran: 'Pengarah Teknik', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Kamerawan', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 3 },
    { peran: 'VTR. OP', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Pemadu Gambar', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 2 },
    { peran: 'Penata Cahaya', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Penata Suara', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 2 },
    { peran: 'Penata Rias', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 2 },
    { peran: 'Transmisi', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 3 },
    { peran: 'Penata Aksara', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'PD. BHI / GB / BV', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Penata Acara', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Penyiar BHI / GB / BV', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Teknisi IT / LED', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
    { peran: 'Penata Artistik', personil: '(Menunggu Penugasan Divisi Teknik)', kuota: 1 },
  ],
  totalTechnicalCrew: 24,
  supervisor: 'Eryawan Srimartono',
  supervisorTitle: 'Ketua Tim Perencanaan dan Pengendalian Program',
  supervisorNip: '196904162014091001',
};

interface WizardAProps {
  onSuccessSubmit: (newRequest: CrewRequest) => void;
  onGoToRundown?: () => void;
  existingRequests?: CrewRequest[];
  programType?: 'penyiaran' | 'produksi';
  onProgramTypeChange?: (type: 'penyiaran' | 'produksi') => void;
}

export const WizardA: React.FC<WizardAProps> = ({
  onSuccessSubmit,
  onGoToRundown,
  existingRequests = [],
  programType: propProgramType = 'penyiaran',
  onProgramTypeChange,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Baru saja');
  const [draftSavedAlert, setDraftSavedAlert] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [viewingFinalRundownReq, setViewingFinalRundownReq] = useState<CrewRequest | null>(null);

  // Uploaded Rundown State
  const [uploadedRundownDoc, setUploadedRundownDoc] = useState<typeof TVRI_BALI_SAMPLE | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Step 1 State - Program Type sync with parent tabs
  const [programType, setProgramTypeState] = useState<'penyiaran' | 'produksi'>(propProgramType);

  useEffect(() => {
    setProgramTypeState(propProgramType);
  }, [propProgramType]);

  const setProgramType = (newType: 'penyiaran' | 'produksi') => {
    setProgramTypeState(newType);
    if (onProgramTypeChange) onProgramTypeChange(newType);
  };

  const [broadcastDate, setBroadcastDate] = useState<string>('2026-10-06');
  const [selectedBlock, setSelectedBlock] = useState<BroadcastBlock>('Pagi');
  const [dateError, setDateError] = useState<string>('');

  // Step 2 State - Repeatable rows
  const [programs, setPrograms] = useState<ProgramDemand[]>([
    {
      id: 'prog-1',
      programName: 'Seputar Info Indonesia',
      startTime: '07:00',
      endTime: '08:30',
      notes: 'Segmen dialog live dengan narasumber',
      roles: [
        { role: 'Kameramen', count: 2, requestedNamesText: 'Andrew, Reza' },
        { role: 'Audio Engineer', count: 1, requestedNamesText: 'Mega' },
        { role: 'Switcher / TD', count: 1, requestedNamesText: 'Putu Widiastuti' },
      ],
      overlapWarning: 'Perhatian: Jam mulai 07:00 beririsan dengan gladi resik Divisi Berita (06:30–07:15). Anda tetap dapat melanjutkan.',
    },
  ]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wizardA_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.broadcastDate) setBroadcastDate(parsed.broadcastDate);
        if (parsed.selectedBlock) setSelectedBlock(parsed.selectedBlock);
        if (parsed.programs && parsed.programs.length > 0) setPrograms(parsed.programs);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // Auto-save draft
  const saveDraft = (explicit = false) => {
    const payload = { broadcastDate, selectedBlock, programs };
    localStorage.setItem('wizardA_draft', JSON.stringify(payload));
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    setLastSavedTime(`Pukul ${timeStr}`);
    if (explicit) {
      setDraftSavedAlert(true);
      setTimeout(() => setDraftSavedAlert(false), 3000);
    }
  };

  // Handler for File Upload or Mocking the User's TVRI Bali Sample
  const handleLoadSampleRundown = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadedRundownDoc(TVRI_BALI_SAMPLE);
      setBroadcastDate(TVRI_BALI_SAMPLE.date);
      setSelectedBlock(TVRI_BALI_SAMPLE.block);
      setPrograms(TVRI_BALI_SAMPLE.programs);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      // Populate with parsed TVRI Bali rundown & kerabat kerja
      setUploadedRundownDoc({
        ...TVRI_BALI_SAMPLE,
        documentTitle: `Berkas: ${file.name} (Rundown Siaran Pagi TVRI Bali)`,
      });
      setBroadcastDate(TVRI_BALI_SAMPLE.date);
      setSelectedBlock(TVRI_BALI_SAMPLE.block);
      setPrograms(TVRI_BALI_SAMPLE.programs);
    }, 600);
  };

  // Direct Submit from Uploaded Kerabat Kerja Siaran
  const handleDirectSubmitUploaded = () => {
    const rolesConsolidated: RoleNeedItem[] = [
      { role: 'PD. Umum', count: 1 },
      { role: 'Master Control / CCU', count: 2 },
      { role: 'Pengarah Teknik', count: 1 },
      { role: 'Kamerawan', count: 3 },
      { role: 'VTR. OP', count: 1 },
      { role: 'Pemadu Gambar', count: 2 },
      { role: 'Penata Cahaya', count: 1 },
      { role: 'Penata Suara', count: 2 },
      { role: 'Penata Rias', count: 2 },
      { role: 'Transmisi', count: 3 },
      { role: 'Penata Aksara', count: 1 },
      { role: 'PD. BHI / GB / BV', count: 1 },
      { role: 'Penata Acara', count: 1 },
      { role: 'Penyiar BHI / GB / BV', count: 1 },
      { role: 'Teknisi IT / LED', count: 1 },
      { role: 'Penata Artistik', count: 1 },
    ];

    const newReq: CrewRequest = {
      id: `req-tvri-${Date.now().toString().slice(-4)}`,
      requestNumber: `REQ/TVRI-BALI/PAGI/09/024`,
      date: uploadedRundownDoc?.date || broadcastDate,
      block: 'Pagi',
      programName: 'Rundown Siaran Pagi (Antar Nusa, Gatra Bali, Nyurya Sewana)',
      timeRange: '06:00 – 16:00 WITA',
      rolesNeeded: rolesConsolidated,
      status: 'Diajukan',
      requesterName: 'Eryawan Srimartono (Ketua Tim Perencanaan Program)',
      createdAt: 'Baru saja',
      notes: 'Pengajuan daftar kebutuhan profesi siaran (16 profesi). Penugasan personil kru diisi oleh Divisi Teknik.',
      sourceDocument: uploadedRundownDoc?.documentTitle || 'Rundown Penyelenggaraan Siaran Pagi TVRI Bali',
      kerabatKerja: uploadedRundownDoc?.kerabatKerja,
      programType: 'penyiaran',
    };

    setIsSubmitted(true);
    onSuccessSubmit(newReq);
    localStorage.removeItem('wizardA_draft');
  };

  // Step validation
  const isStep1Valid = Boolean(broadcastDate && broadcastDate.trim().length > 0);
  const isStep2Valid =
    programs.length > 0 &&
    programs.every(
      (p) => p.programName.trim().length > 0 && p.startTime && p.endTime
    );
  const isStep3Valid = programs.every((p) => p.roles.some((r) => r.count > 0));

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return true;
  };

  // Repeatable program rows management
  const addProgramRow = () => {
    const newId = `prog-${Date.now()}`;
    setPrograms([
      ...programs,
      {
        id: newId,
        programName: '',
        startTime: '08:00',
        endTime: '09:00',
        notes: '',
        roles: [
          { role: 'Kameramen', count: 1 },
          { role: 'Audio Engineer', count: 1 },
        ],
      },
    ]);
  };

  const removeProgramRow = (id: string) => {
    if (programs.length <= 1) return;
    setPrograms(programs.filter((p) => p.id !== id));
  };

  const updateProgramField = (
    id: string,
    field: keyof ProgramDemand,
    value: string
  ) => {
    setPrograms(
      programs.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        return updated;
      })
    );
  };

  // Role counter inside Step 3
  const updateRoleCount = (progId: string, roleName: string, delta: number) => {
    setPrograms(
      programs.map((p) => {
        if (p.id !== progId) return p;
        const existingRole = p.roles.find((r) => r.role === roleName);
        let newRoles = [...p.roles];
        if (existingRole) {
          const newCount = Math.max(0, existingRole.count + delta);
          newRoles = newRoles.map((r) =>
            r.role === roleName ? { ...r, count: newCount } : r
          );
        } else if (delta > 0) {
          newRoles.push({ role: roleName, count: delta });
        }
        return { ...p, roles: newRoles };
      })
    );
  };

  // Step 4: Submission
  const handleSubmit = () => {
    // Consolidate roles from all programs
    const roleCountMap = new Map<string, number>();
    const roleRequestedMap = new Map<string, string[]>();

    programs.forEach((prog) => {
      prog.roles.forEach((r) => {
        if (r.count > 0) {
          roleCountMap.set(r.role, (roleCountMap.get(r.role) || 0) + r.count);
          const names = r.requestedNames || (r.requestedNamesText ? parseCommaNames(r.requestedNamesText) : []);
          if (names.length > 0) {
            const existing = roleRequestedMap.get(r.role) || [];
            roleRequestedMap.set(r.role, Array.from(new Set([...existing, ...names])));
          }
        }
      });
    });

    const consolidatedRoles: RoleNeedItem[] = Array.from(roleCountMap.entries()).map(([role, count]) => ({
      role,
      count,
      requestedNames: roleRequestedMap.get(role),
    }));

    // Build kerabatKerja array if not using uploaded doc
    const constructedKerabatKerja = uploadedRundownDoc?.kerabatKerja || consolidatedRoles
      .filter((r) => r.requestedNames && r.requestedNames.length > 0)
      .map((r) => ({
        peran: r.role,
        personil: r.requestedNames!.join(', '),
        kuota: r.count,
        namaList: r.requestedNames,
      }));

    const newReq: CrewRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      requestNumber: `REQ/PROG/2026/10/${Math.floor(100 + Math.random() * 900)}`,
      date: broadcastDate,
      block: selectedBlock,
      programName: programs.map((p) => p.programName).join(', '),
      timeRange: `${programs[0].startTime} – ${programs[programs.length - 1].endTime}`,
      rolesNeeded: consolidatedRoles.length > 0 ? consolidatedRoles : [{ role: 'Kameramen', count: 2 }],
      status: 'Diajukan',
      requesterName: uploadedRundownDoc ? 'Eryawan Srimartono (Admin Program)' : 'Bambang Triyono (Admin Program)',
      createdAt: 'Baru saja',
      notes: programType === 'produksi'
        ? programs.map((p) => p.notes).filter(Boolean).join('; ')
        : (programs.map((p) => p.notes).filter(Boolean).join('; ') || 'Pengajuan daftar kebutuhan profesi siaran. Penugasan personil kru diisi oleh Divisi Teknik.'),
      sourceDocument: uploadedRundownDoc?.documentTitle,
      kerabatKerja: constructedKerabatKerja && constructedKerabatKerja.length > 0 ? constructedKerabatKerja : undefined,
      programType: programType,
    };

    setIsSubmitted(true);
    onSuccessSubmit(newReq);
    localStorage.removeItem('wizardA_draft');
  };

  // If already submitted successfully:
  if (isSubmitted) {
    return (
      <div className="wizard-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--success-soft)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle size={36} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          Permintaan Terkirim ke Admin Teknik!
        </h2>

        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 16px', fontSize: 14, lineHeight: 1.6 }}>
          Daftar program beserta seluruh kebutuhan personil dari tabel <strong>KERABAT KERJA SIARAN</strong> telah diteruskan secara langsung ke antrean kerja <strong>Admin Teknik (Wizard B)</strong>.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status Dokumen:</span>
          <StatusBadge status="Diajukan" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline-gray"
            onClick={() => {
              setIsSubmitted(false);
              setUploadedRundownDoc(null);
              setCurrentStep(1);
            }}
          >
            Buat / Upload Permintaan Lain
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ minWidth: 220 }}
            onClick={() => {
              if (onGoToRundown) onGoToRundown();
            }}
          >
            Lihat Antrean di Admin Teknik &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Wizard Header */}
      <div className="wizard-header">
        <h1 className="wizard-page-title">Wizard A &mdash; Permintaan Kru</h1>
        <p className="wizard-page-desc">
          Formulir terpadu Admin Program untuk mengajukan kebutuhan kru teknis siaran televisi atau mengunggah rundown penyelenggaraan siaran.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* UPLOAD / IMPORT RUNDOWN & KERABAT KERJA SECTION                            */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#0F1F54',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileUp size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Upload Rundown & Kerabat Kerja Siaran</span>
                <span style={{ fontSize: '11px', backgroundColor: '#EFF6FF', color: '#1E3FA8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                  Format Resmi TVRI Bali
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Unggah berkas rundown siaran (PDF, Excel, Scan) untuk mengekstrak jadwal acara & tabel <strong>KERABAT KERJA SIARAN</strong> langsung ke Admin Teknik.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* File Upload Button */}
            <label
              className="btn btn-outline-gray"
              style={{ height: 38, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Upload size={14} /> Pilih File Rundown
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.docx,.json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>

            {/* Quick One-Click Button with the User's Real PDF Example */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 38, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={isUploading}
              onClick={handleLoadSampleRundown}
              title="Muat contoh resmi Rundown Siaran Pagi TVRI Bali (Senin, 21 September 2026)"
            >
              <Sparkles size={14} />
              <span>{isUploading ? 'Mengekstrak Dokumen...' : 'Muat Rundown Siaran Pagi (21 Sep 2026)'}</span>
            </button>
          </div>
        </div>

        {/* Display Verified Extracted Rundown & Kerabat Kerja Card */}
        {uploadedRundownDoc && (
          <div
            style={{
              marginTop: 18,
              padding: 18,
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #94A3B8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: '9999px', fontSize: 12, fontWeight: 700 }}>
                  <Check size={14} strokeWidth={3} /> Dokumen Berhasil Diekstrak
                </span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>
                  {uploadedRundownDoc.documentTitle}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ height: 34, fontSize: 12, padding: '0 14px' }}
                  onClick={handleDirectSubmitUploaded}
                >
                  <Send size={13} /> Kirim Langsung ke Admin Teknik
                </button>
              </div>
            </div>

            {/* 1. Summary of Extracted Broadcast Rundown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Jadwal & Blok Siaran
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  {uploadedRundownDoc.dateDisplay} &bull; Blok {uploadedRundownDoc.block}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  Durasi Siaran Pagi: <span className="tabular font-bold">06.00 – 16.00 WITA</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Mata Acara Utama Terjadwal
                </div>
                <div style={{ fontSize: 12, color: '#0F172A', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>&bull; <strong>Antar Nusa (Host Bali)</strong> &ndash; Live Bali-NTB-NTT (09:00 - 11:00)</span>
                  <span>&bull; <strong>Gatra Bali</strong> &ndash; Production 1 (16:00 - 16:30)</span>
                  <span>&bull; <strong>Nyurya Sewana & Musikpedia</strong> &ndash; In-House Production</span>
                </div>
              </div>
            </div>

            {/* 2. Visual Authentic "KERABAT KERJA SIARAN" Table Preview */}
            <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 6, border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0F1F54', letterSpacing: '0.3px' }}>
                    TABEL KERABAT KERJA SIARAN (Daftar Profesi Program Penyiaran)
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                    Format Program Penyiaran TVRI Bali: Mengajukan daftar profesi yang dibutuhkan. Kolom personil akan diplot oleh Divisi Teknik.
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F1F54', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 4 }}>
                  16 Profesi Penyiaran
                </span>
              </div>

              {/* Two Column Grid Matching Page 2 of PDF */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {uploadedRundownDoc.kerabatKerja.slice(0, 8).map((k, i) => {
                    const isUnassigned = !k.namaList || k.namaList.length === 0 || k.personil.includes('Menunggu');
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#FFFFFF', borderRadius: 4, gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{k.peran}</span>
                        </div>
                        <div className="crew-name-pills-wrap" style={{ justifyContent: 'flex-end', flex: 1 }}>
                          {isUnassigned ? (
                            <span className="crew-name-pill" style={{ backgroundColor: '#F1F5F9', color: '#64748B', border: '1px dashed #CBD5E1' }}>
                              Menunggu Divisi Teknik
                            </span>
                          ) : (
                            k.namaList?.map((pName, pIdx) => (
                              <span key={pIdx} className="crew-name-pill highlight" title="Personil yang ditugaskan">
                                {pName}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {uploadedRundownDoc.kerabatKerja.slice(8).map((k, i) => {
                    const isUnassigned = !k.namaList || k.namaList.length === 0 || k.personil.includes('Menunggu');
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#FFFFFF', borderRadius: 4, gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{k.peran}</span>
                        </div>
                        <div className="crew-name-pills-wrap" style={{ justifyContent: 'flex-end', flex: 1 }}>
                          {isUnassigned ? (
                            <span className="crew-name-pill" style={{ backgroundColor: '#F1F5F9', color: '#64748B', border: '1px dashed #CBD5E1' }}>
                              Menunggu Divisi Teknik
                            </span>
                          ) : (
                            k.namaList?.map((pName, pIdx) => (
                              <span key={pIdx} className="crew-name-pill highlight" title="Personil yang ditugaskan">
                                {pName}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supervisor Sign-Off Footer */}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                <span>Otorisasi Permintaan: <strong>{uploadedRundownDoc.supervisor}</strong> ({uploadedRundownDoc.supervisorTitle})</span>
                <span className="tabular">NIP. {uploadedRundownDoc.supervisorNip}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing Requests & Returned Rundowns from Divisi Teknik */}
      {existingRequests && existingRequests.length > 0 && (() => {
        const filteredReqs = existingRequests.filter((r) =>
          programType === 'produksi' ? r.programType === 'produksi' : r.programType !== 'produksi'
        );
        if (filteredReqs.length === 0) return null;

        return (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={16} color="#1F4E8C" />
                <strong style={{ fontSize: 14, color: '#0F1F54' }}>
                  {programType === 'produksi'
                    ? 'Status Permintaan Kru Produksi In-House (Divisi Program)'
                    : 'Status Permintaan Rundown Siaran Harian (Divisi Program)'}
                </strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {programType === 'produksi'
                  ? 'Siklus: Rencana Produksi &rarr; Plotting Kuota Kru &rarr; Surat Perintah Produksi'
                  : 'Siklus: Program (Hanya Profesi) &rarr; Teknik (Isi Kru) &rarr; Kembali ke Program (Final)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredReqs.slice(0, 4).map((req) => {
              const isReturned = req.status === 'Dikirim ke Program';
              return (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 6,
                    backgroundColor: isReturned ? '#F0FDF4' : '#F8FAFC',
                    border: `1px solid ${isReturned ? '#86EFAC' : '#E2E8F0'}`,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: '#0F172A' }}>{req.programName}</strong>
                      <span style={{ fontSize: 11, color: '#64748B' }}>&bull; {req.timeRange}</span>
                    </div>
                    <div style={{ fontSize: 12, color: isReturned ? '#166534' : '#64748B' }}>
                      {isReturned
                        ? `✓ Telah Dilengkapi oleh Divisi Teknik: Kru terisi resmi & Surat Perintah terbit (${req.returnedToProgramAt || 'Baru saja'})`
                        : 'Sedang Diproses oleh Divisi Teknik: Menunggu plotting nama-nama personil kru'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={req.status} />
                    {isReturned && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                        onClick={() => setViewingFinalRundownReq(req)}
                      >
                        Lihat Rundown Final (Kru Terisi)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ); })()}

      {/* Stepper */}
      <Stepper
        steps={WIZARD_A_STEPS}
        currentStep={currentStep}
        onStepClick={(id) => {
          saveDraft();
          setCurrentStep(id);
        }}
      />

      {/* Wizard Card Container */}
      <div className="wizard-card">
        {draftSavedAlert && (
          <AlertBanner
            type="success"
            title="Draf Tersimpan"
            message="Data formulir Anda telah diamankan secara otomatis di peramban."
            onDismiss={() => setDraftSavedAlert(false)}
          />
        )}

        {/* STEP 1: Tanggal & Blok */}
        {currentStep === 1 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">Langkah 1 &mdash; Tanggal & Blok Siaran</h2>
              <p className="step-card-desc">
                Tentukan hari siaran dan slot waktu blok program yang akan diajukan.
              </p>
            </div>

            <div className="two-col-layout">
              {/* Form Input Area */}
              <div>
                <div className="form-group">
                  <label className="form-label">
                    Kategori Alur Program <span className="required-star">*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setProgramType('penyiaran')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: programType === 'penyiaran' ? '2px solid #1F4E8C' : '1px solid #CBD5E1',
                        backgroundColor: programType === 'penyiaran' ? '#EFF6FF' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: programType === 'penyiaran' ? '#1E40AF' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Program Penyiaran</span>
                        {programType === 'penyiaran' && (
                          <span style={{ fontSize: 10, backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Aktif
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>
                        Siaran harian TVRI Bali. Hanya mengajukan daftar <strong>profesi kerabat kerja</strong> (kuota angka disembunyikan).
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProgramType('produksi')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: programType === 'produksi' ? '2px solid #1F4E8C' : '1px solid #CBD5E1',
                        backgroundColor: programType === 'produksi' ? '#EFF6FF' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: programType === 'produksi' ? '#1E40AF' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Program Produksi</span>
                        {programType === 'produksi' && (
                          <span style={{ fontSize: 10, backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Aktif
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>
                        In-house taping & syuting. Mengaktifkan <strong>stepper kuota jumlah kru</strong> per profesi.
                      </div>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="broadcast-date" className="form-label">
                    Tanggal Siaran <span className="required-star">*</span>
                  </label>
                  <input
                    id="broadcast-date"
                    type="date"
                    className={`form-input tabular ${dateError ? 'has-error' : ''}`}
                    value={broadcastDate}
                    onChange={(e) => {
                      setBroadcastDate(e.target.value);
                      if (e.target.value) setDateError('');
                    }}
                    required
                  />
                  <div className="form-helper">Wajib diisi sesuai jadwal master rundown.</div>
                  {dateError && <div className="form-error-msg">{dateError}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Blok Waktu Siaran <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value as BroadcastBlock)}
                  >
                    <option value="Pagi">Blok Pagi (06:00 – 16:00 WITA)</option>
                    <option value="Siang">Blok Siang (12:00 – 15:30 WITA)</option>
                    <option value="Sore">Blok Sore (16:00 – 24:00 WITA)</option>
                    <option value="Malam">Blok Malam (19:00 – 23:30 WITA)</option>
                  </select>
                  <div className="form-helper">
                    Pembagian blok menentukan penugasan shift teknisi dan operator.
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--primary-soft)',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    marginTop: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    <Calendar size={16} />
                    <span>Jadwal Terpilih</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    Tanggal: <strong className="tabular">{broadcastDate}</strong> &bull; Blok: <strong>{selectedBlock}</strong>
                  </div>
                </div>
              </div>

              {/* Side Panel showing existing rundown rows */}
              <aside className="side-panel" aria-label="Rundown Terjadwal">
                <div className="side-panel-title">
                  <span>Rundown Tanggal Ini</span>
                  <Radio size={16} color="var(--primary)" />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Program lain yang telah tercatat di studio pada tanggal yang sama:
                </p>

                {INITIAL_RUNDOWN.map((item) => (
                  <div
                    key={item.id}
                    className={`rundown-card-item ${item.hasOverlap ? 'has-overlap' : ''}`}
                  >
                    <div className="rundown-card-header">
                      <span className="rundown-card-time tabular">{item.startTime} – {item.endTime}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.studio}</span>
                    </div>
                    <div className="rundown-card-name">{item.programName}</div>
                    <div className="rundown-card-meta">
                      {item.division}
                    </div>
                    {item.hasOverlap && (
                      <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} />
                        <span>Potensi jadwal beririsan</span>
                      </div>
                    )}
                  </div>
                ))}
              </aside>
            </div>
          </div>
        )}

        {/* STEP 2: Baris Program */}
        {currentStep === 2 && (
          <div>
            <div className="step-card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="step-card-title">Langkah 2 &mdash; Baris Program Siaran</h2>
                  <p className="step-card-desc">
                    Daftar mata acara siaran yang membutuhkan dukungan kru teknis.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addProgramRow}
                >
                  <Plus size={16} /> Tambah Program
                </button>
              </div>
            </div>

            {programs.map((prog, idx) => (
              <div
                key={prog.id}
                className={`program-row-card ${prog.overlapWarning ? 'has-warning' : ''}`}
              >
                <div className="program-row-header">
                  <div className="program-row-num">
                    <span>Program #{idx + 1}</span>
                  </div>
                  {programs.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                      onClick={() => removeProgramRow(prog.id)}
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  )}
                </div>

                <div className="grid-3" style={{ marginBottom: 16 }}>
                  <div>
                    <label className="form-label">
                      Nama Program <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Antar Nusa (Host Bali)"
                      value={prog.programName}
                      onChange={(e) =>
                        updateProgramField(prog.id, 'programName', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Jam Mulai <span className="required-star">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-input tabular"
                      value={prog.startTime}
                      onChange={(e) =>
                        updateProgramField(prog.id, 'startTime', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Jam Selesai <span className="required-star">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-input tabular"
                      value={prog.endTime}
                      onChange={(e) =>
                        updateProgramField(prog.id, 'endTime', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Catatan Teknis / Permintaan Khusus</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Membutuhkan audio clip-on 3 buah dan kamera tripod tele"
                    value={prog.notes || ''}
                    onChange={(e) =>
                      updateProgramField(prog.id, 'notes', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: Kebutuhan Peran */}
        {currentStep === 3 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">
                {programType === 'produksi'
                  ? 'Langkah 3 — Kebutuhan Peran Kru (Program Produksi)'
                  : 'Langkah 3 — Daftar Profesi Kerabat Kerja (Program Penyiaran)'}
              </h2>
              <p className="step-card-desc">
                {programType === 'produksi'
                  ? 'Tentukan kuota jumlah personil yang dibutuhkan untuk setiap peran produksi.'
                  : 'Pilih profesi kerabat kerja siaran yang dibutuhkan. Pada alur penyiaran, penugasan kru diisi oleh Divisi Teknik tanpa penentuan kuota angka.'}
              </p>
            </div>

            {programs.map((prog, pIdx) => (
              <div key={prog.id} className="program-demand-block">
                <div className="program-demand-title">
                  <span>Program #{pIdx + 1}: <strong>{prog.programName || 'Belum diberi nama'}</strong></span>
                  <span className="tabular" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    ({prog.startTime} – {prog.endTime})
                  </span>
                </div>

                <div className="roles-grid">
                  {AVAILABLE_ROLES.map((role) => {
                    const count = prog.roles.find((r) => r.role === role)?.count || 0;
                    return (
                      <div
                        key={role}
                        className="role-stepper-card"
                        style={{
                          backgroundColor: count > 0 ? '#EFF6FF' : 'var(--bg-canvas)',
                          borderColor: count > 0 ? '#3B82F6' : 'var(--border)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, display: 'block', color: 'var(--text-primary)' }}>
                            {role}
                          </span>
                          {programType === 'produksi' ? (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {count > 0 ? `${count} personil` : 'Tidak dibutuhkan'}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: count > 0 ? '#15803D' : 'var(--text-secondary)', fontWeight: count > 0 ? 600 : 400 }}>
                              {count > 0 ? '✓ Profesi Dipilih' : 'Tidak dibutuhkan'}
                            </span>
                          )}
                        </div>

                        {programType === 'produksi' ? (
                          <div className="quantity-stepper">
                            <button
                              type="button"
                              className="stepper-btn"
                              disabled={count <= 0}
                              onClick={() => updateRoleCount(prog.id, role, -1)}
                              aria-label={`Kurangi personil ${role}`}
                            >
                              -
                            </button>
                            <span className="stepper-value tabular">{count}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => updateRoleCount(prog.id, role, 1)}
                              aria-label={`Tambah personil ${role}`}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div>
                            {count > 0 ? (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                                onClick={() => updateRoleCount(prog.id, role, -count)}
                              >
                                Batal
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-gray"
                                style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                                onClick={() => updateRoleCount(prog.id, role, 1)}
                              >
                                + Pilih
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: Tinjau & Kirim */}
        {currentStep === 4 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">Langkah 4 &mdash; Tinjau & Kirim Permintaan</h2>
              <p className="step-card-desc">
                Periksa kembali ringkasan data sebelum diteruskan ke Admin Teknik.
              </p>
            </div>

            <div className="summary-card">
              {/* Section 1 */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <span className="summary-section-title">1. Waktu & Blok Siaran</span>
                  <button
                    type="button"
                    className="summary-link-edit"
                    onClick={() => setCurrentStep(1)}
                  >
                    Ubah
                  </button>
                </div>
                <div className="summary-kv-row">
                  <div className="summary-key">Tanggal Siaran</div>
                  <div className="summary-val tabular">{broadcastDate}</div>
                </div>
                <div className="summary-kv-row">
                  <div className="summary-key">Blok Waktu</div>
                  <div className="summary-val">{selectedBlock}</div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <span className="summary-section-title">2. Daftar Program Siaran</span>
                  <button
                    type="button"
                    className="summary-link-edit"
                    onClick={() => setCurrentStep(2)}
                  >
                    Ubah
                  </button>
                </div>
                {programs.map((p, idx) => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {idx + 1}. {p.programName}{' '}
                      <span className="tabular" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        ({p.startTime} – {p.endTime} WITA)
                      </span>
                    </div>
                    {p.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 16 }}>
                        Catatan: {p.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Section 3 */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <span className="summary-section-title">
                    {programType === 'produksi' ? '3. Total Kebutuhan Kru' : '3. Daftar Profesi Kru Yang Diajukan'}
                  </span>
                  <button
                    type="button"
                    className="summary-link-edit"
                    onClick={() => setCurrentStep(3)}
                  >
                    Ubah
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {programs.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        width: '100%',
                      }}
                    >
                      <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                        {p.programName}:
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {p.roles
                          .filter((r) => r.count > 0)
                          .map((r) => (
                            <span
                              key={r.role}
                              className="status-badge"
                              style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                            >
                              {programType === 'produksi' ? `${r.role} × ${r.count}` : r.role}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AlertBanner
              type="info"
              title="Informasi Alur Pengajuan"
              message="Setelah dikirim, permintaan ini akan berstatus 'Diajukan' dan langsung muncul di papan kerja Admin Teknik untuk pemilahan kandidat dan penerbitan Surat Perintah."
            />
          </div>
        )}

        {/* Sticky Footer */}
        <div className="wizard-footer">
          <div className="footer-left">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  saveDraft();
                  setCurrentStep(currentStep - 1);
                }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            )}
          </div>

          <div className="footer-center">
            <button
              type="button"
              className="btn btn-outline-gray"
              style={{ height: 34, fontSize: 13 }}
              onClick={() => saveDraft(true)}
            >
              <Save size={14} /> Simpan Draf
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Disimpan: {lastSavedTime}
            </span>
          </div>

          <div className="footer-right">
            {currentStep < 4 ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canProceed()}
                onClick={() => {
                  saveDraft();
                  setCurrentStep(currentStep + 1);
                }}
                title={!canProceed() ? 'Mohon lengkapi kolom wajib terlebih dahulu' : ''}
              >
                Lanjut <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                <Send size={16} /> Kirim ke Teknik
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Pratinjau Rundown Final yang Dikembalikan oleh Teknik */}
      {viewingFinalRundownReq && (
        <div className="modal-backdrop" onClick={() => setViewingFinalRundownReq(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 840, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1.5px solid #E2E8F0', paddingBottom: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: 9999 }}>
                  ✓ Dokumen Resmi Dikembalikan oleh Divisi Teknik
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F1F54', marginTop: 4 }}>
                  RUNDOWN PENYELENGGARAAN SIARAN PAGI TVRI BALI (FINAL & LENGKAP)
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {viewingFinalRundownReq.date} &bull; {viewingFinalRundownReq.timeRange} &bull; Program: {viewingFinalRundownReq.programName}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-gray"
                style={{ height: 32, fontSize: 12 }}
                onClick={() => setViewingFinalRundownReq(null)}
              >
                Tutup
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 6, border: '1px solid #CBD5E1', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F1F54' }}>
                  TABEL KERABAT KERJA SIARAN (Nama Personel Kru Resmi Telah Diisi Lengkap)
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: 4 }}>
                  24 Kru Terisi Lengkap
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {viewingFinalRundownReq.kerabatKerja?.slice(0, 8).map((k, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{k.peran}:</span>
                      <span style={{ fontWeight: 700, color: '#1E40AF' }}>{k.personil}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {viewingFinalRundownReq.kerabatKerja?.slice(8).map((k, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{k.peran}:</span>
                      <span style={{ fontWeight: 700, color: '#1E40AF' }}>{k.personil}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline-gray"
                onClick={() => setViewingFinalRundownReq(null)}
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                Cetak Rundown Siap Siar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardA;
