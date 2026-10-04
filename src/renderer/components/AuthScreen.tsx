import React, { useState, useEffect } from 'react';
import styles from './AuthScreen.module.css';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateEmail } from '../lib/authUtils';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthScreen: React.FC<Props> = ({ onClose, onSuccess }) => {
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
        setCooldown(c => c - 1);
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
          shouldCreateUser: true
        }
      });
      
      if (signInError) {
        if (signInError.message === 'Failed to fetch') {
          setError('Network error: Unable to reach the authentication server. Please check your internet connection or Supabase URL.');
        } else {
          setError(signInError.message);
        }
      } else {
        setSuccess('Verification code sent to your email.');
        setStep('otp');
        setCooldown(60);
      }
    } catch (err: any) {
      console.error('Auth request failed:', err);
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
      email,
      token: otp,
      type: 'email'
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    } else if (data.session) {
      onSuccess();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.authContainer}>
        <h2 className={styles.title}>Account Sign In</h2>
        <p className={styles.subtitle}>Sign in to save your data securely.</p>
        
        {error && <div className={styles.errorBox}>{error}</div>}
        {success && <div className={styles.successBox}>{success}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
                required
              />
              {showEmailWarning && (
                <span className={styles.validationWarning}>Please enter a valid email address.</span>
              )}
            </div>
            <button type="submit" className={styles.button} disabled={loading || !isValidEmail}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
            <button type="button" className={`${styles.button} ${styles.secondaryButton}`} onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>6-Digit Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className={styles.input}
                placeholder="123456"
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify and Sign In'}
            </button>
            
            <button 
              type="button" 
              className={styles.textButton} 
              onClick={handleSendCode} 
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
            </button>

            <button type="button" className={`${styles.button} ${styles.secondaryButton}`} onClick={() => setStep('email')} disabled={loading}>
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
