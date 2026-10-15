import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Edit3,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import type { DutySchedule, DutyJobGroup, UserRole, Employee } from '../types';
import { MASTER_EMPLOYEES } from '../data/mockData';
import { OFFICIAL_JOB_CODES } from '../utils/conflictDetector';

interface JadwalDinasMonthlyDocumentViewProps {
  currentUserRole: UserRole;
  dutySchedule: DutySchedule;
  onOpenWizard: (group?: DutyJobGroup) => void;
  onClose?: () => void;
  initialMonth?: string;
}

// 11 Profession Groups strictly from TVRI Bali Official Monthly Schedule Document
export const OFFICIAL_MONTHLY_JOB_GROUPS: { id: DutyJobGroup; label: string; codeShort: string }[] = [
  { id: 'Teknisi Siaran', label: 'TEKNISI SIARAN', codeShort: 'TDM/TDP' },
  { id: 'Opr. Peralatan Teknik Studio', label: 'OPR. PERALATAN TEKNIK STUDIO', codeShort: 'OB/MC' },
  { id: 'Kamerawan', label: 'KAMERAWAN', codeShort: 'CAM' },
  { id: 'Penata Suara', label: 'PENATA SUARA', codeShort: 'AU' },
  { id: 'Penata Cahaya', label: 'PENATA CAHAYA', codeShort: 'LT' },
  { id: 'Pemadu Gambar', label: 'PEMADU GAMBAR (SWITCHER)', codeShort: 'SW' },
  { id: 'VTR/Editor', label: 'VTR/EDITOR', codeShort: 'VTR/EDP' },
  { id: 'Teknisi IT', label: 'TEKNISI IT', codeShort: 'IT' },
  { id: 'Chargen', label: 'CHARGEN', codeShort: 'CG' },
  { id: 'AC/Listrik', label: 'AC / LISTRIK', codeShort: 'D1/D2' },
  { id: 'Maintenance', label: 'MAINTENANCE', codeShort: 'MT/U' },
];

// Indonesian Day abbreviations as used in the TVRI Bali document header (SL, RB, KM, JM, SB, MG, SN)
const DAY_ABBR: Record<number, string> = {
  0: 'MG', // Minggu
  1: 'SN', // Senin
  2: 'SL', // Selasa
  3: 'RB', // Rabu
  4: 'KM', // Kamis
  5: 'JM', // Jumat
  6: 'SB', // Sabtu
};

