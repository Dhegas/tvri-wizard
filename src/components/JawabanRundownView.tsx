import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Printer,
  Layers,
  ShieldCheck,
  Check,
  Activity,
} from 'lucide-react';
import type { UserRole, RundownProgramRow, BroadcastCrewRosterItem } from '../types';
import { MOCK_DAILY_RUNDOWNS } from '../data/mockData';
import { RundownPrintModal } from './RundownPrintModal';

export interface RundownTechnicalResponse {
  id: string;
  rundownId: string;
  tanggal: string;
  blok: 'Pagi' | 'Sore';
  programNameSummary: string;
  submittedBy: string;
  submittedAt: string;
  status: 'menunggu_respon' | 'disetujui' | 'disetujui_bersyarat' | 'perlu_revisi';
  decision: 'siap_siar' | 'catatan_teknis' | 'revisi';
  fasilitasReady: {
    mcr: boolean;
    transmisi: boolean;
    studio: boolean;
    playbackServer: boolean;
  };
  catatanTeknis: string;
  reviewedBy: string;
  reviewedAt?: string;
  nomorSuratJawaban?: string;
  programs: RundownProgramRow[];
  kerabatKerja: BroadcastCrewRosterItem[];
}

interface JawabanRundownViewProps {
  currentUserRole: UserRole;
  onClose: () => void;
  onOpenRundownDetail?: (date: string, block: 'Pagi' | 'Sore') => void;
  activeDivision?: 'program' | 'teknik';
}

const INITIAL_RESPONSES: RundownTechnicalResponse[] = [
  {
    id: 'resp-rd-01',
    rundownId: 'rd-2026-10-12-sore',
    tanggal: '2026-10-12',
    blok: 'Sore',
    programNameSummary: 'Balivision, Mimbar Agama, Bali Hari Ini, Puja Tri Sandhya, Indonesia Bicara',
    submittedBy: 'Dewi Sartika (Divisi Program)',
    submittedAt: '11 Oktober 2026, 14:30 WITA',
    status: 'menunggu_respon',
    decision: 'siap_siar',
    fasilitasReady: {
      mcr: true,
      transmisi: true,
      studio: true,
      playbackServer: true,
    },
    catatanTeknis: 'MCR 1 dan CCU dalam kondisi normal. Pemancar Bukit Bakung dan Kintamani siap daya penuh. Studio 2 stand by pukul 15.30 WITA untuk live Balivision.',
    reviewedBy: 'Bambang Triyono (Sub Koordinator Teknik)',
    programs: MOCK_DAILY_RUNDOWNS[0]?.programs || [],
    kerabatKerja: MOCK_DAILY_RUNDOWNS[0]?.kerabatKerjaSiaran || [],
  },
  {
    id: 'resp-rd-02',
    rundownId: 'rd-2026-10-12-pagi',
    tanggal: '2026-10-12',
    blok: 'Pagi',
    programNameSummary: 'Indonesia Pagi, Mimbar Agama Hindu, Jelajah Dewata, Info Terkini',
    submittedBy: 'Panji Surya Dewata (Divisi Program)',
    submittedAt: '11 Oktober 2026, 11:15 WITA',
    status: 'disetujui',
    decision: 'siap_siar',
    fasilitasReady: {
      mcr: true,
      transmisi: true,
      studio: true,
      playbackServer: true,
    },
    catatanTeknis: 'Fasilitas dan seluruh kru teknik dinas pagi telah terkonfirmasi siap. Tidak ada kendala teknis.',
    reviewedBy: 'Bambang Triyono (Sub Koordinator Teknik)',
    reviewedAt: '11 Oktober 2026, 15:45 WITA',
    nomorSuratJawaban: 'SP-TEK/RUNDOWN/2026/10/012',
    programs: MOCK_DAILY_RUNDOWNS[0]?.programs || [],
    kerabatKerja: MOCK_DAILY_RUNDOWNS[0]?.kerabatKerjaSiaran || [],
  },
  {
    id: 'resp-rd-03',
    rundownId: 'rd-2026-10-13-pagi',
    tanggal: '2026-10-13',
    blok: 'Pagi',
    programNameSummary: 'Indonesia Pagi, Budaya Nusantara, Bali Hari Ini Pagi',
    submittedBy: 'Dewi Sartika (Divisi Program)',
    submittedAt: '12 Oktober 2026, 10:00 WITA',
    status: 'menunggu_respon',
    decision: 'siap_siar',
    fasilitasReady: {
      mcr: true,
      transmisi: true,
      studio: true,
      playbackServer: true,
    },
    catatanTeknis: 'Perlu konfirmasi pemancar transmisi cadangan sebelum live segmen pagi.',
    reviewedBy: 'Bambang Triyono (Sub Koordinator Teknik)',
    programs: MOCK_DAILY_RUNDOWNS[0]?.programs || [],
    kerabatKerja: MOCK_DAILY_RUNDOWNS[0]?.kerabatKerjaSiaran || [],
  },
];

