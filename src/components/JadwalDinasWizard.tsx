import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Info,
} from 'lucide-react';
import type {
  DutySchedule,
  DutyJobGroup,
  DutyCellState,
  DutyAvailabilityCode,
  Employee,
  UserRole,
} from '../types';
import {
  MASTER_EMPLOYEES,
  DUTY_JOB_DEFINITIONS,
  MOCK_DUTY_SCHEDULE,
  MOCK_SPR_DOCUMENTS,
} from '../data/mockData';
import {
  OFFICIAL_JOB_CODES,
  validateDutyCellAssignment,
  runDutyScheduleHealthCheck,
  formatAvailabilityReason,
} from '../utils/conflictDetector';

interface JadwalDinasWizardProps {
  currentUserRole?: UserRole;
  onClose?: () => void;
  onSuccessPublish?: (schedule: DutySchedule) => void;
  schedule?: DutySchedule;
  onChangeSchedule?: (schedule: DutySchedule) => void;
  initialStep?: number;
  initialGroup?: DutyJobGroup;
}

export function JadwalDinasWizard({
  currentUserRole = 'admin_teknik',
  onClose,
  onSuccessPublish,
  schedule: scheduleProp,
  onChangeSchedule,
  initialStep = 1,
  initialGroup = 'Teknisi Siaran',
}: JadwalDinasWizardProps) {
  // Step state: 1: Bulan & Sumber, 2: Grid Kode, 3: Pemeriksaan, 4: Tinjau & Terbitkan, 5: Sukses
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Month & Source state (J1)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [sourceType, setSourceType] = useState<'kosong' | 'salin'>('kosong');

  // Schedule state (deep copy of prop or mock data)
  const [schedule, setSchedule] = useState<DutySchedule>(() => {
    return scheduleProp
      ? JSON.parse(JSON.stringify(scheduleProp))
      : JSON.parse(JSON.stringify(MOCK_DUTY_SCHEDULE));
  });

  // J2 UI states
  const [activeGroup, setActiveGroup] = useState<DutyJobGroup>(initialGroup);
  const [viewMode, setViewMode] = useState<'bulan' | 'tanggal'>('bulan');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('2026-10-12');
  const [saveStatusText, setSaveStatusText] = useState<string>('Tersimpan otomatis');

  // Cell popover/editor state
  const [activeCell, setActiveCell] = useState<{
    employee: Employee;
    date: string;
    cellState: DutyCellState;
  } | null>(null);

  // Editor modal form fields
  const [modalTab, setModalTab] = useState<'job' | 'availability'>('job');
  const [editPrimaryCode, setEditPrimaryCode] = useState<string>('');
  const [editSecondaryCode, setEditSecondaryCode] = useState<string>('');
  const [editChangeReason, setEditChangeReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSpecialException, setIsSpecialException] = useState<boolean>(false);
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorWarning, setEditorWarning] = useState<string | null>(null);

  // Availability form fields
  const [availType, setAvailType] = useState<DutyAvailabilityCode>('CT');
  const [availStartDate, setAvailStartDate] = useState<string>('2026-10-12');
  const [availEndDate, setAvailEndDate] = useState<string>('2026-10-14');
  const [availReason, setAvailReason] = useState<string>('Cuti Tahunan');

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedMonth}-${dayNum.toString().padStart(2, '0')}`;
      const dayDate = new Date(year, month - 1, dayNum);
      const dayNameShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dayDate.getDay()];
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const isToday = dateStr === '2026-10-12';
      return { dayNum, dateStr, dayNameShort, isWeekend, isToday };
    });
  }, [selectedMonth]);

  // Filter employees for the current group
  const groupEmployees = useMemo(() => {
    return MASTER_EMPLOYEES.filter((emp) => {
      if (activeGroup === 'Job Program') {
        return emp.division === 'Program';
      }
      if (emp.division !== 'Teknik') return false;

      // Match employee qualified jobs with the active group
      const qualifiedCodes = emp.jobCodes;
      return qualifiedCodes.some((code) => {
        const meta = OFFICIAL_JOB_CODES[code];
        return meta && meta.group === activeGroup;
      });
    });
  }, [activeGroup]);

  // J3 Comprehensive Health Check calculation
  const healthCheck = useMemo(() => {
    return runDutyScheduleHealthCheck(schedule, MASTER_EMPLOYEES, MOCK_SPR_DOCUMENTS);
  }, [schedule]);

  // Open Cell Popover
  const handleOpenCell = (emp: Employee, dateStr: string) => {
    const existing = schedule.assignments[emp.id]?.[dateStr] || { primaryCode: '' };
    setActiveCell({
      employee: emp,
      date: dateStr,
      cellState: existing,
    });
    setModalTab(existing.availability ? 'availability' : 'job');
    setEditPrimaryCode(existing.primaryCode || '');
    setEditSecondaryCode(existing.secondaryCode || '');
    setEditChangeReason(existing.changeReason || '');
    setEditNotes(existing.notes || '');
    setIsSpecialException(existing.isSpecialException || false);
    setExceptionReason(existing.exceptionReason || '');
    setAvailStartDate(dateStr);
    setAvailEndDate(dateStr);
    setAvailType(existing.availability || 'CT');
    setAvailReason(existing.reason || 'Cuti Tahunan');
    setEditorError(null);
    setEditorWarning(existing.warningMessage || null);
  };

  // Save Cell Code Assignment
  const handleSaveCellCode = () => {
    if (!activeCell) return;
    const { employee, date } = activeCell;

    // Validate using universal conflict engine
    const validation = validateDutyCellAssignment(
      employee,
      date,
      editPrimaryCode,
      editSecondaryCode,
      schedule,
      MOCK_SPR_DOCUMENTS,
      isSpecialException,
      exceptionReason,
      editChangeReason
    );

    if (!validation.isValid) {
      setEditorError(validation.errorMessage || 'Penugasan tidak valid.');
      return;
    }

    setSaveStatusText('Menyimpan...');

    // Update cell state
    setSchedule((prev) => {
      const next = { ...prev };
      if (!next.assignments[employee.id]) {
        next.assignments[employee.id] = {};
      }
      next.assignments[employee.id][date] = {
        ...validation.cellState,
        notes: editNotes || undefined,
      };

      // Add to audit trail if published and code changed
      if (prev.status === 'terbit' && activeCell.cellState.primaryCode !== editPrimaryCode) {
        const newAuditItem = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          employeeId: employee.id,
          employeeName: employee.name,
          date,
          previousCode: activeCell.cellState.primaryCode || '(kosong)',
          newCode: editPrimaryCode || '(kosong)',
          reason: editChangeReason || 'Penyesuaian operasional',
          changedBy: currentUserRole === 'admin_program' ? 'Admin Program' : 'Admin Teknik',
        };
        next.auditTrail = [newAuditItem, ...(next.auditTrail || [])];
      }

      onChangeSchedule?.(next);
      return next;
    });

    setTimeout(() => {
      setSaveStatusText(`Tersimpan ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
      setActiveCell(null);
    }, 200);
  };

  // Save Availability (Cuti / Libur / DL)
  const handleSaveAvailability = () => {
    if (!activeCell) return;
    const { employee } = activeCell;

    setSaveStatusText('Menyimpan ketersediaan...');

    setSchedule((prev) => {
      const next = { ...prev };
      if (!next.assignments[employee.id]) {
        next.assignments[employee.id] = {};
      }

      // Apply across date range
      const start = new Date(availStartDate);
      const end = new Date(availEndDate);
      const cur = new Date(start);

      while (cur <= end) {
        const curDateStr = cur.toISOString().split('T')[0];
        next.assignments[employee.id][curDateStr] = {
          primaryCode: '',
          availability: availType,
          reason: availReason,
        };
        cur.setDate(cur.getDate() + 1);
      }

      onChangeSchedule?.(next);
      return next;
    });

    setTimeout(() => {
      setSaveStatusText('Ketersediaan tercatat');
      setActiveCell(null);
    }, 200);
  };

  // Clear Cell
  const handleClearCell = () => {
    if (!activeCell) return;
    const { employee, date } = activeCell;
    setSchedule((prev) => {
      const next = { ...prev };
      if (next.assignments[employee.id]) {
        delete next.assignments[employee.id][date];
      }
      onChangeSchedule?.(next);
      return next;
    });
    setActiveCell(null);
  };

  // Publish Schedule (J4)
  const handlePublishSchedule = () => {
    const published = {
      ...schedule,
      status: 'terbit' as const,
      publishedAt: new Date().toISOString(),
      publishedBy: 'Admin Teknik (Ketua Tim)',
    };
    setSchedule(published);
    setCurrentStep(5); // Success confirmation step
    onChangeSchedule?.(published);
    if (onSuccessPublish) {
      onSuccessPublish(published);
    }
  };

  // Jump from J3 issues to cell in J2
  const handleJumpToCell = (employeeId: string, date: string, group: DutyJobGroup) => {
    setActiveGroup(group);
    setCurrentStep(2);
    const emp = MASTER_EMPLOYEES.find((e) => e.id === employeeId);
    if (emp) {
      setTimeout(() => {
        handleOpenCell(emp, date);
      }, 100);
    }
  };

  return (
    <div className="jadwal-dinas-container" style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Top Header */}
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderBottom: '1px solid var(--divider)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
              Wizard Jadwal Dinas Bulanan
            </h1>
            <span
              className={`chip-status ${
                schedule.status === 'terbit' ? 'chip-status-success' : 'chip-status-draft'
              }`}
            >
              {schedule.status === 'terbit' ? 'Terbit' : 'Draf'}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 2 }}>
            LPP TVRI Stasiun Bali &bull; Sumber Otomatis Kerabat Kerja Siaran
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }} className="tabular">
            {saveStatusText}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
              style={{ height: 38, padding: '0 14px' }}
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Banner Mode Lihat Saja untuk Divisi Program */}
      {currentUserRole === 'admin_program' && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#1E3FA8',
          }}
        >
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Mode Lihat Saja (Divisi Program):</strong> Jadwal Dinas Bulanan disusun dan dikelola sepenuhnya oleh Divisi Teknik sebagai acuan shift penyiaran 24 jam. Divisi Program dapat melihat jadwal shift seluruh kru siaran tanpa hak mengubah jadwal atau kode shift.
          </div>
        </div>
      )}

      {/* 4-Step Stepper Header */}
      {currentStep <= 4 && (
        <div
          style={{
            backgroundColor: 'var(--panel)',
            borderBottom: '1px solid var(--divider)',
            padding: '12px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, maxWidth: 960, margin: '0 auto' }}>
            {[
              { num: 1, title: 'Bulan dan sumber' },
              { num: 2, title: 'Kelompok dan grid kode' },
              { num: 3, title: 'Pemeriksaan' },
              { num: 4, title: 'Tinjau dan terbitkan' },
            ].map((step, idx) => {
              const isCurrent = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: isDone ? 'pointer' : 'default',
                    opacity: isCurrent || isDone ? 1 : 0.6,
                  }}
                  onClick={() => {
                    if (isDone) setCurrentStep(step.num);
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={
                      isCurrent ? 'stepper-current' : isDone ? 'stepper-done' : 'stepper-upcoming'
                    }
                  >
                    {isDone ? <Check size={18} strokeWidth={2.5} /> : step.num}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: isCurrent ? 700 : 500, color: 'var(--ink)' }}>
                      {step.title}
                    </div>
                  </div>
                  {idx < 3 && (
                    <div
                      style={{
                        height: 1,
                        width: 32,
                        backgroundColor: 'var(--divider)',
                        marginLeft: 16,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content by Step */}
      <div style={{ padding: '24px', maxWidth: 1440, margin: '0 auto' }}>
        {/* ===================================================================
            LANGKAH J1: BULAN DAN SUMBER
            =================================================================== */}
        {currentStep === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ backgroundColor: 'var(--panel)', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--divider)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                Langkah 1: Pilih Bulan dan Sumber Jadwal Dinas
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 24 }}>
                Tentukan bulan penugasan kerabat kerja siaran bulanan. Jadwal ini akan mengisi nama kru siaran secara otomatis pada setiap rundown harian.
              </p>

              {/* Info & Warning Notices */}
              {schedule.totalAssignments > 0 && (
                <div className="notice-info" style={{ marginBottom: 20 }}>
                  <Info size={18} />
                  <div>
                    <strong>Pemberitahuan Draf:</strong> Jadwal Dinas {selectedMonth} sudah berisi {schedule.totalAssignments} penugasan. Anda akan melanjutkan penyuntingan.
                  </div>
                </div>
              )}

              {schedule.status === 'terbit' && (
                <div className="notice-warning" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Jadwal Sudah Terbit:</strong> Jadwal bulan ini sudah diterbitkan sebelumnya. Setiap perubahan kode memerlukan alasan resmi dan tercatat pada audit trail.
                  </div>
                </div>
              )}

              {/* Month Picker */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
                  Bulan Jadwal Dinas <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-default"
                  style={{ maxWidth: 320 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  Default bulan berjalan atau bulan berikutnya untuk penyusunan rutin.
                </span>
              </div>

              {/* Source Option */}
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 10, color: 'var(--ink)' }}>
                  Metode Pembuatan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div
                    onClick={() => setSourceType('kosong')}
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      border: sourceType === 'kosong' ? '2px solid var(--primary)' : '1px solid var(--divider)',
                      backgroundColor: sourceType === 'kosong' ? 'var(--primary-container)' : 'var(--panel)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                      Mulai Kosong / Lanjutkan Draf
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 4 }}>
                      Memulai jadwal baru atau membuka kembali penugasan yang sudah tersimpan.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--divider)',
                      backgroundColor: 'var(--surface)',
                      opacity: 0.6,
                      cursor: 'not-allowed',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--muted)' }}>
                      Salin dari Bulan Lalu
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 4 }}>
                      Fitur prioritas P2 (Segera tersedia pada pembaruan berikutnya).
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="button-primary"
                onClick={() => setCurrentStep(2)}
              >
                Lanjut ke Grid Kode <ArrowRight size={18} />
              </button>
            </div>

            {/* Sticky Summary Panel */}
            <div className="panel-summary" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--divider)', paddingBottom: 8 }}>
                Ringkasan Draf
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Bulan:</span>
                  <strong>{selectedMonth}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Jumlah Pegawai:</span>
                  <strong>{MASTER_EMPLOYEES.length} orang</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Total Hari:</span>
                  <strong>{daysInMonth.length} hari</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Penugasan Terisi:</span>
                  <span className="tabular">{schedule.totalAssignments} sel</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            LANGKAH J2: KELOMPOK DAN GRID KODE
            =================================================================== */}
        {currentStep === 2 && (
          <div>
            {/* Top Toolbar: Group Tabs & View Mode */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid var(--divider)',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {/* Group Tabs with Empty Slot Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', maxWidth: '78%' }}>
                {[
                  'Teknisi Siaran',
                  'Opr. Peralatan Teknik Studio',
                  'Kamerawan',
                  'Penata Suara',
                  'Penata Cahaya',
                  'Pemadu Gambar',
                  'VTR/Editor',
                  'Teknisi IT',
                  'Chargen',
                  'AC/Listrik',
                  'Maintenance',
                  ...(currentUserRole === 'admin_program' || currentUserRole === 'super_admin' ? (['Job Program'] as const) : []),
                ].map((grp) => {
                  const isActive = activeGroup === grp;
                  const summary = healthCheck.unassignedByGroup.find((u) => u.group === grp);
                  const emptyCount = summary ? summary.emptySlots : 0;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setActiveGroup(grp as DutyJobGroup)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                        color: isActive ? 'var(--on-primary)' : 'var(--ink)',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--primary)' : 'var(--divider)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{grp}</span>
                      {emptyCount > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--divider)',
                            color: isActive ? '#fff' : 'var(--muted)',
                          }}
                        >
                          {emptyCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* View Mode Toggle: Per bulan vs Per tanggal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Tampilan:</span>
                <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('bulan')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.8125rem',
                      fontWeight: viewMode === 'bulan' ? 700 : 500,
                      backgroundColor: viewMode === 'bulan' ? 'var(--primary-container)' : 'var(--panel)',
                      color: viewMode === 'bulan' ? 'var(--on-primary-container)' : 'var(--ink)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Per bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('tanggal')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.8125rem',
                      fontWeight: viewMode === 'tanggal' ? 700 : 500,
                      backgroundColor: viewMode === 'tanggal' ? 'var(--primary-container)' : 'var(--panel)',
                      color: viewMode === 'tanggal' ? 'var(--on-primary-container)' : 'var(--ink)',
                      border: 'none',
                      borderLeft: '1px solid var(--divider)',
                      cursor: 'pointer',
                    }}
                  >
                    Per tanggal
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW MODE: PER BULAN (44x44px Grid) */}
            {viewMode === 'bulan' && (
              <div
                style={{
                  backgroundColor: 'var(--panel)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--divider)',
                  overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '620px',
                    position: 'relative',
                  }}
                >
                  <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                    <thead>
                      <tr>
                        {/* Sticky Left Header: Nama Pegawai */}
                        <th
                          style={{
                            position: 'sticky',
                            left: 0,
                            top: 0,
                            zIndex: 20,
                            backgroundColor: 'var(--surface)',
                            borderBottom: '2px solid var(--divider)',
                            borderRight: '2px solid var(--divider)',
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: 'var(--ink)',
                            minWidth: 200,
                          }}
                        >
                          Pegawai ({groupEmployees.length})
                        </th>

                        {/* Date Columns */}
                        {daysInMonth.map((d) => (
                          <th
                            key={d.dateStr}
                            style={{
                              position: 'sticky',
                              top: 0,
                              zIndex: 10,
                              backgroundColor: d.isToday
                                ? 'var(--primary-container)'
                                : d.isWeekend
                                ? '#F1F5F9'
                                : 'var(--surface)',
                              borderBottom: '2px solid var(--divider)',
                              borderRight: '1px solid var(--divider)',
                              width: 44,
                              minWidth: 44,
                              maxWidth: 44,
                              padding: '6px 2px',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>
                              {d.isToday ? 'Hari ini' : d.dayNameShort}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                              {d.dayNum}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {groupEmployees.map((emp) => (
                        <tr key={emp.id}>
                          {/* Sticky Left Column: Employee Name */}
                          <td
                            style={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 5,
                              backgroundColor: 'var(--panel)',
                              borderBottom: '1px solid var(--divider)',
                              borderRight: '2px solid var(--divider)',
                              padding: '8px 14px',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              {emp.jobCodes.join(', ') || emp.subDivision}
                            </div>
                          </td>

                          {/* 44x44px Grid Cells */}
                          {daysInMonth.map((d) => {
                            const cellState = schedule.assignments[emp.id]?.[d.dateStr];
                            const hasCode = !!cellState?.primaryCode;
                            const hasAvail = !!cellState?.availability;
                            const hasWarn = !!cellState?.hasWarning;
                            const hasConflict = !!cellState?.hasConflict;

                            let cellClass = 'grid-cell-44 grid-cell-empty';
                            let displayContent = '';

                            if (hasAvail) {
                              cellClass = 'grid-cell-44 grid-cell-availability';
                              displayContent = cellState.availability || '';
                            } else if (hasConflict) {
                              cellClass = 'grid-cell-44 grid-cell-conflict';
                              displayContent = cellState?.primaryCode || '';
                            } else if (hasWarn) {
                              cellClass = 'grid-cell-44 grid-cell-warning';
                              displayContent = cellState?.secondaryCode
                                ? `${cellState.primaryCode}/${cellState.secondaryCode}`
                                : cellState?.primaryCode || '';
                            } else if (hasCode) {
                              cellClass = 'grid-cell-44 grid-cell-filled';
                              displayContent = cellState?.secondaryCode
                                ? `${cellState.primaryCode}/${cellState.secondaryCode}`
                                : cellState?.primaryCode || '';
                            }

                            return (
                              <td
                                key={d.dateStr}
                                style={{
                                  padding: 0,
                                  borderBottom: '1px solid var(--divider)',
                                  borderRight: '1px solid var(--divider)',
                                  width: 44,
                                  height: 44,
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                }}
                              >
                                <button
                                  type="button"
                                  className={cellClass}
                                  onClick={() => handleOpenCell(emp, d.dateStr)}
                                  title={
                                    hasAvail
                                      ? `${emp.name}: ${formatAvailabilityReason(cellState.availability!)} (${cellState.reason || ''})`
                                      : hasWarn
                                      ? `${emp.name}: ${cellState?.warningMessage || 'Peringatan'}`
                                      : `${emp.name} - ${d.dateStr}: ${displayContent || 'Kosong'}`
                                  }
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    border: 'none',
                                  }}
                                >
                                  {displayContent}

                                  {/* Warning triangle in corner */}
                                  {hasWarn && !hasAvail && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        width: 0,
                                        height: 0,
                                        borderLeft: '5px solid transparent',
                                        borderRight: '5px solid transparent',
                                        borderBottom: '5px solid #D97706',
                                      }}
                                    />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW MODE: PER TANGGAL (Ponsel & Single Day Focus) */}
            {viewMode === 'tanggal' && (
              <div
                style={{
                  backgroundColor: 'var(--panel)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--divider)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                {/* Horizontal Day Strip Picker */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8, display: 'block' }}>
                    Pilih Tanggal:
                  </label>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                    {daysInMonth.map((d) => {
                      const isSel = selectedDateFilter === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => setSelectedDateFilter(d.dateStr)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSel ? '2px solid var(--primary)' : '1px solid var(--divider)',
                            backgroundColor: isSel ? 'var(--primary-container)' : 'var(--panel)',
                            color: isSel ? 'var(--on-primary-container)' : 'var(--ink)',
                            minWidth: 54,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{d.dayNameShort}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>{d.dayNum}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Employee Cards on Selected Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {groupEmployees.map((emp) => {
                    const cell = schedule.assignments[emp.id]?.[selectedDateFilter];
                    return (
                      <div
                        key={emp.id}
                        className="candidate-row"
                        onClick={() => handleOpenCell(emp, selectedDateFilter)}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                            Job: {emp.jobCodes.join(', ') || 'Umum'} &bull; NIP: {emp.nip}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {cell?.availability ? (
                            <span className="chip-status" style={{ backgroundColor: 'var(--divider)' }}>
                              {formatAvailabilityReason(cell.availability)}
                            </span>
                          ) : cell?.primaryCode ? (
                            <span className="chip-status chip-status-info timecode">
                              {cell.primaryCode}
                              {cell.secondaryCode ? `/${cell.secondaryCode}` : ''}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                              (Belum ada kode)
                            </span>
                          )}

                          <button type="button" className="button-secondary" style={{ height: 36, padding: '0 12px', fontSize: 13 }}>
                            Ubah
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Legend Bar (SAD v1.1 J2) */}
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid var(--divider)',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                LEGENDA KODE JOB ({activeGroup}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.8125rem' }}>
                {DUTY_JOB_DEFINITIONS.filter((d) => d.group === activeGroup).map((def) => (
                  <div key={def.code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="timecode" style={{ padding: '2px 6px', background: 'var(--surface)', borderRadius: 4, fontWeight: 700 }}>
                      {def.code}
                    </span>
                    <span style={{ color: 'var(--ink)' }}>{def.label}</span>
                    <span style={{ color: 'var(--muted)' }}>({def.timeRangeText})</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="timecode" style={{ padding: '2px 6px', background: 'var(--divider)', borderRadius: 4, fontWeight: 700 }}>
                    L / CT
                  </span>
                  <span style={{ color: 'var(--muted)' }}>Lepas Piket / Cuti</span>
                </div>
              </div>
            </div>

            {/* Step Action Bar */}
            <div className="action-bar" style={{ borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={18} /> Kembali ke Bulan
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={() => setCurrentStep(3)}
              >
                Lanjut ke Pemeriksaan <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            LANGKAH J3: PEMERIKSAAN
            =================================================================== */}
        {currentStep === 3 && (
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: 'var(--panel)',
                padding: 28,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--divider)',
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                Langkah 3: Pemeriksaan Keseluruhan Jadwal Dinas
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 24 }}>
                Sistem memeriksa bentrok lintas penyiaran dan kegiatan produksi, status cuti, serta pelanggaran beban kerja shift.
              </p>

              {/* Status Banner */}
              {healthCheck.canPublish ? (
                <div className="notice-success" style={{ marginBottom: 24 }}>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Tidak Ada Pemblokir:</strong> Jadwal Dinas siap diterbitkan. Terdapat {healthCheck.warnings.length} peringatan yang telah ditinjau.
                  </div>
                </div>
              ) : (
                <div className="notice-error" style={{ marginBottom: 24 }}>
                  <AlertCircle size={20} />
                  <div>
                    <strong>Perlu Diperbaiki:</strong> Ditemukan {healthCheck.blockers.length} bentrok pemblokir sebelum jadwal dapat diterbitkan.
                  </div>
                </div>
              )}

              {/* 1. PERLU DIPERBAIKI (PEMBLOKIR) */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertCircle size={18} /> 1. Perlu Diperbaiki ({healthCheck.blockers.length} Pemblokir)
                </h3>
                {healthCheck.blockers.length === 0 ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 6 }}>
                    Tidak ada bentrok waktu atau pelanggaran ketersediaan.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {healthCheck.blockers.map((blk) => (
                      <div
                        key={blk.id}
                        style={{
                          backgroundColor: 'var(--error-container)',
                          border: '1px solid #FCA5A5',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--on-error-container)' }}>
                            {blk.employeeName} &bull; {blk.date}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--on-error-container)' }}>
                            {blk.message}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="button-danger"
                          style={{ height: 34, padding: '0 12px', fontSize: 13 }}
                          onClick={() => handleJumpToCell(blk.employeeId, blk.date, blk.group)}
                        >
                          Buka Sel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. PERLU DIPERHATIKAN (PERINGATAN) */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertTriangle size={18} /> 2. Perlu Diperhatikan ({healthCheck.warnings.length} Peringatan)
                </h3>
                {healthCheck.warnings.length === 0 ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 6 }}>
                    Tidak ada peringatan beban atau rangkap.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {healthCheck.warnings.map((warn) => (
                      <div
                        key={warn.id}
                        style={{
                          backgroundColor: 'var(--warning-container)',
                          border: '1px solid #FDE047',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--on-warning-container)' }}>
                            {warn.employeeName} &bull; {warn.date}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--on-warning-container)' }}>
                            {warn.message}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="button-secondary"
                          style={{ height: 34, padding: '0 12px', fontSize: 13 }}
                          onClick={() => handleJumpToCell(warn.employeeId, warn.date, warn.group)}
                        >
                          Buka Sel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. BELUM TERISI (INFORMASI) */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Info size={18} /> 3. Kelengkapan Sel per Kelompok
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {healthCheck.unassignedByGroup.map((item) => (
                    <div
                      key={item.group}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--divider)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.group}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          Terisi {item.assignedSlots} dari {item.totalSlots} sel
                        </div>
                      </div>

                      {item.emptySlots > 0 ? (
                        <button
                          type="button"
                          className="button-secondary"
                          style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                          onClick={() => {
                            setActiveGroup(item.group);
                            setCurrentStep(2);
                          }}
                        >
                          Isi ({item.emptySlots})
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 700 }}>
                          Lengkap
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar" style={{ borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft size={18} /> Kembali ke Grid
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={!healthCheck.canPublish}
                onClick={() => setCurrentStep(4)}
              >
                Lanjut ke Tinjauan <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            LANGKAH J4: TINJAU DAN TERBITKAN
            =================================================================== */}
        {currentStep === 4 && (
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: 'var(--panel)',
                padding: 32,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--divider)',
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                Langkah 4: Tinjau dan Terbitkan Jadwal Dinas
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 24 }}>
                Pastikan seluruh alokasi kerabat kerja siaran bulanan telah sesuai sebelum diterbitkan ke Portal Crew.
              </p>

              {/* Summary Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ padding: 16, backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {MASTER_EMPLOYEES.length}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Pegawai Ditugaskan</div>
                </div>

                <div style={{ padding: 16, backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {healthCheck.totalAssignments}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Total Sel Shift Terisi</div>
                </div>

                <div style={{ padding: 16, backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: healthCheck.warnings.length > 0 ? '#B45309' : 'var(--muted)' }}>
                    {healthCheck.warnings.length}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Peringatan Diterima</div>
                </div>
              </div>

              {/* Impact Notice */}
              <div className="notice-info" style={{ marginBottom: 24 }}>
                <Info size={18} />
                <div>
                  <strong>Pemberitahuan Otomatis:</strong> Menerbitkan jadwal ini akan mengirimkan notifikasi resmi kepada <strong>{MASTER_EMPLOYEES.length} kerabat kerja</strong> dan secara otomatis mengisi tabel <em>Kerabat Kerja Siaran</em> di seluruh Rundown Harian bulan {selectedMonth}.
                </div>
              </div>

              {/* Audit Trail (If Modified) */}
              {schedule.auditTrail && schedule.auditTrail.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                    Riwayat Perubahan Terakhir:
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8125rem' }}>
                    {schedule.auditTrail.slice(0, 3).map((aud) => (
                      <div
                        key={aud.id}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--surface)',
                          borderRadius: 6,
                          border: '1px solid var(--divider)',
                        }}
                      >
                        <strong>{aud.employeeName}</strong> pada tanggal {aud.date}: kode <code>{aud.previousCode}</code> diubah ke <code>{aud.newCode}</code> &bull; <em>"{aud.reason}"</em> ({aud.changedBy})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, borderTop: '1px solid var(--divider)', paddingTop: 20 }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setCurrentStep(3)}
                >
                  <ArrowLeft size={18} /> Kembali ke Pemeriksaan
                </button>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled
                    title="Fitur prioritas P2"
                  >
                    Unduh PDF (Segera)
                  </button>
                  {currentUserRole === 'admin_teknik' ? (
                    <button
                      type="button"
                      className="button-primary"
                      onClick={handlePublishSchedule}
                    >
                      Terbitkan Jadwal Dinas
                    </button>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        padding: '0 16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        height: 40,
                      }}
                    >
                      <Info size={15} />
                      <span>Mode Lihat (Dikelola Teknik)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            LANGKAH 5: KONFIRMASI SUKSES (SAD v1.1 J4)
            =================================================================== */}
        {currentStep === 5 && (
          <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: 'var(--panel)',
                padding: 40,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--divider)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--success-container)',
                  color: 'var(--on-success-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Check size={36} strokeWidth={3} />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                Jadwal Dinas {selectedMonth} Terbit
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: 28 }}>
                {MASTER_EMPLOYEES.length} crew diberi tahu. Tabel Kerabat Kerja Siaran pada rundown harian kini telah sinkron secara otomatis.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setCurrentStep(2)}
                >
                  Lihat Grid Jadwal
                </button>
                {onClose && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={onClose}
                  >
                    Selesai & Keluar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          CELL EDITOR MODAL / SHEET (SAD v1.1 J2 Popover)
          ===================================================================== */}
      {activeCell && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 27, 45, 0.48)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 8px 24px rgba(16, 27, 45, 0.16)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--divider)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Penugasan Sel: {activeCell.employee.name}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Tanggal: <strong>{activeCell.date}</strong> &bull; Divisi {activeCell.employee.division}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation: Job Code vs Ketersediaan */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--divider)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <button
                type="button"
                onClick={() => setModalTab('job')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: modalTab === 'job' ? 'var(--panel)' : 'transparent',
                  fontWeight: modalTab === 'job' ? 700 : 500,
                  color: modalTab === 'job' ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: modalTab === 'job' ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Kode Job Dinas
              </button>
              <button
                type="button"
                onClick={() => setModalTab('availability')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: modalTab === 'availability' ? 'var(--panel)' : 'transparent',
                  fontWeight: modalTab === 'availability' ? 700 : 500,
                  color: modalTab === 'availability' ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: modalTab === 'availability' ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Catat Ketersediaan (Cuti/Libur)
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Error / Warning Alert inside modal */}
              {editorError && (
                <div className="notice-error" style={{ marginBottom: 16 }}>
                  <AlertCircle size={18} />
                  <div style={{ fontSize: '0.8125rem' }}>{editorError}</div>
                </div>
              )}

              {editorWarning && (
                <div className="notice-warning" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  <div style={{ fontSize: '0.8125rem' }}>{editorWarning}</div>
                </div>
              )}

              {/* TAB 1: JOB CODE */}
              {modalTab === 'job' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Primary Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      Kode Utama:
                    </label>
                    <select
                      className="input-default"
                      value={editPrimaryCode}
                      onChange={(e) => {
                        setEditPrimaryCode(e.target.value);
                        setEditorError(null);
                      }}
                    >
                      <option value="">-- Kosongkan Sel --</option>
                      {/* Qualified codes only for this employee */}
                      <optgroup label="Kode Resmi Pegawai">
                        {activeCell.employee.jobCodes.map((code) => {
                          const meta = OFFICIAL_JOB_CODES[code];
                          return (
                            <option key={code} value={code}>
                              {code} &mdash; {meta?.roleName || code} ({meta?.standardTime})
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Kode Status Harian">
                        <option value="U">U &mdash; Dinas Umum Harian</option>
                        <option value="ADM">ADM &mdash; Administrasi Teknik</option>
                        <option value="MT">MT &mdash; Maintenance Fasilitas</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Secondary Code (Rangkap) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      Kode Rangkap (Opsional):
                    </label>
                    <select
                      className="input-default"
                      value={editSecondaryCode}
                      onChange={(e) => {
                        setEditSecondaryCode(e.target.value);
                        setEditorError(null);
                      }}
                    >
                      <option value="">-- Tidak Ada Rangkap --</option>
                      {activeCell.employee.jobCodes.map((code) => (
                        <option key={code} value={code}>
                          {code} &mdash; {OFFICIAL_JOB_CODES[code]?.roleName || code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pengecualian Ketua Tim if needed */}
                  {editSecondaryCode && (
                    <div style={{ padding: 12, backgroundColor: 'var(--surface)', borderRadius: 6, border: '1px solid var(--divider)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={isSpecialException}
                          onChange={(e) => setIsSpecialException(e.target.checked)}
                        />
                        Beri Pengecualian Ketua Tim
                      </label>
                      {isSpecialException && (
                        <input
                          type="text"
                          placeholder="Tulis alasan pengecualian resmi (Wajib)..."
                          value={exceptionReason}
                          onChange={(e) => setExceptionReason(e.target.value)}
                          className="input-default"
                          style={{ marginTop: 8, height: 38 }}
                        />
                      )}
                    </div>
                  )}

                  {/* Alasan Perubahan (wajib jika jadwal terbit) */}
                  {schedule.status === 'terbit' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                        Alasan Perubahan <span style={{ color: 'var(--error)' }}>*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="Wajib diisi karena jadwal sudah terbit..."
                        value={editChangeReason}
                        onChange={(e) => setEditChangeReason(e.target.value)}
                        className="input-default"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      Catatan Tambahan:
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Standby studio 2"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="input-default"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: AVAILABILITY (Cuti / Libur) */}
              {modalTab === 'availability' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      Jenis Ketersediaan:
                    </label>
                    <select
                      className="input-default"
                      value={availType}
                      onChange={(e) => setAvailType(e.target.value as DutyAvailabilityCode)}
                    >
                      <option value="CT">CT &mdash; Cuti Tahunan</option>
                      <option value="L">L &mdash; Hari Libur / Lepas Piket</option>
                      <option value="IZIN">IZIN &mdash; Izin Resmi</option>
                      <option value="DL">DL &mdash; Dinas Luar Kota</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                        Tanggal Mulai:
                      </label>
                      <input
                        type="date"
                        className="input-default"
                        value={availStartDate}
                        onChange={(e) => setAvailStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                        Tanggal Selesai:
                      </label>
                      <input
                        type="date"
                        className="input-default"
                        value={availEndDate}
                        onChange={(e) => setAvailEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      Keterangan Resmi:
                    </label>
                    <input
                      type="text"
                      className="input-default"
                      value={availReason}
                      onChange={(e) => setAvailReason(e.target.value)}
                      placeholder="Misal: Cuti Tahunan / Tugas Luar Kota"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--divider)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--surface)',
              }}
            >
              {currentUserRole === 'admin_teknik' ? (
                <>
                  <button
                    type="button"
                    className="button-danger"
                    style={{ height: 40, padding: '0 14px' }}
                    onClick={handleClearCell}
                  >
                    Kosongkan Sel
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="button-secondary"
                      style={{ height: 40, padding: '0 16px' }}
                      onClick={() => setActiveCell(null)}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="button-primary"
                      style={{ height: 40, padding: '0 18px' }}
                      onClick={modalTab === 'job' ? handleSaveCellCode : handleSaveAvailability}
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
                    <Info size={16} />
                    <span>Mode Lihat Saja (Dikelola Divisi Teknik)</span>
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    style={{ height: 40, padding: '0 16px' }}
                    onClick={() => setActiveCell(null)}
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
