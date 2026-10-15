import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Radio,
  Plus,
  Printer,
  Edit3,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  AlertCircle,
} from 'lucide-react';
import type { DailyRundown, UserRole } from '../types';
import { MOCK_DAILY_RUNDOWNS } from '../data/mockData';
import { RundownPrintModal } from './RundownPrintModal';

interface RundownProgramListViewProps {
  currentUserRole: UserRole;
  onOpenCreateWizard: (date?: string, block?: 'Pagi' | 'Sore') => void;
  onOpenEditWizard: (rundown: DailyRundown) => void;
  onGoToPolaAcara?: () => void;
  customRundowns?: DailyRundown[];
}

export const RundownProgramListView: React.FC<RundownProgramListViewProps> = ({
  currentUserRole,
  onOpenCreateWizard,
  onOpenEditWizard,
  onGoToPolaAcara,
  customRundowns,
}) => {
  const [filterBlock, setFilterBlock] = useState<'Semua' | 'Pagi' | 'Sore'>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'tersimpan' | 'draf'>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Print modal state
  const [printModalData, setPrintModalData] = useState<DailyRundown | null>(null);

  // Combine mock data and any custom created rundowns
  const allRundowns = useMemo(() => {
    const list = customRundowns && customRundowns.length > 0 ? customRundowns : MOCK_DAILY_RUNDOWNS;
    // Add additional mock records for a richer view if only 1 exists
    if (list.length === 1) {
      const extraList: DailyRundown[] = [
        ...list,
        {
          id: 'rd-2026-10-13-pagi',
          tanggal: '2026-10-13',
          blok: 'Pagi',
          status: 'tersimpan',
          savedAt: '2026-10-12 15:45:00',
          sourceType: 'Pola Acara',
          programs: [
            {
              id: 'p-1',
              mataAcara: 'Warta Nusantara Pagi',
              tayang: 'Live',
              jamMulai: '06:00:00',
              durasi: '0:30:00',
              jamSelesai: '06:30:00',
              sumber: 'Live Studio 1',
              sumberCategory: 'Live',
              lokasi: 'Studio 1 (Utama - Live & Berita)',
              sisipanList: [],
            },
            {
              id: 'p-2',
              mataAcara: 'Gatra Bali Pagi',
              tayang: 'Live',
              jamMulai: '06:30:00',
              durasi: '0:30:00',
              jamSelesai: '07:00:00',
              sumber: 'Live Studio 1',
              sumberCategory: 'Live',
              lokasi: 'Studio 1 (Utama - Live & Berita)',
              sisipanList: [],
            },
            {
              id: 'p-3',
              mataAcara: 'Nyurya Sewana',
              tayang: 'Live',
              jamMulai: '07:00:00',
              durasi: '0:30:00',
              jamSelesai: '07:30:00',
              sumber: 'Live Studio 2',
              sumberCategory: 'Live',
              lokasi: 'Studio 2 (Musik & Budaya)',
              sisipanList: [],
            },
            {
              id: 'p-4',
              mataAcara: 'Antar Nusa',
              tayang: 'Live',
              jamMulai: '08:00:00',
              durasi: '1:00:00',
              jamSelesai: '09:00:00',
              sumber: 'Relay nasional',
              sumberCategory: 'Relay',
              sisipanList: [],
            },
          ],
          kerabatKerjaSiaran: list[0].kerabatKerjaSiaran,
          warnings: [],
        },
        {
          id: 'rd-2026-10-14-sore',
          tanggal: '2026-10-14',
          blok: 'Sore',
          status: 'draf',
          savedAt: '2026-10-13 11:20:00',
          sourceType: 'Pola Acara',
          programs: list[0].programs.slice(0, 4),
          kerabatKerjaSiaran: list[0].kerabatKerjaSiaran,
          warnings: ['Ada 2 baris acara belum lengkap sumber penyiaran.'],
        },
      ];
      return extraList;
    }
    return list;
  }, [customRundowns]);

  // Filtered rundown records
  const filteredRundowns = useMemo(() => {
    return allRundowns.filter((rd) => {
      if (!rd.tanggal.startsWith(selectedMonth)) return false;
      if (filterBlock !== 'Semua' && rd.blok !== filterBlock) return false;
      if (filterStatus !== 'Semua' && rd.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDate = rd.tanggal.includes(q);
        const matchProg = rd.programs.some((p) => p.mataAcara.toLowerCase().includes(q));
        if (!matchDate && !matchProg) return false;
      }
      return true;
    });
  }, [allRundowns, selectedMonth, filterBlock, filterStatus, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
          border: '1px solid #E9D5FF',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <Radio size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: '#EDE9FE',
                  color: '#6D28D9',
                  letterSpacing: '0.05em',
                }}
              >
                Divisi Program &bull; Operasional Penyiaran
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>&bull;</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                Acuan: <strong>Pola Acara Stasiun (Disetujui)</strong>
              </span>
            </div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#0F172A',
                margin: '4px 0 2px 0',
                letterSpacing: '-0.01em',
              }}
            >
              Daftar Rundown Penyelenggaraan Siaran Harian
            </h1>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>
              Penyusunan strip waktu dan mata acara siaran harian (Pagi &amp; Sore). Kerabat kerja otomatis terisi dari Jadwal Dinas Teknik.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {onGoToPolaAcara && (
            <button
              type="button"
              className="button-secondary"
              onClick={onGoToPolaAcara}
              style={{ height: 38, fontSize: 13, fontWeight: 600, gap: 6, padding: '0 14px' }}
              title="Lihat master grid Pola Acara Stasiun"
            >
              <Layers size={15} color="#7C3AED" />
              Lihat Pola Acara
            </button>
          )}

          {currentUserRole === 'admin_program' && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onOpenCreateWizard()}
              style={{
                height: 38,
                fontSize: 13,
                fontWeight: 700,
                gap: 6,
                padding: '0 16px',
                backgroundColor: '#7C3AED',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.25)',
              }}
            >
              <Plus size={16} />
              Susun Rundown Baru (W2)
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 12px',
              backgroundColor: '#F8FAFC',
            }}
          >
            <Calendar size={15} color="#64748B" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: 12.5,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-11">November 2026</option>
            </select>
          </div>

          {/* Block Filter Buttons */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: 3,
              borderRadius: 8,
              gap: 2,
            }}
          >
            {(['Semua', 'Pagi', 'Sore'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setFilterBlock(b)}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: filterBlock === b ? 700 : 500,
                  backgroundColor: filterBlock === b ? '#FFFFFF' : 'transparent',
                  color: filterBlock === b ? '#7C3AED' : '#64748B',
                  boxShadow: filterBlock === b ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {b === 'Semua' ? 'Semua Blok' : `Blok ${b}`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: 3,
              borderRadius: 8,
              gap: 2,
            }}
          >
            {(['Semua', 'tersimpan', 'draf'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: filterStatus === s ? 700 : 500,
                  backgroundColor: filterStatus === s ? '#FFFFFF' : 'transparent',
                  color: filterStatus === s ? '#0F172A' : '#64748B',
                  boxShadow: filterStatus === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {s === 'Semua' ? 'Semua Status' : s === 'tersimpan' ? 'Tersimpan (Siap Siar)' : 'Draf'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '6px 12px',
            backgroundColor: '#FFFFFF',
            minWidth: 220,
          }}
        >
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Cari tanggal / mata acara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 12.5,
              width: '100%',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Rundown Cards / Table List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredRundowns.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 48,
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px dashed #CBD5E1',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#F3E8FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Radio size={26} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: '#0F172A' }}>
              Tidak Ada Dokumen Rundown Ditemukan
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748B' }}>
              Belum ada rundown yang disusun untuk filter yang dipilih.
            </p>
            {currentUserRole === 'admin_program' && (
              <button
                type="button"
                className="button-primary"
                onClick={() => onOpenCreateWizard()}
                style={{ height: 38, fontSize: 13, padding: '0 16px', backgroundColor: '#7C3AED' }}
              >
                <Plus size={15} /> Susun Rundown Sekarang
              </button>
            )}
          </div>
        ) : (
          filteredRundowns.map((rd) => {
            const isPagi = rd.blok === 'Pagi';
            const timeRange = isPagi ? '06:00 – 16:00 WITA' : '16:00 – 24:00 WITA';

            // Format date string
            let dateDisplay = rd.tanggal;
            try {
              const d = new Date(rd.tanggal);
              dateDisplay = d.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
            } catch {
              // keep default
            }

            return (
              <div
                key={rd.id}
                className="card"
                style={{
                  padding: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--divider)',
                  borderRadius: 12,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Card Main Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        backgroundColor: isPagi ? '#FEF3C7' : '#EDE9FE',
                        color: isPagi ? '#92400E' : '#6D28D9',
                        fontWeight: 800,
                        fontSize: 12.5,
                        letterSpacing: '0.04em',
                      }}
                    >
                      BLOK {rd.blok.toUpperCase()}
                    </div>

                    <div>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                        {dateDisplay}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                        <Clock size={13} />
                        <span>{timeRange}</span>
                        <span>&bull;</span>
                        <span>{rd.programs.length} Mata Acara</span>
                        <span>&bull;</span>
                        <span>Sumber: <strong>{rd.sourceType}</strong></span>
                        {rd.savedAt && (
                          <>
                            <span>&bull;</span>
                            <span>Disimpan: {rd.savedAt}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: rd.status === 'tersimpan' ? '#DCFCE7' : '#FEF3C7',
                        color: rd.status === 'tersimpan' ? '#166534' : '#854D0E',
                      }}
                    >
                      {rd.status === 'tersimpan' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {rd.status === 'tersimpan' ? 'Tersimpan (Kirim ke Teknik)' : 'Draf Belum Selesai'}
                    </span>

                    {/* Action buttons */}
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setPrintModalData(rd)}
                      style={{ height: 36, fontSize: 12.5, padding: '0 14px', gap: 6 }}
                      title="Cetak lembar resmi rundown A4"
                    >
                      <Printer size={15} /> Cetak
                    </button>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => onOpenEditWizard(rd)}
                      style={{
                        height: 36,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#7C3AED',
                      }}
                    >
                      <Edit3 size={15} /> Edit Rundown
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print Modal */}
      {printModalData && (
        <RundownPrintModal
          isOpen={!!printModalData}
          onClose={() => setPrintModalData(null)}
          date={printModalData.tanggal}
          block={printModalData.blok}
          programs={printModalData.programs}
          rosterItems={printModalData.kerabatKerjaSiaran}
        />
      )}
    </div>
  );
};
