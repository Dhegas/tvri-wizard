import React, { useRef } from 'react';
import { Printer, X, FileCheck, QrCode } from 'lucide-react';
import type { SPRDocument, SPRAssignmentDocument } from '../types';
import { MASTER_EMPLOYEES } from '../data/mockData';

interface SuratPenunjukanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  spr: SPRDocument;
  assignment: SPRAssignmentDocument;
}

function formatTvriDateOnly(dateStr?: string): string {
  if (!dateStr) return '';
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

function formatTvriFullDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : '';
    const dateFormatted = !isNaN(d.getTime()) ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` : dateStr;
    const timeFormatted = timeStr ? `pukul ${timeStr.slice(0, 5).replace(':', '.')} Wita` : '';
    return `${dayName ? `${dayName}, ` : ''}${dateFormatted} ${timeFormatted}`.trim();
  } catch {
    return `${dateStr} ${timeStr || ''}`.trim();
  }
}

function getEmployeeGolongan(empId?: string, empName?: string): string {
  if (!empId && !empName) return '-';
  const emp = MASTER_EMPLOYEES.find(
    (e) => (empId && e.id === empId) || (empName && e.name.toLowerCase() === empName.toLowerCase())
  );
  if (!emp?.golongan) return '-';
  const m = emp.golongan.match(/[I|V|X]+[\.\-][a-d]/i) || emp.golongan.match(/[I|V|X]+[a-d]/i);
  if (m) {
    return m[0].replace('.', '-');
  }
  return emp.golongan;
}

export const SuratPenunjukanPrintModal: React.FC<SuratPenunjukanPrintModalProps> = ({
  isOpen,
  onClose,
  spr,
  assignment,
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Cari kegiatan-kegiatan berdasarkan tahapan dari SPR
  const mainProduction =
    spr.kegiatanList.find((k) => k.jenis === 'On air') ||
    spr.kegiatanList[0];

  const huntingAct = spr.kegiatanList.find(
    (k) => k.jenis === 'Hunting' || k.jenis === 'Survei'
  );
  const prodMeetingAct = spr.kegiatanList.find(
    (k) => k.jenis === 'Production Meeting'
  );
  const settingAct = spr.kegiatanList.find(
    (k) => k.jenis === 'Setting peralatan'
  );
  const pascaAct = spr.kegiatanList.find(
    (k) => k.jenis === 'Pasca produksi'
  );

  // Deteksi jenis pelaksanaan untuk 4 kotak atas
  const isHunting = spr.jenisKegiatan === 'Peninjauan' || Boolean(huntingAct);
  const isLive = spr.jenisKegiatan === 'Siaran langsung';
  const isRekaman = spr.jenisKegiatan === 'Rekaman';
  const isProduksi = spr.jenisKegiatan === 'Produksi';

  // Deteksi sistem peralatan untuk kotak poin 11
  const sisAlat = (spr.sistemPeralatan?.sistem || '').toLowerCase();
  const isStudio = sisAlat.includes('studio') || (!sisAlat.includes('eng') && !sisAlat.includes('efp') && !sisAlat.includes('ob'));
  const isEng = sisAlat.includes('eng');
  const isEfp = sisAlat.includes('efp');
  const isObVan = sisAlat.includes('ob');

  const jumlahKamera = spr.sistemPeralatan?.jumlahKamera || 3;

  // Tanggal permintaan (SPR)
  const tanggalPermintaan = formatTvriDateOnly(
    spr.createdAt ? spr.createdAt.split(' ')[0] : mainProduction?.tanggal || '2026-10-09'
  );

  // Tanggal surat penunjukan terbit
  const tanggalTerbit = formatTvriDateOnly(
    assignment.publishedAt ? assignment.publishedAt.split(' ')[0] : mainProduction?.tanggal || '2026-10-09'
  );

  // Produser / Pemohon
  const produserName = spr.produser || 'Cok Devi';

  // Lokasi & Keterangan
  const lokasiAcara = mainProduction?.lokasi || 'Studio 1';
  const keteranganAcara = mainProduction?.catatanCrew || '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 27, 45, 0.72)',
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
          borderRadius: 12,
          maxWidth: 920,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar (Web Only) */}
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
                Pratinjau Surat Penunjukan Kerabat Kerja (Divisi Teknik)
              </strong>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                Format Resmi Jawaban SPR &bull; LPP TVRI Stasiun Bali
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
              <Printer size={15} /> Cetak Surat (A4)
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

        {/* Printable Paper Viewport */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#CBD5E1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* ========================================================= */}
          {/* LEMBAR FISIK RESMI SURAT PENUNJUKAN KERABAT KERJA TVRI    */}
          {/* ========================================================= */}
          <div
            ref={printSheetRef}
            className="tvri-official-sheet"
            style={{
              width: '100%',
              maxWidth: 794, // Standard A4 width at 96 DPI
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              padding: '32px 38px',
              marginBottom: '28px',
              height: 'auto',
              minHeight: 'fit-content',
              boxSizing: 'border-box',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000000',
              fontSize: '11px',
              lineHeight: 1.3,
            }}
          >
            {/* 1. Header: Logo TVRI (kiri) & Judul Surat (kanan/tengah) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 4,
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {/* Official TVRI Logo */}
                <img
                  src="/tvri-logo.png"
                  alt="Logo TVRI"
                  style={{
                    height: 32,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              <div style={{ flex: 1, textAlign: 'center', paddingRight: 40 }}>
                <h1
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#000000',
                  }}
                >
                  SURAT PENUNJUKAN KERABAT KERJA
                </h1>
              </div>
            </div>

            {/* 2. Tujuan Surat (Kepada Yth) */}
            <div style={{ fontSize: '10.5px', lineHeight: 1.25, marginBottom: 12 }}>
              <div>Kepada Yth :</div>
              <div style={{ fontWeight: 500 }}>Kepala Sub Bagian Tata Usaha TVRI Stasiun Bali</div>
              <div>di-</div>
              <div style={{ paddingLeft: 12 }}>Denpasar</div>
            </div>

            {/* 3. Paragraf Pembuka & Checkbox Jenis Pelaksanaan */}
            <div style={{ fontSize: '10.5px', lineHeight: 1.3, marginBottom: 8 }}>
              <div style={{ marginBottom: 2 }}>Dengan hormat,</div>
              <div>
                Berdasarkan permintaan kerabat kerja dan peralatan operasional produksi tanggal{' '}
                <strong style={{ fontWeight: 600 }}>{tanggalPermintaan}</strong>
              </div>
              <div style={{ marginBottom: 6 }}>
                bahwa petugas yang ditunjuk melaksanakan :
              </div>

              {/* 4 Checkboxes Sebaris */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  marginLeft: 10,
                  fontSize: '10.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: '1px solid #000000',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {isHunting ? 'x' : ''}
                  </span>
                  <span>Peninjauan/hunting</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: '1px solid #000000',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {isProduksi ? 'x' : ''}
                  </span>
                  <span>Produksi</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: '1px solid #000000',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {isRekaman ? 'x' : ''}
                  </span>
                  <span>Rekaman</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: '1px solid #000000',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {isLive ? 'x' : ''}
                  </span>
                  <span>Siaran Langsung</span>
                </div>
              </div>
            </div>

            {/* 4. Tabel 13 Parameter Rincian Acara */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10.5px',
                marginBottom: 8,
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: 18, verticalAlign: 'top', padding: '1.5px 0' }}>1</td>
                  <td style={{ width: 140, verticalAlign: 'top', padding: '1.5px 0' }}>Mata Acara</td>
                  <td style={{ width: 14, verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{spr.programName}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>2</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Judul</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{spr.judul}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>3</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>D u r a s i</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{spr.durasi}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>4</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>L o k a s i</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{lokasiAcara}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>5</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Tgl. Pelaksanaan</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>
                    {formatTvriFullDateTime(mainProduction?.tanggal, mainProduction?.jamMulai)}
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>6</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Hunting</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>
                    {huntingAct ? formatTvriFullDateTime(huntingAct.tanggal, huntingAct.jamMulai) : ''}
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>7</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Production Meeting</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>
                    {prodMeetingAct ? formatTvriFullDateTime(prodMeetingAct.tanggal, prodMeetingAct.jamMulai) : ''}
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>8</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Setting</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>
                    {settingAct
                      ? formatTvriFullDateTime(settingAct.tanggal, settingAct.jamMulai)
                      : mainProduction
                      ? formatTvriFullDateTime(mainProduction.tanggal, '08:00:00')
                      : ''}
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>9</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Pasca Produksi</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>
                    {pascaAct ? formatTvriFullDateTime(pascaAct.tanggal, pascaAct.jamMulai) : ''}
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>10</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Keterangan</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{keteranganAcara}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '3px 0' }}>11</td>
                  <td style={{ verticalAlign: 'top', padding: '3px 0' }}>Sistem Peralatan</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '3px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, fontSize: '10.5px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 13,
                              height: 13,
                              border: '1px solid #000000',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {isStudio ? 'x' : ''}
                          </span>
                          <span>Studio</span>
                        </div>
                        <div style={{ fontSize: '9px', paddingLeft: 19, color: '#000000' }}>
                          ({jumlahKamera} camera)
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 13,
                            height: 13,
                            border: '1px solid #000000',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          {isEng ? 'x' : ''}
                        </span>
                        <span>ENG</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 13,
                            height: 13,
                            border: '1px solid #000000',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          {isEfp ? 'x' : ''}
                        </span>
                        <span>EFP</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 13,
                              height: 13,
                              border: '1px solid #000000',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {isObVan ? 'x' : ''}
                          </span>
                          <span>OB-VAN</span>
                        </div>
                        <div style={{ fontSize: '9px', paddingLeft: 19, color: '#000000' }}>
                          ({jumlahKamera} camera)
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>12</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Produser/PD/FD/UM</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{produserName}</td>
                </tr>

                <tr>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>13</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>Format</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'center', padding: '1.5px 0' }}>:</td>
                  <td style={{ verticalAlign: 'top', padding: '1.5px 0' }}>{spr.formatAcara || 'Dialog'}</td>
                </tr>
              </tbody>
            </table>

            {/* 5. Teks Pengantar Tabel Kerabat Kerja */}
            <div style={{ fontSize: '10.5px', marginBottom: 4 }}>
              Nama-nama Kerabat Kerja sebagai berikut :
            </div>

            {/* 6. TABEL KERABAT KERJA (NO, N A M A, P R O F E S I, GOLONGAN) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000000',
                marginBottom: 10,
                fontSize: '10px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <th
                    style={{
                      width: 32,
                      border: '1px solid #000000',
                      textAlign: 'center',
                      padding: '3px 4px',
                      fontWeight: 700,
                    }}
                  >
                    No
                  </th>
                  <th
                    style={{
                      border: '1px solid #000000',
                      textAlign: 'center',
                      padding: '3px 6px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                    }}
                  >
                    N A M A
                  </th>
                  <th
                    style={{
                      width: 220,
                      border: '1px solid #000000',
                      textAlign: 'center',
                      padding: '3px 6px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                    }}
                  >
                    P R O F E S I
                  </th>
                  <th
                    style={{
                      width: 110,
                      border: '1px solid #000000',
                      textAlign: 'center',
                      padding: '3px 6px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}
                  >
                    GOLONGAN
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignment.assignedSlots.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: 'center',
                        padding: 10,
                        border: '1px solid #000000',
                        fontStyle: 'italic',
                        color: '#666666',
                      }}
                    >
                      Belum ada kerabat kerja yang ditugaskan.
                    </td>
                  </tr>
                ) : (
                  assignment.assignedSlots.map((slot, idx) => {
                    const gol = getEmployeeGolongan(slot.assignedCrewId, slot.assignedCrewName);

                    return (
                      <tr key={slot.id || idx}>
                        <td
                          style={{
                            textAlign: 'center',
                            border: '1px solid #000000',
                            padding: '2px 4px',
                            verticalAlign: 'middle',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '2px 6px',
                            verticalAlign: 'middle',
                            fontWeight: 500,
                          }}
                        >
                          {slot.assignedCrewName || (
                            <span style={{ color: '#666666', fontStyle: 'italic' }}>
                              (Belum ditugaskan)
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '2px 6px',
                            verticalAlign: 'middle',
                          }}
                        >
                          {slot.profesi}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '2px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                          }}
                        >
                          {gol}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* 7. Kalimat Penutup */}
            <div style={{ fontSize: '10.5px', marginBottom: 14 }}>
              Demikian atas perhatiannya disampaikan terima kasih.
            </div>

            {/* 8. Tanda Tangan Sub Koordinator / Ketua Tim Teknik TVRI Bali */}
            <div
              style={{
                width: 280,
                marginLeft: 'auto',
                textAlign: 'center',
                fontSize: '10.5px',
                lineHeight: 1.25,
              }}
            >
              <div>Denpasar, {tanggalTerbit}</div>
              <div style={{ marginTop: 2 }}>Ketua Tim Perencanaan, Pengendalian</div>
              <div>dan Pengembangan Teknik</div>

              {/* QR Code Resmi TVRI Bali */}
              <div
                style={{
                  margin: '8px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    padding: 4,
                    border: '1px solid #E2E8F0',
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                    display: 'inline-flex',
                  }}
                >
                  <QrCode size={52} color="#000000" />
                </div>
              </div>

              <div style={{ fontWeight: 700, textDecoration: 'none', color: '#000000' }}>
                I Wayan Wigena Adi Kurniawan, ST
              </div>
              <div style={{ fontSize: '10px', color: '#000000' }}>NIP. 198310272011011006</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratPenunjukanPrintModal;
