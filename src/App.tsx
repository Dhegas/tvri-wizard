import { useState } from 'react';
import {
  Users,
  Calendar,
  Radio,
  Film,
  Printer,
  Clock,
  Tv,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { SideNavbar } from './components/SideNavbar';
import type { ActiveView, DivisionType } from './components/SideNavbar';
import { WizardA } from './components/WizardA';
import { WizardB } from './components/WizardB';
import { JadwalDinasWizard } from './components/JadwalDinasWizard';
import { RundownWizard } from './components/RundownWizard';
import { RundownTeknikHistoryView } from './components/RundownTeknikHistoryView';
import { JawabanRundownView } from './components/JawabanRundownView';
import { PolaAcaraView } from './components/PolaAcaraView';
import { SPRWizard } from './components/SPRWizard';
import { SPRPrintModal } from './components/SPRPrintModal';
import { SPRAssignmentWizard } from './components/SPRAssignmentWizard';
import { SuratPenunjukanPrintModal } from './components/SuratPenunjukanPrintModal';
import { FirstLoginModal } from './components/FirstLoginModal';
import { SuratPerintahModal } from './components/SuratPerintahModal';
import {
  INITIAL_REQUESTS,
  MOCK_SPR_DOCUMENTS,
  MOCK_DUTY_SCHEDULE,
  MOCK_SPR_ASSIGNMENT,
} from './data/mockData';
import type {
  CrewRequest,
  SavedAssignment,
  UserRole,
  SPRDocument,
  SPRAssignmentDocument,
} from './types';

export function App() {
  const [activeDivision, setActiveDivision] = useState<DivisionType>('teknik');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [activeProgramType, setActiveProgramType] = useState<'penyiaran' | 'produksi'>('penyiaran');
  const [requests, setRequests] = useState<CrewRequest[]>(INITIAL_REQUESTS);
  const [sprList, setSprList] = useState<SPRDocument[]>(MOCK_SPR_DOCUMENTS);
  const [showFirstLogin, setShowFirstLogin] = useState<boolean>(false);
  const [selectedSprForAssignmentId, setSelectedSprForAssignmentId] = useState<string | undefined>(undefined);
  const [selectedSprForEdit, setSelectedSprForEdit] = useState<SPRDocument | null>(null);
  const [selectedProgramForSpr, setSelectedProgramForSpr] = useState<{
    programName: string;
    format: string;
    duration: string;
  } | null>(null);
  const [previewSprDocument, setPreviewSprDocument] = useState<SPRDocument | null>(null);
  const [previewSuratPenunjukan, setPreviewSuratPenunjukan] = useState<{
    spr: SPRDocument;
    assignment: SPRAssignmentDocument;
  } | null>(null);
  const [sprAssignments, setSprAssignments] = useState<Record<string, SPRAssignmentDocument>>({
    'spr-mock-01': MOCK_SPR_ASSIGNMENT,
  });
  const [userProfile, setUserProfile] = useState({
    name: 'Bambang Triyono',
    phone: '0812-3456-7890',
  });

  // Sample saved assignment for direct preview if user wants
  const [previewSp, setPreviewSp] = useState<SavedAssignment | null>(null);
  const [showTeknikRundownMatrix, setShowTeknikRundownMatrix] = useState<boolean>(false);

  const activeRole: UserRole = activeDivision === 'program' ? 'admin_program' : 'admin_teknik';

  const handleSelectDivision = (division: DivisionType) => {
    setActiveDivision(division);
    setShowTeknikRundownMatrix(false);
  };

  // Handle new request submitted from Wizard A
  const handleNewRequest = (newReq: CrewRequest) => {
    setRequests([newReq, ...requests]);
  };

  // Handle assignment completed in Wizard B
  const handleAssignmentComplete = (saved: SavedAssignment) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === saved.requestId ? { ...r, status: 'Ditugaskan' } : r
      )
    );
  };

  // Handle sending finalized rundown back to Divisi Program
  const handleSendBackToProgram = (requestId: string, saved: SavedAssignment) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Map assigned crew to kerabatKerja items so Program can view the final names!
        const updatedKerabatKerja = r.kerabatKerja?.map((k) => {
          const matchedCrew = saved.crew.filter(
            (c) =>
              c.role.toLowerCase() === k.peran.toLowerCase() ||
              (c.secondaryRole && c.secondaryRole.toLowerCase().includes(k.peran.toLowerCase()))
          );
          if (matchedCrew.length > 0) {
            const names = matchedCrew.map((c) =>
              c.secondaryRole ? `${c.name} (${c.secondaryRole})` : c.name
            );
            return {
              ...k,
              personil: names.join(', '),
              namaList: names,
            };
          }
          return k;
        });

        return {
          ...r,
          status: 'Dikirim ke Program',
          returnedToProgramAt: `Hari ini, pukul ${timeStr} WITA`,
          kerabatKerja: updatedKerabatKerja || r.kerabatKerja,
        };
      })
    );
  };

  const returnedCount = requests.filter((r) => r.status === 'Dikirim ke Program').length;

  const pendingSprAssignmentCount = sprList.filter(
    (s) => s.status === 'Diajukan' || s.status === 'Ditugaskan sebagian'
  ).length;

  const completedSprCount = sprList.filter((s) => s.status === 'Ditugaskan lengkap').length;

  return (
    <div className="app-layout">
      {/* Broadcast Studio Side Navbar */}
      <SideNavbar
        activeDivision={activeDivision}
        onSelectDivision={handleSelectDivision}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        pendingAssignmentCount={pendingSprAssignmentCount}
        sprTotalCount={sprList.length}
        returnedRundownCount={returnedCount}
        pendingRundownReviewCount={2}
        userProfile={userProfile}
        onOpenFirstLogin={() => setShowFirstLogin(true)}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Breadcrumb & Status Bar */}
        <header className="top-breadcrumb-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: activeDivision === 'program' ? '#EDE9FE' : '#D1FAE5',
                color: activeDivision === 'program' ? '#6D28D9' : '#065F46',
                border: `1px solid ${activeDivision === 'program' ? '#DDD6FE' : '#A7F3D0'}`,
                letterSpacing: 0.5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: activeDivision === 'program' ? '#7C3AED' : '#059669',
                }}
              />
              {activeDivision === 'program' ? 'DIVISI PROGRAM' : 'DIVISI TEKNIK'}
            </div>

            <span style={{ color: 'var(--border)' }}>/</span>

            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
              {activeView === 'dashboard'
                ? activeDivision === 'program'
                  ? 'Dasbor Perencanaan & Produksi Siaran'
                  : 'Dasbor Operasional & Penugasan Kru Teknik'
                : activeView === 'pola_acara'
                ? 'Pola Acara Stasiun & Master Grid Penyiaran (Oktober 2026)'
                : activeView === 'wizard_1_jadwal'
                ? 'Jadwal Dinas Bulanan Penyiaran (Wizard 1)'
                : activeView === 'wizard_2_rundown'
                ? activeDivision === 'teknik'
                  ? 'Highlight, Riwayat & Penugasan Kru Rundown Siaran'
                  : 'Rundown Harian Penyiaran (Wizard 2)'
                : activeView === 'jawaban_rundown'
                ? 'Jawaban & Verifikasi Teknis Rundown Siaran Harian'
                : activeView === 'wizard_3_spr'
                ? 'Penyusunan SPR Permintaan Kru & Peralatan (Wizard 3)'
                : activeView === 'wizard_4_assignment'
                ? 'Penugasan Kru SPR & Surat Penunjukan (Wizard 4)'
                : activeDivision === 'program'
                ? 'Arsip Alur Lama: Formulir Pengajuan Kru (Wizard A v1.0)'
                : 'Arsip Alur Lama: Plotting Cepat Kru (Wizard B v1.0)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeView !== 'dashboard' && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setActiveView('dashboard');
                  setShowTeknikRundownMatrix(false);
                  setSelectedSprForEdit(null);
                  setSelectedSprForAssignmentId(undefined);
                }}
                style={{ height: 34, fontSize: 12.5, padding: '0 14px', gap: 6 }}
              >
                ← Kembali ke Dasbor
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-gray"
              style={{ height: 34, fontSize: 12, padding: '0 10px', gap: 5 }}
              onClick={() => setShowFirstLogin(true)}
              title="Buka dialog aktivasi akun pertama kali (Section 8.4)"
            >
              <Shield size={13} />
              <span>Aktivasi Akun</span>
            </button>
          </div>
        </header>

        {/* View Routing Body */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {activeView === 'pola_acara' ? (
            <PolaAcaraView
              currentUserRole={activeRole}
              onGoToRundownWithDay={(_day, _block) => {
                setActiveDivision('program');
                setActiveView('wizard_2_rundown');
              }}
              onGoToSprWithProgram={(programName, format, duration) => {
                setSelectedSprForEdit(null);
                setSelectedProgramForSpr({ programName, format, duration });
                setActiveDivision('program');
                setActiveView('wizard_3_spr');
              }}
            />
          ) : activeView === 'wizard_1_jadwal' ? (
            <JadwalDinasWizard
              currentUserRole={activeRole}
              onClose={() => setActiveView('dashboard')}
            />
          ) : activeView === 'wizard_2_rundown' ? (
            activeDivision === 'teknik' && !showTeknikRundownMatrix ? (
              <RundownTeknikHistoryView
                currentUserRole={activeRole}
                onOpenJadwalDinas={() => setActiveView('wizard_1_jadwal')}
                onOpenFullMatrix={() => setShowTeknikRundownMatrix(true)}
                onOpenJawabanRundown={() => setActiveView('jawaban_rundown')}
              />
            ) : (
              <RundownWizard
                currentUserRole={activeRole}
                onClose={() => {
                  if (activeDivision === 'teknik') {
                    setShowTeknikRundownMatrix(false);
                  } else {
                    setActiveView('dashboard');
                  }
                }}
                onOpenJadwalDinas={() => setActiveView('wizard_1_jadwal')}
              />
            )
          ) : activeView === 'jawaban_rundown' ? (
            <JawabanRundownView
              currentUserRole={activeRole}
              activeDivision={activeDivision}
              onClose={() => setActiveView('dashboard')}
              onOpenRundownDetail={(_date, _block) => {
                setActiveView('wizard_2_rundown');
              }}
            />
          ) : activeView === 'wizard_3_spr' ? (
            <SPRWizard
              currentUserRole={activeRole}
              existingSpr={selectedSprForEdit}
              initialProgramFromPola={selectedProgramForSpr}
              onClose={() => {
                setActiveView('dashboard');
                setSelectedSprForEdit(null);
                setSelectedProgramForSpr(null);
              }}
              onSubmitSPR={(newSpr) => {
                setSelectedProgramForSpr(null);
                setSprList((prev) => {
                  const idx = prev.findIndex((s) => s.id === newSpr.id);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = newSpr;
                    return copy;
                  }
                  return [newSpr, ...prev];
                });
                setActiveView('dashboard');
              }}
            />
          ) : activeView === 'wizard_4_assignment' ? (
            <SPRAssignmentWizard
              currentUserRole={activeRole}
              initialSprId={selectedSprForAssignmentId}
              dutySchedule={MOCK_DUTY_SCHEDULE}
              allSPRs={sprList}
              onClose={() => {
                setActiveView('dashboard');
                setSelectedSprForAssignmentId(undefined);
              }}
              onSaveAssignment={(assignment, updatedSpr) => {
                setSprAssignments((prev) => ({
                  ...prev,
                  [updatedSpr.id]: assignment,
                }));
                setSprList((prev) =>
                  prev.map((s) => (s.id === updatedSpr.id ? updatedSpr : s))
                );
              }}
            />
          ) : activeView === 'legacy_flow' ? (
            <div>
              {/* Compatibility / Legacy Flow Information Banner */}
              <div
                style={{
                  marginBottom: 20,
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400E' }}>
                      Mode Arsip & Kompatibilitas Alur Lama (v1.0)
                    </div>
                    <div style={{ fontSize: 12, color: '#B45309', marginTop: 2, lineHeight: 1.5 }}>
                      Formulir ini dipertahankan sebagai arsip data. Sesuai standar operasional <strong>SAD v1.1</strong>, kru siaran harian kini otomatis terbentuk dari Jadwal Dinas bulanan tanpa meminta kru di Rundown, dan kebutuhan kru hanya diajukan untuk produksi lewat <strong>SPR</strong>.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="button-primary"
                  style={{ height: 36, fontSize: 12.5, padding: '0 16px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() =>
                    setActiveView(activeDivision === 'program' ? 'wizard_2_rundown' : 'wizard_4_assignment')
                  }
                >
                  Buka Alur Resmi SAD v1.1 →
                </button>
              </div>

              {activeDivision === 'program' ? (
                <WizardA
                  key={`wizard-a-${activeProgramType}`}
                  onSuccessSubmit={handleNewRequest}
                  onGoToRundown={() => {
                    setActiveDivision('teknik');
                    setActiveView('wizard_2_rundown');
                  }}
                  existingRequests={requests}
                  programType={activeProgramType}
                  onProgramTypeChange={setActiveProgramType}
                />
              ) : (
                <WizardB
                  key={`wizard-b-${activeProgramType}`}
                  requests={requests}
                  onAssignmentComplete={handleAssignmentComplete}
                  onSendBackToProgram={handleSendBackToProgram}
                  programType={activeProgramType}
                  onProgramTypeChange={setActiveProgramType}
                />
              )}
            </div>
          ) : (
            /* Dashboard View: Separate UX for Program vs Teknik */
            <div>
              {/* Header Title Section */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
                  {activeDivision === 'program'
                    ? 'Dasbor Perencanaan & Produksi Siaran'
                    : 'Dasbor Operasional & Penugasan Kru Teknik'}
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {activeDivision === 'program'
                    ? 'Kelola alur siaran harian (Rundown W2), rancang permintaan kru produksi (SPR W3), dan pantau kesiapan penugasan dari Divisi Teknik.'
                    : 'Kendali penuh jadwal dinas bulanan 24 jam (W1), review rundown siaran harian (W2), dan penugasan resmi kru produksi (SPR W4).'}
                </p>
              </div>

              {/* KPI Metrics Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {activeDivision === 'program' ? (
                  <>
                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#EFF6FF',
                          color: '#2440B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Radio size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Rundown Siap Siar
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {returnedCount} Berkas
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#FAF5FF',
                          color: '#7C3AED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Film size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Total Dokumen SPR
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {sprList.length} Berkas
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Menunggu Penugasan
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {pendingSprAssignmentCount} Berkas
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Kru Selesai Ditugaskan
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {completedSprCount} Berkas
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AlertCircle size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          SPR Perlu Penugasan
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {pendingSprAssignmentCount} Berkas
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#EFF6FF',
                          color: '#2440B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Jadwal Dinas Siaran
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)' }}>
                          24 Jam / 12 Profesi
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Kru Selesai Ditugaskan
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {completedSprCount} Berkas
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-card">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#FAF5FF',
                          color: '#7C3AED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Tv size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                          Total Berkas SPR
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }} className="tabular">
                          {sprList.length} Berkas
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Banner Prompts */}
              {activeDivision === 'program' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  {/* Wizard 3 Card */}
                  <div
                    style={{
                      backgroundColor: '#FAF5FF',
                      border: '1px solid #DDD6FE',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Film size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Wizard 3: SPR &mdash; Permintaan Kru
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#EDE9FE',
                              color: '#6D28D9',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            SAD v1.1 S1–S4
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Ajukan kuota profesi kru & peralatan sistem produksi TVRI Bali ke Sub Koordinator Teknik.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        setSelectedSprForEdit(null);
                        setActiveView('wizard_3_spr');
                      }}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#7C3AED',
                        flexShrink: 0,
                      }}
                    >
                      <Film size={14} /> + Susun SPR
                    </button>
                  </div>

                  {/* Wizard 2 Card */}
                  <div
                    style={{
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                          flexShrink: 0,
                        }}
                      >
                        <Radio size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Wizard 2: Rundown Harian Penyiaran
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#DBEAFE',
                              color: '#1E3FA8',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            SAD v1.1 R1–R4
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Penyusunan rundown siaran harian, strip waktu visual, dan kerabat kerja resmi.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setActiveView('wizard_2_rundown')}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#1E3FA8',
                        flexShrink: 0,
                      }}
                    >
                      <Radio size={14} /> Buka Rundown
                    </button>
                  </div>

                  {/* Pola Acara Card */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Pola Acara Stasiun & Master Grid
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#E2E8F0',
                              color: '#0F172A',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Oktober 2026
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Dokumen acuan resmi penyiaran (27 slot waktu & 9 kategori) disahkan Kepala TVRI Bali.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setActiveView('pola_acara')}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={14} /> Lihat Pola Acara
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  {/* Wizard 4 Card */}
                  <div
                    style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Users size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Wizard 4: Penugasan Kru & Surat Penunjukan
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#D1FAE5',
                              color: '#065F46',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            SAD v1.1 P1–P4
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Plotting kru teknik, validasi bentrok/jeda istirahat, & penerbitan SP Sub Koordinator Teknik.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        setSelectedSprForAssignmentId(undefined);
                        setActiveView('wizard_4_assignment');
                      }}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#059669',
                        flexShrink: 0,
                      }}
                    >
                      <Users size={14} /> Buka Penugasan ({pendingSprAssignmentCount})
                    </button>
                  </div>

                  {/* Wizard 1 Card */}
                  <div
                    style={{
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#2440B8',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Calendar size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Wizard 1: Jadwal Dinas Bulanan
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#DBEAFE',
                              color: '#1E3FA8',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            SAD v1.1 J1–J4
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Kelola matriks jadwal dinas 24 jam untuk 12 profesi operasional penyiaran stasiun.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setActiveView('wizard_1_jadwal')}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#2440B8',
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={14} /> Buka Jadwal Dinas
                    </button>
                  </div>

                  {/* Pola Acara Teknik Card */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Pola Acara Stasiun & Master Grid
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#E2E8F0',
                              color: '#0F172A',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Oktober 2026
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Acuan transmisi & fasilitas penyiaran (Studio 1, Studio 2, Studio 3, MCR, OB Van).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setActiveView('pola_acara')}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={14} /> Lihat Pola Acara
                    </button>
                  </div>

                  {/* Rundown Siaran Teknik Card */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#0F766E',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Radio size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Rundown Siaran: Highlight & Riwayat
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#CCFBF1',
                              color: '#0F766E',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Siaran Hari Ini
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Highlight rundown hari ini, arsip riwayat siaran, cetak lembar tugas, dan plotting kru.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        setShowTeknikRundownMatrix(false);
                        setActiveView('wizard_2_rundown');
                      }}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#0F766E',
                        flexShrink: 0,
                      }}
                    >
                      <Radio size={14} /> Buka Rundown
                    </button>
                  </div>

                  {/* Jawaban Rundown Siaran Card */}
                  <div
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(16, 27, 45, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Radio size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Jawaban Rundown Siaran Harian
                          </strong>
                          <span
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            2 Menunggu Respon
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Review kelayakan teknis fasilitas MCR & pemancar atas rundown siaran harian dari Divisi Program.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setActiveView('jawaban_rundown')}
                      style={{
                        height: 38,
                        fontSize: 12.5,
                        padding: '0 16px',
                        gap: 6,
                        backgroundColor: '#059669',
                        flexShrink: 0,
                      }}
                    >
                      <Radio size={14} /> Jawab Rundown (2)
                    </button>
                  </div>
                </div>
              )}

              {/* SPR Documents Table Section */}
              <div className="panel-summary" style={{ padding: 22, marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                      {activeDivision === 'program'
                        ? `Daftar Berkas SPR Resmi Terdaftar (${sprList.length} Berkas)`
                        : `Antrian Dokumen SPR Produksi Masuk (${sprList.length} Berkas)`}
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {activeDivision === 'program'
                        ? 'Permohonan kru dan peralatan operasional produksi yang telah disusun oleh Divisi Program'
                        : 'Berkas permohonan kru yang siap ditugaskan personil teknik dan diterbitkan Surat Penunjukan'}
                    </span>
                  </div>

                  {activeDivision === 'program' && (
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        setSelectedSprForEdit(null);
                        setActiveView('wizard_3_spr');
                      }}
                      style={{ height: 34, fontSize: 12, padding: '0 14px', gap: 6, backgroundColor: '#7C3AED' }}
                    >
                      <Film size={13} /> + Buat Dokumen SPR Baru
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }}>
                  <table className="kerabat-table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 35 }}>No</th>
                        <th style={{ width: 170 }}>Nomor Surat / Versi</th>
                        <th>Program & Judul Acara</th>
                        <th style={{ width: 130 }}>Format & Durasi</th>
                        <th style={{ width: 95 }}>Sistem Alat</th>
                        <th style={{ width: 105 }}>Kru Diminta</th>
                        <th style={{ width: 140 }}>Status Siklus</th>
                        <th style={{ width: 330, textAlign: 'center' }}>Aksi Dokumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sprList.map((sprItem, idx) => (
                        <tr key={sprItem.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{sprItem.nomorSurat || '-'}</div>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Versi {sprItem.versi}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--ink)' }}>{sprItem.programName}</strong>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{sprItem.judul}</div>
                          </td>
                          <td>
                            <div>{sprItem.formatAcara}</div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{sprItem.durasi}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor: '#E2E8F0',
                                color: 'var(--ink)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {sprItem.sistemPeralatan.sistem}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#7C3AED' }}>{sprItem.totalCrewNeeded} Posisi</strong>
                            {sprItem.totalCrewAssigned > 0 && (
                              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                                Terisi: {sprItem.totalCrewAssigned}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor:
                                  sprItem.status === 'Ditugaskan lengkap'
                                    ? 'var(--success-container)'
                                    : sprItem.status === 'Ditugaskan sebagian'
                                    ? '#FEF3C7'
                                    : sprItem.status === 'Diajukan'
                                    ? '#EDE9FE'
                                    : sprItem.status === 'Menunggu Program'
                                    ? 'var(--warning-container)'
                                    : '#E2E8F0',
                                color:
                                  sprItem.status === 'Ditugaskan lengkap'
                                    ? 'var(--on-success-container)'
                                    : sprItem.status === 'Ditugaskan sebagian'
                                    ? '#92400E'
                                    : sprItem.status === 'Diajukan'
                                    ? '#6D28D9'
                                    : sprItem.status === 'Menunggu Program'
                                    ? 'var(--on-warning-container)'
                                    : 'var(--ink)',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 12,
                              }}
                            >
                              {sprItem.status === 'Diajukan'
                                ? 'Diajukan (Menunggu Jawaban Teknik)'
                                : sprItem.status === 'Ditolak'
                                ? 'Ditolak (Perlu Revisi)'
                                : sprItem.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {activeDivision === 'teknik' ? (
                                <button
                                  type="button"
                                  className="button-primary"
                                  onClick={() => {
                                    setSelectedSprForAssignmentId(sprItem.id);
                                    setActiveView('wizard_4_assignment');
                                  }}
                                  style={{
                                    height: 28,
                                    fontSize: 11,
                                    padding: '0 8px',
                                    gap: 4,
                                    backgroundColor:
                                      sprItem.status === 'Ditugaskan lengkap'
                                        ? '#4B5563'
                                        : '#059669',
                                  }}
                                  title="Buka Wizard 4 untuk menugaskan kru teknik resmi TVRI Bali"
                                >
                                  <Users size={12} /> Tugaskan Kru
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="button-secondary"
                                  onClick={() => {
                                    setSelectedSprForAssignmentId(sprItem.id);
                                    setActiveView('wizard_4_assignment');
                                  }}
                                  style={{
                                    height: 28,
                                    fontSize: 11,
                                    padding: '0 8px',
                                    gap: 4,
                                    borderColor: '#059669',
                                    color: '#059669',
                                  }}
                                  title="Lihat rincian dan status penugasan kerabat kerja oleh Divisi Teknik"
                                >
                                  <Users size={12} /> Lihat Kru
                                </button>
                              )}

                              <button
                                type="button"
                                className="button-secondary"
                                onClick={() => {
                                  const assignedDoc = sprAssignments[sprItem.id] || MOCK_SPR_ASSIGNMENT;
                                  setPreviewSuratPenunjukan({
                                    spr: sprItem,
                                    assignment: assignedDoc,
                                  });
                                }}
                                style={{
                                  height: 28,
                                  fontSize: 11,
                                  padding: '0 8px',
                                  gap: 4,
                                  borderColor: '#059669',
                                  color: '#059669',
                                  display: sprItem.status === 'Draf' ? 'none' : 'inline-flex',
                                }}
                                title="Lihat & cetak Surat Penunjukan Kerabat Kerja resmi Sub Koordinator Teknik"
                              >
                                <Printer size={12} /> Surat Penunjukan
                              </button>

                              {activeDivision === 'program' ? (
                                <>
                                  <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => setPreviewSprDocument(sprItem)}
                                    style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                                    title="Cetak lembar fisik SPR resmi A4"
                                  >
                                    Cetak SPR
                                  </button>

                                  <button
                                    type="button"
                                    className="button-secondary"
                                    disabled={sprItem.status === 'Diajukan'}
                                    onClick={() => {
                                      if (sprItem.status === 'Diajukan') return;
                                      setSelectedSprForEdit(sprItem);
                                      setActiveView('wizard_3_spr');
                                    }}
                                    style={{
                                      height: 28,
                                      fontSize: 11,
                                      padding: '0 8px',
                                      opacity: sprItem.status === 'Diajukan' ? 0.45 : 1,
                                      cursor: sprItem.status === 'Diajukan' ? 'not-allowed' : 'pointer',
                                    }}
                                    title={
                                      sprItem.status === 'Diajukan'
                                        ? 'SPR sedang diproses oleh Divisi Teknik. Anda harus menunggu jawaban dari Divisi Teknik (Penugasan Kru / Penolakan) sebelum dapat merevisi.'
                                        : 'Buka form wizard untuk merevisi SPR ini'
                                    }
                                  >
                                    Revisi
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="button-secondary"
                                  onClick={() => setPreviewSprDocument(sprItem)}
                                  style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                                  title="Lihat dokumen fisik SPR resmi A4 dari Divisi Program"
                                >
                                  Lihat SPR
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Siaran Harian Requests Tracking Table */}
              <div className="panel-summary" style={{ padding: 22 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                      Pelacakan Berkas Siaran Harian & Permintaan Kru ({requests.length} Berkas)
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Status pengajuan, plotting kru, dan pengembalian rundown dari teknik ke program
                    </span>
                  </div>

                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setActiveView('legacy_flow')}
                    style={{ height: 32, fontSize: 12, padding: '0 12px', gap: 5 }}
                  >
                    <Layers size={13} /> Buka Tampilan Alur Klasik
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }}>
                  <table className="kerabat-table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 35 }}>No</th>
                        <th>Program Siaran</th>
                        <th style={{ width: 140 }}>Kategori</th>
                        <th style={{ width: 160 }}>Waktu Pelaksanaan</th>
                        <th style={{ width: 140 }}>Status Alur</th>
                        <th style={{ width: 220, textAlign: 'center' }}>Aksi Berkas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req, idx) => (
                        <tr key={req.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--ink)' }}>{req.programName}</strong>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                              Pengusul: {req.requesterName}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: req.programType === 'produksi' ? '#FAF5FF' : '#EFF6FF',
                                color: req.programType === 'produksi' ? '#7C3AED' : '#1E3FA8',
                              }}
                            >
                              {req.programType === 'produksi' ? 'Program Produksi' : 'Siaran Harian'}
                            </span>
                          </td>
                          <td>
                            <div>{req.date}</div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                              {req.timeRange} WITA
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor:
                                  req.status === 'Ditugaskan' || req.status === 'Dikirim ke Program'
                                    ? 'var(--success-container)'
                                    : 'var(--warning-container)',
                                color:
                                  req.status === 'Ditugaskan' || req.status === 'Dikirim ke Program'
                                    ? 'var(--on-success-container)'
                                    : 'var(--on-warning-container)',
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setActiveView('legacy_flow')}
                                style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                              >
                                Lihat Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* First Login Modal (Section 8.4) */}
      <FirstLoginModal
        isOpen={showFirstLogin}
        onClose={() => setShowFirstLogin(false)}
        onSuccess={(data) => {
          setUserProfile(data);
        }}
      />

      {/* Direct Surat Perintah Preview if opened */}
      {previewSp && (
        <SuratPerintahModal
          assignment={previewSp}
          onClose={() => setPreviewSp(null)}
        />
      )}

      {/* Direct SPR Print Modal if opened */}
      {previewSprDocument && (
        <SPRPrintModal
          isOpen={Boolean(previewSprDocument)}
          onClose={() => setPreviewSprDocument(null)}
          spr={previewSprDocument}
        />
      )}

      {/* Direct Surat Penunjukan Print Modal if opened */}
      {previewSuratPenunjukan && (
        <SuratPenunjukanPrintModal
          isOpen={Boolean(previewSuratPenunjukan)}
          onClose={() => setPreviewSuratPenunjukan(null)}
          spr={previewSuratPenunjukan.spr}
          assignment={previewSuratPenunjukan.assignment}
        />
      )}
    </div>
  );
}

export default App;
