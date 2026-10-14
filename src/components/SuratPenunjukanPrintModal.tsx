import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck,
  QrCode,
} from 'lucide-react';
import type { SPRDocument, SPRAssignmentDocument } from '../types';

interface SuratPenunjukanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  spr: SPRDocument;
  assignment: SPRAssignmentDocument;
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

  const spNomor = assignment.suratPenunjukanNomor || `SP/TVRI-BALI/TEK/10/2026/042`;
  const qrCodeText = assignment.qrVerificationCode || `QR-TVRI-BALI-SP-202610-042`;
  const mainProduction = spr.kegiatanList.find((k) => k.jenis === 'Produksi') || spr.kegiatanList[0];

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
          maxWidth: 900,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
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
                Pratinjau Surat Penunjukan Kerabat Kerja Produksi (Divisi Teknik)
              </strong>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                LPP TVRI Stasiun Bali &bull; Format Surat Perintah Tugas Teknik Baku
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
              padding: '36px 44px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000000',
              fontSize: 11,
              lineHeight: 1.35,
            }}
          >
            {/* Kop Surat Resmi TVRI Stasiun Bali */}
            <div style={{ textAlign: 'center', borderBottom: '2.5px solid #000000', paddingBottom: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                LEMBAGA PENYIARAN PUBLIK TELEVISI REPUBLIK INDONESIA
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '2px 0' }}>
                STASIUN BALI
              </div>
              <div style={{ fontSize: 9.5, color: '#333333' }}>
                Jl. Kapten Cokorda Agung Tresna, Renon, Denpasar - Bali 80235 | Telp. (0361) 228941, 235127
              </div>
            </div>

            {/* Document Title & Number */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  textDecoration: 'underline',
                  textTransform: 'uppercase',
                  margin: '0 0 3px',
                }}
              >
                SURAT PENUNJUKAN KERABAT KERJA DAN PERALATAN
              </div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>
                NOMOR : {spNomor}
              </div>
            </div>

            {/* Legal Basis Statement */}
            <div style={{ marginBottom: 12, fontSize: 10.5, lineHeight: 1.4 }}>
              <div>
                Berdasarkan <strong>Surat Permintaan Kerabat Kerja dan Peralatan Operasional Produksi (SPR)</strong> Nomor :{' '}
                <strong>{spr.nomorSurat || 'SPR/PROG/2026/10/028'}</strong>, dengan ini Sub Koordinator Pengendalian dan Pengembangan Teknik LPP TVRI Stasiun Bali menugaskan personil Kerabat Kerja Divisi Teknik untuk melaksanakan operasional produksi sebagai berikut :
              </div>
            </div>

            {/* Production Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                padding: '8px 12px',
                marginBottom: 14,
                fontSize: 10.5,
              }}
            >
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 100, verticalAlign: 'top', color: '#475569' }}>Mata Acara</td>
                      <td style={{ width: 10, verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', fontWeight: 700 }}>{spr.programName}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569' }}>Judul Acara</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.judul}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569' }}>Jenis Kegiatan</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{spr.jenisKegiatan} ({spr.formatAcara})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 90, verticalAlign: 'top', color: '#475569' }}>Hari / Tgl</td>
                      <td style={{ width: 10, verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', fontWeight: 600 }}>{mainProduction?.tanggal || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569' }}>Waktu / Jam</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>
                        {mainProduction ? `${mainProduction.jamMulai.slice(0, 5)} - ${mainProduction.jamSelesai.slice(0, 5)} WITA` : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569' }}>Lokasi / Studio</td>
                      <td style={{ verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>{mainProduction?.lokasi || 'Studio TVRI Bali'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569' }}>Sistem Alat</td>
                      <td style={{ width: 10, verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', fontWeight: 600 }}>
                        {spr.sistemPeralatan.sistem} {spr.sistemPeralatan.jumlahKamera ? `(${spr.sistemPeralatan.jumlahKamera} Kamera)` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL KERABAT KERJA RESMI DIVISI TEKNIK */}
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 10.5, textTransform: 'uppercase' }}>
              I. SUSUNAN KERABAT KERJA OPERASIONAL TEKNIK
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 14,
                fontSize: 10,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: 28, borderRight: '1px solid #000000', padding: 5 }}>NO</th>
                  <th style={{ width: 150, borderRight: '1px solid #000000', padding: 5 }}>TUGAS / PROFESI</th>
                  <th style={{ borderRight: '1px solid #000000', padding: 5 }}>NAMA PERSONIL</th>
                  <th style={{ width: 160, borderRight: '1px solid #000000', padding: 5 }}>NIP</th>
                  <th style={{ width: 95, padding: 5 }}>KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {assignment.assignedSlots.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 12, fontStyle: 'italic', color: '#666' }}>
                      Belum ada personil yang ditugaskan.
                    </td>
                  </tr>
                ) : (
                  assignment.assignedSlots.map((slot, idx) => (
                    <tr
                      key={slot.id}
                      style={{
                        borderBottom: idx === assignment.assignedSlots.length - 1 ? 'none' : '1px solid #CCCCCC',
                      }}
                    >
                      <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, borderRight: '1px solid #000000', padding: '4px 6px' }}>
                        {slot.profesi} {slot.totalSlots > 1 ? `(${slot.slotNumber})` : ''}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', fontWeight: slot.assignedCrewName ? 600 : 400 }}>
                        {slot.assignedCrewName || <span style={{ color: '#DC2626', fontStyle: 'italic' }}>(Belum ditugaskan)</span>}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '4px 6px', fontSize: 9.5, textAlign: 'center' }}>
                        {slot.assignedCrewNip || '-'}
                      </td>
                      <td style={{ padding: '4px 6px', fontSize: 9.5, textAlign: 'center' }}>
                        {slot.status === 'terisi' ? 'Bertugas' : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* TABEL JADWAL TAHAPAN KEGIATAN */}
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 10.5, textTransform: 'uppercase' }}>
              II. JADWAL PELAKSANAAN KEGIATAN PRODUKSI
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                marginBottom: 16,
                fontSize: 9.5,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: 28, borderRight: '1px solid #000000', padding: 4 }}>NO</th>
                  <th style={{ width: 130, borderRight: '1px solid #000000', padding: 4 }}>TAHAPAN</th>
                  <th style={{ width: 110, borderRight: '1px solid #000000', padding: 4 }}>HARI / TANGGAL</th>
                  <th style={{ width: 90, borderRight: '1px solid #000000', padding: 4 }}>WAKTU</th>
                  <th style={{ width: 130, borderRight: '1px solid #000000', padding: 4 }}>TEMPAT</th>
                  <th style={{ padding: 4 }}>CATATAN</th>
                </tr>
              </thead>
              <tbody>
                {spr.kegiatanList.map((k, idx) => (
                  <tr
                    key={k.id}
                    style={{
                      borderBottom: idx === spr.kegiatanList.length - 1 ? 'none' : '1px solid #CCCCCC',
                    }}
                  >
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: 3 }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, borderRight: '1px solid #000000', padding: '3px 6px' }}>
                      {k.jenis}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                      {k.tanggal}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', textAlign: 'center' }}>
                      {k.jamMulai.slice(0, 5)} - {k.jamSelesai.slice(0, 5)}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', padding: '3px 6px' }}>
                      {k.lokasi || '-'}
                    </td>
                    <td style={{ padding: '3px 6px' }}>{k.catatanCrew || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ketentuan Tugas & Signature Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, fontSize: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Ketentuan :</div>
                <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.4, color: '#333' }}>
                  <li>Melaksanakan tugas operasional teknik dengan penuh tanggung jawab dan disiplin SOP penyiaran.</li>
                  <li>Hadir di lokasi kegiatan minimal 30 menit sebelum jadwal produksi dimulai untuk persiapan teknis (*pre-flight check*).</li>
                  <li>Melaporkan kesiapan peralatan dan kendala teknis kepada Pengarah Teknik / Sub Koordinator Teknik.</li>
                </ol>
              </div>

              {/* Tanda Tangan Sub Koordinator Teknik & QR Code */}
              <div style={{ textAlign: 'center' }}>
                <div>Denpasar, {assignment.publishedAt ? assignment.publishedAt.split(' ')[0] : '12 Oktober 2026'}</div>
                <div>An. Kepala Stasiun TVRI Bali</div>
                <div style={{ marginBottom: 6 }}>Sub Koordinator Teknik,</div>

                {/* QR Code Verification Box */}
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px dashed #94A3B8',
                    padding: '4px 10px',
                    borderRadius: 4,
                    marginBottom: 6,
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <QrCode size={36} color="#1E3FA8" />
                  <span style={{ fontSize: 7.5, color: '#64748B', fontFamily: 'monospace' }}>
                    {qrCodeText}
                  </span>
                </div>

                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
                  I Made Dwi Cahyadi, S.T.
                </div>
                <div style={{ fontSize: 9.5 }}>NIP. 19820514 200801 1 012</div>
              </div>
            </div>

            {/* Official Tembusan Distribution */}
            <div style={{ fontSize: 9, borderTop: '1px solid #999', paddingTop: 6 }}>
              <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2 }}>Tembusan :</div>
              <div>1. Kepala LPP TVRI Stasiun Bali</div>
              <div>2. Kepala Sub. Bagian Tata Usaha</div>
              <div>3. Ketua Tim Perencanaan & Pengendalian Program</div>
              <div>4. Yang bersangkutan untuk dilaksanakan</div>
              <div>5. Arsip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratPenunjukanPrintModal;
