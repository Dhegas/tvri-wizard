import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import type { SavedAssignment } from '../types';
import { StatusBadge } from './StatusBadge';

interface SuratPerintahModalProps {
  assignment: SavedAssignment;
  onClose: () => void;
}

interface OfficialCrewRow {
  no: number;
  nama: string;
  profesi: string;
  gol: string;
  keterangan: string;
  isAssigned?: boolean;
  isDualRole?: boolean;
}

export const SuratPerintahModal: React.FC<SuratPerintahModalProps> = ({ assignment, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [highlightAssigned, setHighlightAssigned] = useState(true);
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Derive registration number
  const spNumber = useMemo(() => {
    return assignment.spNumber || `SP.024/TVRI-BALI/TEK/09/2026`;
  }, [assignment]);

  // Format dates matching TVRI Bali official document format
  const { hariTanggal, tanggalTtd } = useMemo(() => {
    try {
      const raw = assignment.date || '2026-09-21';
      let dateObj = new Date(raw);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date('2026-09-21');
      }

      const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const bulanList = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];

      const hari = hariList[dateObj.getDay()];
      const tgl = dateObj.getDate();
      const bln = bulanList[dateObj.getMonth()];
      const thn = dateObj.getFullYear();

      // Sign date 3 days before
      const ttdDateObj = new Date(dateObj);
      ttdDateObj.setDate(ttdDateObj.getDate() - 3);
      const ttdTgl = ttdDateObj.getDate();
      const ttdBln = bulanList[ttdDateObj.getMonth()];
      const ttdThn = ttdDateObj.getFullYear();

      return {
        hariTanggal: `${hari}, ${tgl} ${bln} ${thn}`,
        tanggalTtd: `Denpasar, ${ttdTgl} ${ttdBln} ${ttdThn}`,
      };
    } catch {
      return {
        hariTanggal: 'Senin, 21 September 2026',
        tanggalTtd: 'Denpasar, 18 September 2026',
      };
    }
  }, [assignment.date]);

  // Build official TVRI Bali 27-crew roster based on authentic document
  const rosterData = useMemo(() => {
    const assignedCrew = assignment.crew || [];
    const assignedNames = new Set(assignedCrew.map((c) => c.name.toLowerCase()));

    // 1. TEKNIK PRODUKSI & PENYIARAN (Authentic TVRI Bali Staff List)
    const produksiItems: OfficialCrewRow[] = [
      { no: 1, nama: 'I Ketut Anom Randhika', profesi: 'Pengarah teknik pagi', gol: 'II-b', keterangan: 'Siaran pagi s/d selesai' },
      { no: 2, nama: 'I Gede Purnayasa, A.Md', profesi: 'VTR/editor pagi', gol: 'VII', keterangan: 'Siaran pagi s/d selesai' },
      { no: 3, nama: 'I Gst.Bgs.Ariantara', profesi: 'Pengarah teknik sore/live', gol: 'VII', keterangan: 'Siaran sore s/d selesai' },
      { no: 4, nama: 'IGN. Ary Juliantara', profesi: 'Teknisi master control', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 5, nama: 'I Wayan Sugata, S.I.Kom', profesi: 'Teknisi CCU/VE', gol: 'III-c', keterangan: 'Siaran sore s/d selesai' },
      { no: 6, nama: 'IGN. Ary Juliantara', profesi: 'Teknisi maintenance', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 7, nama: 'Rovelino Andrew Nanlohy', profesi: 'Kamerawan', gol: 'VII', keterangan: 'Siaran sore s/d selesai' },
      { no: 8, nama: 'I Gde Made Reza Ardianto, S.Sn', profesi: 'Kamerawan', gol: 'XI', keterangan: 'Siaran sore s/d selesai' },
      { no: 9, nama: 'Luh Putu Widiastuti, S.PT', profesi: 'Pemadu gambar', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 10, nama: 'Ni Made Mega Pratiwi, S.Si', profesi: 'Penata suara', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 11, nama: 'Erik Julianto Nugroho, A.Md.', profesi: 'Penata suara live', gol: '', keterangan: 'Siaran sore s/d selesai' },
      { no: 12, nama: 'Annisa Pratiwi, A.Md.T.', profesi: 'Penata aksara', gol: 'IIc', keterangan: 'Siaran sore s/d selesai' },
      { no: 13, nama: 'Bagas Suryatama, A.Md.T', profesi: 'VTR/editor sore', gol: 'IIc', keterangan: 'Siaran sore s/d selesai' },
      { no: 14, nama: 'Bagas Suryatama, A.Md.T', profesi: 'Teknisi IT/LED', gol: 'IIc', keterangan: 'Siaran sore s/d selesai' },
      { no: 15, nama: 'Supriyanto', profesi: 'Penata cahaya', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 16, nama: 'Supriyanto', profesi: 'Teknisi peralatan', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 17, nama: 'I Wayan Widana', profesi: 'Teknisi AC/listrik pagi', gol: 'VII', keterangan: 'Siaran pagi s/d selesai' },
      { no: 18, nama: 'I Nyoman Sucipta', profesi: 'Teknisi AC/listrik pagi', gol: 'VII', keterangan: 'Siaran pagi s/d selesai' },
      { no: 19, nama: "Hafizd Naufal Mu'ammar, A.Md.T.", profesi: 'Teknisi AC/listrik', gol: 'IIc', keterangan: 'Siaran sore s/d selesai' },
    ];

    // 2. TEKNIK TRANSMISI
    const transmisiItems: OfficialCrewRow[] = [
      { no: 20, nama: 'Ni Made Dyana Sari', profesi: 'Teknisi STL', gol: 'IIa', keterangan: 'Siaran Shift 1 s/d selesai' },
      { no: 21, nama: 'IGAB. Arya Yudhistira', profesi: 'Teknisi STL', gol: 'V', keterangan: 'Siaran Shift 2 s/d selesai' },
      { no: 22, nama: 'I Gst. Ngurah Putra', profesi: 'Teknisi STL', gol: 'II-d', keterangan: 'Siaran Shift 3 s/d selesai' },
      { no: 23, nama: 'Ni Putu Suciana Wijayanthi', profesi: 'Teknisi STL', gol: 'IIa', keterangan: 'Siaran Shift 3 s/d selesai' },
    ];

    // 3. CREW TAMBAHAN LIVE STUDIO (Dynamic support for custom assigned crew & secondary roles)
    const customCrewRows: OfficialCrewRow[] = [];
    let extraNo = 24;

    assignedCrew.forEach((c) => {
      // Check if primary role is in rows 1-23
      const inStandard = produksiItems.some(
        (p) => p.nama.toLowerCase() === c.name.toLowerCase()
      );
      if (!inStandard && extraNo <= 27) {
        customCrewRows.push({
          no: extraNo++,
          nama: c.name,
          profesi: c.role,
          gol: 'III-b',
          keterangan: 'Siaran sore s/d selesai',
          isAssigned: true,
          isDualRole: !!c.secondaryRole,
        });
      }

      // If candidate has a secondary role
      if (c.secondaryRole && extraNo <= 27) {
        // If secondary role not already filled in standard rows by this person
        const secondaryInStandard = produksiItems.some(
          (p) =>
            p.nama.toLowerCase() === c.name.toLowerCase() &&
            p.profesi.toLowerCase().includes(c.secondaryRole!.toLowerCase())
        );
        if (!secondaryInStandard) {
          customCrewRows.push({
            no: extraNo++,
            nama: c.name,
            profesi: c.secondaryRole,
            gol: 'III-b',
            keterangan: 'Siaran sore s/d selesai (Rangkap Tugas)',
            isAssigned: true,
            isDualRole: true,
          });
        }
      }
    });

    // Fill remaining up to 4 rows
    const defaultExtras: OfficialCrewRow[] = [
      { no: 24, nama: 'I Made Astawa', profesi: 'Kamerawan', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 25, nama: 'Putri Krisna Lila Dewi, ST', profesi: 'Pemadu gambar', gol: 'III-b', keterangan: 'Siaran sore s/d selesai' },
      { no: 26, nama: '', profesi: 'Penata suara', gol: '', keterangan: '' },
      { no: 27, nama: '', profesi: 'Kamerawan', gol: '', keterangan: '' },
    ];

    while (customCrewRows.length < 4) {
      const fallback = defaultExtras[customCrewRows.length];
      customCrewRows.push({
        ...fallback,
        no: 24 + customCrewRows.length,
      });
    }

    const tambahanItems = customCrewRows.slice(0, 4);

    // Track dual-role occurrences by name frequency
    const allCombined = [...produksiItems, ...transmisiItems, ...tambahanItems];
    const nameFrequency = new Map<string, number>();
    allCombined.forEach((r) => {
      if (r.nama && r.nama.trim()) {
        const key = r.nama.toLowerCase();
        nameFrequency.set(key, (nameFrequency.get(key) || 0) + 1);
      }
    });

    // Check highlights & dual-role status for all
    const checkAssigned = (items: OfficialCrewRow[]) =>
      items.map((row) => {
        const isAssigned =
          row.isAssigned || (row.nama ? assignedNames.has(row.nama.toLowerCase()) : false);
        const isDual =
          (row.nama && (nameFrequency.get(row.nama.toLowerCase()) || 0) > 1) || !!row.isDualRole;

        let keterangan = row.keterangan;
        if (isDual && !keterangan.includes('Rangkap')) {
          // Add Rangkap annotation on secondary row
          if (row.no === 6 || row.no === 13 || row.no === 16 || row.isDualRole) {
            keterangan = `${keterangan} (Rangkap)`;
          }
        }

        return {
          ...row,
          isAssigned,
          isDualRole: isDual,
          keterangan,
        };
      });

    return [
      { category: 'TEKNIK PRODUKSI & PENYIARAN:', items: checkAssigned(produksiItems) },
      { category: 'TEKNIK TRANSMISI :', items: checkAssigned(transmisiItems) },
      { category: 'CREW TAMBAHAN LIVE STUDIO :', items: checkAssigned(tambahanItems) },
    ];
  }, [assignment.crew]);

  // Dedicated Print Function: prints ONLY the document sheet via isolated iframe
  const handlePrintOrDownload = () => {
    if (!printSheetRef.current) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const contentHtml = printSheetRef.current.innerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>SURAT PERINTAH PENYIARAN - ${spNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 12mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #000000;
              font-family: Arial, Calibri, 'Public Sans', sans-serif;
              font-size: 11px;
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .tvri-official-sheet {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            .tvri-doc-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .tvri-logo-wrapper {
              flex-shrink: 0;
            }
            .tvri-doc-title-container {
              flex: 1;
              text-align: center;
            }
            .tvri-doc-title {
              font-size: 17px;
              font-weight: 700;
              letter-spacing: 0.5px;
              margin: 0;
              text-transform: uppercase;
              color: #000000;
            }
            .tvri-recipient-block {
              font-size: 11.5px;
              line-height: 1.3;
              margin-bottom: 10px;
              color: #000000;
            }
            .tvri-recipient-dest {
              font-weight: 600;
            }
            .tvri-opening-block {
              font-size: 11.5px;
              line-height: 1.3;
              margin-bottom: 8px;
              color: #000000;
            }
            .tvri-schedule-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 3px;
              font-size: 11.5px;
              color: #000000;
            }
            .tvri-schedule-table td {
              border: none !important;
              padding: 1px 0 !important;
            }
            .tvri-crew-table {
              width: 100%;
              border-collapse: collapse;
              border: 1.5px solid #000000;
              font-size: 10.5px;
              margin-bottom: 10px;
              color: #000000;
            }
            .tvri-crew-table th,
            .tvri-crew-table td {
              border: 1px solid #000000 !important;
              padding: 2px 4px !important;
              vertical-align: middle;
              color: #000000;
            }
            .tvri-crew-table th {
              background-color: #fafafa;
              font-weight: 700;
              text-align: center;
            }
            .tvri-table-category-row td {
              background-color: #ffffff;
              padding: 2.5px 5px !important;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.2px;
            }
            .tvri-closing-text {
              font-size: 11.5px;
              margin-top: 8px;
              margin-bottom: 8px;
              color: #000000;
            }
            .tvri-signature-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 8px;
              font-size: 11.5px;
              color: #000000;
            }
            .tvri-signature-box {
              width: 280px;
              text-align: left;
            }
            .tvri-qr-wrapper {
              margin: 6px 0 6px 30px;
            }
            .tvri-signer-name {
              font-weight: 700;
              font-size: 12px;
              color: #000000;
            }
            .tvri-signer-nip {
              font-size: 11px;
              color: #000000;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="tvri-official-sheet">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 1500);
    }, 200);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
      <div className="modal-content tvri-sp-modal-content" style={{ maxWidth: 860, maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header (Web Only) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCheck size={22} color="var(--primary)" />
            <div>
              <h3 id="sp-modal-title" className="modal-title" style={{ fontSize: 16 }}>
                Pratinjau Surat Perintah Penyiaran TVRI Stasiun Bali
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Format Resmi Dinas Penyiaran &bull; Nomor: <span className="tabular font-bold">{spNumber}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="alert-banner-close"
            onClick={onClose}
            aria-label="Tutup jendela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action / Notification Bar (Web Only) */}
        <div className="no-print" style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge status="Ditugaskan" />
            <span style={{ fontSize: 12, color: '#475569' }}>
              Program: <strong>{assignment.programName}</strong> ({assignment.timeRange})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={highlightAssigned}
                onChange={(e) => setHighlightAssigned(e.target.checked)}
                style={{ accentColor: '#1E3FA8' }}
              />
              <span>Sorot Kru Terpilih</span>
            </label>

            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 32, fontSize: 12, padding: '0 12px' }}
              onClick={handlePrintOrDownload}
            >
              <Printer size={14} /> Cetak / Unduh PDF
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '24px 20px', backgroundColor: '#F1F5F9' }}>
          {/* ========================================================= */}
          {/* LEMBAR SURAT RESMI TVRI STASIUN BALI                      */}
          {/* ========================================================= */}
          <div className="official-doc-paper tvri-official-sheet" ref={printSheetRef}>
            {/* 1. KOP SURAT & LOGO */}
            <div className="tvri-doc-header">
              <div className="tvri-logo-wrapper">
                {/* Official TVRI Mark */}
                <img
                  src="/tvri-logo.png"
                  alt="Logo TVRI"
                  style={{
                    height: 36,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              <div className="tvri-doc-title-container">
                <h1 className="tvri-doc-title">SURAT PERINTAH PENYIARAN</h1>
              </div>
            </div>

            {/* 2. TUJUAN SURAT (KEPADA YTH) */}
            <div className="tvri-recipient-block">
              <div>Kepada Yth :</div>
              <div className="tvri-recipient-dest">Kepala Sub Bagian Tata Usaha TVRI Stasiun Bali</div>
              <div>di-</div>
              <div className="tvri-recipient-dest" style={{ paddingLeft: 16 }}>Denpasar</div>
            </div>

            {/* 3. PARAGRAF PEMBUKA & RINCIAN WAKTU SIARAN */}
            <div className="tvri-opening-block">
              <p style={{ margin: '0 0 4px 0' }}>Dengan hormat,</p>
              <p style={{ margin: '0 0 8px 0' }}>
                Dengan ini disampaikan nama-nama petugas untuk melaksanakan penyiaran pada :
              </p>

              <table className="tvri-schedule-table">
                <tbody>
                  <tr>
                    <td style={{ width: 24, textAlign: 'left', verticalAlign: 'top' }}>1</td>
                    <td style={{ width: 190, verticalAlign: 'top' }}>Hari/tanggal</td>
                    <td style={{ width: 16, textAlign: 'center', verticalAlign: 'top' }}>:</td>
                    <td style={{ fontWeight: 500 }}>{hariTanggal}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left', verticalAlign: 'top' }}>2</td>
                    <td style={{ verticalAlign: 'top' }}>Siaran pagi mulai pukul</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'top' }}>:</td>
                    <td>Pukul 06.00 Wita s/d 16.00 Wita</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left', verticalAlign: 'top' }}>3</td>
                    <td style={{ verticalAlign: 'top' }}>Siaran sore mulai pukul</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'top' }}>:</td>
                    <td>Pukul 16.00 Wita s/d 24.00 Wita</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TABEL DAFTAR PETUGAS PENYIARAN */}
            <table className="tvri-crew-table">
              <thead>
                <tr>
                  <th style={{ width: '5%', textAlign: 'center' }}>NO.</th>
                  <th style={{ width: '38%', textAlign: 'center' }}>NAMA</th>
                  <th style={{ width: '30%', textAlign: 'center' }}>PROFESI</th>
                  <th style={{ width: '9%', textAlign: 'center' }}>GOL.</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {rosterData.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    {/* Section Header Row */}
                    <tr className="tvri-table-category-row">
                      <td colSpan={5}>
                        <strong>{section.category}</strong>
                      </td>
                    </tr>

                    {/* Personnel Rows */}
                    {section.items.map((row) => {
                      const isRowAssigned = highlightAssigned && row.isAssigned;
                      return (
                        <tr
                          key={row.no}
                          className={isRowAssigned ? 'tvri-row-assigned' : ''}
                        >
                          <td style={{ textAlign: 'center', fontWeight: isRowAssigned ? 700 : 400 }}>
                            {row.no}
                          </td>
                          <td style={{ fontWeight: isRowAssigned ? 700 : 400 }}>
                            {row.nama}
                            {row.isDualRole && (
                              <span
                                className="no-print"
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  border: '1px solid #FCD34D',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  verticalAlign: 'middle',
                                }}
                              >
                                ⚡ Rangkap
                              </span>
                            )}
                            {isRowAssigned && (
                              <span className="no-print tvri-assigned-pill">
                                &bull; {assignment.programName}
                              </span>
                            )}
                          </td>
                          <td>{row.profesi}</td>
                          <td style={{ textAlign: 'center' }}>{row.gol}</td>
                          <td>{row.keterangan}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* 5. KALIMAT PENUTUP */}
            <div className="tvri-closing-text">
              Demikian atas perhatiannya disampaikan terimakasih.
            </div>

            {/* 6. BLOK TANDA TANGAN (DENPASAR & QR CODE RESMI) */}
            <div className="tvri-signature-container">
              <div className="tvri-signature-box">
                <div style={{ marginBottom: 2 }}>{tanggalTtd}</div>
                <div style={{ fontWeight: 600, lineHeight: 1.25 }}>
                  Ketua Tim Perencanaan, Pengendalian<br />
                  dan Pengembangan Teknik
                </div>

                {/* QR Code Resmi TTE BSrE / TVRI Bali */}
                <div className="tvri-qr-wrapper">
                  <svg width="74" height="74" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="84" height="84" fill="#FFFFFF" />
                    {/* Detection Corner: Top-Left */}
                    <rect x="6" y="6" width="22" height="22" fill="#000000" />
                    <rect x="9" y="9" width="16" height="16" fill="#FFFFFF" />
                    <rect x="12" y="12" width="10" height="10" fill="#000000" />

                    {/* Detection Corner: Top-Right */}
                    <rect x="56" y="6" width="22" height="22" fill="#000000" />
                    <rect x="59" y="9" width="16" height="16" fill="#FFFFFF" />
                    <rect x="62" y="12" width="10" height="10" fill="#000000" />

                    {/* Detection Corner: Bottom-Left */}
                    <rect x="6" y="56" width="22" height="22" fill="#000000" />
                    <rect x="9" y="59" width="16" height="16" fill="#FFFFFF" />
                    <rect x="12" y="62" width="10" height="10" fill="#000000" />

                    {/* Data Modules */}
                    <rect x="34" y="8" width="4" height="4" fill="#000" />
                    <rect x="42" y="8" width="4" height="4" fill="#000" />
                    <rect x="30" y="14" width="4" height="4" fill="#000" />
                    <rect x="38" y="14" width="4" height="4" fill="#000" />
                    <rect x="46" y="14" width="4" height="4" fill="#000" />
                    <rect x="34" y="20" width="4" height="4" fill="#000" />
                    <rect x="42" y="20" width="4" height="4" fill="#000" />
                    <rect x="50" y="20" width="4" height="4" fill="#000" />

                    <rect x="8" y="34" width="4" height="4" fill="#000" />
                    <rect x="16" y="34" width="4" height="4" fill="#000" />
                    <rect x="24" y="34" width="4" height="4" fill="#000" />
                    <rect x="32" y="32" width="4" height="4" fill="#000" />
                    <rect x="40" y="32" width="4" height="4" fill="#000" />
                    <rect x="48" y="32" width="4" height="4" fill="#000" />
                    <rect x="56" y="34" width="4" height="4" fill="#000" />
                    <rect x="64" y="34" width="4" height="4" fill="#000" />
                    <rect x="72" y="34" width="4" height="4" fill="#000" />

                    <rect x="12" y="42" width="4" height="4" fill="#000" />
                    <rect x="20" y="42" width="4" height="4" fill="#000" />
                    <rect x="28" y="40" width="4" height="4" fill="#000" />
                    <rect x="36" y="40" width="4" height="4" fill="#000" />
                    <rect x="44" y="40" width="4" height="4" fill="#000" />
                    <rect x="52" y="42" width="4" height="4" fill="#000" />
                    <rect x="60" y="42" width="4" height="4" fill="#000" />
                    <rect x="68" y="42" width="4" height="4" fill="#000" />

                    <rect x="8" y="48" width="4" height="4" fill="#000" />
                    <rect x="18" y="48" width="4" height="4" fill="#000" />
                    <rect x="32" y="48" width="4" height="4" fill="#000" />
                    <rect x="40" y="48" width="4" height="4" fill="#000" />
                    <rect x="48" y="48" width="4" height="4" fill="#000" />
                    <rect x="62" y="48" width="4" height="4" fill="#000" />
                    <rect x="70" y="48" width="4" height="4" fill="#000" />

                    <rect x="34" y="56" width="4" height="4" fill="#000" />
                    <rect x="42" y="56" width="4" height="4" fill="#000" />
                    <rect x="50" y="56" width="4" height="4" fill="#000" />
                    <rect x="58" y="56" width="4" height="4" fill="#000" />
                    <rect x="66" y="56" width="4" height="4" fill="#000" />
                    <rect x="74" y="56" width="4" height="4" fill="#000" />

                    <rect x="30" y="64" width="4" height="4" fill="#000" />
                    <rect x="38" y="64" width="4" height="4" fill="#000" />
                    <rect x="46" y="64" width="4" height="4" fill="#000" />
                    <rect x="54" y="64" width="4" height="4" fill="#000" />
                    <rect x="62" y="64" width="4" height="4" fill="#000" />
                    <rect x="70" y="64" width="4" height="4" fill="#000" />

                    <rect x="34" y="72" width="4" height="4" fill="#000" />
                    <rect x="42" y="72" width="4" height="4" fill="#000" />
                    <rect x="50" y="72" width="4" height="4" fill="#000" />
                    <rect x="58" y="72" width="4" height="4" fill="#000" />
                    <rect x="66" y="72" width="4" height="4" fill="#000" />
                    <rect x="74" y="72" width="4" height="4" fill="#000" />
                  </svg>
                </div>

                <div className="tvri-signer-name">
                  I Wayan Wigena Adi Kurniawan, ST
                </div>
                <div className="tvri-signer-nip tabular">
                  NIP. 198310272011011006
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Web Only) */}
        <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            * Dokumen ini siap cetak ukuran A4 Portrait (hanya lembar surat yang masuk PDF).
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline-gray" onClick={onClose}>
              Tutup
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrintOrDownload}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Berhasil Dicetak / Diunduh
                </>
              ) : (
                <>
                  <Download size={16} /> Cetak / Unduh PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratPerintahModal;
