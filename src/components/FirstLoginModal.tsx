import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, X, Check } from 'lucide-react';
import { Stepper } from './Stepper';
import type { StepItem } from './Stepper';

interface FirstLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { name: string; phone: string }) => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('Budi Pratama');
  const [phone, setPhone] = useState('0812-9876-5432');
  const [division, setDivision] = useState('Divisi Berita & Informasi');

  if (!isOpen) return null;

  const steps: StepItem[] = [
    { id: 1, label: 'Ganti Password' },
    { id: 2, label: 'Lengkapi Profil' },
  ];

  // Calculate live password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Kosong', color: '#999' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, text: 'Lemah', color: 'var(--danger)' };
    if (score === 2 || score === 3) return { score: 2, text: 'Sedang', color: 'var(--warning)' };
    return { score: 3, text: 'Sangat Kuat', color: 'var(--success)' };
  };

  const strength = getPasswordStrength(newPassword);
  const isStep1Valid = newPassword.length >= 8 && newPassword === confirmPassword;
  const isStep2Valid = fullName.trim().length > 3 && phone.trim().length >= 10;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid) return;
    onSuccess({ name: fullName, phone });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <h3 className="modal-title">Aktivasi Akun & Kata Sandi Pertama</h3>
          </div>
          <button
            type="button"
            className="alert-banner-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <Stepper
            steps={steps}
            currentStep={step}
            onStepClick={(id) => {
              if (id === 1 || (id === 2 && isStep1Valid)) setStep(id);
            }}
          />

          {step === 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Untuk keamanan akun Anda, silakan buat kata sandi baru minimal 8 karakter.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Kata Sandi Baru <span className="required-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan minimal 8 karakter..."
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {newPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Kekuatan Kata Sandi:</span>
                      <strong style={{ color: strength.color }}>{strength.text}</strong>
                    </div>
                    <div
                      style={{
                        height: 4,
                        width: '100%',
                        backgroundColor: '#E2E6ED',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(strength.score / 3) * 100}%`,
                          backgroundColor: strength.color,
                          transition: 'width 200ms ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Konfirmasi Kata Sandi <span className="required-star">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru..."
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="form-error-msg">
                    Kata sandi konfirmasi tidak cocok.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Periksa dan lengkapi kontak resmi Anda untuk notifikasi tugas siaran.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nama Lengkap Sesuai SK <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nomor Handphone / WhatsApp <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input tabular"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                />
                <span className="form-helper">
                  Nomor aktif untuk pengiriman notifikasi jadwal dan Surat Perintah otomatis.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Divisi / Satuan Kerja</label>
                <input
                  type="text"
                  className="form-input"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              Lanjut ke Profil
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-gray"
                onClick={() => setStep(1)}
              >
                Kembali
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isStep2Valid}
                onClick={handleFinish}
              >
                <Check size={16} /> Simpan & Selesaikan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
