import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck,
} from 'lucide-react';
import type { SPRDocument } from '../types';
import { MASTER_EMPLOYEES } from '../data/mockData';

interface SPRPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  spr: SPRDocument;
}

function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatIndonesianFullDateWithTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : '';
    const dateFormatted = !isNaN(d.getTime()) ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` : dateStr;
    const timeClean = timeStr ? `Pkl ${timeStr.slice(0, 5)} wita` : '';
    return `${dayName ? `${dayName}, ` : ''}${dateFormatted} ${timeClean}`.trim();
  } catch {
    return `${dateStr} ${timeStr || ''}`.trim();
  }
}

export const SPRPrintModal: React.FC<SPRPrintModalProps> = ({ isOpen, onClose, spr }) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // 22 Standard TVRI Bali Professions split into 2 columns for the official SPR table
  const col1Professions = [
    { label: 'Pemasaran', key: 'Pemasaran' },
    { label: 'T.D', key: 'T.D' },
    { label: 'Maintenance', key: 'Maintenance' },
    { label: 'CCU/VE', key: 'CCU/VE' },
    { label: 'M C', key: 'MC' },
    { label: 'Listrik Op', key: 'Listrik Op' },
    { label: 'IT', key: 'IT' },
    { label: 'Op. Jib Crane', key: 'Op. Jib Crane' },
    { label: 'Peralatan', key: 'Peralatan' },
    { label: 'Kamramen', key: 'Kamerawan' },
    { label: 'SNG', key: 'SNG' },
  ];

  const col2Professions = [
    { label: 'Penata Suara', key: 'Penata Suara' },
    { label: 'Penata Cahaya', key: 'Penata Cahaya' },
    { label: 'Swicher', key: 'Switcher' },
    { label: 'VTR/Editor', key: 'VTR/Editor' },
    { label: 'Chargen', key: 'Chargen' },
    { label: 'LED', key: 'Op. LED' },
    { label: 'UM', key: 'UM' },
    { label: 'P.Rias', key: 'Penata Rias' },
    { label: 'P.Artistik', key: 'Penata Artistik' },
    { label: 'Dekor', key: 'Dekor' },
    { label: 'Pengemudi', key: 'Pengemudi' },
  ];

  const getNeedCount = (key: string) => {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const item = spr.kebutuhanCrewList.find((n) => {
      const cleanP = n.profesi.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanP === cleanKey) return true;
      if ((cleanKey.includes('kamera') || cleanKey.includes('kamramen')) && (cleanP.includes('kamera') || cleanP.includes('kamramen') || cleanP.includes('cam'))) return true;
      if (cleanKey.includes('td') && (cleanP.includes('td') || cleanP.includes('pengarah') || cleanP.includes('teknik') || cleanP.includes('technical'))) return true;
      if ((cleanKey.includes('switch') || cleanKey.includes('swicher')) && (cleanP.includes('switch') || cleanP.includes('pemadu') || cleanP.includes('gambar'))) return true;
      if (cleanKey.includes('suara') && (cleanP.includes('suara') || cleanP.includes('audio') || cleanP.includes('sound'))) return true;
      if (cleanKey.includes('cahaya') && (cleanP.includes('cahaya') || cleanP.includes('lighting') || cleanP.includes('lampu'))) return true;
      if (cleanKey.includes('led') && cleanP.includes('led')) return true;
      if (cleanKey.includes('rias') && cleanP.includes('rias')) return true;
      if (cleanKey.includes('artistik') && cleanP.includes('artistik')) return true;
      if (cleanKey.includes('mc') && cleanP.includes('mc')) return true;
      if (cleanKey.includes('vtr') && (cleanP.includes('vtr') || cleanP.includes('editor'))) return true;
      if (cleanKey.includes('chargen') && (cleanP.includes('chargen') || cleanP.includes('cg'))) return true;
      if (cleanKey.includes('listrik') && (cleanP.includes('listrik') || cleanP.includes('genset') || cleanP.includes('power'))) return true;
      if (cleanKey.includes('ccu') && (cleanP.includes('ccu') || cleanP.includes('ve'))) return true;
      if (cleanKey.includes('dekor') && (cleanP.includes('dekor') || cleanP.includes('properti') || cleanP.includes('property'))) return true;
      if (cleanKey.includes('pengemudi') && (cleanP.includes('pengemudi') || cleanP.includes('driver') || cleanP.includes('sopir'))) return true;
      if (cleanKey.includes('jib') && (cleanP.includes('jib') || cleanP.includes('crane'))) return true;
      if (cleanKey.includes('um') && (cleanP === 'um' || cleanP.includes('unitmanager'))) return true;
      return false;
    });
    return item && item.jumlah > 0 ? item.jumlah.toString() : '';
  };

  // Find main production/recording shoot (excluding pasca produksi)
  const mainProduction =
    spr.kegiatanList.find((k) => {
      const j = k.jenis.toLowerCase();
      return (j === 'produksi' || j.includes('rekam') || j.includes('siaran') || j === 'on air') && !j.includes('pasca');
    }) ||
    spr.kegiatanList.find((k) => {
      const j = k.jenis.toLowerCase();
      return j.includes('produksi') && !j.includes('pasca');
    }) ||
    spr.kegiatanList[0];

  // 6 standard activity phases on physical TVRI Bali sheet
  const stages = [
    { no: 1, label: 'Survey', matchKeys: ['survey', 'survei', 'peninjauan'] },
    { no: 2, label: 'Production Meeting', matchKeys: ['production meeting', 'meeting', 'rapat'] },
    { no: 3, label: 'Hunting', matchKeys: ['hunting'] },
    { no: 4, label: 'Setting', matchKeys: ['setting', 'persiapan alat', 'persiapan'] },
    { no: 5, label: 'Pasca Produksi', matchKeys: ['pasca', 'editing', 'mastering', 'vtr'] },
    { no: 6, label: 'On Air', matchKeys: ['on air', 'onair', 'tayang', 'siaran langsung'] },
  ];

  const getStageItem = (matchKeys: string[]) => {
    return spr.kegiatanList.find((k) => {
      const j = k.jenis.toLowerCase();
      return matchKeys.some((mk) => j.includes(mk));
    });
  };

  // Activities entered by user that do not map to the preprinted 6 stages
  const unmappedActivities = spr.kegiatanList.filter((k) => {
    if (k.id === mainProduction?.id) return false;
    const matched = stages.some((st) => st.matchKeys.some((mk) => k.jenis.toLowerCase().includes(mk)));
    return !matched;
  });

  // Clean Keterangan to avoid awkward duplication like "Dialog Dialog Budaya Bali"
  const getKeterangan = () => {
    const pName = (spr.programName || '').trim();
    const fName = (spr.formatAcara || '').trim();
    const jTitle = (spr.judul || '').trim();

    if (fName && pName.toLowerCase().startsWith(fName.toLowerCase())) {
      return jTitle && jTitle !== pName ? `${pName} (${jTitle})` : pName;
    }
    if (fName && pName) {
      return `${fName} ${pName}${jTitle && jTitle !== pName ? ` (${jTitle})` : ''}`;
    }
    return jTitle || pName || '-';
  };

  // Resolve producer NIP from master employees
  const producerEmployee = MASTER_EMPLOYEES.find(
    (e) => e.name.toLowerCase() === (spr.produser || '').toLowerCase()
  );
  const producerNip =
    producerEmployee?.nip ||
    (spr.produser === 'Eryawan Srimartono' ? '196904162014091001' : '-');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 27, 45, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 140,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 920,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar */}
        <div
          className="no-print"
          style={{
            padding: '14px 24px',
            backgroundColor: '#1E3FA8',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCheck size={20} />
            <div>
              <strong style={{ fontSize: '0.9375rem' }}>
                Pratinjau Lembar Fisik SPR (Surat Permintaan Kerabat Kerja dan Peralatan)
              </strong>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                LPP TVRI Stasiun Bali &bull; Format Baku Fisik Arsip Tata Usaha
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                height: 34,
                backgroundColor: '#FFFFFF',
                color: '#1E3FA8',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                padding: '0 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Printer size={15} /> Cetak Lembar A4
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Tutup dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Paper Viewport: Desk Background with Clear Contrast */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            backgroundColor: '#CBD5E1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <div
            ref={printSheetRef}
            className="tvri-official-sheet"
            style={{
              width: '100%',
              maxWidth: 780,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              padding: '32px 36px',
              marginBottom: '28px',
              height: 'auto',
              minHeight: 'fit-content',
              fontFamily: 'Arial, Calibri, sans-serif',
              color: '#000000',
              fontSize: 10.5,
              lineHeight: 1.35,
              boxSizing: 'border-box',
              border: '1px solid #94A3B8',
            }}
          >
            {/* Kop & Document Title */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                <img
                  src="/tvri-logo.png"
                  alt="Logo TVRI"
                  style={{
                    height: 28,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              <h2
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  margin: '0 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                SURAT PERMINTAAN KERABAT KERJA
              </h2>
              <h2
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                DAN PERALATAN OPERASIONAL PRODUKSI
              </h2>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: 12, fontSize: 10.5 }}>
              <div>Kepada Yth:</div>
              <div style={{ fontWeight: 700 }}>Kepala Sub. Bagian Tata Usaha</div>
              <div>di -</div>
              <div style={{ textIndent: 20 }}>Denpasar</div>
            </div>

            {/* Introductory Statement */}
            <div style={{ marginBottom: 10, fontSize: 10.5 }}>
              <div>Dengan hormat,</div>
              <div>Berdasarkan surat permohonan kerjasama acara :</div>
            </div>

            {/* Program Metadata 2-Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                marginBottom: 10,
                fontSize: 10.5,
              }}
            >
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 85, verticalAlign: 'top', padding: '1px 0' }}>Nomor</td>
                      <td style={{ width: 10, verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>{spr.nomorSurat || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>Klien</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>-</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>Mata Acara</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', fontWeight: 700, padding: '1px 0' }}>{spr.programName}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>Judul</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>{spr.judul}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 65, verticalAlign: 'top', padding: '1px 0' }}>Tanggal</td>
                      <td style={{ width: 10, verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>
                        {formatIndonesianDate(mainProduction?.tanggal)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>Durasi</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>{spr.durasi}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>Format</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '1px 0' }}>{spr.formatAcara}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guest / Pengisi Acara */}
            <div style={{ marginBottom: 10, fontSize: 10.5 }}>
              <span style={{ display: 'inline-block', width: 85 }}>Pengisi Acara</span>
              <span style={{ display: 'inline-block', width: 10 }}>:</span>
              <span>{spr.pengisiAcara || '-'}</span>
            </div>

            <div style={{ marginBottom: 6, fontSize: 10.5 }}>untuk melaksanakan :</div>

            {/* MAIN ACTIVITY & CREW DEMAND TABLE (Exact match to TVRI Bali sheet) */}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 10,
                fontSize: 9.5,
                backgroundColor: '#FFFFFF',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th rowSpan={2} style={{ width: '4%', borderRight: '1px solid #000000', padding: '4px 2px' }}>#</th>
                  <th rowSpan={2} style={{ width: '20%', borderRight: '1px solid #000000', padding: 4 }}>KEGIATAN</th>
                  <th rowSpan={2} style={{ width: '22%', borderRight: '1px solid #000000', padding: 4 }}>HARI/TANGGAL</th>
                  <th rowSpan={2} style={{ width: '20%', borderRight: '1px solid #000000', padding: 4 }}>TEMPAT</th>
                  <th colSpan={4} style={{ width: '34%', borderBottom: '1px solid #000000', padding: 4 }}>
                    KERABAT KERJA
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1.5px solid #000000', fontSize: 9 }}>
                  <th style={{ width: '13%', borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Profesi</th>
                  <th style={{ width: '4%', borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Jml.</th>
                  <th style={{ width: '13%', borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Profesi</th>
                  <th style={{ width: '4%', padding: 2, textAlign: 'center' }}>Jml.</th>
                </tr>
              </thead>
              <tbody>
                {col1Professions.map((col1, idx) => {
                  const col2 = col2Professions[idx];
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #000000',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {/* Left Side Columns Spanned on First Row */}
                      {idx === 0 && (
                        <>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 700,
                              backgroundColor: '#FFFFFF',
                              padding: '4px 2px',
                            }}
                          >
                            X
                          </td>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: 6,
                              fontWeight: 600,
                              backgroundColor: '#FFFFFF',
                              lineHeight: 1.3,
                            }}
                          >
                            {spr.jenisKegiatan || 'Produksi'} {spr.programName}
                          </td>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: 6,
                              backgroundColor: '#FFFFFF',
                              lineHeight: 1.3,
                            }}
                          >
                            {mainProduction
                              ? formatIndonesianFullDateWithTime(mainProduction.tanggal, mainProduction.jamMulai)
                              : '-'}
                          </td>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: 6,
                              backgroundColor: '#FFFFFF',
                              lineHeight: 1.3,
                            }}
                          >
                            {mainProduction?.lokasi || 'Studio TVRI Bali'}
                          </td>
                        </>
                      )}

                      {/* Right Side: Crew Demands Columns */}
                      <td style={{ borderRight: '1px solid #000000', padding: '2px 4px', whiteSpace: 'nowrap', backgroundColor: '#FFFFFF' }}>
                        {col1.label}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 700, backgroundColor: '#FFFFFF' }}>
                        {getNeedCount(col1.key)}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '2px 4px', whiteSpace: 'nowrap', backgroundColor: '#FFFFFF' }}>
                        {col2.label}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, backgroundColor: '#FFFFFF' }}>
                        {getNeedCount(col2.key)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* EQUIPMENT SYSTEM SELECTOR BAR (Exact match to TVRI Bali sheet) */}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 10,
                fontSize: 9.5,
                backgroundColor: '#FFFFFF',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: '18%', borderRight: '1px solid #000000', padding: '4px 6px', fontWeight: 700 }}>
                    Sistem Peralatan :
                  </td>
                  <td style={{ width: '23%', borderRight: '1px solid #000000', padding: '4px 6px' }}>
                    <strong>[{spr.sistemPeralatan?.sistem === 'Studio' ? 'X' : ' '}]</strong>{' '}
                    {spr.sistemPeralatan?.jumlahKamera || 3} Cam (Studio)
                  </td>
                  <td style={{ width: '18%', borderRight: '1px solid #000000', padding: '4px 6px' }}>
                    <strong>[{spr.sistemPeralatan?.sistem === 'ENG' ? 'X' : ' '}]</strong> ENG (1 Cam)
                  </td>
                  <td style={{ width: '18%', borderRight: '1px solid #000000', padding: '4px 6px' }}>
                    <strong>[{spr.sistemPeralatan?.sistem === 'EFP' ? 'X' : ' '}]</strong> EFP (2 Cam)
                  </td>
                  <td style={{ width: '23%', padding: '4px 6px' }}>
                    <strong>[{spr.sistemPeralatan?.sistem === 'OB Van' ? 'X' : ' '}]</strong> OB Van (3 Cam)
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 6 ACTIVITY PHASES TABLE (NO 1 to 6) */}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 12,
                fontSize: 9.5,
                backgroundColor: '#FFFFFF',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: '5%', borderRight: '1px solid #000000', padding: 4 }}>NO.</th>
                  <th style={{ width: '22%', borderRight: '1px solid #000000', padding: 4 }}>KEGIATAN</th>
                  <th style={{ width: '22%', borderRight: '1px solid #000000', padding: 4 }}>HARI/TANGGAL</th>
                  <th style={{ width: '15%', borderRight: '1px solid #000000', padding: 4 }}>PUKUL</th>
                  <th style={{ width: '20%', borderRight: '1px solid #000000', padding: 4 }}>TEMPAT</th>
                  <th style={{ width: '16%', padding: 4 }}>CREW</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((st) => {
                  const item = getStageItem(st.matchKeys);
                  return (
                    <tr key={st.no} style={{ borderBottom: '1px solid #000000', backgroundColor: '#FFFFFF' }}>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '3px 4px' }}>
                        {st.no}
                      </td>
                      <td style={{ fontWeight: 600, borderRight: '1px solid #000000', padding: '3px 6px' }}>
                        {st.label}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                        {item?.tanggal ? formatIndonesianDate(item.tanggal) : ''}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                        {item ? `${item.jamMulai.slice(0, 5)} - ${item.jamSelesai.slice(0, 5)} WITA` : ''}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px' }}>
                        {item?.lokasi || ''}
                      </td>
                      <td style={{ padding: '3px 6px' }}>{item?.catatanCrew || ''}</td>
                    </tr>
                  );
                })}
                {unmappedActivities.map((act, uIdx) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid #000000', backgroundColor: '#FFFFFF' }}>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '3px 4px' }}>
                      {stages.length + uIdx + 1}
                    </td>
                    <td style={{ fontWeight: 600, borderRight: '1px solid #000000', padding: '3px 6px' }}>
                      {act.jenis}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                      {act.tanggal ? formatIndonesianDate(act.tanggal) : ''}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                      {`${act.jamMulai.slice(0, 5)} - ${act.jamSelesai.slice(0, 5)} WITA`}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px' }}>
                      {act.lokasi || ''}
                    </td>
                    <td style={{ padding: '3px 6px' }}>{act.catatanCrew || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Production Crew Team Footer & Signature */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                fontSize: 10.5,
                marginBottom: 12,
              }}
            >
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 110, padding: '1px 0' }}>Prod./Ass.Produser</td>
                      <td style={{ width: 10, padding: '1px 0' }}>:</td>
                      <td style={{ fontWeight: 700, padding: '1px 0' }}>{spr.produser}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1px 0' }}>PD/As.PD/FD/UM</td>
                      <td style={{ padding: '1px 0' }}>:</td>
                      <td style={{ padding: '1px 0' }}>Adolf / Wiryoga</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1px 0' }}>Keterangan</td>
                      <td style={{ padding: '1px 0' }}>:</td>
                      <td style={{ padding: '1px 0', fontWeight: 600 }}>{getKeterangan()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Producer Signature */}
              <div style={{ textAlign: 'center' }}>
                <div>Denpasar, {formatIndonesianDate(mainProduction?.tanggal)}</div>
                <div style={{ marginBottom: 38 }}>Produser,</div>
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{spr.produser}</div>
                <div style={{ fontSize: 9.5 }}>NIP. {producerNip}</div>
              </div>
            </div>

            {/* Official Tembusan Distribution */}
            <div style={{ fontSize: 9.5, borderTop: '1px solid #000000', paddingTop: 6 }}>
              <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2 }}>Tembusan :</div>
              <div>1. Ketua Tim Perencanaan, Pengendalian dan Pengembangan Teknik</div>
              <div>2. Ketua Tim Bidang Umum</div>
              <div>3. Arsip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SPRPrintModal;
