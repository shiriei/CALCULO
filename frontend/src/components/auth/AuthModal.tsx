import React, { useState, useEffect } from 'react';
import styles from './AuthModal.module.css';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { validateEmail } from '../../lib/authUtils';
import { PillButton } from '../ui/PillButton';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const trimmedEmail = email.trim();
  const isValidEmail = validateEmail(trimmedEmail);
  const showEmailWarning = trimmedEmail.length > 0 && !isValidEmail;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isValidEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Authentication is disabled. Missing Supabase configuration (.env).');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        if (signInError.message === 'Failed to fetch') {
          setError('Network error: Unable to reach the authentication server.');
        } else {
          setError(signInError.message);
        }
      } else {
        setSuccess('Verification code sent to your email.');
        setStep('otp');
        setCooldown(60);
      }
    } catch (err: unknown) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    const { error: verifyError, data } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: otp,
      type: 'email',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    } else if (data.session) {
      onSuccess();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{step === 'email' ? 'Sign In / Register' : 'Verify Email'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close authentication modal">
            ✕
          </button>
        </div>

        <p className={styles.subText}>
          {step === 'email'
            ? 'Enter your email to receive a secure 6-digit authentication code.'
            : `We sent a code to ${trimmedEmail}. Enter it below.`}
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                disabled={loading}
                className={showEmailWarning ? styles.inputInvalid : ''}
              />
              {showEmailWarning && (
                <span className={styles.warningText}>Please enter a valid email (e.g., name@domain.com)</span>
              )}
            </div>

            <div className={styles.actions}>
              <PillButton
                type="submit"
                variant="primary"
                disabled={loading || !isValidEmail || cooldown > 0}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Sending code...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Login Code'}
              </PillButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="auth-otp">6-Digit Code</label>
              <input
                id="auth-otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                disabled={loading}
              />
            </div>

            <div className={styles.actions}>
              <PillButton
                type="submit"
                variant="primary"
                disabled={loading || otp.length !== 6}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </PillButton>

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                }}
              >
                &larr; Use different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
