import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck,
} from 'lucide-react';
import type { RundownProgramRow, BroadcastCrewRosterItem } from '../types';

interface RundownPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  block: 'Pagi' | 'Sore';
  programs: RundownProgramRow[];
  rosterItems: BroadcastCrewRosterItem[];
}

export const RundownPrintModal: React.FC<RundownPrintModalProps> = ({
  isOpen,
  onClose,
  date,
  block,
  programs,
  rosterItems,
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Format date to Indonesian (e.g., "Sabtu, 12 September 2026")
  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const bulanList = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      const hari = hariList[d.getDay()];
      const tgl = d.getDate();
      const bln = bulanList[d.getMonth()];
      const thn = d.getFullYear();
      return `${hari}, ${tgl} ${bln} ${thn}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDateIndo(date);

  // Group roster into Left and Right Columns matching TVRI Bali official sheet
  const rosterLeftRoles = [
    'PD. Umum',
    'Pengarah Teknik',
    'VTR. OP',
    'Penata Cahaya',
    'Penata Rias',
    'Penata Aksara',
    'Penata Acara',
    'Teknisi IT / LED',
  ];

  const rosterRightRoles = [
    'Master Control / CCU',
    'Kamerawan',
    'Pemadu Gambar',
    'Penata Suara',
    'Transmisi',
    'PD. BHI / GB / BV',
    'Penyiar BHI / GB / BV',
    'Penata Artistik',
  ];

  const getPersonil = (roleName: string) => {
    const item = rosterItems.find((r) => r.peran.toLowerCase() === roleName.toLowerCase());
    if (!item) return '-';
    if (item.statusPetugas === 'pemberitaan') return 'Pemberitaan';
    return item.personil || '(Belum ada petugas)';
  };

  const handlePrint = () => {
    window.print();
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
        zIndex: 120,
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 960,
          width: '100%',
          maxHeight: '92vh',
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
                Pratinjau Cetak Lembar Resmi &mdash; {block === 'Pagi' ? 'Rundown Penyelenggaraan Siaran Pagi' : 'Pedoman Penyelenggaraan Siaran'}
              </strong>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                LPP TVRI Stasiun Bali &bull; Format Baku Cetak Siaran Harian
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

        {/* Printable Sheet Viewport */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '30px',
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
              maxWidth: 820,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '32px 36px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000000',
              fontSize: 11,
              lineHeight: 1.35,
            }}
          >
            {/* Header: TVRI Logo & Document Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    backgroundColor: '#1E3FA8',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontWeight: 900,
                    fontSize: 22,
                    letterSpacing: 2,
                    fontFamily: 'sans-serif',
                  }}
                >
                  TVRI
                </div>
              </div>

              <div style={{ textAlign: 'center', flex: 1 }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {block === 'Pagi' ? 'RUNDOWN PENYELENGGARAAN SIARAN PAGI' : 'PEDOMAN PENYELENGGARAAN SIARAN'}
                </h2>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                  HARI / TANGGAL : {formattedDate}
                </div>
              </div>

              <div style={{ width: 60 }} />
            </div>

            {/* Main Rundown Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 16,
                fontSize: 10.5,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#D9E1F2', borderBottom: '1.5px solid #000000' }}>
                  <th style={{ width: 75, padding: '5px 6px', borderRight: '1px solid #000000', textAlign: 'center' }}>
                    JAM
                  </th>
                  <th style={{ padding: '5px 8px', borderRight: '1px solid #000000', textAlign: 'center' }}>
                    MATA ACARA
                  </th>
                  <th style={{ width: 65, padding: '5px 6px', borderRight: '1px solid #000000', textAlign: 'center' }}>
                    DUR
                  </th>
                  <th style={{ width: 140, padding: '5px 6px', textAlign: 'center' }}>
                    SUMBER
                  </th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog) => (
                  <React.Fragment key={prog.id}>
                    {/* Main Program Header Row */}
                    <tr
                      style={{
                        backgroundColor: prog.tayang === 'Live' ? '#FCE4D6' : '#FFFFFF',
                        borderBottom: '1px solid #000000',
                        fontWeight: 700,
                      }}
                    >
                      <td style={{ padding: '5px 6px', borderRight: '1px solid #000000', textAlign: 'center', fontFamily: 'monospace' }}>
                        {prog.jamMulai}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{prog.mataAcara.toUpperCase()}</span>
                          <span style={{ fontSize: 9.5, fontWeight: 600 }}>({prog.tayang === 'Live' ? 'LIVE' : 'R-BO'})</span>
                        </div>
                        {prog.catatan && (
                          <div style={{ fontSize: 9.5, fontWeight: 400, fontStyle: 'italic', color: '#333' }}>
                            Judul : {prog.catatan}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '5px 6px', borderRight: '1px solid #000000', textAlign: 'center', fontFamily: 'monospace' }}>
                        {prog.durasi}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 600 }}>
                        {prog.sumber} {prog.lokasi && `(${prog.lokasi.split('(')[0].trim()})`}
                      </td>
                    </tr>

                    {/* Inserts rows if any */}
                    {prog.sisipanList &&
                      prog.sisipanList.map((ins) => (
                        <tr
                          key={ins.id}
                          style={{
                            borderBottom: '1px solid #CCCCCC',
                            backgroundColor: '#F9FAFB',
                            fontSize: 10,
                          }}
                        >
                          <td style={{ padding: '3px 6px', borderRight: '1px solid #000000', textAlign: 'center', fontFamily: 'monospace', color: '#444' }}>
                            {ins.jamMulai}
                          </td>
                          <td style={{ padding: '3px 8px 3px 24px', borderRight: '1px solid #000000' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: '#1E3FA8' }}>[{ins.jenis}]</span>
                              <span>
                                {ins.jenis === 'ID'
                                  ? `ID TVRI BALI_${prog.mataAcara.replace(/\s+/g, '')}`
                                  : ins.jenis === 'Sting'
                                  ? 'Channel Sting'
                                  : ins.jenis === 'Endtag'
                                  ? 'ENDTAG TVRI BALI_2026'
                                  : 'ILM / Promo Acara TVRI Bali'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '3px 6px', borderRight: '1px solid #000000', textAlign: 'center', fontFamily: 'monospace' }}>
                            {ins.durasi}
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center', color: '#555' }}>
                            {ins.sumber}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* KERABAT KERJA SIARAN (2 Column Layout Matching Official PDF Page 2) */}
            <div style={{ border: '1.5px solid #000000', marginBottom: 12 }}>
              <div
                style={{
                  backgroundColor: '#D9E1F2',
                  padding: '4px 8px',
                  fontWeight: 800,
                  fontSize: 11,
                  borderBottom: '1px solid #000000',
                  letterSpacing: 0.5,
                }}
              >
                KERABAT KERJA SIARAN
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* Left Column Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderRight: '1px solid #000000', fontSize: 10 }}>
                  <tbody>
                    {rosterLeftRoles.map((role, idx) => (
                      <tr key={role} style={{ borderBottom: idx === rosterLeftRoles.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                        <td style={{ width: 110, padding: '3px 6px', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                          {role}
                        </td>
                        <td style={{ padding: '3px 6px' }}>
                          : {getPersonil(role)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Right Column Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <tbody>
                    {rosterRightRoles.map((role, idx) => (
                      <tr key={role} style={{ borderBottom: idx === rosterRightRoles.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                        <td style={{ width: 130, padding: '3px 6px', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                          {role}
                        </td>
                        <td style={{ padding: '3px 6px' }}>
                          : {getPersonil(role)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official TVRI Bali Running Text & Disclaimer Box */}
            <div
              style={{
                border: '1px solid #999999',
                padding: '6px 10px',
                marginBottom: 16,
                fontSize: 8.5,
                lineHeight: 1.3,
                backgroundColor: '#FAFAFA',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                RUNNING TEXT : **** PERMOHONAN LIPUTAN ADVERTORIAL DAN KERJASAMA PROGRAM TVRI BALI DAPAT MENGHUBUNGI BIDANG KERJASAMA JASA SIARAN DAN NON SIARAN DI NO. TLP. (0361)237307 ATAU DI NO. 081337330492***
              </div>
              <div style={{ color: '#444' }}>
                PENAYANGAN RUNNING TEXT INISIATIF TVRI STASIUN BALI &bull; Karyawan/Karyawati TVRI Stasiun Bali dalam Melaksanakan Tugas Tidak Menerima Imbalan Apapun. Karyawan/Karyawati Pada Saat Melaksanakan Tugas di Lapangan Dilengkapi dengan Kartu Tanda Pengenal.
              </div>
            </div>

            {/* Signature Box by Ketua Tim Perencanaan dan Pengendalian Program */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 260, textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>
                  Ketua Tim Perencanaan dan Pengendalian Program
                </div>

                {/* QR Code Verification Simulation */}
                <div style={{ margin: '6px auto', display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      border: '1.5px solid #000000',
                      padding: 2,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 1,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor:
                            i === 0 || i === 4 || i === 20 || i === 24 || i % 3 === 0
                              ? '#000000'
                              : '#FFFFFF',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                  Eryawan Srimartono
                </div>
                <div style={{ fontSize: 10, color: '#333' }}>
                  NIP. 196904162014091001
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RundownPrintModal;