export const JawabanRundownView: React.FC<JawabanRundownViewProps> = ({
  currentUserRole: _currentUserRole,
  onClose: _onClose,
  onOpenRundownDetail: _onOpenRundownDetail,
  activeDivision: _activeDivision = 'teknik',
}) => {
  const [responseList, setResponseList] = useState<RundownTechnicalResponse[]>(INITIAL_RESPONSES);
  const [selectedResponseId, setSelectedResponseId] = useState<string>(INITIAL_RESPONSES[0].id);
  const [previewPrintModal, setPreviewPrintModal] = useState<{
    date: string;
    block: 'Pagi' | 'Sore';
    programs: RundownProgramRow[];
    rosterItems: BroadcastCrewRosterItem[];
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  const currentItem = responseList.find((r) => r.id === selectedResponseId) || responseList[0];

  const [editDecision, setEditDecision] = useState<'siap_siar' | 'catatan_teknis' | 'revisi'>(
    currentItem?.decision || 'siap_siar'
  );
  const [editFasilitas, setEditFasilitas] = useState({
    mcr: currentItem?.fasilitasReady.mcr ?? true,
    transmisi: currentItem?.fasilitasReady.transmisi ?? true,
    studio: currentItem?.fasilitasReady.studio ?? true,
    playbackServer: currentItem?.fasilitasReady.playbackServer ?? true,
  });
  const [editCatatan, setEditCatatan] = useState<string>(currentItem?.catatanTeknis || '');

  // Handle select item
  const handleSelectItem = (item: RundownTechnicalResponse) => {
    setSelectedResponseId(item.id);
    setEditDecision(item.decision);
    setEditFasilitas({ ...item.fasilitasReady });
    setEditCatatan(item.catatanTeknis);
  };

  // Submit Answer to Program
  const handleSubmitAnswer = () => {
    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')} Oktober 2026, ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;

    const newStatus =
      editDecision === 'siap_siar'
        ? 'disetujui'
        : editDecision === 'catatan_teknis'
        ? 'disetujui_bersyarat'
        : 'perlu_revisi';

    const generatedNumber = `BA-TEK/RUNDOWN/${now.getFullYear()}/10/${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

    setResponseList((prev) =>
      prev.map((r) => {
        if (r.id !== selectedResponseId) return r;
        return {
          ...r,
          status: newStatus,
          decision: editDecision,
          fasilitasReady: editFasilitas,
          catatanTeknis: editCatatan,
          reviewedAt: timeStr,
          nomorSuratJawaban: r.nomorSuratJawaban || generatedNumber,
        };
      })
    );

    setNotification({
      type: 'success',
      message: `Jawaban & konfirmasi teknis untuk Rundown ${currentItem.blok} (${currentItem.tanggal}) berhasil dikirim ke Divisi Program!`,
    });

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const pendingCount = responseList.filter((r) => r.status === 'menunggu_respon').length;
  const approvedCount = responseList.filter(
    (r) => r.status === 'disetujui' || r.status === 'disetujui_bersyarat'
  ).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 9999,
            backgroundColor: '#065F46',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
            fontWeight: 600,
            border: '1px solid #10B981',
          }}
        >
          <CheckCircle2 size={18} color="#34D399" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #A7F3D0',
              color: '#059669',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Jawaban & Verifikasi Teknis Rundown Siaran
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #A7F3D0',
                }}
              >
                Divisi Teknik Operasional
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
              Review kelayakan fasilitas studio, pemancar, dan kirimkan respon resmi kesiapan teknis atas rundown siaran harian yang diajukan Divisi Program.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              textAlign: 'right',
              paddingRight: 14,
              borderRight: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Menunggu Jawaban</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: pendingCount > 0 ? '#D97706' : '#059669' }}>
              {pendingCount} Rundown
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Telah Dijawab</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
              {approvedCount} Berkas
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: List of Rundowns from Program */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748B',
              letterSpacing: 0.6,
              paddingLeft: 4,
            }}
          >
            Daftar Rundown Masuk dari Program ({responseList.length})
          </div>

          {responseList.map((item) => {
            const isSelected = item.id === selectedResponseId;
            const isPending = item.status === 'menunggu_respon';

            return (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #059669' : '1px solid #E2E8F0',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(5, 150, 105, 0.12)'
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Header row in card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        backgroundColor: item.blok === 'Pagi' ? '#FEF3C7' : '#EDE9FE',
                        color: item.blok === 'Pagi' ? '#92400E' : '#6D28D9',
                        padding: '2px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                      }}
                    >
                      Blok {item.blok}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                      {item.tanggal}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: isPending ? '#FEF3C7' : '#D1FAE5',
                      color: isPending ? '#B45309' : '#065F46',
                      border: `1px solid ${isPending ? '#FDE68A' : '#A7F3D0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isPending ? <Clock size={11} /> : <Check size={11} />}
                    {isPending ? 'Perlu Respon' : 'Dijawab Teknik'}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#1E293B',
                    lineHeight: 1.35,
                    marginBottom: 8,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.programNameSummary}
                </div>

                <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Pengirim:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{item.submittedBy}</span>
                </div>

                {item.nomorSuratJawaban && (
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'monospace',
                      color: '#059669',
                      fontWeight: 700,
                      marginTop: 6,
                      backgroundColor: '#ECFDF5',
                      padding: '2px 6px',
                      borderRadius: 4,
                      display: 'inline-block',
                    }}
                  >
                    {item.nomorSuratJawaban}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Review & Answer Form */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Card Title Bar */}
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Rundown Penyiaran Siaran {currentItem.blok} &mdash; {currentItem.tanggal}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: currentItem.status === 'menunggu_respon' ? '#FEF3C7' : '#D1FAE5',
                    color: currentItem.status === 'menunggu_respon' ? '#B45309' : '#065F46',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  {currentItem.status === 'menunggu_respon'
                    ? 'Menunggu Jawaban Divisi Teknik'
                    : 'Telah Dijawab & Disetujui Teknik'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Diajukan oleh: <strong>{currentItem.submittedBy}</strong> &bull; {currentItem.submittedAt}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Preview Rundown Sheet Button */}
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setPreviewPrintModal({
                    date: currentItem.tanggal,
                    block: currentItem.blok,
                    programs: currentItem.programs,
                    rosterItems: currentItem.kerabatKerja,
                  })
                }
                style={{ height: 34, fontSize: 12, padding: '0 12px', gap: 6 }}
              >
                <Printer size={14} /> Pratinjau Lembar Rundown (A4)
              </button>
            </div>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Section A: Ringkasan Kebutuhan Fasilitas & Program */}
            <div>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Layers size={16} color="#059669" />
                <span>Ringkasan Beban Penyiaran & Studio</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748B' }}>Total Mata Acara</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {currentItem.programs.length} Program
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748B' }}>Sumber Siaran Digunakan</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    Studio 1, Studio 2, Storage 3, Relay
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748B' }}>Kru Operasional Siaran</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    15 Posisi Terhubung (W1)
                  </div>
                </div>
              </div>

              {/* Programs Quick List */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  fontSize: 12,
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700 }}>
                    <tr>
                      <th style={{ padding: '8px 12px', width: 70 }}>Jam</th>
                      <th style={{ padding: '8px 12px' }}>Mata Acara</th>
                      <th style={{ padding: '8px 12px', width: 90 }}>Tayang</th>
                      <th style={{ padding: '8px 12px', width: 130 }}>Sumber / Lokasi</th>
                      <th style={{ padding: '8px 12px', width: 90 }}>Sisipan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItem.programs.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        }}
                      >
                        <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontWeight: 600 }}>
                          {p.jamMulai.slice(0, 5)}
                        </td>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: '#0F172A' }}>
                          {p.mataAcara}
                        </td>
                        <td style={{ padding: '7px 12px' }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: p.tayang === 'Live' ? '#FEE2E2' : '#F1F5F9',
                              color: p.tayang === 'Live' ? '#DC2626' : '#475569',
                            }}
                          >
                            {p.tayang}
                          </span>
                        </td>
                        <td style={{ padding: '7px 12px', color: '#334155' }}>
                          {p.sumber}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#64748B' }}>
                          {p.sisipanList?.length || 0} item
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B: Formulir Verifikasi Kesiapan Fasilitas Teknik */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: '20px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Activity size={16} color="#059669" />
                <span>1. Ceklis Kesiapan Fasilitas Teknis Siaran</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editFasilitas.mcr}
                    onChange={(e) => setEditFasilitas({ ...editFasilitas, mcr: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#059669' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A' }}>Master Control Room (MCR) & CCU</strong>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Switcher siaran, audio console, dan monitoring</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editFasilitas.transmisi}
                    onChange={(e) => setEditFasilitas({ ...editFasilitas, transmisi: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#059669' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A' }}>Pemancar & Transmisi Digital</strong>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Tx Bukit Bakung & Kintamani siap on-air</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editFasilitas.studio}
                    onChange={(e) => setEditFasilitas({ ...editFasilitas, studio: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#059669' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A' }}>Studio Produksi & Tata Cahaya</strong>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Kamera studio, tata cahaya, dan intercom</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editFasilitas.playbackServer}
                    onChange={(e) => setEditFasilitas({ ...editFasilitas, playbackServer: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#059669' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A' }}>Server Playback & Titlebox</strong>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Storage 3, Playbox 3/4, dan rundown sync</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Section C: Pilihan Keputusan & Catatan Teknis */}
            <div>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FileText size={16} color="#059669" />
                <span>2. Keputusan Jawaban & Rekomendasi Teknik</span>
              </div>

              {/* Radio options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '14px',
                    borderRadius: 8,
                    backgroundColor: editDecision === 'siap_siar' ? '#ECFDF5' : '#FFFFFF',
                    border: editDecision === 'siap_siar' ? '2px solid #059669' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={editDecision === 'siap_siar'}
                    onChange={() => setEditDecision('siap_siar')}
                    style={{ marginTop: 2, accentColor: '#059669' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#065F46', display: 'block' }}>
                      Disetujui Penuh (Siap Siar)
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      Semua fasilitas dan kru teknik siap menjalankan rundown tanpa hambatan.
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '14px',
                    borderRadius: 8,
                    backgroundColor: editDecision === 'catatan_teknis' ? '#FEF3C7' : '#FFFFFF',
                    border: editDecision === 'catatan_teknis' ? '2px solid #D97706' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={editDecision === 'catatan_teknis'}
                    onChange={() => setEditDecision('catatan_teknis')}
                    style={{ marginTop: 2, accentColor: '#D97706' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#92400E', display: 'block' }}>
                      Disetujui Bersyarat
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      Disetujui dengan catatan teknis khusus yang harus diperhatikan tim siaran.
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '14px',
                    borderRadius: 8,
                    backgroundColor: editDecision === 'revisi' ? '#FEE2E2' : '#FFFFFF',
                    border: editDecision === 'revisi' ? '2px solid #DC2626' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={editDecision === 'revisi'}
                    onChange={() => setEditDecision('revisi')}
                    style={{ marginTop: 2, accentColor: '#DC2626' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, color: '#991B1B', display: 'block' }}>
                      Perlu Penyesuaian Program
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      Ada bentrok studio / kendala peralatan yang harus disesuaikan Program.
                    </span>
                  </div>
                </label>
              </div>

              {/* Textarea for Technical Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Catatan Teknis Resmi untuk Divisi Program:
                </label>
                <textarea
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan catatan teknis operasional (misal: jam stand-by studio, verifikasi materi playbox, kondisi transmisi)..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Penanggung Jawab Footer & Action Button */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Penanggung Jawab Verifikasi:</div>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>{currentItem.reviewedBy}</strong>
                  {currentItem.reviewedAt && (
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                      Dijawab pada: {currentItem.reviewedAt}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={handleSubmitAnswer}
                    style={{
                      height: 42,
                      padding: '0 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      gap: 8,
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                    }}
                  >
                    <Send size={15} />
                    <span>Kirim Jawaban ke Divisi Program</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PRATINJAU RUNDOWN SIARAN */}
      {previewPrintModal && (
        <RundownPrintModal
          isOpen={Boolean(previewPrintModal)}
          onClose={() => setPreviewPrintModal(null)}
          date={previewPrintModal.date}
          block={previewPrintModal.block}
          programs={previewPrintModal.programs}
          rosterItems={previewPrintModal.rosterItems}
        />
      )}
    </div>
  );
};

export default JawabanRundownView;
