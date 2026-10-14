import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Printer,
  RotateCcw,
  Clock,
  Send,
  XCircle,
  Search,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  Check,
  Calendar,
} from 'lucide-react';
import type {
  SPRDocument,
  SPRAssignmentSlot,
  SPRAssignmentDocument,
  DutySchedule,
  UserRole,
} from '../types';
import {
  MASTER_EMPLOYEES,
  MOCK_SPR_ASSIGNMENT,
} from '../data/mockData';
import {
  evaluateSPRCandidates,
  checkStudioOverlapWarning,
} from '../utils/conflictDetector';
import type { CandidateEvaluationResult } from '../utils/conflictDetector';
import { SuratPenunjukanPrintModal } from './SuratPenunjukanPrintModal';

interface SPRAssignmentWizardProps {
  currentUserRole: UserRole;
  onClose: () => void;
  initialSprId?: string;
  dutySchedule: DutySchedule | null;
  allSPRs: SPRDocument[];
  onSaveAssignment: (assignment: SPRAssignmentDocument, updatedSpr: SPRDocument) => void;
}

export const SPRAssignmentWizard: React.FC<SPRAssignmentWizardProps> = ({
  currentUserRole,
  onClose,
  initialSprId,
  dutySchedule,
  allSPRs,
  onSaveAssignment,
}) => {
  // Stepper state: P1 -> P2 -> P3 -> P4 -> SUCCESS
  const [currentStep, setCurrentStep] = useState<'P1' | 'P2' | 'P3' | 'P4' | 'SUCCESS'>(() => {
    return initialSprId ? 'P2' : 'P1';
  });

  // Selected SPR Document
  const [selectedSprId, setSelectedSprId] = useState<string | null>(() => {
    return initialSprId || (allSPRs.find((s) => s.status === 'Diajukan')?.id || allSPRs[0]?.id || null);
  });

  const selectedSpr = useMemo(() => {
    return allSPRs.find((s) => s.id === selectedSprId) || allSPRs[0] || null;
  }, [allSPRs, selectedSprId]);

  // P1 Filter Tabs
  const [filterTab, setFilterTab] = useState<'semua' | 'belum_terisi' | 'terisi_sebagian' | 'direvisi' | 'mendesak'>('semua');

  // P2 Slots State: Initialized from existing assignment or generated from SPR needs
  const [assignmentSlots, setAssignmentSlots] = useState<SPRAssignmentSlot[]>([]);

  useEffect(() => {
    if (!selectedSpr) return;

    // Check if mock assignment exists for this SPR
    if (selectedSpr.id === MOCK_SPR_ASSIGNMENT.sprId) {
      setAssignmentSlots(MOCK_SPR_ASSIGNMENT.assignedSlots);
      return;
    }

    // Otherwise generate clean slots from kebutuhanCrewList
    const generatedSlots: SPRAssignmentSlot[] = [];
    selectedSpr.kebutuhanCrewList.forEach((need) => {
      const isNonTechnical = ['Penata Rias', 'Penata Artistik', 'Dekor', 'Pengemudi'].some(
        (nt) => need.profesi.toLowerCase().includes(nt.toLowerCase())
      );

      for (let i = 1; i <= need.jumlah; i++) {
        generatedSlots.push({
          id: `slot-${selectedSpr.id}-${need.profesi.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
          profesi: need.profesi,
          slotNumber: i,
          totalSlots: need.jumlah,
          status: 'kosong',
          assignedCrewDivision: isNonTechnical ? 'Divisi Lain' : undefined,
        });
      }
    });

    setAssignmentSlots(generatedSlots);
  }, [selectedSpr]);

  // P2 Candidate Picker Drawer State
  const [activeDrawerSlotId, setActiveDrawerSlotId] = useState<string | null>(null);
  const [candidateSearchText, setCandidateSearchText] = useState<string>('');
  const [showUnavailable, setShowUnavailable] = useState<boolean>(true);

  // Special Exception Modal for Team Lead
  const [exceptionCandidate, setExceptionCandidate] = useState<CandidateEvaluationResult | null>(null);
  const [exceptionReasonInput, setExceptionReasonInput] = useState<string>('');
  const [exceptionReasonError, setExceptionReasonError] = useState<string>('');

  // Rejection Dialog for P1 (Admin Teknik rejects incoming SPR)
  const [rejectingSpr, setRejectingSpr] = useState<SPRDocument | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');
  const [rejectionReasonError, setRejectionReasonError] = useState<string>('');

  // Partial Publish Confirmation Modal in P4
  const [partialPublishConfirmOpen, setPartialPublishConfirmOpen] = useState<boolean>(false);

  // Expandable activity checklist per slot (SAD v1.1 line 885)
  const [expandedActivitySlotId, setExpandedActivitySlotId] = useState<string | null>(null);

  // One-step confirmation for emptying slot (SAD v1.1 line 902)
  const [confirmEmptySlotId, setConfirmEmptySlotId] = useState<string | null>(null);

  // Auto-Save Indicator
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Printable Modal
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Calculate slot counts
  const filledSlotsCount = useMemo(() => {
    return assignmentSlots.filter((s) => s.status === 'terisi').length;
  }, [assignmentSlots]);

  const totalSlotsCount = assignmentSlots.length;

  // Active Slot being picked
  const activeSlot = useMemo(() => {
    return assignmentSlots.find((s) => s.id === activeDrawerSlotId) || null;
  }, [assignmentSlots, activeDrawerSlotId]);

  // Candidates evaluated for active slot
  const evaluatedCandidates: CandidateEvaluationResult[] = useMemo(() => {
    if (!activeSlot || !selectedSpr) return [];

    return evaluateSPRCandidates(
      activeSlot.profesi,
      selectedSpr.kegiatanList,
      MASTER_EMPLOYEES,
      dutySchedule,
      allSPRs,
      selectedSpr.id,
      assignmentSlots,
      activeSlot.id
    );
  }, [activeSlot, selectedSpr, dutySchedule, allSPRs, assignmentSlots]);

  // Filtered candidate list based on search and showUnavailable switch
  const filteredCandidates = useMemo(() => {
    return evaluatedCandidates.filter((item) => {
      if (!showUnavailable && item.status === 'tidak_tersedia') return false;
      if (!candidateSearchText.trim()) return true;

      const q = candidateSearchText.toLowerCase();
      return (
        item.candidate.name.toLowerCase().includes(q) ||
        item.candidate.nip.includes(q) ||
        (item.candidate.subDivision || '').toLowerCase().includes(q)
      );
    });
  }, [evaluatedCandidates, candidateSearchText, showUnavailable]);

  // Check studio overlap warnings for P2 header strip
  const studioWarnings = useMemo(() => {
    if (!selectedSpr) return [];
    const warns: string[] = [];
    selectedSpr.kegiatanList.forEach((act) => {
      if (act.lokasi) {
        const w = checkStudioOverlapWarning(
          act.lokasi,
          act.tanggal,
          act.jamMulai,
          act.jamSelesai,
          allSPRs,
          selectedSpr.id
        );
        if (w) warns.push(w);
      }
    });
    return warns;
  }, [selectedSpr, allSPRs]);

  // P3 Conflict Evaluation
  const p3Evaluation = useMemo(() => {
    const blockers: { id: string; slot: SPRAssignmentSlot; message: string }[] = [];
    const unfilled: { id: string; slot: SPRAssignmentSlot; message: string }[] = [];
    const warnings: { id: string; slot: SPRAssignmentSlot; message: string; reason?: string }[] = [];

    assignmentSlots.forEach((slot) => {
      if (slot.status === 'kosong') {
        const isNonTech = ['Penata Rias', 'Penata Artistik', 'Dekor', 'Pengemudi'].some((nt) =>
          slot.profesi.toLowerCase().includes(nt.toLowerCase())
        );
        if (!isNonTech) {
          unfilled.push({
            id: `unfilled-${slot.id}`,
            slot,
            message: `${slot.profesi} (Slot ${slot.slotNumber} dari ${slot.totalSlots}) belum ditugaskan.`,
          });
        }
      } else {
        // If filled, verify against schedule availability
        if (dutySchedule && selectedSpr) {
          selectedSpr.kegiatanList.forEach((act) => {
            const cell = dutySchedule.assignments[slot.assignedCrewId || '']?.[act.tanggal];
            if (cell?.availability) {
              blockers.push({
                id: `blk-${slot.id}-${act.tanggal}`,
                slot,
                message: `${slot.assignedCrewName} (${slot.profesi}) tercatat ${cell.availability} pada ${act.tanggal}. Pilih kru lain.`,
              });
            }
          });
        }

        if (slot.secondaryRole) {
          warnings.push({
            id: `warn-dual-${slot.id}`,
            slot,
            message: `${slot.assignedCrewName} merangkap sebagai ${slot.profesi} dan ${slot.secondaryRole}.`,
            reason: 'Rangkap jabatan diizinkan oleh Ketua Tim',
          });
        }
      }
    });

    return {
      blockers,
      unfilled,
      warnings,
      canProceedToP4: blockers.length === 0,
    };
  }, [assignmentSlots, dutySchedule, selectedSpr]);

  // Handle slot assignment
  const handleAssignCrew = (candidateItem: CandidateEvaluationResult) => {
    if (!activeDrawerSlotId) return;

    if (candidateItem.requiresException) {
      setExceptionCandidate(candidateItem);
      setExceptionReasonInput('');
      setExceptionReasonError('');
      return;
    }

    setSaveStatus('Menyimpan...');

    setAssignmentSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === activeDrawerSlotId) {
          return {
            ...slot,
            status: 'terisi',
            assignedCrewId: candidateItem.candidate.id,
            assignedCrewName: candidateItem.candidate.name,
            assignedCrewNip: candidateItem.candidate.nip,
            assignedCrewDivision: candidateItem.candidate.subDivision || candidateItem.candidate.division,
          };
        }
        return slot;
      })
    );

    setTimeout(() => {
      setSaveStatus('Tersimpan');
      setActiveDrawerSlotId(null);
      setTimeout(() => setSaveStatus(null), 2000);
    }, 400);
  };

  // Handle confirming team lead exception
  const handleConfirmException = () => {
    if (!exceptionReasonInput.trim()) {
      setExceptionReasonError('Tulis alasan pengecualian resmi Ketua Tim agar tercatat pada audit.');
      return;
    }

    if (!activeDrawerSlotId || !exceptionCandidate) return;

    setSaveStatus('Menyimpan...');

    setAssignmentSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === activeDrawerSlotId) {
          return {
            ...slot,
            status: 'terisi',
            assignedCrewId: exceptionCandidate.candidate.id,
            assignedCrewName: exceptionCandidate.candidate.name,
            assignedCrewNip: exceptionCandidate.candidate.nip,
            assignedCrewDivision: exceptionCandidate.candidate.subDivision || exceptionCandidate.candidate.division,
            secondaryRole: `Pengecualian: ${exceptionReasonInput.trim()}`,
          };
        }
        return slot;
      })
    );

    setExceptionCandidate(null);
    setActiveDrawerSlotId(null);
    setSaveStatus('Tersimpan');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Handle emptying a slot
  const handleEmptySlot = (slotId: string) => {
    setAssignmentSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          return {
            ...slot,
            status: 'kosong',
            assignedCrewId: undefined,
            assignedCrewName: undefined,
            assignedCrewNip: undefined,
            secondaryRole: undefined,
            hanyaKegiatanTertentu: undefined,
          };
        }
        return slot;
      })
    );
    setConfirmEmptySlotId(null);
    if (activeDrawerSlotId === slotId) {
      setActiveDrawerSlotId(null);
    }
    setSaveStatus('Tersimpan');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Handle Rejecting SPR in P1
  const handleConfirmRejectSPR = () => {
    if (!rejectionReasonText.trim()) {
      setRejectionReasonError('Tulis alasan penolakan agar Admin Program dapat memperbaikinya.');
      return;
    }

    if (!rejectingSpr) return;

    const updatedSpr: SPRDocument = {
      ...rejectingSpr,
      status: 'Ditolak',
      alasanPenolakan: rejectionReasonText.trim(),
    };

    const emptyAssignment: SPRAssignmentDocument = {
      sprId: rejectingSpr.id,
      status: 'Ditugaskan sebagian',
      assignedSlots: [],
      warnings: [],
    };

    onSaveAssignment(emptyAssignment, updatedSpr);
    setRejectingSpr(null);
    setRejectionReasonText('');
  };

  // Handle Final Publish in P4
  const handleFinalPublish = (isPartial: boolean = false) => {
    if (!selectedSpr) return;

    const finalStatus: 'Ditugaskan lengkap' | 'Ditugaskan sebagian' =
      isPartial || filledSlotsCount < totalSlotsCount ? 'Ditugaskan sebagian' : 'Ditugaskan lengkap';

    const assignmentDoc: SPRAssignmentDocument = {
      sprId: selectedSpr.id,
      suratPenunjukanNomor: `SP/TVRI-BALI/TEK/10/2026/0${Math.floor(Math.random() * 80 + 20)}`,
      status: finalStatus,
      assignedSlots: assignmentSlots,
      publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      qrVerificationCode: `QR-TVRI-BALI-SP-202610-0${Math.floor(Math.random() * 800 + 100)}`,
      warnings: p3Evaluation.warnings.map((w) => w.message),
    };

    const updatedSpr: SPRDocument = {
      ...selectedSpr,
      status: finalStatus,
      totalCrewAssigned: filledSlotsCount,
    };

    onSaveAssignment(assignmentDoc, updatedSpr);
    setPartialPublishConfirmOpen(false);
    setCurrentStep('SUCCESS');
  };

  // P1 Filtered SPR List
  const filteredSprList = useMemo(() => {
    return allSPRs
      .filter((spr) => {
        if (filterTab === 'mendesak') return spr.isMendesak;
        if (filterTab === 'direvisi') return spr.versi > 1;
        if (filterTab === 'belum_terisi') return spr.totalCrewAssigned === 0;
        if (filterTab === 'terisi_sebagian') return spr.totalCrewAssigned > 0 && spr.totalCrewAssigned < spr.totalCrewNeeded;
        return true;
      })
      .sort((a, b) => {
        // Urgent first, then date asc
        if (a.isMendesak && !b.isMendesak) return -1;
        if (!a.isMendesak && b.isMendesak) return 1;
        const dateA = a.kegiatanList[0]?.tanggal || '';
        const dateB = b.kegiatanList[0]?.tanggal || '';
        return dateA.localeCompare(dateB);
      });
  }, [allSPRs, filterTab]);

  // Construct assignment document object for preview modal
  const currentAssignmentDocument: SPRAssignmentDocument = useMemo(() => {
    return {
      sprId: selectedSpr?.id || '',
      suratPenunjukanNomor: `SP/TVRI-BALI/TEK/10/2026/042`,
      status: filledSlotsCount === totalSlotsCount ? 'Ditugaskan lengkap' : 'Ditugaskan sebagian',
      assignedSlots: assignmentSlots,
      publishedAt: '2026-10-12 10:00:00',
      qrVerificationCode: `QR-TVRI-BALI-SP-202610-042`,
      warnings: p3Evaluation.warnings.map((w) => w.message),
    };
  }, [selectedSpr, filledSlotsCount, totalSlotsCount, assignmentSlots, p3Evaluation]);

  return (
    <div className="panel-summary" style={{ maxWidth: 1240, margin: '0 auto', padding: 0 }}>
      {/* ===================================================================
          TOP BAR & STEPPER HEADER (SAD v1.1 lines 430-442)
          =================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--divider)',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'var(--primary-container)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Wizard 4: Penugasan SPR (Divisi Teknik)
              </h2>
              {selectedSpr?.isMendesak && (
                <span className="chip-urgent" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} />
                  Mendesak
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Pemenuhan slot kru per profesi, audit bentrok lintas jadwal, dan penerbitan Surat Penunjukan
            </span>
          </div>
        </div>

        {/* Right Info: Save Indicator & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {saveStatus && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: saveStatus === 'Tersimpan' ? 'var(--success)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {saveStatus === 'Tersimpan' ? <Check size={14} /> : <Clock size={14} />}
              {saveStatus}
            </div>
          )}

          <button
            type="button"
            className="button-secondary"
            onClick={onClose}
            style={{ height: 36, fontSize: 13, padding: '0 14px' }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ===================================================================
          4-STEP STEPPER (P1 -> P2 -> P3 -> P4)
          =================================================================== */}
      {currentStep !== 'SUCCESS' && (
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--divider)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'P1', label: 'Pilih SPR' },
            { id: 'P2', label: 'Tugaskan Kru' },
            { id: 'P3', label: 'Periksa Bentrok' },
            { id: 'P4', label: 'Tinjau & Terbitkan' },
          ].map((st, i) => {
            const stepOrder = ['P1', 'P2', 'P3', 'P4'];
            const curIdx = stepOrder.indexOf(currentStep);
            const isCurrent = currentStep === st.id;
            const isDone = curIdx > i;

            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isCurrent || isDone ? 1 : 0.6,
                }}
                onClick={() => {
                  if (isDone) setCurrentStep(st.id as any);
                }}
              >
                <div
                  className={
                    isCurrent
                      ? 'stepper-current'
                      : isDone
                      ? 'stepper-done'
                      : 'stepper-upcoming'
                  }
                  style={{
                    width: 30,
                    height: 30,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--primary)' : isDone ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {st.label}
                </span>
                {i < 3 && <ChevronRight size={14} color="var(--border)" style={{ marginLeft: 6 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Container */}
      <div style={{ padding: '24px' }}>
        {/* ===================================================================
            STEP P1: PILIH SPR (SAD v1.1 lines 869-878)
            =================================================================== */}
        {currentStep === 'P1' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
                Pilih Berkas SPR Masuk
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
                Daftar permohonan kerabat kerja dan peralatan produksi yang diajukan oleh Divisi Program dan Berita.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'semua', label: 'Semua Berkas' },
                  { id: 'belum_terisi', label: 'Belum Terisi' },
                  { id: 'terisi_sebagian', label: 'Terisi Sebagian' },
                  { id: 'direvisi', label: 'Direvisi' },
                  { id: 'mendesak', label: 'Mendesak' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12.5,
                    fontWeight: filterTab === tab.id ? 700 : 500,
                    backgroundColor: filterTab === tab.id ? 'var(--primary)' : 'var(--panel)',
                    color: filterTab === tab.id ? 'var(--on-primary)' : 'var(--ink)',
                    border: '1px solid',
                    borderColor: filterTab === tab.id ? 'var(--primary)' : 'var(--divider)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.id === 'mendesak' && <AlertTriangle size={13} />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SPR Cards Grid */}
            {filteredSprList.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: 'center',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)',
                }}
              >
                <Users size={36} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 4px', color: 'var(--ink)' }}>Tidak ada SPR masuk</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                  SPR baru dari Divisi Program dan Berita akan muncul di sini setelah diajukan.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {filteredSprList.map((spr) => {
                  const nearestDate = spr.kegiatanList[0]?.tanggal || '-';
                  const isSelected = selectedSprId === spr.id;

                  return (
                    <div
                      key={spr.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--divider)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 18,
                        boxShadow: isSelected ? '0 0 0 2px var(--primary-container)' : '0 1px 3px rgba(16,27,45,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Card Top: Badges */}
                      <div>
                        {/* Revision Notice Banner */}
                        {spr.versi > 1 && (
                          <div
                            style={{
                              backgroundColor: 'var(--warning-container)',
                              color: 'var(--on-warning-container)',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: 4,
                              marginBottom: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <AlertTriangle size={13} />
                            <span>SPR ini direvisi (Versi {spr.versi}). Periksa kuota terbaru.</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                            {spr.nomorSurat || 'DRAF SPR'}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {spr.isMendesak && (
                              <span className="chip-urgent" style={{ fontSize: 10, padding: '2px 6px' }}>
                                Mendesak
                              </span>
                            )}
                            <span
                              style={{
                                backgroundColor:
                                  spr.status === 'Ditugaskan lengkap'
                                    ? 'var(--success-container)'
                                    : spr.status === 'Diajukan'
                                    ? '#EDE9FE'
                                    : spr.status === 'Menunggu Program'
                                    ? 'var(--warning-container)'
                                    : '#E2E8F0',
                                color:
                                  spr.status === 'Ditugaskan lengkap'
                                    ? 'var(--on-success-container)'
                                    : spr.status === 'Diajukan'
                                    ? '#6D28D9'
                                    : spr.status === 'Menunggu Program'
                                    ? 'var(--on-warning-container)'
                                    : 'var(--ink)',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 12,
                              }}
                            >
                              {spr.status}
                            </span>
                          </div>
                        </div>

                        {/* Title & Program */}
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--ink)' }}>
                          {spr.programName}
                        </h4>
                        <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                          {spr.judul}
                        </p>

                        {/* Metadata row */}
                        <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={13} />
                            <span>Tanggal Terdekat: <strong>{nearestDate}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={13} />
                            <span>Peminta: <strong>Divisi {spr.divisiPeminta}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11 }}>Peralatan:</span>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                              {spr.sistemPeralatan.sistem} {spr.sistemPeralatan.jumlahKamera ? `(${spr.sistemPeralatan.jumlahKamera} Cam)` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom: Progress & Actions */}
                      <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Kru Ditugaskan:</span>
                          <strong style={{ fontSize: 12.5, color: spr.totalCrewAssigned === spr.totalCrewNeeded && spr.totalCrewNeeded > 0 ? 'var(--success)' : '#7C3AED' }}>
                            {spr.totalCrewAssigned} dari {spr.totalCrewNeeded} posisi
                          </strong>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="button-primary"
                            onClick={() => {
                              setSelectedSprId(spr.id);
                              setCurrentStep('P2');
                            }}
                            style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px', gap: 6 }}
                          >
                            <span>Tugaskan Kru</span>
                            <ArrowRight size={14} />
                          </button>

                          {spr.status === 'Diajukan' && currentUserRole === 'admin_teknik' && (
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => {
                                setRejectingSpr(spr);
                                setRejectionReasonText('');
                                setRejectionReasonError('');
                              }}
                              style={{ height: 38, padding: '0 12px', color: 'var(--error)', borderColor: 'var(--error)', fontSize: 12 }}
                              title="Tolak berkas SPR ini dan kembalikan ke Program"
                            >
                              Tolak
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            STEP P2: TUGASKAN CREW (SAD v1.1 lines 879-927)
            =================================================================== */}
        {currentStep === 'P2' && selectedSpr && (
          <div>
            {/* Visual Time Strip for Production Activities */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--divider)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Strip Waktu Kegiatan Produksi: {selectedSpr.judul}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {selectedSpr.kegiatanList.length} Tahapan &bull; Format: {selectedSpr.formatAcara}
                </span>
              </div>

              {/* Time Strip Segments */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {selectedSpr.kegiatanList.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      flex: '1 0 200px',
                      backgroundColor: 'var(--primary-container)',
                      border: '1px solid #BFDBFE',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 12, color: 'var(--on-primary-container)' }}>{act.jenis}</strong>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {act.jamMulai.slice(0, 5)} - {act.jamSelesai.slice(0, 5)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 2 }}>
                      {act.tanggal} &bull; {act.lokasi || 'Studio'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Studio Warning Banners if any */}
              {studioWarnings.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {studioWarnings.map((warn, wIdx) => (
                    <div
                      key={wIdx}
                      className="notice-warning"
                      style={{ padding: '6px 12px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <AlertTriangle size={14} />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Layout: Main Slot Assignment Grid (Left 2.2fr) + Sticky Summary (Right 1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(280px, 1fr)', gap: 24, alignItems: 'start' }}>
              {/* Left Column: Sections per Profession */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {selectedSpr.kebutuhanCrewList.map((need) => {
                  const slotsForProfesi = assignmentSlots.filter((s) => s.profesi === need.profesi);
                  const isNonTechnical = ['Penata Rias', 'Penata Artistik', 'Dekor', 'Pengemudi'].some((nt) =>
                    need.profesi.toLowerCase().includes(nt.toLowerCase())
                  );

                  return (
                    <div
                      key={need.profesi}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--divider)',
                        borderRadius: 'var(--radius-md)',
                        padding: 16,
                      }}
                    >
                      {/* Profession Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--ink)' }}>{need.profesi}</strong>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            ({need.jumlah} posisi diminta)
                          </span>
                          {need.catatan && (
                            <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--muted)' }}>
                              &mdash; {need.catatan}
                            </span>
                          )}
                        </div>

                        {isNonTechnical && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                            Dipenuhi divisi lain, di luar penugasan sistem.
                          </span>
                        )}
                      </div>

                      {/* Slots for this profession */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {slotsForProfesi.map((slot) => {
                          const isFilled = slot.status === 'terisi';

                          return (
                            <div
                              key={slot.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isFilled ? 'var(--success-container)' : 'var(--surface)',
                                border: '1px solid',
                                borderColor: isFilled ? '#A7F3D0' : 'var(--divider)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {/* Left: Slot Label & Assigned Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: isFilled ? 'var(--on-success-container)' : 'var(--muted)', minWidth: 150 }}>
                                    {slot.profesi}, slot {slot.slotNumber} dari {slot.totalSlots}
                                  </span>

                                  {isFilled ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div
                                          style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--success)',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          <Check size={13} strokeWidth={3} />
                                        </div>
                                        <div>
                                          <strong style={{ fontSize: 13, color: 'var(--on-success-container)' }}>
                                            {slot.assignedCrewName}
                                          </strong>
                                          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                                            {slot.assignedCrewNip || slot.assignedCrewDivision}
                                          </span>
                                          {slot.secondaryRole && (
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginLeft: 8, backgroundColor: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                                              {slot.secondaryRole}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Tautan Hanya kegiatan tertentu (SAD v1.1 line 885) */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginLeft: 30, fontSize: 11 }}>
                                        <span style={{ color: 'var(--muted)' }}>
                                          {slot.hanyaKegiatanTertentu && slot.hanyaKegiatanTertentu.length > 0
                                            ? `Berlaku untuk ${slot.hanyaKegiatanTertentu.length} dari ${selectedSpr.kegiatanList.length} kegiatan`
                                            : 'Berlaku untuk seluruh kegiatan'}
                                        </span>
                                        <span>&bull;</span>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedActivitySlotId(expandedActivitySlotId === slot.id ? null : slot.id)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                            padding: 0,
                                            textDecoration: 'underline',
                                          }}
                                        >
                                          {expandedActivitySlotId === slot.id ? 'Tutup pilihan kegiatan' : 'Hanya kegiatan tertentu'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                                      {isNonTechnical ? 'Diisi oleh Unit Terkait' : 'Belum ada kru ditugaskan'}
                                    </span>
                                  )}
                                </div>

                                {/* Right: Action Buttons */}
                                {!isNonTechnical && (
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    {isFilled ? (
                                      <>
                                        <button
                                          type="button"
                                          className="button-secondary"
                                          onClick={() => {
                                            setActiveDrawerSlotId(slot.id);
                                            setCandidateSearchText('');
                                          }}
                                          style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                                        >
                                          Ganti
                                        </button>
                                        <button
                                          type="button"
                                          className="button-secondary"
                                          onClick={() => setConfirmEmptySlotId(slot.id)}
                                          style={{ height: 32, fontSize: 12, padding: '0 10px', color: 'var(--error)', borderColor: '#FCA5A5' }}
                                          title="Kosongkan slot"
                                        >
                                          Kosongkan slot
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        className="button-primary"
                                        onClick={() => {
                                          setActiveDrawerSlotId(slot.id);
                                          setCandidateSearchText('');
                                        }}
                                        style={{ height: 34, fontSize: 12.5, padding: '0 14px', gap: 6 }}
                                      >
                                        <UserCheck size={14} /> Pilih Kru
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Expandable Activity Checklist (SAD v1.1 line 885) */}
                              {isFilled && expandedActivitySlotId === slot.id && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    padding: '10px 14px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid #BFDBFE',
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                                    Pilih Tahapan Kegiatan untuk {slot.assignedCrewName}:
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                                    {selectedSpr.kegiatanList.map((act) => {
                                      const isChecked = !slot.hanyaKegiatanTertentu || slot.hanyaKegiatanTertentu.includes(act.id);
                                      return (
                                        <label
                                          key={act.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 11.5,
                                            cursor: 'pointer',
                                            padding: '4px 6px',
                                            backgroundColor: isChecked ? '#EFF6FF' : '#F8FAFC',
                                            borderRadius: 4,
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentList = slot.hanyaKegiatanTertentu || selectedSpr.kegiatanList.map((a) => a.id);
                                              const nextList = e.target.checked
                                                ? [...currentList, act.id]
                                                : currentList.filter((id) => id !== act.id);
                                              setAssignmentSlots((prev) =>
                                                prev.map((s) => (s.id === slot.id ? { ...s, hanyaKegiatanTertentu: nextList } : s))
                                              );
                                            }}
                                          />
                                          <span>
                                            <strong>{act.jenis}</strong> ({act.jamMulai.slice(0, 5)} - {act.jamSelesai.slice(0, 5)})
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Sticky Summary Panel (SAD v1.1 lines 903-906) */}
              <div
                style={{
                  position: 'sticky',
                  top: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                }}
              >
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9375rem', color: 'var(--ink)' }}>
                  Kelengkapan Kru
                </h4>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>Progres Penugasan:</span>
                    <strong style={{ color: filledSlotsCount === totalSlotsCount ? 'var(--success)' : 'var(--primary)' }}>
                      {filledSlotsCount} dari {totalSlotsCount} slot terisi
                    </strong>
                  </div>
                  <div style={{ height: 8, backgroundColor: 'var(--divider)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${totalSlotsCount > 0 ? (filledSlotsCount / totalSlotsCount) * 100 : 0}%`,
                        backgroundColor: filledSlotsCount === totalSlotsCount ? 'var(--success)' : 'var(--primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Unfilled slots quick links */}
                {totalSlotsCount > filledSlotsCount && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                      BELUM TERISI:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {assignmentSlots
                        .filter((s) => s.status === 'kosong')
                        .slice(0, 6)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveDrawerSlotId(s.id)}
                            style={{
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: 12,
                              padding: '2px 0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{s.profesi} (Slot {s.slotNumber})</span>
                            <span style={{ fontSize: 11 }}>Pilih &rarr;</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Quick Info Box */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    fontSize: 11.5,
                    color: 'var(--muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Jadwal Produksi:</strong>
                    <div>{selectedSpr.kegiatanList[0]?.tanggal || '-'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Lokasi Utama:</strong>
                    <div>{selectedSpr.kegiatanList[0]?.lokasi || 'Studio TVRI'}</div>
                  </div>
                </div>

                {/* Navigation Button */}
                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => setCurrentStep('P3')}
                    style={{ width: '100%', height: 42, fontSize: 13.5, gap: 8 }}
                  >
                    <span>Periksa bentrok</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setCurrentStep('P1')}
                    style={{ width: '100%', height: 36, fontSize: 12.5, marginTop: 8 }}
                  >
                    Kembali ke Pilih SPR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP P3: PERIKSA BENTROK (SAD v1.1 lines 929-943)
            =================================================================== */}
        {currentStep === 'P3' && selectedSpr && (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
                Hasil Audit Jadwal & Ketersediaan Kru
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
                Verifikasi integritas jadwal lintas penyiaran dan produksi sebelum Surat Penunjukan diterbitkan.
              </p>
            </div>

            {/* 1. KELOMPOK: PERLU DIPERBAIKI (PEMBLOKIR) */}
            {p3Evaluation.blockers.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--error-container)',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <XCircle size={18} color="var(--error)" />
                  <strong style={{ fontSize: 14, color: 'var(--on-error-container)' }}>
                    Perlu Diperbaiki ({p3Evaluation.blockers.length} Pemblokir)
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p3Evaluation.blockers.map((blk) => (
                    <div
                      key={blk.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{blk.message}</span>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                          setCurrentStep('P2');
                          setActiveDrawerSlotId(blk.slot.id);
                        }}
                        style={{ height: 30, fontSize: 11, padding: '0 10px' }}
                      >
                        Ganti Kru
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. KELOMPOK: BELUM TERISI (INFORMASI / PERINGATAN NON-BLOKIR) */}
            {p3Evaluation.unfilled.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--warning-container)',
                  border: '1px solid #FCD34D',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <AlertTriangle size={18} color="var(--on-warning-container)" />
                  <strong style={{ fontSize: 14, color: 'var(--on-warning-container)' }}>
                    Belum Terisi ({p3Evaluation.unfilled.length} Posisi)
                  </strong>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--on-warning-container)' }}>
                  SPR dapat diterbitkan dengan status <em>Ditugaskan sebagian</em> jika posisi berikut belum terpenuhi:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p3Evaluation.unfilled.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{item.message}</span>
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => {
                          setCurrentStep('P2');
                          setActiveDrawerSlotId(item.slot.id);
                        }}
                        style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                      >
                        Isi Sekarang
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. KELOMPOK: PERLU DIPERHATIKAN (PERINGATAN NON-BLOKIR) */}
            {p3Evaluation.warnings.length > 0 && (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ShieldAlert size={18} color="#D97706" />
                  <strong style={{ fontSize: 14, color: 'var(--ink)' }}>
                    Perlu Diperhatikan ({p3Evaluation.warnings.length} Peringatan)
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p3Evaluation.warnings.map((warn) => (
                    <div
                      key={warn.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5,
                        color: 'var(--ink)',
                      }}
                    >
                      {warn.message} &bull; <span style={{ color: 'var(--muted)' }}>{warn.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NO PROBLEMS SUCCESS BANNER */}
            {p3Evaluation.blockers.length === 0 && p3Evaluation.unfilled.length === 0 && (
              <div
                className="notice-success"
                style={{ padding: 18, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}
              >
                <CheckCircle2 size={24} color="var(--success)" />
                <div>
                  <strong style={{ fontSize: 14 }}>Tidak ada bentrok. Semua profesi terisi lengkap.</strong>
                  <div style={{ fontSize: 12 }}>Seluruh personil kru tersedia dan bebas dari bentrok dinas siaran.</div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('P2')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Penugasan Kru
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={!p3Evaluation.canProceedToP4}
                onClick={() => setCurrentStep('P4')}
                style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
                title={!p3Evaluation.canProceedToP4 ? 'Selesaikan bentrok pemblokir terlebih dahulu' : 'Lanjut ke tinjauan'}
              >
                <span>Lanjut ke tinjauan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP P4: TINJAU DAN TERBITKAN (SAD v1.1 lines 944-960)
            =================================================================== */}
        {currentStep === 'P4' && selectedSpr && (
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
                Tinjau & Terbitkan Surat Penunjukan
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
                Periksa susunan resmi Surat Penunjukan Kerabat Kerja sebelum diterbitkan ke Portal Crew dan dicetak untuk arsip.
              </p>
            </div>

            {/* Summary Box */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--divider)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 14 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                    {selectedSpr.programName}: {selectedSpr.judul}
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Nomor SPR: {selectedSpr.nomorSurat} &bull; Peralatan: {selectedSpr.sistemPeralatan.sistem}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Kelengkapan Kru:</span>
                  <strong style={{ fontSize: 14, color: filledSlotsCount === totalSlotsCount ? 'var(--success)' : '#D97706' }}>
                    {filledSlotsCount} dari {totalSlotsCount} Personil
                  </strong>
                </div>
              </div>

              {/* Roster Table Preview */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--divider)', borderRadius: 'var(--radius-sm)' }}>
                <table className="kerabat-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No</th>
                      <th style={{ width: 180 }}>Tugas / Profesi</th>
                      <th>Nama Pegawai</th>
                      <th style={{ width: 170 }}>NIP</th>
                      <th style={{ width: 100 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentSlots.map((slot, idx) => (
                      <tr key={slot.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{slot.profesi}</strong> {slot.totalSlots > 1 ? `(${slot.slotNumber})` : ''}
                        </td>
                        <td>
                          {slot.assignedCrewName ? (
                            <span style={{ fontWeight: 600 }}>{slot.assignedCrewName}</span>
                          ) : (
                            <span style={{ color: 'var(--error)', fontStyle: 'italic' }}>Belum ditugaskan</span>
                          )}
                        </td>
                        <td style={{ fontSize: 11 }}>{slot.assignedCrewNip || '-'}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: slot.status === 'terisi' ? 'var(--success-container)' : '#FEE2E2',
                              color: slot.status === 'terisi' ? 'var(--on-success-container)' : 'var(--error)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10.5,
                              fontWeight: 700,
                            }}
                          >
                            {slot.status === 'terisi' ? 'Terisi' : 'Kosong'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions based on Slot Completeness */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep('P3')}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <ArrowLeft size={16} /> Kembali ke Periksa Bentrok
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Print button */}
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowPrintModal(true)}
                  style={{ height: 42, padding: '0 16px', gap: 6 }}
                  title="Cetak Surat Penunjukan format resmi A4"
                >
                  <Printer size={16} />
                  <span>Cetak Surat Penunjukan (A4)</span>
                </button>

                {/* Primary Action Button (SAD v1.1 lines 950-956) */}
                {filledSlotsCount === totalSlotsCount ? (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => handleFinalPublish(false)}
                    style={{ height: 42, padding: '0 24px', fontSize: 14, gap: 8 }}
                  >
                    <Send size={16} />
                    <span>Terbitkan Surat Penunjukan</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setPartialPublishConfirmOpen(true)}
                      style={{ height: 42, padding: '0 16px', fontSize: 13 }}
                    >
                      Terbitkan surat dengan penugasan sebagian
                    </button>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => handleFinalPublish(true)}
                      style={{ height: 42, padding: '0 20px', fontSize: 13.5 }}
                    >
                      Simpan penugasan sebagian
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUCCESS SCREEN (SAD v1.1 line 959)
            =================================================================== */}
        {currentStep === 'SUCCESS' && selectedSpr && (
          <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--success-container)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink)' }}>
              Penugasan tersimpan. {filledSlotsCount} crew diberi tahu.
            </h2>

            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Surat Penunjukan Kerabat Kerja untuk produksi <strong>{selectedSpr.judul}</strong> telah berhasil diterbitkan. Seluruh personil teknis dapat melihat tugas dan call sheet di Portal Crew.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowPrintModal(true)}
                style={{ height: 42, padding: '0 20px', gap: 6 }}
              >
                <Printer size={16} /> Cetak Surat Penunjukan (A4)
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setCurrentStep('P1');
                  setSelectedSprId(null);
                }}
                style={{ height: 42, padding: '0 18px', gap: 6 }}
              >
                <RotateCcw size={16} /> Tugaskan SPR Lain
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={onClose}
                style={{ height: 42, padding: '0 20px' }}
              >
                Selesai & Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          CANDIDATE PICKER DRAWER / PANEL (SAD v1.1 lines 887-895)
          Desktop: 420px drawer panel
          =================================================================== */}
      {activeDrawerSlotId && activeSlot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 135,
          }}
          onClick={() => setActiveDrawerSlotId(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              height: '100%',
              backgroundColor: '#FFFFFF',
              boxShadow: '-8px 0 24px rgba(16, 27, 45, 0.16)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1.05rem', color: 'var(--ink)' }}>
                  Pilih Kru: {activeSlot.profesi}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Slot {activeSlot.slotNumber} dari {activeSlot.totalSlots}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerSlotId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <XCircle size={20} color="var(--muted)" />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} color="var(--border)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="text"
                className="input-default"
                value={candidateSearchText}
                onChange={(e) => setCandidateSearchText(e.target.value)}
                placeholder="Cari nama atau NIP crew..."
                style={{ width: '100%', height: 40, paddingLeft: 36, fontSize: 13 }}
              />
            </div>

            {/* Switch: Tampilkan yang tidak tersedia */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>Tampilkan yang tidak tersedia</span>
              <input
                type="checkbox"
                checked={showUnavailable}
                onChange={(e) => setShowUnavailable(e.target.checked)}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
            </div>

            {/* Candidates List (Ranked: Tersedia -> Peringatan -> Pengecualian -> Tidak Tersedia) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {filteredCandidates.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12.5 }}>
                  Tidak ada kandidat teknisi yang cocok dengan pencarian.
                </div>
              ) : (
                filteredCandidates.map((cItem) => {
                  const isKetuaTim = currentUserRole === 'admin_teknik' || currentUserRole === 'super_admin';
                  const isSelectable = cItem.canBeAssigned || (cItem.requiresException && isKetuaTim);

                  return (
                    <div
                      key={cItem.candidate.id}
                      onClick={() => {
                        if (isSelectable) handleAssignCrew(cItem);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor:
                          cItem.status === 'tersedia'
                            ? 'var(--divider)'
                            : cItem.status === 'tersedia_peringatan'
                            ? '#FCD34D'
                            : cItem.status === 'perlu_pengecualian'
                            ? '#FDBA74'
                            : '#FCA5A5',
                        backgroundColor:
                          cItem.status === 'tersedia'
                            ? '#FFFFFF'
                            : cItem.status === 'tersedia_peringatan'
                            ? 'var(--warning-container)'
                            : cItem.status === 'perlu_pengecualian'
                            ? '#FFF7ED'
                            : '#FEF2F2',
                        cursor: isSelectable ? 'pointer' : 'not-allowed',
                        opacity: cItem.status === 'tidak_tersedia' ? 0.75 : 1,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{cItem.candidate.name}</strong>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor:
                              cItem.status === 'tersedia'
                                ? 'var(--success-container)'
                                : cItem.status === 'tersedia_peringatan'
                                ? '#FEF3C7'
                                : cItem.status === 'perlu_pengecualian'
                                ? '#FFEDD5'
                                : 'var(--error-container)',
                            color:
                              cItem.status === 'tersedia'
                                ? 'var(--on-success-container)'
                                : cItem.status === 'tersedia_peringatan'
                                ? 'var(--on-warning-container)'
                                : cItem.status === 'perlu_pengecualian'
                                ? '#C2410C'
                                : 'var(--error)',
                          }}
                        >
                          {cItem.statusLabel}
                        </span>
                      </div>

                      <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{cItem.candidate.subDivision || cItem.candidate.division}</span>
                        <span>&bull;</span>
                        <span>{cItem.bebanTugasHariIni} tugas pada tanggal ini</span>
                      </div>

                      {cItem.reason && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: cItem.status === 'tersedia' ? 'var(--success)' : cItem.status === 'tidak_tersedia' ? 'var(--error)' : 'var(--ink)',
                            lineHeight: 1.3,
                          }}
                        >
                          {cItem.reason}
                        </div>
                      )}

                      {/* Ketua Tim Action vs Admin Lain Info (SAD v1.1 line 894-895) */}
                      {cItem.status === 'perlu_pengecualian' && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #FED7AA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {isKetuaTim ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C' }}>
                              Beri pengecualian &rarr;
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#9A3412', fontStyle: 'italic' }}>
                              Hanya Ketua Tim yang dapat memberi pengecualian.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: PENGECEUALIAN KETUA TIM (SAD v1.1 line 894)
          =================================================================== */}
      {exceptionCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 145,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 480,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldAlert size={22} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                Beri Pengecualian Ketua Tim
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.4 }}>
              <strong>{exceptionCandidate.candidate.name}</strong> terdeteksi memiliki konflik/rangkap peran: <em>{exceptionCandidate.reason}</em>.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                Alasan Pengecualian Resmi (Wajib) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                className="input-default"
                rows={3}
                value={exceptionReasonInput}
                onChange={(e) => {
                  setExceptionReasonInput(e.target.value);
                  if (exceptionReasonError) setExceptionReasonError('');
                }}
                placeholder="Tulis alasan pengecualian resmi Ketua Tim agar tercatat pada audit..."
                style={{ width: '100%', padding: 10, fontSize: 13 }}
              />
              {exceptionReasonError && (
                <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>
                  {exceptionReasonError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setExceptionCandidate(null)}
                style={{ height: 38, padding: '0 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={handleConfirmException}
                style={{ height: 38, padding: '0 18px', backgroundColor: '#D97706' }}
              >
                Beri Pengecualian & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: TOLAK SPR DI P1 (SAD v1.1 line 873)
          =================================================================== */}
      {rejectingSpr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 145,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 480,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <XCircle size={22} color="var(--error)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                Tolak Pengajuan SPR
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 14px' }}>
              Tolak permohonan produksi <strong>{rejectingSpr.judul}</strong>. Berkas akan dikembalikan ke Divisi Program dengan alasan.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                Alasan Penolakan <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                className="input-default"
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => {
                  setRejectionReasonText(e.target.value);
                  if (rejectionReasonError) setRejectionReasonError('');
                }}
                placeholder="Tulis alasan penolakan agar Admin Program dapat memperbaikinya..."
                style={{ width: '100%', padding: 10, fontSize: 13 }}
              />
              {rejectionReasonError && (
                <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>
                  {rejectionReasonError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setRejectingSpr(null)}
                style={{ height: 38, padding: '0 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={handleConfirmRejectSPR}
                style={{ height: 38, padding: '0 18px', backgroundColor: 'var(--error)', color: '#FFFFFF' }}
              >
                Konfirmasi Tolak SPR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: KONFIRMASI TERBITKAN SURAT SEBAGIAN (SAD v1.1 line 954)
          =================================================================== */}
      {partialPublishConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 145,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 460,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={22} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                Terbitkan Surat Penugasan Sebagian?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
              Surat akan memuat <strong>{filledSlotsCount} dari {totalSlotsCount}</strong> kerabat kerja. Posisi yang kosong akan ditandai belum terisi dan status SPR akan menjadi <em>Ditugaskan sebagian</em>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setPartialPublishConfirmOpen(false)}
                style={{ height: 38, padding: '0 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => handleFinalPublish(true)}
                style={{ height: 38, padding: '0 18px' }}
              >
                Terbitkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: KONFIRMASI SATU LANGKAH KOSONGKAN SLOT (SAD v1.1 line 902)
          =================================================================== */}
      {confirmEmptySlotId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 145,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 420,
              width: '100%',
              padding: 24,
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', color: 'var(--ink)' }}>
              Kosongkan Slot Penugasan?
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 18px', lineHeight: 1.4 }}>
              Kru yang bertugas pada slot ini akan dihapus dari penugasan dan status slot akan kembali kosong.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setConfirmEmptySlotId(null)}
                style={{ height: 36, padding: '0 14px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={() => handleEmptySlot(confirmEmptySlotId)}
                style={{ height: 36, padding: '0 16px', backgroundColor: 'var(--error)', color: '#FFFFFF' }}
              >
                Kosongkan Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: CETAK RESMI SURAT PENUNJUKAN A4 (BAKU TVRI BALI)
          =================================================================== */}
      {selectedSpr && (
        <SuratPenunjukanPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          spr={selectedSpr}
          assignment={currentAssignmentDocument}
        />
      )}
    </div>
  );
};

export default SPRAssignmentWizard;
