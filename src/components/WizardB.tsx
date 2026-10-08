import { useState, useMemo } from 'react';
import {
  CheckCircle,
  Printer,
  ArrowLeft,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Stepper } from './Stepper';
import type { StepItem } from './Stepper';
import { StatusBadge } from './StatusBadge';
import { AlertBanner } from './AlertBanner';
import { CandidatePicker } from './CandidatePicker';
import { SuratPerintahModal } from './SuratPerintahModal';
import type {
  CrewRequest,
  AssignmentConflict,
  SavedAssignment,
} from '../types';
import { CREW_CANDIDATES } from '../data/mockData';
import {
  parseCommaNames,
  matchCandidateWithRequestedNames,
  findMatchingCandidateIds,
} from '../utils/crewParser';

const WIZARD_B_STEPS: StepItem[] = [
  { id: 1, label: 'Pilih Permintaan' },
  { id: 2, label: 'Pilih Kandidat' },
  { id: 3, label: 'Cek Bentrok' },
  { id: 4, label: 'Simpan' },
  { id: 5, label: 'Selesai' },
];

interface WizardBProps {
  requests: CrewRequest[];
  onAssignmentComplete: (assignment: SavedAssignment) => void;
}

export const WizardB: React.FC<WizardBProps> = ({ requests, onAssignmentComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Filter requests in Step 1
  const [filterBlock, setFilterBlock] = useState<string>('Semua');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    requests.find((r) => r.status === 'Diajukan')?.id || requests[0]?.id || ''
  );

  // Step 2 State - Candidate Selection
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([
    'crew-tvri-01', // I Ketut Anom Randhika (Pengarah Teknik)
    'crew-tvri-02', // IGN. Ary Juliantara (Master Control & Maintenance)
    'crew-tvri-12', // Supriyanto (Penata Cahaya & Peralatan)
    'crew-tvri-14', // Bagas Suryatama (Teknisi IT/LED & VTR sore)
  ]);

  // Dual role map: candidateId -> secondaryRole
  const [dualRoleMap, setDualRoleMap] = useState<Record<string, string>>({
    'crew-tvri-02': 'Teknisi maintenance',
    'crew-tvri-12': 'Teknisi peralatan',
    'crew-tvri-14': 'VTR/editor sore',
  });

  // Simulation flags for testing conflict warning vs normal success
  const [simulateConflict, setSimulateConflict] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Saved result & Surat Perintah modal
  const [savedAssignment, setSavedAssignment] = useState<SavedAssignment | null>(null);
  const [showSpModal, setShowSpModal] = useState<boolean>(false);

  // Selected request object
  const activeRequest = requests.find((r) => r.id === selectedRequestId) || requests[0];

  // Total crew positions needed
  const totalCrewNeeded =
    activeRequest?.rolesNeeded.reduce((acc, curr) => acc + curr.count, 0) || 3;

  // Comma-separated requested crew names extracted from Rundown & Roles
  const requestedNamesList = useMemo(() => {
    const namesSet = new Set<string>();
    if (activeRequest?.rolesNeeded) {
      activeRequest.rolesNeeded.forEach((r) => {
        if (r.requestedNames && r.requestedNames.length > 0) {
          r.requestedNames.forEach((n) => namesSet.add(n.trim()));
        }
      });
    }
    if (activeRequest?.kerabatKerja) {
      activeRequest.kerabatKerja.forEach((k) => {
        if (k.namaList && k.namaList.length > 0) {
          k.namaList.forEach((n) => namesSet.add(n.trim()));
        } else if (k.personil) {
          parseCommaNames(k.personil).forEach((n) => namesSet.add(n.trim()));
        }
      });
    }
    return Array.from(namesSet).filter(Boolean);
  }, [activeRequest]);

  // Quick auto-select matching crew requested in rundown
  const handleSelectAllRequestedFromRundown = () => {
    if (!requestedNamesList.length) return;
    const matchedIds = findMatchingCandidateIds(requestedNamesList, CREW_CANDIDATES);
    if (matchedIds.length > 0) {
      setSelectedCrewIds((prev) => Array.from(new Set([...prev, ...matchedIds])));
    }
  };

  // Dual role calculations
  const dualRoleCount = useMemo(() => {
    return Object.keys(dualRoleMap).filter((id) => selectedCrewIds.includes(id)).length;
  }, [dualRoleMap, selectedCrewIds]);

  const totalPositionsCovered = selectedCrewIds.length + dualRoleCount;

  // Filtered requests list
  const filteredRequests = requests.filter((r) => {
    if (filterBlock !== 'Semua' && r.block !== filterBlock) return false;
    return true;
  });

  // Candidate selection toggle
  const handleToggleCandidate = (candidateId: string) => {
    if (selectedCrewIds.includes(candidateId)) {
      setSelectedCrewIds(selectedCrewIds.filter((id) => id !== candidateId));
      if (dualRoleMap[candidateId]) {
        setDualRoleMap((prev) => {
          const next = { ...prev };
          delete next[candidateId];
          return next;
        });
      }
    } else {
      setSelectedCrewIds([...selectedCrewIds, candidateId]);
    }
  };

  // Set secondary role for a candidate
  const handleSetDualRole = (candidateId: string, role: string) => {
    setDualRoleMap((prev) => ({
      ...prev,
      [candidateId]: role,
    }));
  };

  // Remove secondary role for a candidate
  const handleRemoveDualRole = (candidateId: string) => {
    setDualRoleMap((prev) => {
      const next = { ...prev };
      delete next[candidateId];
      return next;
    });
  };

  // Apply authentic TVRI Bali crew assignment preset with dual roles
  const handleApplyTvriPresets = () => {
    setSelectedCrewIds([
      'crew-tvri-01', // I Ketut Anom Randhika (Pengarah Teknik)
      'crew-tvri-02', // IGN. Ary Juliantara (Master Control / CCU + Maintenance)
      'crew-tvri-11', // I Gede Purnayasa (VTR. OP)
      'crew-tvri-12', // Supriyanto (Penata Cahaya + Peralatan)
      'crew-tvri-14', // Bagas Suryatama (Teknisi IT / LED + VTR Sore)
      'crew-tvri-04', // Rovelino Andrew Nanlohy (Kamerawan)
      'crew-tvri-07', // Luh Putu Widiastuti (Pemadu Gambar)
      'crew-tvri-09', // Ni Made Mega Pratiwi (Penata Suara)
      'crew-tvri-13', // Annisa Pratiwi (Penata Aksara)
    ]);
    setDualRoleMap({
      'crew-tvri-02': 'Teknisi maintenance',
      'crew-tvri-12': 'Teknisi peralatan',
      'crew-tvri-14': 'VTR/editor sore',
    });
  };

  // Check if any selected candidate is marked unavailable
  const selectedCandidatesList = CREW_CANDIDATES.filter((c) =>
    selectedCrewIds.includes(c.id)
  );
  const unavailableSelected = selectedCandidatesList.filter((c) => !c.available);

  // Detect potential scheduling conflicts (non-blocking warning)
  const detectedConflicts = useMemo(() => {
    const list: AssignmentConflict[] = [];

    if (selectedCrewIds.includes('crew-02')) {
      list.push({
        crewName: 'Budi Santoso',
        role: 'Kameramen',
        date: activeRequest?.date || '2026-10-05',
        time: '08:00 – 10:00 WIB',
        program: 'Berita Pagi (Studio 1)',
        reason: 'Tumpang tindih jadwal siaran langsung utama',
      });
    }

    if (selectedCrewIds.includes('crew-05')) {
      list.push({
        crewName: 'Eko Prasetyo',
        role: 'Audio Engineer',
        date: activeRequest?.date || '2026-10-05',
        time: 'Sepanjang Hari',
        program: 'Cuti Tahunan',
        reason: 'Status kepegawaian sedang cuti',
      });
    }

    if (simulateConflict && list.length === 0) {
      list.push({
        crewName: 'Chandra Gunawan',
        role: 'Kameramen',
        date: activeRequest?.date || '2026-10-05',
        time: '07:30 – 09:00 WIB',
        program: 'Peliputan Lapangan',
        reason: 'Jadwal bertabrakan dengan penugasan lain',
      });
    }

    return list;
  }, [selectedCrewIds, activeRequest?.date, simulateConflict]);

  // Step 4: Simpan Penugasan execution (non-blocking warning, allows submission)
  const handleSaveAssignment = () => {
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);

      // Simpan data penugasan (201 Created) bahkan jika ada catatan bentrok
      const assignmentResult: SavedAssignment = {
        requestId: activeRequest.id,
        programName: activeRequest.programName,
        date: activeRequest.date,
        timeRange: activeRequest.timeRange,
        crew: selectedCandidatesList.map((c) => ({
          candidateId: c.id,
          name: c.name,
          role: c.role,
          secondaryRole: dualRoleMap[c.id],
          nip: c.nip,
        })),
        createdAt: new Date().toLocaleDateString('id-ID'),
      };

      setSavedAssignment(assignmentResult);
      onAssignmentComplete(assignmentResult);
      setCurrentStep(5);
    }, 800);
  };

  // Helper validation for steps
  const canProceed = () => {
    if (currentStep === 1) return !!selectedRequestId;
    if (currentStep === 2) return selectedCrewIds.length > 0;
    if (currentStep === 3) return true;
    return true;
  };

  const stepsWithErrors = WIZARD_B_STEPS.map((s) => ({
    ...s,
    hasError: false,
  }));

  return (
    <div>
      {/* Wizard Header */}
      <div className="wizard-header">
        <h1 className="wizard-page-title">Wizard B &mdash; Penugasan Kru</h1>
        <p className="wizard-page-desc">
          Alur kerja Admin Teknik untuk menindaklanjuti permintaan siaran, memilih kandidat yang tersedia, memeriksa bentrok jadwal, dan menerbitkan Surat Perintah.
        </p>
      </div>

      {/* Stepper */}
      <Stepper
        steps={stepsWithErrors}
        currentStep={currentStep}
        onStepClick={(id) => {
          if (id < currentStep) setCurrentStep(id);
        }}
      />

      {/* Wizard Card Container */}
      <div className="wizard-card">
        {/* STEP 1: Pilih Permintaan */}
        {currentStep === 1 && (
          <div>
            <div className="step-card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="step-card-title">Langkah 1 &mdash; Pilih Permintaan Siaran</h2>
                  <p className="step-card-desc">
                    Pilih permintaan dari Admin Program yang berstatus 'Diajukan'.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={15} color="var(--text-secondary)" />
                  <select
                    className="form-select"
                    style={{ width: 140, height: 34, fontSize: 13 }}
                    value={filterBlock}
                    onChange={(e) => setFilterBlock(e.target.value)}
                    aria-label="Filter Blok"
                  >
                    <option value="Semua">Semua Blok</option>
                    <option value="Pagi">Blok Pagi</option>
                    <option value="Siang">Blok Siang</option>
                    <option value="Malam">Blok Malam</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`card-selectable ${selectedRequestId === req.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRequestId(req.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: selectedRequestId === req.id ? '6px solid var(--primary)' : '2px solid var(--border)',
                        backgroundColor: '#FFF',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                          {req.programName}
                        </div>
                        {req.sourceDocument && (
                          <span style={{ fontSize: 11, backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 8px', borderRadius: 4, fontWeight: 700 }}>
                            Rundown Siaran Pagi
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        <span className="tabular">{req.date}</span> &bull; {req.timeRange} &bull; Blok {req.block}
                        {req.sourceDocument && (
                          <span style={{ marginLeft: 6, color: '#1E3FA8', fontWeight: 600 }}>
                            &bull; Tabel Kerabat Kerja ({req.rolesNeeded.reduce((a, b) => a + b.count, 0)} personil)
                          </span>
                        )}
                      </div>
                      {req.kerabatKerja && req.kerabatKerja.length > 0 && (
                        <div className="crew-name-pills-wrap" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: '#64748B' }}>Kru diminta:</span>
                          {req.kerabatKerja.slice(0, 4).map((kk, kIdx) => (
                            <span key={kIdx} className="crew-name-pill highlight" title={`${kk.peran}: ${kk.personil}`}>
                              {kk.peran}: {kk.personil}
                            </span>
                          ))}
                          {req.kerabatKerja.length > 4 && (
                            <span style={{ fontSize: 11, color: '#64748B' }}>+{req.kerabatKerja.length - 4} lainnya</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Kebutuhan:{' '}
                      <strong className="tabular">
                        {req.rolesNeeded.reduce((a, b) => a + b.count, 0)} orang
                      </strong>
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Pilih Kandidat */}
        {currentStep === 2 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">Langkah 2 &mdash; Pilih Kandidat Kru</h2>
              <p className="step-card-desc">
                Pilih personil untuk program <strong>{activeRequest.programName}</strong> (Kebutuhan: {totalCrewNeeded} posisi).
              </p>
            </div>

            {/* Roles Needed Summary Pills */}
            {activeRequest.rolesNeeded && activeRequest.rolesNeeded.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13, color: '#0F1F54' }}>
                    Kebutuhan Peran ({activeRequest.sourceDocument ? 'Tabel KERABAT KERJA SIARAN' : 'Daftar Pengajuan'}):
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Total: <strong className="tabular">{totalCrewNeeded} posisi</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {activeRequest.rolesNeeded.map((r) => {
                    const reqNames = r.requestedNames || [];
                    return (
                      <div
                        key={r.role}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          padding: '5px 9px',
                          borderRadius: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                          {r.role} &times; {r.count}
                        </span>
                        {reqNames.length > 0 && (
                          <div className="crew-name-pills-wrap">
                            {reqNames.map((nm, idx) => (
                              <span key={idx} className="crew-name-pill highlight" title="Nama personil diminta di rundown">
                                {nm}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dual Role Banner & TVRI Preset Trigger */}
            <div className="dual-role-banner">
              <div className="dual-role-banner-text">
                <span style={{ fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  ⚡ Fitur Rangkap Profesi Aktif (Multi-Role Support)
                </span>
                <span style={{ fontSize: 12, color: '#15803D' }}>
                  Satu kru dapat mengemban 2 profesi sekaligus dalam 1 acara (misal: Master Control + Maintenance). Mengisi kuota 2 posisi tanpa bentrok sistem.
                </span>
              </div>
              <button
                type="button"
                className="dual-role-preset-btn"
                onClick={handleApplyTvriPresets}
                title="Terapkan contoh personil rangkap profesi sesuai dokumen resmi TVRI Bali"
              >
                ⚡ Contoh Rangkap TVRI Bali
              </button>
            </div>

            {/* Candidate Picker Section */}
            <CandidatePicker
              candidates={CREW_CANDIDATES}
              selectedIds={selectedCrewIds}
              maxNeeded={totalCrewNeeded}
              onToggleCandidate={handleToggleCandidate}
              dualRoleMap={dualRoleMap}
              onSetDualRole={handleSetDualRole}
              onRemoveDualRole={handleRemoveDualRole}
              availableSecondaryRoles={activeRequest?.rolesNeeded?.map((r) => r.role)}
              requestedNames={requestedNamesList}
              onSelectAllRequested={handleSelectAllRequestedFromRundown}
            />
          </div>
        )}

        {/* STEP 3: Cek Bentrok */}
        {currentStep === 3 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">Langkah 3 &mdash; Cek Bentrok & Jadwal Silang</h2>
              <p className="step-card-desc">
                Validasi kesiapan dan ketersediaan kandidat sebelum mengunci jadwal.
              </p>
            </div>

            {/* Neutral info note as specified in Section 8.2 Step 3 */}
            <AlertBanner
              type="info"
              title="Catatan Pemeriksaan"
              message="Ini adalah pratinjau ketersediaan kru. Pemeriksaan akhir dan validasi kunci slot jadwal dilakukan saat Anda menekan tombol 'Simpan Penugasan'."
            />

            {/* Warning if any selected candidate is marked unavailable */}
            {unavailableSelected.length > 0 && (
              <AlertBanner
                type="warning"
                title="Peringatan Ketersediaan Terdeteksi"
                message={`Kandidat berikut memiliki catatan ketersediaan: ${unavailableSelected
                  .map((u) => `${u.name} (${u.unavailableReason})`)
                  .join(', ')}.`}
              />
            )}

            {/* Dual Role Validation Notice */}
            {dualRoleCount > 0 && (
              <div
                style={{
                  marginTop: 12,
                  marginBottom: 12,
                  padding: '12px 16px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <CheckCircle size={22} color="#16A34A" />
                <div>
                  <strong style={{ fontSize: 13, color: '#166534' }}>
                    Validasi Rangkap Profesi: Sah & Disetujui ({dualRoleCount} Personil Rangkap)
                  </strong>
                  <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
                    {Object.keys(dualRoleMap)
                      .filter((id) => selectedCrewIds.includes(id))
                      .map((id) => {
                        const cand = CREW_CANDIDATES.find((c) => c.id === id);
                        return `${cand?.name} (${cand?.role} + ${dualRoleMap[id]})`;
                      })
                      .join('; ')}{' '}
                    &mdash; Diakui sebagai rangkap fungsi resmi dalam satu susunan acara siaran.
                  </div>
                </div>
              </div>
            )}

            <div className="summary-card" style={{ marginTop: 16 }}>
              <div className="summary-section-header">
                <span className="summary-section-title">
                  Kandidat yang Ditugaskan ({selectedCrewIds.length} personil &bull; {totalPositionsCovered} posisi terisi)
                </span>
                <button
                  type="button"
                  className="summary-link-edit"
                  onClick={() => setCurrentStep(2)}
                >
                  Ubah Pilihan
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {selectedCandidatesList.map((cand) => (
                  <div
                    key={cand.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        className="candidate-avatar"
                        style={{
                          width: 34,
                          height: 34,
                          fontSize: 12,
                          backgroundColor: cand.avatarBg || 'var(--primary)',
                        }}
                      >
                        {cand.initials}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            {cand.name}
                          </strong>
                          {matchCandidateWithRequestedNames(cand.name, requestedNamesList) && (
                            <span className="rundown-match-badge" title="Nama personil diminta di Rundown Siaran">
                              🎯 Sesuai Rundown: {matchCandidateWithRequestedNames(cand.name, requestedNamesList)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {cand.role} &bull; {cand.division}
                        </div>
                        {dualRoleMap[cand.id] && (
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1E40AF', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                              Utama: {cand.role}
                            </span>
                            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                              ⚡ Rangkap: {dualRoleMap[cand.id]}
                            </span>
                            <span style={{ fontSize: 10, color: '#15803D', fontWeight: 600 }}>
                              (Sah &bull; 2 Posisi Terpenuhi)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <StatusBadge status={cand.available ? 'Tersedia' : 'Tidak tersedia'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Simpan Penugasan */}
        {currentStep === 4 && (
          <div>
            <div className="step-card-header">
              <h2 className="step-card-title">Langkah 4 &mdash; Simpan Penugasan</h2>
              <p className="step-card-desc">
                Kirim data ke server untuk penguncian jadwal dan validasi bentrok.
              </p>
            </div>

            {/* Warning Banner on Scheduling Conflict (NON-BLOCKING: user can still submit!) */}
            {detectedConflicts.length > 0 && (
              <AlertBanner
                type="warning"
                title="Peringatan: Terjadi Konflik Jadwal"
                message="Ditemukan bentrok tugas pada beberapa personil yang Anda pilih. Data pilihan Anda tetap tersimpan dan Anda dapat tetap melanjutkan untuk menyimpan penugasan ini."
                conflicts={detectedConflicts}
                actionLabel="Pilih Ulang Kru Bermasalah"
                onActionClick={() => setCurrentStep(2)}
              />
            )}

            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                Konfirmasi Penyimpanan
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Menyimpan penugasan akan mengunci jadwal siaran untuk{' '}
                <strong>{activeRequest.programName}</strong> pada tanggal{' '}
                <strong className="tabular">{activeRequest.date}</strong> ({activeRequest.timeRange}).
                Setelah disimpan, Anda dapat langsung menerbitkan Surat Perintah resmi.
              </p>

              {/* Dual Role and Roster Overview */}
              <div
                style={{
                  marginTop: 16,
                  backgroundColor: '#FFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    Rincian Penugasan ({selectedCrewIds.length} Personil &bull; {totalPositionsCovered} Posisi Terisi)
                  </strong>
                  {dualRoleCount > 0 && (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: '#92400E',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      ⚡ {dualRoleCount} Rangkap Tugas Sah
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCandidatesList.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12.5,
                        borderBottom:
                          idx < selectedCandidatesList.length - 1
                            ? '1px dashed #E2E8F0'
                            : 'none',
                        paddingBottom: 6,
                      }}
                    >
                      <span>
                        <strong>{c.name}</strong>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          (NIP: {c.nip})
                        </span>
                      </span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span
                          style={{
                            background: '#EFF6FF',
                            color: '#1E40AF',
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          {c.role}
                        </span>
                        {dualRoleMap[c.id] && (
                          <span
                            style={{
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            ⚡ Rangkap: {dualRoleMap[c.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dev/Demo switch to simulate conflict */}
              <div
                style={{
                  marginTop: 20,
                  padding: 12,
                  backgroundColor: '#FFF',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Mode Simulasi Pengujian:</strong>
                  <div>Simulasikan peringatan bentrok jadwal untuk demonstrasi banner peringatan.</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={simulateConflict}
                    onChange={(e) => setSimulateConflict(e.target.checked)}
                    style={{ accentColor: 'var(--warning)' }}
                  />
                  <span>Simulasi Bentrok Jadwal</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '16px 0', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: 44, padding: '0 18px' }}
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft size={16} /> Kembali ke Cek Bentrok
              </button>

              <button
                type="button"
                className={`btn btn-primary ${isSaving ? 'btn-loading' : ''}`}
                style={{ minWidth: 220, height: 44 }}
                disabled={isSaving}
                onClick={handleSaveAssignment}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" /> Memeriksa & Menyimpan...
                  </>
                ) : detectedConflicts.length > 0 ? (
                  <>
                    <CheckCircle size={16} /> Tetap Simpan Penugasan
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Simpan Penugasan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Selesai */}
        {currentStep === 5 && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--success-soft)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
              Penugasan Kru Berhasil Disimpan (201 Created)
            </h2>

            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 14px', fontSize: 14 }}>
              Kru telah resmi dialokasikan untuk program{' '}
              <strong>{savedAssignment?.programName || activeRequest.programName}</strong>. Notifikasi otomatis telah dikirimkan ke ponsel kru dan Admin Program.
            </p>

            {detectedConflicts.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--warning-soft)',
                    color: '#7B4F0F',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid rgba(183, 121, 31, 0.3)',
                  }}
                >
                  Pemberitahuan: Disimpan dengan persetujuan catatan bentrok ({detectedConflicts.length} personil)
                </span>
              </div>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status Penugasan:</span>
              <StatusBadge status="Ditugaskan" />
            </div>

            {/* List of assigned personnel */}
            <div
              style={{
                maxWidth: 580,
                margin: '0 auto 28px',
                textAlign: 'left',
                backgroundColor: 'var(--bg-canvas)',
                padding: 18,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Daftar Personil Bertugas:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedCandidatesList.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>{c.name}</strong> &bull; <span style={{ color: 'var(--primary)' }}>{c.role}</span>
                      {dualRoleMap[c.id] && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: '#92400E',
                            backgroundColor: '#FEF3C7',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid #FCD34D',
                          }}
                        >
                          ⚡ Rangkap: {dualRoleMap[c.id]}
                        </span>
                      )}
                    </div>
                    <span className="tabular" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      NIP: {c.nip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons as specified in Section 8.2 Step 5 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline-gray"
                onClick={() => {
                  setCurrentStep(1);
                }}
              >
                Kembali ke Daftar Permintaan
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSpModal(true)}
              >
                <Printer size={16} /> Buat Surat Perintah
              </button>
            </div>
          </div>
        )}

        {/* Sticky Footer (Steps 1 to 4) */}
        {currentStep < 5 && (
          <div className="wizard-footer">
            <div className="footer-left">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
              )}
            </div>

            <div className="footer-center">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Kebutuhan: <strong>{totalCrewNeeded} posisi</strong> ({totalPositionsCovered} posisi terisi: {selectedCrewIds.length} personil{dualRoleCount > 0 ? `, ${dualRoleCount} rangkap tugas` : ''})
              </span>
            </div>

            <div className="footer-right">
              {currentStep < 4 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canProceed()}
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Lanjut <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Surat Perintah Status Panel & PDF Modal (Section 8.3) */}
      {showSpModal && savedAssignment && (
        <SuratPerintahModal
          assignment={savedAssignment}
          onClose={() => setShowSpModal(false)}
        />
      )}
    </div>
  );
};

export default WizardB;