export const JadwalDinasMonthlyDocumentView: React.FC<JadwalDinasMonthlyDocumentViewProps> = ({
  currentUserRole,
  dutySchedule,
  onOpenWizard,
  initialMonth = '2026-10',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dutySchedule.month || initialMonth
  );
  const [activeGroup, setActiveGroup] = useState<DutyJobGroup>('Teknisi Siaran');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printGroupFilter, setPrintGroupFilter] = useState<'active' | 'all'>('active');

  // Parse Year and Month
  const { year, month, monthNameFull, totalDays } = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const parsedY = parseInt(y, 10) || 2026;
    const parsedM = parseInt(m, 10) || 10;
    const dateObj = new Date(parsedY, parsedM - 1, 1);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
    const daysInMonth = new Date(parsedY, parsedM, 0).getDate();
    return {
      year: parsedY,
      month: parsedM,
      monthNameFull: monthName,
      totalDays: daysInMonth,
    };
  }, [selectedMonth]);

  // Days array for the month
  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(year, month - 1, dayNum);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu
      const dayAbbr = DAY_ABBR[dayOfWeek];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateStr = `${selectedMonth}-${dayNum.toString().padStart(2, '0')}`;
      return {
        dayNum,
        dayAbbr,
        isWeekend,
        dateStr,
      };
    });
  }, [selectedMonth, year, month, totalDays]);

  // Map employees to profession groups
  const getEmployeesForGroup = (group: DutyJobGroup): Employee[] => {
    return MASTER_EMPLOYEES.filter((emp) => {
      if (emp.division !== 'Teknik') return false;
      // Match qualified job codes to group
      return emp.jobCodes.some((c) => {
        const meta = OFFICIAL_JOB_CODES[c];
        return meta && meta.group === group;
      });
    });
  };

  const currentGroupEmployees = useMemo(() => {
    const matched = getEmployeesForGroup(activeGroup);
    // If empty for this mock, provide fallback list of technical employees so document never looks blank
    if (matched.length === 0) {
      return MASTER_EMPLOYEES.filter((e) => e.division === 'Teknik').slice(0, 6);
    }
    return matched;
  }, [activeGroup]);

  // Helper to resolve cell code for a given employee and date
  const getCellDisplay = (empId: string, dateStr: string) => {
    const cell = dutySchedule.assignments?.[empId]?.[dateStr];
    if (!cell) {
      return { code: '-', isSpecial: false, isWarning: false, isLeave: false };
    }
    if (cell.availability) {
      return {
        code: cell.availability,
        isSpecial: false,
        isWarning: false,
        isLeave: true,
      };
    }
    const primary = cell.primaryCode || '-';
    const secondary = cell.secondaryCode ? `/${cell.secondaryCode}` : '';
    const fullCode = cell.secondaryCode && !primary.includes('/') ? `${primary}${secondary}` : primary;

    const isLeave = ['L', 'CT', 'DL', 'U'].includes(fullCode);
    return {
      code: fullCode,
      isSpecial: ['TDM', 'TDP', 'CAM1', 'CAM2', 'SW1', 'SW2'].includes(primary),
      isWarning: !!cell.hasWarning,
      isLeave,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Control Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
            }}
          >
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  letterSpacing: '0.05em',
                }}
              >
                Dokumen Resmi Terbit (Format Matriks Bulanan)
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>&bull;</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                Status: <strong>{dutySchedule.status === 'terbit' ? 'Terbit (Aktif)' : 'Draf Penyusunan'}</strong>
              </span>
            </div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#0F172A',
                margin: '2px 0 0 0',
                letterSpacing: '-0.01em',
              }}
            >
              Jadwal Dinas Operasional Teknik Produksi & Penyiaran
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            <Calendar size={15} color="#475569" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: 13,
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

          {/* Cetak Bulanan Button */}
          <button
            type="button"
            className="button-secondary"
            onClick={() => setShowPrintModal(true)}
            style={{
              height: 38,
              fontSize: 13,
              fontWeight: 600,
              gap: 6,
              padding: '0 14px',
            }}
          >
            <Printer size={15} />
            Cetak Dokumen Bulanan
          </button>

          {/* Edit Button with Active Group */}
          {currentUserRole === 'admin_teknik' && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onOpenWizard(activeGroup)}
              style={{
                height: 38,
                fontSize: 13,
                fontWeight: 700,
                gap: 6,
                padding: '0 16px',
                backgroundColor: '#2440B8',
                boxShadow: '0 2px 4px rgba(36, 64, 184, 0.25)',
              }}
            >
              <Edit3 size={15} />
              Edit Jadwal Dinas (Buka Wizard)
            </button>
          )}
        </div>
      </div>

      {/* 11 Profession Group Tabs (Navigation matching PDF pages) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '2px solid #E2E8F0',
        }}
      >
        {OFFICIAL_MONTHLY_JOB_GROUPS.map((grp) => {
          const isActive = activeGroup === grp.id;
          return (
            <button
              key={grp.id}
              type="button"
              onClick={() => setActiveGroup(grp.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '8px 14px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid #2440B8' : '3px solid transparent',
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#1D4ED8' : '#64748B',
                fontWeight: isActive ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{grp.label}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 4,
                  backgroundColor: isActive ? '#DBEAFE' : '#F1F5F9',
                  color: isActive ? '#1E40AF' : '#94A3B8',
                }}
              >
                {grp.codeShort}
              </span>
            </button>
          );
        })}
      </div>

      {/* Authentic TVRI Document Sheet Container */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Document Header (Identical to Official TVRI Bali Document) */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '2px solid #0F172A',
            textAlign: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#0F172A',
              textTransform: 'uppercase',
            }}
          >
            JADWAL DINAS OPERASIONAL TEKNIK PRODUKSI &amp; PENYIARAN
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              marginTop: 4,
            }}
          >
            BULAN : {monthNameFull} {year}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 14px',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            DIVISI: {activeGroup.toUpperCase()}
          </div>
        </div>

        {/* Scrollable Month Matrix Grid */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            <thead>
              {/* Row 1: Header TGL */}
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #94A3B8' }}>
                <th
                  rowSpan={2}
                  style={{
                    width: 38,
                    borderRight: '1px solid #CBD5E1',
                    borderBottom: '2px solid #0F172A',
                    padding: '6px 4px',
                    fontWeight: 800,
                    color: '#0F172A',
                  }}
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  style={{
                    minWidth: 170,
                    maxWidth: 220,
                    textAlign: 'left',
                    padding: '6px 12px',
                    borderRight: '2px solid #0F172A',
                    borderBottom: '2px solid #0F172A',
                    fontWeight: 800,
                    color: '#0F172A',
                  }}
                >
                  NAMA
                </th>
                <th
                  style={{
                    width: 44,
                    borderRight: '1px solid #CBD5E1',
                    padding: '4px 2px',
                    fontWeight: 800,
                    backgroundColor: '#E2E8F0',
                  }}
                >
                  TGL
                </th>
                {daysArray.map((d) => (
                  <th
                    key={`tgl-${d.dayNum}`}
                    style={{
                      width: 32,
                      minWidth: 32,
                      padding: '4px 0',
                      borderRight: '1px solid #CBD5E1',
                      fontWeight: 800,
                      color: d.isWeekend ? '#DC2626' : '#0F172A',
                      backgroundColor: d.isWeekend ? '#FEE2E2' : '#F1F5F9',
                    }}
                  >
                    {d.dayNum}
                  </th>
                ))}
              </tr>

              {/* Row 2: Header HARI */}
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #0F172A' }}>
                <th
                  style={{
                    borderRight: '1px solid #CBD5E1',
                    padding: '4px 2px',
                    fontWeight: 800,
                    fontSize: 10,
                    backgroundColor: '#E2E8F0',
                  }}
                >
                  HARI
                </th>
                {daysArray.map((d) => (
                  <th
                    key={`hari-${d.dayNum}`}
                    style={{
                      padding: '4px 0',
                      borderRight: '1px solid #CBD5E1',
                      fontWeight: 800,
                      fontSize: 10,
                      color: d.isWeekend ? '#B91C1C' : '#334155',
                      backgroundColor: d.isWeekend ? '#FEE2E2' : '#F8FAFC',
                    }}
                  >
                    {d.dayAbbr}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {currentGroupEmployees.map((emp, idx) => {
                const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                return (
                  <tr
                    key={emp.id}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <td
                      style={{
                        padding: '6px 4px',
                        borderRight: '1px solid #CBD5E1',
                        fontWeight: 700,
                        color: '#64748B',
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderRight: '2px solid #0F172A',
                        fontWeight: 700,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div>{emp.name.toUpperCase()}</div>
                      {emp.nip && (
                        <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 500 }}>
                          NIP. {emp.nip}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        borderRight: '1px solid #CBD5E1',
                        backgroundColor: '#F1F5F9',
                      }}
                    />
                    {daysArray.map((d) => {
                      const { code, isSpecial, isLeave } = getCellDisplay(emp.id, d.dateStr);

                      // Authentic cell coloring matching real TVRI sheets
                      let cellBg = d.isWeekend ? '#FFF1F2' : 'transparent';
                      let textColor = '#0F172A';

                      if (code === 'L') {
                        textColor = '#DC2626'; // Libur red
                        cellBg = '#FEF2F2';
                      } else if (code === 'CT') {
                        textColor = '#D97706'; // Cuti amber
                        cellBg = '#FEF3C7';
                      } else if (code === 'DL') {
                        textColor = '#2563EB'; // Dinas Luar blue
                        cellBg = '#EFF6FF';
                      } else if (code === 'U') {
                        textColor = '#475569';
                      } else if (isSpecial) {
                        textColor = '#1D4ED8';
                      }

                      return (
                        <td
                          key={d.dateStr}
                          title={`${emp.name} (${d.dayNum} ${monthNameFull}): ${code}`}
                          style={{
                            padding: '6px 0',
                            borderRight: '1px solid #CBD5E1',
                            fontFamily: 'monospace',
                            fontWeight: isLeave ? 800 : 700,
                            fontSize: 10.5,
                            backgroundColor: cellBg,
                            color: textColor,
                            cursor: 'default',
                          }}
                        >
                          {code}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notice Note Bar (Exact wording from document) */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#FEF08A',
            borderTop: '2px solid #CA8A04',
            borderBottom: '1px solid #E2E8F0',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: '#854D0E',
            letterSpacing: '0.02em',
          }}
        >
          &quot;JADWAL DAPAT BERUBAH SESUAI KEBUTUHAN DINAS, DI SHARE DI WA GROUP DAN DITEMPEL DI PAPAN PENGUMUMAN.
          KALAU ADA PERUBAHAN DINAS KOORDINASIKAN DENGAN KETUA TIM PRODUKSI DAN PENYIARAN&quot;
        </div>

        {/* Legend of Codes (Keterangan Singkatan) */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            fontSize: 10.5,
            color: '#334155',
          }}
        >
          <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 8, fontSize: 11 }}>
            KETERANGAN SINGKATAN TUGAS DINAS:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '6px 16px',
            }}
          >
            <div><strong>TDP:</strong> TECHNIKAL DIRECTOR SIARAN PAGI</div>
            <div><strong>TDM:</strong> TECHNIKAL DIRECTOR SIARAN SORE</div>
            <div><strong>CCU:</strong> CAMERA CONTROL UNIT / VIDEO ENGINER</div>
            <div><strong>MC:</strong> MASTER CONTROL</div>
            <div><strong>EDP:</strong> EDITOR SIARAN PAGI / REKAMAN PAGI</div>
            <div><strong>VTR:</strong> EDITOR SIARAN SORE</div>
            <div><strong>AU:</strong> AUDIO (AU1=PAGI, AU2=SORE)</div>
            <div><strong>CAM:</strong> KAMERAWAN (CAM1, CAM2, CAM3)</div>
            <div><strong>OB:</strong> PELAYANAN PERALATAN TEKNIK STUDIO</div>
            <div><strong>CG:</strong> CHARGEN (PENATA AKSARA)</div>
            <div><strong>SW:</strong> SWITCHER (SW1=PAGI, SW2=SORE)</div>
            <div><strong>IT:</strong> TEKNISI IT / TRANSMISI</div>
            <div><strong>D1:</strong> LISTRIK SIARAN PAGI</div>
            <div><strong>D2:</strong> LISTRIK SIARAN SORE</div>
            <div><strong>DL:</strong> DINAS LUAR KOTA / EVENT</div>
            <div><strong>LT:</strong> LIGHTING (TATA CAHAYA)</div>
            <div><strong>MT:</strong> MAINTENANCE FASILITAS</div>
            <div><strong>U:</strong> UMUM / ADMINISTRASI HARIAN</div>
            <div><strong>L:</strong> LIBUR / LEPAS PIKET</div>
            <div><strong>CT:</strong> CUTI TAHUNAN / RESMI</div>
            <div><strong>ADM:</strong> ADMINISTRASI TEKNIK</div>
          </div>
        </div>

        {/* Official Dual Signatures (Exact Match from PDF) */}
        <div
          style={{
            padding: '24px 32px 30px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Left Signature */}
          <div style={{ textAlign: 'center', minWidth: 260 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>Mengetahui,</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              Ketua Tim Perencanaan, Pengendalian dan Pengembangan Teknik
            </div>
            <div style={{ height: 60 }} />
            <div style={{ fontSize: 12, fontWeight: 800, textDecoration: 'underline', color: '#0F172A' }}>
              I Wayan Wigena Adi Kurniawan, ST
            </div>
            <div style={{ fontSize: 10.5, color: '#475569' }}>NIP. 198310272011011006</div>
          </div>

          {/* Right Signature */}
          <div style={{ textAlign: 'center', minWidth: 260 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>
              Denpasar, {totalDays} {monthNameFull.charAt(0) + monthNameFull.slice(1).toLowerCase()} {year}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              Ketua Tim Teknik Produksi Dan Penyiaran
            </div>
            <div style={{ height: 60 }} />
            <div style={{ fontSize: 12, fontWeight: 800, textDecoration: 'underline', color: '#0F172A' }}>
              I Made Ade Dwiana Putra, S.Sn
            </div>
            <div style={{ fontSize: 10.5, color: '#475569' }}>NIP. 198610302011011007</div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal (A4 Landscape Layout) */}
      {showPrintModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              width: '95vw',
              maxWidth: 1180,
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Modal Controls */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Printer size={20} color="#2440B8" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                    Pratinjau Cetak Jadwal Dinas Bulanan (Format A4 Landscape)
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Sesuai format resmi stempel &amp; tanda tangan TVRI Stasiun Bali
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPrintGroupFilter('active')}
                    className={printGroupFilter === 'active' ? 'button-primary' : 'button-secondary'}
                    style={{ height: 32, fontSize: 11.5, padding: '0 10px' }}
                  >
                    Hanya {activeGroup}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintGroupFilter('all')}
                    className={printGroupFilter === 'all' ? 'button-primary' : 'button-secondary'}
                    style={{ height: 32, fontSize: 11.5, padding: '0 10px' }}
                  >
                    Semua 11 Profesi (Lengkap)
                  </button>
                </div>

                <button
                  type="button"
                  className="button-primary"
                  onClick={() => window.print()}
                  style={{ height: 34, fontSize: 12.5, padding: '0 16px', gap: 6 }}
                >
                  <Printer size={15} /> Cetak Sekarang
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowPrintModal(false)}
                  style={{ height: 34, fontSize: 12.5, padding: '0 14px' }}
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div className="printable-monthly-sheet" style={{ border: '1px solid #94A3B8', padding: 16 }}>
              {/* Official TVRI Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                  LEMBAGA PENYIARAN PUBLIK TELEVISI REPUBLIK INDONESIA STASIUN BALI
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>
                  JADWAL DINAS OPERASIONAL TEKNIK PRODUKSI &amp; PENYIARAN
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  BULAN : {monthNameFull} {year}
                </div>
              </div>

              {/* Render either active group or all 11 groups */}
              {(printGroupFilter === 'all'
                ? OFFICIAL_MONTHLY_JOB_GROUPS
                : OFFICIAL_MONTHLY_JOB_GROUPS.filter((g) => g.id === activeGroup)
              ).map((grp) => {
                const emps = getEmployeesForGroup(grp.id);
                const displayEmps = emps.length > 0 ? emps : MASTER_EMPLOYEES.filter((e) => e.division === 'Teknik').slice(0, 4);

                return (
                  <div key={grp.id} style={{ marginBottom: 22, pageBreakInside: 'avoid' }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 900,
                        backgroundColor: '#E2E8F0',
                        padding: '4px 8px',
                        border: '1px solid #94A3B8',
                        borderBottom: 'none',
                        textTransform: 'uppercase',
                        color: '#0F172A',
                      }}
                    >
                      {grp.label}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5, textAlign: 'center' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9' }}>
                          <th rowSpan={2} style={{ width: 28, border: '1px solid #94A3B8' }}>NO</th>
                          <th rowSpan={2} style={{ width: 140, textAlign: 'left', padding: '2px 6px', border: '1px solid #94A3B8' }}>NAMA</th>
                          <th style={{ width: 34, border: '1px solid #94A3B8' }}>TGL</th>
                          {daysArray.map((d) => (
                            <th
                              key={`p-tgl-${d.dayNum}`}
                              style={{
                                width: 24,
                                border: '1px solid #94A3B8',
                                color: d.isWeekend ? '#DC2626' : '#000',
                                backgroundColor: d.isWeekend ? '#FEE2E2' : '#F1F5F9',
                              }}
                            >
                              {d.dayNum}
                            </th>
                          ))}
                        </tr>
                        <tr style={{ backgroundColor: '#F8FAFC' }}>
                          <th style={{ border: '1px solid #94A3B8' }}>HARI</th>
                          {daysArray.map((d) => (
                            <th
                              key={`p-hari-${d.dayNum}`}
                              style={{
                                border: '1px solid #94A3B8',
                                fontSize: 8.5,
                                color: d.isWeekend ? '#DC2626' : '#000',
                                backgroundColor: d.isWeekend ? '#FEE2E2' : '#F8FAFC',
                              }}
                            >
                              {d.dayAbbr}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayEmps.map((emp, i) => (
                          <tr key={emp.id}>
                            <td style={{ border: '1px solid #94A3B8', padding: '3px 0' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #94A3B8', textAlign: 'left', padding: '3px 6px', fontWeight: 700 }}>
                              {emp.name.toUpperCase()}
                            </td>
                            <td style={{ border: '1px solid #94A3B8', backgroundColor: '#F1F5F9' }} />
                            {daysArray.map((d) => {
                              const { code } = getCellDisplay(emp.id, d.dateStr);
                              return (
                                <td
                                  key={`p-c-${d.dateStr}`}
                                  style={{
                                    border: '1px solid #94A3B8',
                                    padding: '2px 0',
                                    fontFamily: 'monospace',
                                    fontWeight: code === 'L' ? 800 : 600,
                                    color: code === 'L' ? '#DC2626' : '#000',
                                    backgroundColor: d.isWeekend ? '#FFF1F2' : 'transparent',
                                  }}
                                >
                                  {code}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Print Footer Note */}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '6px',
                  backgroundColor: '#FEF9C3',
                  border: '1px solid #EAB308',
                  marginBottom: 16,
                }}
              >
                &quot;JADWAL DAPAT BERUBAH SESUAI KEBUTUHAN DINAS, DI SHARE DI WA GROUP DAN DITEMPEL DI PAPAN PENGUMUMAN.
                KALAU ADA PERUBAHAN DINAS KOORDINASIKAN DENGAN KETUA TIM PRODUKSI DAN PENYIARAN&quot;
              </div>

              {/* Dual Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 30px' }}>
                <div style={{ textAlign: 'center', fontSize: 10 }}>
                  <div>Mengetahui,</div>
                  <div style={{ fontWeight: 700 }}>Ketua Tim Perencanaan, Pengendalian dan Pengembangan Teknik</div>
                  <div style={{ height: 44 }} />
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>I Wayan Wigena Adi Kurniawan, ST</div>
                  <div>NIP. 198310272011011006</div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 10 }}>
                  <div>Denpasar, {totalDays} {monthNameFull.charAt(0) + monthNameFull.slice(1).toLowerCase()} {year}</div>
                  <div style={{ fontWeight: 700 }}>Ketua Tim Teknik Produksi Dan Penyiaran</div>
                  <div style={{ height: 44 }} />
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>I Made Ade Dwiana Putra, S.Sn</div>
                  <div>NIP. 198610302011011007</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
