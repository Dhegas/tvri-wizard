import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Radio,
  Tv,
  FileText,
  Printer,
  Users,
  Search,
  CheckCircle2,
  Layers,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import type {
  RundownProgramRow,
  BroadcastCrewRosterItem,
  SavedAssignment,
  UserRole,
} from '../types';
import { MOCK_DAILY_RUNDOWNS, MASTER_EMPLOYEES } from '../data/mockData';
import { RundownPrintModal } from './RundownPrintModal';
import { SuratPerintahModal } from './SuratPerintahModal';

export interface RundownTeknikHistoryItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  blok: 'Pagi' | 'Sore';
  status: 'Sedang Tayang' | 'Siap Siar' | 'Selesai Siar' | 'Diarsipkan';
  nomorSuratTugas: string;
  pengarahTeknik: string;
  mcrPetugas: string;
  totalProgram: number;
  highlightPrograms: string[];
  programs: RundownProgramRow[];
  rosterItems: BroadcastCrewRosterItem[];
  savedAssignment: SavedAssignment;
}

interface RundownTeknikHistoryViewProps {
  currentUserRole: UserRole;
  onOpenJadwalDinas?: () => void;
  onOpenFullMatrix?: () => void;
  onOpenJawabanRundown?: () => void;
}

export const RundownTeknikHistoryView: React.FC<RundownTeknikHistoryViewProps> = ({
  currentUserRole: _currentUserRole,
  onOpenJadwalDinas,
  onOpenFullMatrix,
  onOpenJawabanRundown,
}) => {
  // Filter states
  const [filterBlok, setFilterBlok] = useState<'Semua' | 'Pagi' | 'Sore'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal active states
  const [activePrintRundown, setActivePrintRundown] = useState<{
    isOpen: boolean;
    date: string;
    block: 'Pagi' | 'Sore';
    programs: RundownProgramRow[];
    rosterItems: BroadcastCrewRosterItem[];
  } | null>(null);

  const [activeSuratAssignment, setActiveSuratAssignment] = useState<SavedAssignment | null>(null);

  // Quick Tugaskan Kru modal state
  const [crewModalTarget, setCrewModalTarget] = useState<RundownTeknikHistoryItem | null>(null);
  const [activeCrewRoster, setActiveCrewRoster] = useState<BroadcastCrewRosterItem[]>([]);
  const [saveCrewSuccess, setSaveCrewSuccess] = useState(false);

  // Base mock programs & roster from existing data
  const basePrograms = useMemo(() => MOCK_DAILY_RUNDOWNS[0]?.programs || [], []);
  const baseRoster = useMemo(() => MOCK_DAILY_RUNDOWNS[0]?.kerabatKerjaSiaran || [], []);

  // Today's Rundown Item (Highlight)
  const todayHighlight: RundownTeknikHistoryItem = useMemo(() => {
    return {
      id: 'rd-today-2026-10-15-sore',
      tanggal: '2026-10-15',
      blok: 'Sore',
      status: 'Sedang Tayang',
      nomorSuratTugas: 'ST.042/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Komang Arta Wirawan',
      mcrPetugas: 'I Wayan Sugata, S.I.Kom',
      totalProgram: 6,
      highlightPrograms: [
        'Balivision (Live Studio 2)',
        'Mimbar Agama Budha (Live Studio 3)',
        'Bali Hari Ini (Live Studio 1)',
        'Puja Tri Sandhya (Storage 3)',
        'Indonesia Bicara (Relay Nasional)',
        'Title Box & Penutup Siaran',
      ],
      programs: basePrograms,
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-today-2026-10-15-sore',
        programName: 'Rundown Siaran Sore TVRI Bali',
        date: '2026-10-15',
        timeRange: '16:00 - 24:00 WITA',
        spNumber: 'ST.042/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-15 08:30:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    };
  }, [basePrograms, baseRoster]);

  // History List Items (Past Rundowns)
  const [historyList, setHistoryList] = useState<RundownTeknikHistoryItem[]>([
    {
      id: 'rd-hist-2026-10-14-sore',
      tanggal: '2026-10-14',
      blok: 'Sore',
      status: 'Selesai Siar',
      nomorSuratTugas: 'ST.041/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Komang Arta Wirawan',
      mcrPetugas: 'I Wayan Sugata, S.I.Kom',
      totalProgram: 6,
      highlightPrograms: ['Balivision', 'Bali Hari Ini', 'Dharma Wacana', 'Warta Nusantara'],
      programs: basePrograms,
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-hist-2026-10-14-sore',
        programName: 'Rundown Siaran Sore — 14 Oktober 2026',
        date: '2026-10-14',
        timeRange: '16:00 - 24:00 WITA',
        spNumber: 'ST.041/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-14 08:00:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    },
    {
      id: 'rd-hist-2026-10-14-pagi',
      tanggal: '2026-10-14',
      blok: 'Pagi',
      status: 'Selesai Siar',
      nomorSuratTugas: 'ST.040/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Ketut Subawa',
      mcrPetugas: 'Gede Agus Santika',
      totalProgram: 4,
      highlightPrograms: ['Indonesia Pagi (Relay)', 'Mimbar Agama Hindu', 'Jelajah Dewata'],
      programs: basePrograms.slice(0, 4),
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-hist-2026-10-14-pagi',
        programName: 'Rundown Siaran Pagi — 14 Oktober 2026',
        date: '2026-10-14',
        timeRange: '05:00 - 12:00 WITA',
        spNumber: 'ST.040/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-13 16:00:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    },
    {
      id: 'rd-hist-2026-10-13-sore',
      tanggal: '2026-10-13',
      blok: 'Sore',
      status: 'Selesai Siar',
      nomorSuratTugas: 'ST.039/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Komang Arta Wirawan',
      mcrPetugas: 'I Wayan Sugata, S.I.Kom',
      totalProgram: 6,
      highlightPrograms: ['Balivision', 'Bali Hari Ini', 'Pesona Indonesia', 'Musik Tradisional'],
      programs: basePrograms,
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-hist-2026-10-13-sore',
        programName: 'Rundown Siaran Sore — 13 Oktober 2026',
        date: '2026-10-13',
        timeRange: '16:00 - 24:00 WITA',
        spNumber: 'ST.039/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-13 08:30:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    },
    {
      id: 'rd-hist-2026-10-13-pagi',
      tanggal: '2026-10-13',
      blok: 'Pagi',
      status: 'Selesai Siar',
      nomorSuratTugas: 'ST.038/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Made Suartana',
      mcrPetugas: 'I Wayan Sugata, S.I.Kom',
      totalProgram: 4,
      highlightPrograms: ['Indonesia Pagi', 'Jelajah Dewata', 'Info Terkini'],
      programs: basePrograms.slice(0, 4),
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-hist-2026-10-13-pagi',
        programName: 'Rundown Siaran Pagi — 13 Oktober 2026',
        date: '2026-10-13',
        timeRange: '05:00 - 12:00 WITA',
        spNumber: 'ST.038/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-12 16:00:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    },
    {
      id: 'rd-hist-2026-10-12-sore',
      tanggal: '2026-10-12',
      blok: 'Sore',
      status: 'Diarsipkan',
      nomorSuratTugas: 'ST.037/TVRI-BALI/TEK/10/2026',
      pengarahTeknik: 'Komang Arta Wirawan',
      mcrPetugas: 'I Wayan Sugata, S.I.Kom',
      totalProgram: 6,
      highlightPrograms: ['Balivision', 'Mimbar Agama Budha', 'Bali Hari Ini', 'Puja Tri Sandhya'],
      programs: basePrograms,
      rosterItems: baseRoster,
      savedAssignment: {
        requestId: 'rd-hist-2026-10-12-sore',
        programName: 'Rundown Siaran Sore — 12 Oktober 2026',
        date: '2026-10-12',
        timeRange: '16:00 - 24:00 WITA',
        spNumber: 'ST.037/TVRI-BALI/TEK/10/2026',
        createdAt: '2026-10-12 08:30:00',
        crew: baseRoster.map((r, i) => ({
          candidateId: `emp-${i + 1}`,
          name: r.personil || 'Personil Terpilih',
          role: r.peran,
          nip: `1985011${i}20090${i}100${i}`,
        })),
      },
    },
  ]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      if (filterBlok !== 'Semua' && item.blok !== filterBlok) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDate = item.tanggal.toLowerCase().includes(q);
        const matchSurat = item.nomorSuratTugas.toLowerCase().includes(q);
        const matchProg = item.highlightPrograms.some((p) => p.toLowerCase().includes(q));
        const matchPengarah = item.pengarahTeknik.toLowerCase().includes(q);
        if (!matchDate && !matchSurat && !matchProg && !matchPengarah) return false;
      }
      return true;
    });
  }, [historyList, filterBlok, searchQuery]);

  // Handler to open "Lihat Rundown"
  const handleOpenLihatRundown = (item: RundownTeknikHistoryItem) => {
    setActivePrintRundown({
      isOpen: true,
      date: item.tanggal,
      block: item.blok,
      programs: item.programs,
      rosterItems: item.rosterItems,
    });
  };

  // Handler to open "Surat Lihat Tugas"
  const handleOpenSuratTugas = (item: RundownTeknikHistoryItem) => {
    setActiveSuratAssignment(item.savedAssignment);
  };

  // Handler to open "Tugaskan Kru"
  const handleOpenTugaskanKru = (item: RundownTeknikHistoryItem) => {
    setCrewModalTarget(item);
    setActiveCrewRoster([...item.rosterItems]);
    setSaveCrewSuccess(false);
  };

  // Save modified crew roster
  const handleSaveCrewRoster = () => {
    if (!crewModalTarget) return;
    setHistoryList((prev) =>
      prev.map((item) => {
        if (item.id === crewModalTarget.id) {
          return {
            ...item,
            rosterItems: activeCrewRoster,
          };
        }
        return item;
      })
    );
    setSaveCrewSuccess(true);
    setTimeout(() => {
      setSaveCrewSuccess(false);
      setCrewModalTarget(null);
    }, 1500);
  };

  // Format date helper in Indonesian
  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const bulanList = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${hariList[d.getDay()]}, ${d.getDate()} ${bulanList[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 1. Header Banner & Context */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              border: '1px solid #A7F3D0',
              flexShrink: 0,
            }}
          >
            <Radio size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Rundown Siaran Harian (Operasional Penyiaran)
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: '1px solid #A7F3D0',
                }}
              >
                Divisi Teknik Operasional
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Monitoring rundown harian stasiun, kesiapan kerabat siaran, highlight penyiaran hari ini,
              dan arsip riwayat beserta surat penugasan resmi.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {onOpenJawabanRundown && (
            <button
              type="button"
              onClick={onOpenJawabanRundown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileCheck size={16} color="#059669" />
              <span>Verifikasi & Jawaban Teknik</span>
            </button>
          )}

          {onOpenJadwalDinas && (
            <button
              type="button"
              onClick={onOpenJadwalDinas}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Calendar size={16} color="#0284C7" />
              <span>Jadwal Dinas (W1)</span>
            </button>
          )}

          {onOpenFullMatrix && (
            <button
              type="button"
              onClick={onOpenFullMatrix}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#1E3FA8',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(30, 63, 168, 0.25)',
              }}
            >
              <Layers size={16} />
              <span>Buka Matriks Rundown (W2)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HIGHLIGHT: RUNDOWN SIARAN HARI INI */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: 32,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Highlight Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 8px #FFFFFF',
                }}
              />
              HIGHLIGHT SIARAN HARI INI
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC' }}>
              {formatDateIndo(todayHighlight.tanggal)} &bull; Blok {todayHighlight.blok}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#94A3B8' }}>
            <div>
              No. Surat Tugas: <strong style={{ color: '#F8FAFC' }}>{todayHighlight.nomorSuratTugas}</strong>
            </div>
            <span style={{ color: '#475569' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#34D399' }}>
              <ShieldCheck size={16} />
              <span>Siap Siar & Terverifikasi MCR</span>
            </div>
          </div>
        </div>

        {/* Highlight Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(280px, 1fr)',
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Left Column: Susunan Program Hari Ini */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 10,
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tv size={15} />
                <span>Susunan Program Siaran ({todayHighlight.totalProgram} Mata Acara)</span>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>16:00 — 24:00 WITA</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayHighlight.highlightPrograms.map((prog, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    color: '#E2E8F0',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 12px',
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#38BDF8',
                      minWidth: 20,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{prog}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Kerabat Kerja & Pengawas Teknik */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 10,
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Users size={15} />
                <span>Kerabat Kerja Siaran Bertugas (15 Posisi)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 5 }}>
                  <span style={{ color: '#94A3B8' }}>Pengarah Teknik:</span>
                  <strong style={{ color: '#F1F5F9' }}>{todayHighlight.pengarahTeknik}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 5 }}>
                  <span style={{ color: '#94A3B8' }}>Master Control (MCR):</span>
                  <strong style={{ color: '#F1F5F9' }}>{todayHighlight.mcrPetugas}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 5 }}>
                  <span style={{ color: '#94A3B8' }}>Pemadu Gambar (SW):</span>
                  <strong style={{ color: '#F1F5F9' }}>Putri Krisna Lila Dewi, ST</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 5 }}>
                  <span style={{ color: '#94A3B8' }}>Penata Suara (Audio):</span>
                  <strong style={{ color: '#F1F5F9' }}>Erik Julianto Nugroho, A.Md.</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 2 }}>
                  <span style={{ color: '#94A3B8' }}>Kamerawan Studio:</span>
                  <strong style={{ color: '#F1F5F9' }}>Rovelino Nanlohy, I Made Astawa</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: '#A7F3D0',
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                padding: '6px 10px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 size={13} />
              <span>Sinkron otomatis dengan Matriks Jadwal Dinas (W1)</span>
            </div>
          </div>
        </div>

        {/* 3 Prominent Action Buttons for Today's Highlight */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
            paddingTop: 8,
          }}
        >
          {/* Button 1: Lihat Rundown */}
          <button
            type="button"
            onClick={() => handleOpenLihatRundown(todayHighlight)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Printer size={16} color="#1E3FA8" />
            <span>Lihat Rundown (A4)</span>
          </button>

          {/* Button 2: Surat Lihat Tugas */}
          <button
            type="button"
            onClick={() => handleOpenSuratTugas(todayHighlight)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              backgroundColor: '#38BDF8',
              color: '#0F172A',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)',
              transition: 'transform 0.15s ease',
            }}
          >
            <FileText size={16} color="#0F172A" />
            <span>Surat Lihat Tugas</span>
          </button>

          {/* Button 3: Tugaskan Kru */}
          <button
            type="button"
            onClick={() => handleOpenTugaskanKru(todayHighlight)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>Tugaskan Kru</span>
          </button>
        </div>
      </div>

      {/* 3. HISTORY SECTION: LIST HISTORY RUNDOWN SIARAN SEBELUMNYA */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* History Header & Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Riwayat Rundown Siaran Sebelumnya
            </h2>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
              Daftar arsip siaran yang telah ditayangkan dan terdokumentasi resmi di TVRI Stasiun Bali.
            </div>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                width: 240,
              }}
            >
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tanggal, program, surat..."
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 12.5,
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            {/* Blok Filter Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F1F5F9',
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              {(['Semua', 'Pagi', 'Sore'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setFilterBlok(b)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: filterBlok === b ? 700 : 500,
                    backgroundColor: filterBlok === b ? '#FFFFFF' : 'transparent',
                    color: filterBlok === b ? '#0F172A' : '#64748B',
                    boxShadow: filterBlok === b ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {b === 'Semua' ? 'Semua Blok' : `Blok ${b}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History List Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#94A3B8',
                backgroundColor: '#F8FAFC',
                borderRadius: 8,
                border: '1px dashed #CBD5E1',
              }}
            >
              Tidak ada data riwayat rundown siaran yang sesuai dengan pencarian.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px 20px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Left: Info & Dates */}
                <div style={{ flex: '1 1 340px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: item.blok === 'Pagi' ? '#FEF3C7' : '#E0E7FF',
                        color: item.blok === 'Pagi' ? '#92400E' : '#3730A3',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      BLOK {item.blok.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: 14, color: '#0F172A' }}>
                      {formatDateIndo(item.tanggal)}
                    </strong>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Highlights Program */}
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                    <strong style={{ color: '#0F172A' }}>Program Utama:</strong>{' '}
                    {item.highlightPrograms.join(' &bull; ')} ({item.totalProgram} Mata Acara)
                  </div>

                  {/* Duty info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: '#64748B' }}>
                    <span>Pengarah Teknik: <strong style={{ color: '#334155' }}>{item.pengarahTeknik}</strong></span>
                    <span>&bull;</span>
                    <span>No. Surat: <code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>{item.nomorSuratTugas}</code></span>
                  </div>
                </div>

                {/* Right: 3 Action Buttons (Sesuai Permintaan) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* 1. Lihat Rundown */}
                  <button
                    type="button"
                    onClick={() => handleOpenLihatRundown(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Pratinjau lembar A4 rundown siaran"
                  >
                    <Printer size={14} color="#1E3FA8" />
                    <span>Lihat Rundown</span>
                  </button>

                  {/* 2. Surat Lihat Tugas */}
                  <button
                    type="button"
                    onClick={() => handleOpenSuratTugas(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #BAE6FD',
                      backgroundColor: '#F0F9FF',
                      color: '#0369A1',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Buka Surat Tugas resmi penyiaran"
                  >
                    <FileText size={14} color="#0284C7" />
                    <span>Surat Lihat Tugas</span>
                  </button>

                  {/* 3. Tugaskan Kru */}
                  <button
                    type="button"
                    onClick={() => handleOpenTugaskanKru(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #A7F3D0',
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Tinjau atau sesuaikan kerabat kerja siaran"
                  >
                    <Users size={14} color="#059669" />
                    <span>Tugaskan Kru</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. MODAL: LIHAT RUNDOWN (A4 Print Modal) */}
      {activePrintRundown && (
        <RundownPrintModal
          isOpen={activePrintRundown.isOpen}
          onClose={() => setActivePrintRundown(null)}
          date={activePrintRundown.date}
          block={activePrintRundown.block}
          programs={activePrintRundown.programs}
          rosterItems={activePrintRundown.rosterItems}
        />
      )}

      {/* 5. MODAL: SURAT LIHAT TUGAS (Surat Perintah Penyiaran) */}
      {activeSuratAssignment && (
        <SuratPerintahModal
          assignment={activeSuratAssignment}
          onClose={() => setActiveSuratAssignment(null)}
        />
      )}

      {/* 6. MODAL: QUICK TUGASKAN KRU PENYIARAN */}
      {crewModalTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div
            className="modal-content"
            style={{
              maxWidth: 780,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={20} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                    Penugasan Kerabat Kerja Siaran (Divisi Teknik)
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {formatDateIndo(crewModalTarget.tanggal)} &bull; Blok {crewModalTarget.blok} &bull; No: {crewModalTarget.nomorSuratTugas}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCrewModalTarget(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Roster Table */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {saveCrewSuccess && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Penugasan kerabat kerja berhasil disimpan & diperbarui di lembar tugas!</span>
                </div>
              )}

              <div
                style={{
                  fontSize: 12,
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                Penugasan ini terhubung langsung ke <strong>Jadwal Dinas Siaran (W1)</strong> dan akan tampil pada lembar
                cetak <strong>Surat Tugas</strong> serta lembar <strong>Rundown Siaran Harian</strong>.
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: 40 }}>No</th>
                    <th style={{ padding: '8px 12px', width: 220 }}>Posisi / Peran Kerabat Kerja</th>
                    <th style={{ padding: '8px 12px' }}>Nama Petugas / Personil Terpilih</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCrewRoster.map((roster, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>{roster.peran}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={roster.personil}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActiveCrewRoster((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, personil: val } : r))
                            );
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 12.5,
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value={roster.personil}>{roster.personil}</option>
                          {MASTER_EMPLOYEES.filter(
                            (e) => e.name !== roster.personil && e.division === 'Teknik'
                          ).map((emp) => (
                            <option key={emp.id} value={emp.name}>
                              {emp.name} ({emp.subDivision || emp.division})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Total: <strong>{activeCrewRoster.length} Posisi Kerabat Kerja</strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setCrewModalTarget(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrewRoster}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  Simpan Penugasan Kru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
