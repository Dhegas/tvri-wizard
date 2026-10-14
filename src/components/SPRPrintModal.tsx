import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck,
} from 'lucide-react';
import type { SPRDocument } from '../types';

interface SPRPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  spr: SPRDocument;
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
    const item = spr.kebutuhanCrewList.find(
      (n) => n.profesi.toLowerCase() === key.toLowerCase() || (key === 'Kamerawan' && n.profesi.toLowerCase().includes('kamera'))
    );
    return item && item.jumlah > 0 ? item.jumlah.toString() : '';
  };

  // Find main production event
  const mainProduction = spr.kegiatanList.find((k) => k.jenis === 'Produksi') || spr.kegiatanList[0];

  // 6 standard activity phases
  const stages = [
    'Survey',
    'Production Meeting',
    'Hunting',
    'Setting',
    'Pasca Produksi',
    'On Air',
  ];

  const getStageItem = (stageName: string) => {
    return spr.kegiatanList.find(
      (k) => k.jenis.toLowerCase() === stageName.toLowerCase() ||
             (stageName === 'Setting' && k.jenis.toLowerCase().includes('setting'))
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 27, 45, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 130,
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 900,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
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
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Viewport */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            ref={printSheetRef}
            className="tvri-official-sheet"
            style={{
              width: '100%',
              maxWidth: 780,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '36px 42px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000000',
              fontSize: 11,
              lineHeight: 1.35,
            }}
          >
            {/* Title Centered */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  margin: '0 0 4px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                SURAT PERMINTAAN KERABAT KERJA
              </h2>
              <h2
                style={{
                  fontSize: 13,
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
            <div style={{ marginBottom: 16 }}>
              <div>Kepada Yth:</div>
              <div style={{ fontWeight: 700 }}>Kepala Sub. Bagian Tata Usaha</div>
              <div>di -</div>
              <div style={{ textIndent: 20 }}>Denpasar</div>
            </div>

            {/* Introductory Statement */}
            <div style={{ marginBottom: 14 }}>
              <div>Dengan hormat,</div>
              <div>Berdasarkan surat permohonan kerjasama acara :</div>
            </div>

            {/* Program Metadata 2-Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 14, fontSize: 10.5 }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 90, verticalAlign: 'top' }}>Nomor</td>
                      <td style={{ width: 10, verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.nomorSurat || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Klien</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>-</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Mata Acara</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', fontWeight: 700 }}>{spr.programName}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Judul</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.judul}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 70, verticalAlign: 'top' }}>Tanggal</td>
                      <td style={{ width: 10, verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{mainProduction?.tanggal || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Durasi</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.durasi}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Format</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.formatAcara}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guest / Pengisi Acara */}
            <div style={{ marginBottom: 12, fontSize: 10.5 }}>
              <span style={{ display: 'inline-block', width: 90 }}>Pengisi Acara</span>
              <span style={{ display: 'inline-block', width: 10 }}>:</span>
              <span>{spr.pengisiAcara || '-'}</span>
            </div>

            <div style={{ marginBottom: 6, fontSize: 10.5 }}>untuk melaksanakan :</div>

            {/* MAIN ACTIVITY & CREW DEMAND TABLE (Exact match to TVRI Bali sheet) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 12,
                fontSize: 9.5,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: 25, borderRight: '1px solid #000000', padding: 4 }}>#</th>
                  <th style={{ width: 110, borderRight: '1px solid #000000', padding: 4 }}>KEGIATAN</th>
                  <th style={{ width: 120, borderRight: '1px solid #000000', padding: 4 }}>HARI/TANGGAL</th>
                  <th style={{ width: 110, borderRight: '1px solid #000000', padding: 4 }}>TEMPAT</th>
                  <th colSpan={4} style={{ padding: 4 }}>
                    KERABAT KERJA
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1.5px solid #000000', fontSize: 9 }}>
                  <th colSpan={4} style={{ borderRight: '1px solid #000000' }} />
                  <th style={{ width: 85, borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Profesi</th>
                  <th style={{ width: 35, borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Jml.</th>
                  <th style={{ width: 85, borderRight: '1px solid #000000', padding: 2, textAlign: 'center' }}>Profesi</th>
                  <th style={{ width: 35, padding: 2, textAlign: 'center' }}>Jml.</th>
                </tr>
              </thead>
              <tbody>
                {col1Professions.map((col1, idx) => {
                  const col2 = col2Professions[idx];
                  return (
                    <tr key={idx} style={{ borderBottom: idx === col1Professions.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
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
                            }}
                          >
                            Produksi {spr.programName}
                          </td>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: 6,
                            }}
                          >
                            {mainProduction ? `${mainProduction.tanggal} Pkl ${mainProduction.jamMulai.slice(0, 5)} wita` : '-'}
                          </td>
                          <td
                            rowSpan={col1Professions.length}
                            style={{
                              borderRight: '1px solid #000000',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              padding: 6,
                            }}
                          >
                            {mainProduction?.lokasi || 'Studio TVRI Bali'}
                          </td>
                        </>
                      )}

                      {/* Right Side: Crew Demands Columns */}
                      <td style={{ borderRight: '1px solid #000000', padding: '2px 4px' }}>{col1.label}</td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 700 }}>
                        {getNeedCount(col1.key)}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '2px 4px' }}>{col2.label}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{getNeedCount(col2.key)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* EQUIPMENT SYSTEM SELECTOR BAR (Exact match to TVRI Bali sheet) */}
            <div
              style={{
                border: '1.5px solid #000000',
                display: 'grid',
                gridTemplateColumns: '120px 180px 100px 120px 1fr',
                padding: '4px 8px',
                fontSize: 10,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>Sistem Peralatan :</div>
              <div>
                <span style={{ fontWeight: 700 }}>
                  [{spr.sistemPeralatan.sistem === 'Studio' ? 'X' : ' '}] {spr.sistemPeralatan.jumlahKamera || 3} Cam (Studio)
                </span>
              </div>
              <div>
                <span>[{spr.sistemPeralatan.sistem === 'ENG' ? 'X' : ' '}] ENG (1 Cam)</span>
              </div>
              <div>
                <span>[{spr.sistemPeralatan.sistem === 'EFP' ? 'X' : ' '}] EFP (2 Cam)</span>
              </div>
              <div>
                <span>[{spr.sistemPeralatan.sistem === 'OB Van' ? 'X' : ' '}] OB Van (3 Cam)</span>
              </div>
            </div>

            {/* 6 ACTIVITY PHASES TABLE (NO 1 to 6) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 14,
                fontSize: 9.5,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F2F2F2', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: 30, borderRight: '1px solid #000000', padding: 4 }}>NO.</th>
                  <th style={{ width: 140, borderRight: '1px solid #000000', padding: 4 }}>KEGIATAN</th>
                  <th style={{ width: 120, borderRight: '1px solid #000000', padding: 4 }}>HARI/TANGGAL</th>
                  <th style={{ width: 80, borderRight: '1px solid #000000', padding: 4 }}>PUKUL</th>
                  <th style={{ width: 120, borderRight: '1px solid #000000', padding: 4 }}>TEMPAT</th>
                  <th style={{ padding: 4 }}>CREW</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stageName, sIdx) => {
                  const item = getStageItem(stageName);
                  return (
                    <tr key={stageName} style={{ borderBottom: sIdx === stages.length - 1 ? 'none' : '1px solid #CCCCCC' }}>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '3px 4px' }}>
                        {sIdx + 1}
                      </td>
                      <td style={{ fontWeight: 600, borderRight: '1px solid #000000', padding: '3px 6px' }}>
                        {stageName}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                        {item?.tanggal || ''}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                        {item ? `${item.jamMulai.slice(0, 5)} Wita` : ''}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px' }}>
                        {item?.lokasi || ''}
                      </td>
                      <td style={{ padding: '3px 6px' }}>{item?.catatanCrew || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Production Crew Team Footer & Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, fontSize: 10.5, marginBottom: 14 }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 120 }}>Prod./Ass.Produser</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ fontWeight: 700 }}>{spr.produser}</td>
                    </tr>
                    <tr>
                      <td>PD/As.PD/FD/UM</td>
                      <td>:</td>
                      <td>Adolf / Wiryoga</td>
                    </tr>
                    <tr>
                      <td>Keterangan</td>
                      <td>:</td>
                      <td>Dialog {spr.programName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Producer Signature */}
              <div style={{ textAlign: 'center' }}>
                <div>Denpasar, {mainProduction?.tanggal || '29 Oktober 2026'}</div>
                <div style={{ marginBottom: 36 }}>Produser,</div>
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{spr.produser}</div>
                <div style={{ fontSize: 9.5 }}>NIP. 196904162014091001</div>
              </div>
            </div>

            {/* Official Tembusan Distribution */}
            <div style={{ fontSize: 9.5, borderTop: '1px solid #999', paddingTop: 8 }}>
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
