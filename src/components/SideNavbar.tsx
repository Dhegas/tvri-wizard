import React, { useState, useEffect } from 'react';
import {
  Tv,
  Radio,
  Film,
  Calendar,
  Users,
  FileText,
  CalendarCheck,
  Shield,
  Clock,
  ChevronRight,
  Layers,
} from 'lucide-react';

export type ActiveView =
  | 'dashboard'
  | 'pola_acara'
  | 'wizard_1_jadwal'
  | 'wizard_2_rundown'
  | 'wizard_3_spr'
  | 'wizard_4_assignment'
  | 'legacy_flow';

export type DivisionType = 'program' | 'teknik';

interface SideNavbarProps {
  activeDivision: DivisionType;
  onSelectDivision: (division: DivisionType) => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  pendingAssignmentCount: number;
  sprTotalCount: number;
  returnedRundownCount: number;
  userProfile: {
    name: string;
    phone: string;
  };
  onOpenFirstLogin: () => void;
}

export const SideNavbar: React.FC<SideNavbarProps> = ({
  activeDivision,
  onSelectDivision,
  activeView,
  onSelectView,
  pendingAssignmentCount,
  sprTotalCount,
  returnedRundownCount,
  userProfile,
  onOpenFirstLogin,
}) => {
  // Live clock formatted in WITA (UTC+8)
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Formatted in WITA
      const formatted = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeStr(`${formatted} WITA`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      className="side-nav"
      style={{
        width: 280,
        minWidth: 280,
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid #1E293B',
        zIndex: 50,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
        userSelect: 'none',
      }}
    >
      {/* 1. Header: Brand Logo & Station Identity */}
      <div
        style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#1E3FA8',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 63, 168, 0.4)',
            flexShrink: 0,
          }}
        >
          <Tv size={22} strokeWidth={2.5} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, letterSpacing: 0.5, color: '#FFFFFF' }}>
              TVRI BALI
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid #334155',
              }}
            >
              SAD v1.1
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            Penjadwalan & Penugasan Kru
          </div>
        </div>
      </div>

      {/* 2. Division Switcher Tabs (Strict separation: Divisi Program vs Divisi Teknik) */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E293B' }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
          }}
        >
          Pilih Divisi Operasional
        </div>

        <div
          role="tablist"
          aria-label="Pilih Divisi"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#1E293B',
            padding: 3,
            borderRadius: 8,
            gap: 3,
          }}
        >
          {/* Tab Program */}
          <button
            type="button"
            role="tab"
            aria-selected={activeDivision === 'program'}
            onClick={() => {
              onSelectDivision('program');
              // If currently in a technical-only view, switch to dashboard
              if (activeView === 'wizard_4_assignment' || activeView === 'legacy_flow') {
                onSelectView('dashboard');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 6px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeDivision === 'program' ? 700 : 500,
              backgroundColor: activeDivision === 'program' ? '#7C3AED' : 'transparent',
              color: activeDivision === 'program' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.15s ease',
            }}
          >
            <Radio size={14} />
            <span>Program</span>
            {returnedRundownCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  borderRadius: 10,
                  padding: '1px 5px',
                  fontWeight: 800,
                }}
              >
                {returnedRundownCount}
              </span>
            )}
          </button>

          {/* Tab Teknik */}
          <button
            type="button"
            role="tab"
            aria-selected={activeDivision === 'teknik'}
            onClick={() => {
              onSelectDivision('teknik');
              // If currently in program-specific wizard, switch to dashboard
              if (activeView === 'wizard_3_spr' || activeView === 'legacy_flow') {
                onSelectView('dashboard');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 6px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeDivision === 'teknik' ? 700 : 500,
              backgroundColor: activeDivision === 'teknik' ? '#059669' : 'transparent',
              color: activeDivision === 'teknik' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} />
            <span>Teknik</span>
            {pendingAssignmentCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  borderRadius: 10,
                  padding: '1px 5px',
                  fontWeight: 800,
                }}
              >
                {pendingAssignmentCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Navigation Menu Items (Grouped strictly per division) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Navigation Group for DIVISI PROGRAM */}
        {activeDivision === 'program' && (
          <>
            {/* Group 1: Program Penyiaran */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Siaran Harian (Penyiaran)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Pola Acara Stasiun (Oktober 2026) */}
                <button
                  type="button"
                  onClick={() => onSelectView('pola_acara')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'pola_acara' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'pola_acara' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Layers size={16} color={activeView === 'pola_acara' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'pola_acara' ? 700 : 500 }}>
                      Pola Acara Stasiun
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'pola_acara' ? '#DBEAFE' : '#64748B' }}>
                      Oktober 2026 (Acuan Rundown)
                    </div>
                  </div>
                  {activeView === 'pola_acara' && <ChevronRight size={14} color="#93C5FD" />}
                </button>

                {/* Wizard 2: Rundown Harian */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_2_rundown')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_2_rundown' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'wizard_2_rundown' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Radio size={16} color={activeView === 'wizard_2_rundown' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'wizard_2_rundown' ? 700 : 500 }}>
                      Rundown Harian (W2)
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_2_rundown' ? '#DBEAFE' : '#64748B' }}>
                      Strip waktu & kerabat siaran
                    </div>
                  </div>
                  {activeView === 'wizard_2_rundown' && <ChevronRight size={14} color="#93C5FD" />}
                </button>

                {/* View Jadwal Dinas (Wizard 1 read-only / coordination) */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_1_jadwal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_1_jadwal' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'wizard_1_jadwal' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Calendar size={16} color={activeView === 'wizard_1_jadwal' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'wizard_1_jadwal' ? 700 : 500 }}>
                      Jadwal Dinas Siaran
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_1_jadwal' ? '#DBEAFE' : '#64748B' }}>
                      Lihat jadwal bulanan siaran
                    </div>
                  </div>
                  {activeView === 'wizard_1_jadwal' && <ChevronRight size={14} color="#93C5FD" />}
                </button>
              </div>
            </div>

            {/* Group 2: Program Produksi */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Operasional Produksi
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Wizard 3: Susun SPR Baru */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_3_spr')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_3_spr' ? '#7C3AED' : 'transparent',
                    color: activeView === 'wizard_3_spr' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Film size={16} color={activeView === 'wizard_3_spr' ? '#DDD6FE' : '#A78BFA'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'wizard_3_spr' ? 700 : 500 }}>
                      Susun SPR Baru (W3)
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_3_spr' ? '#EDE9FE' : '#64748B' }}>
                      Permintaan kru & peralatan
                    </div>
                  </div>
                  {activeView === 'wizard_3_spr' && <ChevronRight size={14} color="#DDD6FE" />}
                </button>

                {/* Dashboard / Daftar Berkas SPR */}
                <button
                  type="button"
                  onClick={() => onSelectView('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'dashboard' ? '#1E293B' : 'transparent',
                    color: activeView === 'dashboard' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <FileText size={16} color={activeView === 'dashboard' ? '#38BDF8' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'dashboard' ? 700 : 500 }}>
                      Daftar Berkas SPR
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'dashboard' ? '#94A3B8' : '#64748B' }}>
                      {sprTotalCount} Berkas Terdaftar
                    </div>
                  </div>
                  {activeView === 'dashboard' && <ChevronRight size={14} color="#38BDF8" />}
                </button>
              </div>
            </div>

            {/* Group 3: Alur Klasik Legacy */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Alur Klasik (Legacy)
              </div>

              <button
                type="button"
                onClick={() => onSelectView('legacy_flow')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: activeView === 'legacy_flow' ? '#1E293B' : 'transparent',
                  color: activeView === 'legacy_flow' ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <CalendarCheck size={16} color="#94A3B8" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: activeView === 'legacy_flow' ? 700 : 500 }}>
                    Formulir Wizard A
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748B' }}>Alur pengajuan kru lama</div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Navigation Group for DIVISI TEKNIK */}
        {activeDivision === 'teknik' && (
          <>
            {/* Group 1: Operasional Penyiaran */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Operasional Penyiaran
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Pola Acara Stasiun (Acuan Fasilitas) */}
                <button
                  type="button"
                  onClick={() => onSelectView('pola_acara')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'pola_acara' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'pola_acara' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Layers size={16} color={activeView === 'pola_acara' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'pola_acara' ? 700 : 500 }}>
                      Pola Acara Stasiun
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'pola_acara' ? '#DBEAFE' : '#64748B' }}>
                      Acuan fasilitas & pemancar
                    </div>
                  </div>
                  {activeView === 'pola_acara' && <ChevronRight size={14} color="#93C5FD" />}
                </button>

                {/* Wizard 1: Jadwal Dinas Bulanan */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_1_jadwal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_1_jadwal' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'wizard_1_jadwal' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Calendar size={16} color={activeView === 'wizard_1_jadwal' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'wizard_1_jadwal' ? 700 : 500 }}>
                      Jadwal Dinas (W1)
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_1_jadwal' ? '#DBEAFE' : '#64748B' }}>
                      Matriks 24 jam / 12 profesi
                    </div>
                  </div>
                  {activeView === 'wizard_1_jadwal' && <ChevronRight size={14} color="#93C5FD" />}
                </button>

                {/* Wizard 2: Monitoring Rundown */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_2_rundown')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_2_rundown' ? '#1E3FA8' : 'transparent',
                    color: activeView === 'wizard_2_rundown' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Radio size={16} color={activeView === 'wizard_2_rundown' ? '#93C5FD' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'wizard_2_rundown' ? 700 : 500 }}>
                      Rundown Siaran (W2)
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_2_rundown' ? '#DBEAFE' : '#64748B' }}>
                      Review teknis kerabat siaran
                    </div>
                  </div>
                  {activeView === 'wizard_2_rundown' && <ChevronRight size={14} color="#93C5FD" />}
                </button>
              </div>
            </div>

            {/* Group 2: Operasional Produksi */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Operasional Produksi
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Wizard 4: Penugasan SPR & Surat Penunjukan */}
                <button
                  type="button"
                  onClick={() => onSelectView('wizard_4_assignment')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'wizard_4_assignment' ? '#059669' : 'transparent',
                    color: activeView === 'wizard_4_assignment' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Users size={16} color={activeView === 'wizard_4_assignment' ? '#A7F3D0' : '#34D399'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: activeView === 'wizard_4_assignment' ? 700 : 500 }}>
                        Penugasan SPR (W4)
                      </span>
                      {pendingAssignmentCount > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            backgroundColor: '#F59E0B',
                            color: '#FFFFFF',
                            borderRadius: 10,
                            padding: '1px 6px',
                            fontWeight: 800,
                          }}
                        >
                          {pendingAssignmentCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'wizard_4_assignment' ? '#D1FAE5' : '#64748B' }}>
                      Plotting kru & Surat Penunjukan
                    </div>
                  </div>
                  {activeView === 'wizard_4_assignment' && <ChevronRight size={14} color="#A7F3D0" />}
                </button>

                {/* Dashboard / Antrian SPR Masuk */}
                <button
                  type="button"
                  onClick={() => onSelectView('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: activeView === 'dashboard' ? '#1E293B' : 'transparent',
                    color: activeView === 'dashboard' ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <FileText size={16} color={activeView === 'dashboard' ? '#38BDF8' : '#94A3B8'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: activeView === 'dashboard' ? 700 : 500 }}>
                      Antrian SPR Masuk
                    </div>
                    <div style={{ fontSize: 10.5, color: activeView === 'dashboard' ? '#94A3B8' : '#64748B' }}>
                      {sprTotalCount} Berkas Terdaftar
                    </div>
                  </div>
                  {activeView === 'dashboard' && <ChevronRight size={14} color="#38BDF8" />}
                </button>
              </div>
            </div>

            {/* Group 3: Alur Klasik Legacy */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  padding: '0 8px 6px',
                }}
              >
                Alur Klasik (Legacy)
              </div>

              <button
                type="button"
                onClick={() => onSelectView('legacy_flow')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: activeView === 'legacy_flow' ? '#1E293B' : 'transparent',
                  color: activeView === 'legacy_flow' ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Users size={16} color="#94A3B8" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: activeView === 'legacy_flow' ? 700 : 500 }}>
                    Plotting Wizard B
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748B' }}>Penugasan cepat lama</div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 4. Footer: User Profile, Activation Trigger & Live Time WITA */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid #1E293B',
          backgroundColor: '#0B1120',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: activeDivision === 'teknik' ? '#059669' : '#7C3AED',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {userProfile.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {userProfile.name}
            </div>
            <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
              {activeDivision === 'teknik' ? 'Sub Koordinator Teknik' : 'Pranata Siaran Program'}
            </div>
          </div>
        </div>

        {/* Buttons: Activation Dialog & Status Clock */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #1E293B' }}>
          <button
            type="button"
            onClick={onOpenFirstLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: 0,
            }}
            title="Buka dialog aktivasi akun pertama kali (Section 8.4)"
          >
            <Shield size={12} />
            <span>Aktivasi Akun</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94A3B8' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <Clock size={11} />
            <span>{timeStr || 'WITA'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideNavbar;
