import { useState, useMemo } from 'react';
import { Search, UserCheck } from 'lucide-react';
import type { CrewCandidate } from '../types';
import { StatusBadge } from './StatusBadge';
import { matchCandidateWithRequestedNames } from '../utils/crewParser';

interface CandidatePickerProps {
  candidates: CrewCandidate[];
  selectedIds: string[];
  maxNeeded: number;
  onToggleCandidate: (candidateId: string) => void;
  targetRole?: string;
  dualRoleMap?: Record<string, string>;
  onSetDualRole?: (candidateId: string, role: string) => void;
  onRemoveDualRole?: (candidateId: string) => void;
  availableSecondaryRoles?: string[];
  requestedNames?: string[];
  onSelectAllRequested?: () => void;
  programType?: 'penyiaran' | 'produksi';
}

export const CandidatePicker: React.FC<CandidatePickerProps> = ({
  candidates,
  selectedIds,
  maxNeeded: _maxNeeded = 0,
  onToggleCandidate,
  targetRole = 'Semua',
  dualRoleMap = {},
  onSetDualRole,
  onRemoveDualRole,
  availableSecondaryRoles,
  requestedNames = [],
  onSelectAllRequested,
  programType = 'penyiaran',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>(targetRole);

  // Extract unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(candidates.map((c) => c.role)));
    return ['Semua', ...roles];
  }, [candidates]);

  // Secondary role options for dual-role assignment
  const secondaryRoleOptions = useMemo(() => {
    const defaultList = [
      'Teknisi maintenance',
      'Teknisi IT / LED',
      'Teknisi peralatan',
      'VTR / Editor',
      'VTR/editor sore',
      'Teknisi master control',
      'Teknisi CCU / VE',
      'Penata suara',
      'Penata suara live',
      'Penata cahaya',
      'Pemadu gambar',
      'Kamerawan',
      'Penata aksara',
      'Pengarah teknik',
      'Teknisi AC / Listrik',
      'Teknisi STL / Transmisi',
    ];
    if (availableSecondaryRoles && availableSecondaryRoles.length > 0) {
      return Array.from(new Set([...availableSecondaryRoles, ...defaultList]));
    }
    return defaultList;
  }, [availableSecondaryRoles]);

  // Calculate dual-role count & total filled positions
  const dualRoleCount = useMemo(() => {
    return Object.keys(dualRoleMap).filter((id) => selectedIds.includes(id)).length;
  }, [dualRoleMap, selectedIds]);

  const _totalFilledSlots = selectedIds.length + dualRoleCount;
  void _totalFilledSlots;
  void _maxNeeded;

  // Sort: available first, then matched rundown names, then name
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.division.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole =
          selectedRoleFilter === 'Semua' || c.role === selectedRoleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        // Available candidates first
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;

        // Prioritize candidates matching names requested in the rundown
        const aMatched = requestedNames.length > 0 ? matchCandidateWithRequestedNames(a.name, requestedNames) : null;
        const bMatched = requestedNames.length > 0 ? matchCandidateWithRequestedNames(b.name, requestedNames) : null;
        if (aMatched && !bMatched) return -1;
        if (!aMatched && bMatched) return 1;

        return a.name.localeCompare(b.name);
      });
  }, [candidates, searchQuery, selectedRoleFilter, requestedNames]);

  return (
    <div>
      {/* Top Filter and Search Bar */}
      <div className="candidate-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari nama, NIP, atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: 180 }}>
          <select
            className="form-select"
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            aria-label="Filter berdasarkan peran"
          >
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                Peran: {role}
              </option>
            ))}
          </select>
        </div>

        <div className="selection-counter-badge">
          <UserCheck size={16} />
          <span className="tabular">
            {programType === 'produksi' ? (
              `${selectedIds.length} dari ${_maxNeeded} posisi terisi`
            ) : (
              `${selectedIds.length} personil terpilih${dualRoleCount > 0 ? ` (${dualRoleCount} rangkap tugas)` : ''}`
            )}
          </span>
        </div>
      </div>

      {/* Comma-Separated Rundown Names Helper Bar */}
      {requestedNames && requestedNames.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#FEF9C3',
            border: '1px solid #FDE047',
            borderRadius: 'var(--radius-md)',
            marginBottom: 14,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#854D0E', whiteSpace: 'nowrap' }}>
              🎯 Kru Diminta di Rundown ({requestedNames.length} nama):
            </span>
            <div className="crew-name-pills-wrap">
              {requestedNames.slice(0, 10).map((nm, idx) => (
                <span key={idx} className="crew-name-pill highlight">
                  {nm}
                </span>
              ))}
              {requestedNames.length > 10 && (
                <span style={{ fontSize: 11, color: '#A16207', fontWeight: 600 }}>
                  +{requestedNames.length - 10} lainnya
                </span>
              )}
            </div>
          </div>

          {onSelectAllRequested && (
            <button
              type="button"
              onClick={onSelectAllRequested}
              style={{
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: '#CA8A04',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A16207')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CA8A04')}
              title="Otomatis centang kandidat yang namanya tercantum dalam tabel Kerabat Kerja Rundown"
            >
              ⚡ Pilih Otomatis Kru Sesuai Rundown
            </button>
          )}
        </div>
      )}

      {/* Candidate List */}
      <div className="candidate-list" role="listbox" aria-multiselectable="true">
        {filteredCandidates.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Belum ada crew untuk peran ini
            </p>
            <p style={{ fontSize: 13 }}>
              Coba ubah kata kunci pencarian atau sesuaikan filter peran.
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            const hasDualRole = !!dualRoleMap[candidate.id];
            const matchedRundownName =
              requestedNames.length > 0
                ? matchCandidateWithRequestedNames(candidate.name, requestedNames)
                : null;

            return (
              <div
                key={candidate.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={`candidate-row ${
                  candidate.available ? '' : 'unavailable'
                } ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleCandidate(candidate.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onToggleCandidate(candidate.id);
                  }
                }}
              >
                <div className="candidate-left">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div onClick
                    aria-label={`Pilih ${candidate.name}`}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      accentColor: 'var(--primary)',
                    }}
                  />
                  <div
                    className="candidate-avatar"
                    style={{ backgroundColor: candidate.avatarBg || 'var(--primary)' }}
                  >
                    {candidate.initials}
                  </div>
                  <div className="candidate-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="candidate-name">{candidate.name}</span>
                      {matchedRundownName && (
                        <span
                          className="rundown-match-badge"
                          title={`Nama personil ini diminta secara spesifik di tabel Kerabat Kerja Rundown`}
                        >
                          🎯 Diminta di Rundown: {matchedRundownName}
                        </span>
                      )}
                    </div>
                    <span className="candidate-meta">
                      <strong>{candidate.role}</strong> &bull; {candidate.division} &bull;{' '}
                      <span className="tabular">NIP: {candidate.nip}</span>
                    </span>

                    {/* Dual Role Selector / Pill (Only shown when candidate is selected) */}
                    {isSelected && (
                      <div
                        className="candidate-dual-role-section"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hasDualRole ? (
                          <div className="dual-role-pill">
                            <span className="dual-role-pill-label">
                              ⚡ Rangkap: <strong>{dualRoleMap[candidate.id]}</strong>
                            </span>
                            <button
                              type="button"
                              className="dual-role-remove-btn"
                              title="Hapus peran rangkap"
                              onClick={() => onRemoveDualRole?.(candidate.id)}
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div className="dual-role-assign-box">
                            <select
                              className="dual-role-select"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onSetDualRole?.(candidate.id, e.target.value);
                                }
                              }}
                              aria-label={`Tambah rangkap profesi untuk ${candidate.name}`}
                            >
                              <option value="">+ Tambah Profesi Rangkap...</option>
                              {secondaryRoleOptions
                                .filter(
                                  (r) =>
                                    r.toLowerCase() !== candidate.role.toLowerCase()
                                )
                                .map((r) => (
                                  <option key={r} value={r}>
                                    Rangkap: {r}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="candidate-right">
                  <StatusBadge
                    status={candidate.available ? 'Tersedia' : 'Tidak tersedia'}
                  />
                  {!candidate.available && candidate.unavailableReason && (
                    <span className="unavailable-reason-text">
                      {candidate.unavailableReason}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
