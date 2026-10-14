import React, { useState } from 'react';
import {
  Calendar,
  Radio,
  Film,
  Printer,
  Info,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import {
  OFFICIAL_POLA_GRID_OCTOBER_2026,
} from '../data/mockData';
import type { BroadcastDay, PolaKategoriType, UserRole } from '../types';

interface PolaAcaraViewProps {
  currentUserRole?: UserRole;
  onGoToRundownWithDay?: (day: BroadcastDay, block: 'Pagi' | 'Sore') => void;
  onGoToSprWithProgram?: (programName: string, format: string, duration: string) => void;
}

export const PolaAcaraView: React.FC<PolaAcaraViewProps> = ({
  currentUserRole = 'admin_program',
  onGoToRundownWithDay,
  onGoToSprWithProgram,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [selectedDayTab, setSelectedDayTab] = useState<BroadcastDay>('Senin');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Mapping category colors according to official TVRI Bali document legend
  const getCategoryBadgeStyle = (category: PolaKategoriType) => {
    switch (category) {
      case 'NEWS':
        return { backgroundColor: '#1E3FA8', color: '#FFFFFF', border: '1px solid #1E3FA8' }; // Biru Tua
      case 'BUDAYA':
        return { backgroundColor: '#15803D', color: '#FFFFFF', border: '1px solid #15803D' }; // Hijau Tua
      case 'SPORT':
        return { backgroundColor: '#DC2626', color: '#FFFFFF', border: '1px solid #DC2626' }; // Merah
      case 'KIDS':
        return { backgroundColor: '#EA580C', color: '#FFFFFF', border: '1px solid #EA580C' }; // Oranye
      case 'HIBURAN':
        return { backgroundColor: '#7C3AED', color: '#FFFFFF', border: '1px solid #7C3AED' }; // Ungu
      case 'PENDIDIKAN':
        return { backgroundColor: '#0284C7', color: '#FFFFFF', border: '1px solid #0284C7' }; // Biru Langit
      case 'RELAY JAKARTA':
        return { backgroundColor: '#B91C1C', color: '#FFFFFF', border: '1px solid #991B1B' }; // Coklat Kemerahan / Salmon
      case 'PUJA TRISANDYA':
        return { backgroundColor: '#16A34A', color: '#FFFFFF', border: '1px solid #15803D' }; // Hijau Daun
      case 'KERJASAMA':
        return { backgroundColor: '#CA8A04', color: '#FFFFFF', border: '1px solid #A16207' }; // Kuning Emas
      default:
        return { backgroundColor: '#64748B', color: '#FFFFFF', border: '1px solid #475569' };
    }
  };

  const dayKeys: { label: BroadcastDay; key: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu' }[] = [
    { label: 'Senin', key: 'senin' },
    { label: 'Selasa', key: 'selasa' },
    { label: 'Rabu', key: 'rabu' },
    { label: 'Kamis', key: 'kamis' },
    { label: 'Jumat', key: 'jumat' },
    { label: 'Sabtu', key: 'sabtu' },
    { label: 'Minggu', key: 'minggu' },
  ];

  const categoriesLegend: { label: PolaKategoriType; desc: string }[] = [
    { label: 'NEWS', desc: 'Warta berita lokal & nasional' },
    { label: 'BUDAYA', desc: 'Seni, adat, monolog & tradisi Bali' },
    { label: 'SPORT', desc: 'Olahraga & dinamika prestasi' },
    { label: 'KIDS', desc: 'Acara ramah anak & bermain' },
    { label: 'HIBURAN', desc: 'Musik pop Bali, konser & panggung' },
    { label: 'PENDIDIKAN', desc: 'Edukasi wacana & pertanian' },
    { label: 'RELAY JAKARTA', desc: 'Siaran langsung TVRI Pusat' },
    { label: 'PUJA TRISANDYA', desc: 'Ibadah wajib 3 waktu (06.00, 12.00, 18.00)' },
    { label: 'KERJASAMA', desc: 'Liputan kemitraan (LKBN Antara)' },
  ];

  const handlePrintPola = () => {
    window.print();
  };

  return (
    <div className="pola-acara-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner Mode Lihat Saja untuk Divisi Teknik */}
      {currentUserRole === 'admin_teknik' && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1.5px solid #93C5FD',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: '#1E3FA8',
            boxShadow: '0 1px 2px rgba(30, 63, 168, 0.05)',
          }}
        >
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Mode Lihat Saja (Divisi Teknik):</strong> Pola Acara Stasiun ditetapkan oleh Divisi Program sebagai acuan stasiun. Divisi Teknik menggunakannya untuk melihat fasilitas siaran dan pemancar tanpa hak mengubah jadwal atau membuat rundown.
          </div>
        </div>
      )}

      {/* 1. Official Header Banner: Document Metadata */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: '#1E3FA8',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(30, 63, 168, 0.25)',
                flexShrink: 0,
              }}
            >
              <Tv size={28} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#1E3FA8',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #BFDBFE',
                  }}
                >
                  LEMBAR RESMI KEPALA STASIUN
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--success-container)',
                    color: 'var(--on-success-container)',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  STATUS: AKTIF BERLAKU
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                  Dibuat Akhir Bulan untuk Operasional Bulan Berikutnya
                </span>
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', margin: '6px 0 2px', letterSpacing: -0.5 }}>
                POLA ACARA TVRI BALI &mdash; OKTOBER 2026
              </h1>

              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                Rujukan utama penyusunan <strong>Rundown Harian Penyiaran (Wizard 2)</strong> dan <strong>Pengajuan Surat Permintaan Kru & Peralatan (SPR Wizard 3)</strong>.
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button-secondary"
              onClick={handlePrintPola}
              style={{ height: 38, fontSize: 12.5, padding: '0 14px', gap: 6 }}
              title="Cetak lembar fisik Pola Acara format A4"
            >
              <Printer size={15} /> Cetak Pola Acara
            </button>

            {currentUserRole === 'admin_program' && onGoToRundownWithDay && (
              <button
                type="button"
                className="button-primary"
                onClick={() => onGoToRundownWithDay(selectedDayTab, 'Pagi')}
                style={{ height: 38, fontSize: 13, padding: '0 16px', gap: 6, backgroundColor: '#1E3FA8' }}
                title="Buka Wizard 2 dengan mata acara otomatis dimuat dari Pola Acara hari ini"
              >
                <Radio size={15} /> Buat Rundown Hari Ini (W2)
              </button>
            )}
          </div>
        </div>

        {/* Legal Sign-off Metadata */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--divider)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--muted)' }}>Ditetapkan di: </span>
              <strong>Denpasar, 28 September 2026</strong>
            </div>
            <div style={{ width: 1, height: 16, backgroundColor: 'var(--divider)' }} />
            <div>
              <span style={{ color: 'var(--muted)' }}>Pejabat Pengesah: </span>
              <strong>Ir. I Gede Mustito, M.Si.</strong>{' '}
              <span style={{ color: 'var(--muted)' }}>(Kepala LPP TVRI Stasiun Bali)</span>
            </div>
            <div style={{ width: 1, height: 16, backgroundColor: 'var(--divider)' }} />
            <div>
              <span style={{ color: 'var(--muted)' }}>NIP: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>19680326 199402 1 001</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 700 }}>
            <CheckCircle2 size={15} />
            <span>27 Slot Waktu Penyiaran Terdaftar</span>
          </div>
        </div>

        {/* 2. Color Legend: 9 Kategori Resmi Sesuai Dokumen Fisik */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Keterangan Kategori Mata Acara (Sesuai Legenda Dokumen Resmi):
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                backgroundColor: categoryFilter === 'ALL' ? '#0F172A' : '#F1F5F9',
                color: categoryFilter === 'ALL' ? '#FFFFFF' : '#475569',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              SEMUA KATEGORI
            </button>
            {categoriesLegend.map((cat) => {
              const style = getCategoryBadgeStyle(cat.label);
              const isSelected = categoryFilter === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategoryFilter(isSelected ? 'ALL' : cat.label)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: style.backgroundColor,
                    color: style.color,
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: isSelected ? '0 0 0 2px #0F172A' : '0 1px 2px rgba(0,0,0,0.06)',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: categoryFilter === 'ALL' || isSelected ? 1 : 0.45,
                    transform: isSelected ? 'scale(1.04)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${cat.desc} — Klik untuk filter`}
                >
                  <span>{cat.label}</span>
                  {isSelected && <span style={{ fontSize: 10 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Controls: Mode View Toggle & Day Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Day Selector Tabs (for filtering / detailed focus) */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#FFFFFF', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--divider)' }}>
          {dayKeys.map((day) => (
            <button
              key={day.label}
              type="button"
              onClick={() => setSelectedDayTab(day.label)}
              style={{
                border: 'none',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: selectedDayTab === day.label ? 700 : 500,
                backgroundColor: selectedDayTab === day.label ? '#1E3FA8' : 'transparent',
                color: selectedDayTab === day.label ? '#FFFFFF' : 'var(--ink)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Toggle Grid vs Cards View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: 3, borderRadius: 6, border: '1px solid var(--divider)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: viewMode === 'grid' ? 700 : 500,
                backgroundColor: viewMode === 'grid' ? '#2440B8' : 'transparent',
                color: viewMode === 'grid' ? '#FFFFFF' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Matriks Grid Dokumen Asli
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: viewMode === 'cards' ? 700 : 500,
                backgroundColor: viewMode === 'cards' ? '#2440B8' : 'transparent',
                color: viewMode === 'cards' ? '#FFFFFF' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Jadwal Detail Harian ({selectedDayTab})
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT VIEW */}
      {viewMode === 'grid' ? (
        /* ================= MODE 1: MATRIKS GRID DOKUMEN RESMI ASLI ================= */
        <div
          className="panel-summary"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            border: '2px solid #0F172A',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table Header Band */}
          <div
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#38BDF8', textTransform: 'uppercase' }}>
                TABEL RESMI POLA ACARA PENYIARAN TVRI STASIUN BALI
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                Bulan: Oktober 2026 &mdash; Matriks Waktu Siaran 24 Jam Penuh
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
              Minggu Siar: <strong>I, II, III, IV</strong>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              className="pola-matrix-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11.5,
                textAlign: 'center',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #334155' }}>
                  <th
                    style={{
                      width: 130,
                      padding: '10px 8px',
                      borderRight: '2px solid #CBD5E1',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    WAKTU (WITA)
                  </th>
                  {dayKeys.map((day) => (
                    <th
                      key={day.label}
                      style={{
                        padding: '8px 6px',
                        borderRight: '1px solid #CBD5E1',
                        fontWeight: 800,
                        color: selectedDayTab === day.label ? '#1E3FA8' : 'var(--ink)',
                        backgroundColor: selectedDayTab === day.label ? '#EFF6FF' : 'transparent',
                        minWidth: 140,
                      }}
                    >
                      <div style={{ fontSize: 12 }}>{day.label.toUpperCase()}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 500, letterSpacing: 2 }}>
                        I | II | III | IV
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OFFICIAL_POLA_GRID_OCTOBER_2026.map((slot, sIdx) => (
                  <tr
                    key={slot.id}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: sIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    }}
                  >
                    {/* Waktu WITA */}
                    <td
                      style={{
                        padding: '6px 8px',
                        borderRight: '2px solid #CBD5E1',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        backgroundColor: '#F8FAFC',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div>
                        {slot.jamMulai.slice(0, 5)} - {slot.jamSelesai.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 500 }}>
                        ({slot.durasi})
                      </div>
                    </td>

                    {/* Hari-hari */}
                    {dayKeys.map((day) => {
                      const item = slot[day.key];
                      const style = getCategoryBadgeStyle(item.category);

                      return (
                        <td
                          key={day.key}
                          style={{
                            padding: '4px 6px',
                            borderRight: '1px solid #E2E8F0',
                            verticalAlign: 'middle',
                            backgroundColor: selectedDayTab === day.label ? '#F8FAFC' : 'transparent',
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: style.backgroundColor,
                              color: style.color,
                              padding: '6px 8px',
                              borderRadius: 4,
                              fontSize: 10.5,
                              fontWeight: 700,
                              lineHeight: 1.25,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                              minHeight: 32,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              wordBreak: 'break-word',
                            }}
                            title={`${item.title} (${item.category})`}
                          >
                            <span>{item.title}</span>
                            {item.notes && (
                              <span style={{ fontSize: 8.5, opacity: 0.9, marginTop: 2 }}>
                                *{item.notes}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Footnote from Image */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#FFFBEB',
              borderTop: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#92400E',
            }}
          >
            <Info size={16} />
            <span>
              <strong>Keterangan Khusus Dokumen:</strong> Drama klasik tayang di hari Minggu terakhir di setiap bulan. Jadwal dapat disesuaikan pada hari libur nasional atau siaran khusus peristiwa kenegaraan atas persetujuan Kepala Stasiun.
            </span>
          </div>
        </div>
      ) : (
        /* ================= MODE 2: TAMPILAN JADWAL DETAIL HARIAN & AKSI INTEGRASI ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Action Banner for Selected Day */}
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#1E3FA8',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--ink)' }}>
                  Jadwal Pola Acara Hari {selectedDayTab} (Oktober 2026)
                </strong>
                <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Gunakan seluruh deretan program hari {selectedDayTab} ini sebagai sumber pengisian otomatis ke dalam Rundown Harian Penyiaran (Wizard 2).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {onGoToRundownWithDay && (
                <>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => onGoToRundownWithDay(selectedDayTab, 'Pagi')}
                    style={{ height: 38, fontSize: 12.5, padding: '0 14px', gap: 6, backgroundColor: '#1E3FA8' }}
                  >
                    <Radio size={14} /> Buat Rundown Pagi ({selectedDayTab})
                  </button>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => onGoToRundownWithDay(selectedDayTab, 'Sore')}
                    style={{ height: 38, fontSize: 12.5, padding: '0 14px', gap: 6, backgroundColor: '#2440B8' }}
                  >
                    <Radio size={14} /> Buat Rundown Sore ({selectedDayTab})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cards Table for the selected day */}
          <div className="panel-summary" style={{ padding: 20 }}>
            <div style={{ overflowX: 'auto', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }}>
              <table className="kerabat-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th style={{ width: 140 }}>Waktu Siar</th>
                    <th style={{ width: 90 }}>Durasi</th>
                    <th>Nama Mata Acara</th>
                    <th style={{ width: 140 }}>Kategori Resmi</th>
                    <th style={{ width: 150 }}>Sifat Penyiaran</th>
                    <th style={{ width: 220, textAlign: 'center' }}>Integrasi Alur</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_POLA_GRID_OCTOBER_2026.filter((slot) => {
                    if (categoryFilter === 'ALL') return true;
                    const dayKey = selectedDayTab.toLowerCase() as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
                    return slot[dayKey].category === categoryFilter;
                  }).map((slot, idx) => {
                    const dayKey = selectedDayTab.toLowerCase() as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
                    const item = slot[dayKey];
                    const catStyle = getCategoryBadgeStyle(item.category);
                    const isRelay = item.category === 'RELAY JAKARTA';
                    const isLive = item.category === 'NEWS' && !item.title.includes('RERUN');
                    const isProduksiLocal = !isRelay && !item.title.includes('PUJA') && !item.title.includes('ID CALL');

                    return (
                      <tr key={slot.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>
                          {slot.jamMulai} &ndash; {slot.jamSelesai}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                          {slot.durasi}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9375rem' }}>
                            {item.title}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                              *{item.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: catStyle.backgroundColor,
                              color: catStyle.color,
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              display: 'inline-block',
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: isLive ? 'var(--success-container)' : isRelay ? '#FEF2F2' : '#F1F5F9',
                              color: isLive ? 'var(--on-success-container)' : isRelay ? '#991B1B' : 'var(--ink)',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 10,
                            }}
                          >
                            {isLive ? 'Live Studio' : isRelay ? 'Relay Nasional' : 'Playback / Rerun'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            {currentUserRole === 'admin_program' && isProduksiLocal && onGoToSprWithProgram ? (
                              <button
                                type="button"
                                className="button-secondary"
                                onClick={() => onGoToSprWithProgram(item.title, item.category, slot.durasi)}
                                style={{ height: 28, fontSize: 11, padding: '0 8px', gap: 4 }}
                                title="Buat dokumen permintaan kru (SPR) untuk acara ini"
                              >
                                <Film size={12} /> Ajukan SPR (W3)
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Acuan Siaran</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolaAcaraView;
