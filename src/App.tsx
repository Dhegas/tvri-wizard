import { useState } from 'react';
import {
  Tv,
  Users,
  CalendarCheck,
  Shield,
  User,
} from 'lucide-react';
import { WizardA } from './components/WizardA';
import { WizardB } from './components/WizardB';
import { FirstLoginModal } from './components/FirstLoginModal';
import { SuratPerintahModal } from './components/SuratPerintahModal';
import { INITIAL_REQUESTS } from './data/mockData';
import type { CrewRequest, SavedAssignment, UserRole } from './types';

export function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('admin_program');
  const [requests, setRequests] = useState<CrewRequest[]>(INITIAL_REQUESTS);
  const [showFirstLogin, setShowFirstLogin] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Bambang Triyono',
    phone: '0812-3456-7890',
  });

  // Sample saved assignment for direct preview if user wants
  const [previewSp, setPreviewSp] = useState<SavedAssignment | null>(null);

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

  const pendingCount = requests.filter((r) => r.status === 'Diajukan').length;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="brand-section">
          <div className="brand-logo" title="Stitch AI System">
            <Tv size={20} strokeWidth={2.4} />
          </div>
          <div className="brand-info">
            <span className="brand-title">Stitch AI &mdash; Crew Scheduling</span>
            <span className="brand-subtitle">Sistem Penjadwalan & Penugasan Kru Penyiaran</span>
          </div>
        </div>

        {/* Role & Wizard Switcher */}
        <div className="nav-controls">
          <div className="role-switcher" role="tablist" aria-label="Pilih Peran Pengguna">
            <button
              type="button"
              className={`role-btn ${activeRole === 'admin_program' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin_program')}
              role="tab"
              aria-selected={activeRole === 'admin_program'}
            >
              <CalendarCheck size={15} />
              <span>Admin Program (Wizard A)</span>
            </button>

            <button
              type="button"
              className={`role-btn ${activeRole === 'admin_teknik' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin_teknik')}
              role="tab"
              aria-selected={activeRole === 'admin_teknik'}
            >
              <Users size={15} />
              <span>Admin Teknik (Wizard B)</span>
              {pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: '#fff',
                    borderRadius: 'var(--radius-pill)',
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  className="tabular"
                >
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* First Login Demo Trigger */}
          <button
            type="button"
            className="btn btn-outline-gray"
            style={{ height: 34, fontSize: 12, padding: '0 10px' }}
            onClick={() => setShowFirstLogin(true)}
            title="Buka dialog aktivasi akun pertama kali (Section 8.4)"
          >
            <Shield size={14} /> Aktivasi Akun
          </button>

          {/* User Badge */}
          <div className="user-profile-badge" title={`Kontak: ${userProfile.phone}`}>
            <User size={13} />
            <span>{userProfile.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeRole === 'admin_program' ? (
          <WizardA
            onSuccessSubmit={handleNewRequest}
            onGoToRundown={() => setActiveRole('admin_teknik')}
          />
        ) : (
          <WizardB
            requests={requests}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </main>

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
    </div>
  );
}

export default App;
