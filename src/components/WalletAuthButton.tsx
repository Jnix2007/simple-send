'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

export function WalletAuthButton() {
  const {
    address,
    isConnected,
    walletType,
    connectBaseAccount,
    signInWithEmbeddedWallet,
    verifyOtpAndConnect,
    disconnect,
    isSigningIn,
    isVerifying,
  } = useUnifiedAuth();

  const [authStep, setAuthStep] = useState<'select' | 'email' | 'otp'>('select');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>('');

  // Auto-handle authentication state changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('🎉 Authentication successful - wallet connected!');
      // Component will unmount since parent shows signed-in experience
    }
  }, [isConnected, address]);

  // Connected state - handled by TopNav
  if (isConnected && address) {
    return null;
  }

  // OTP verification
  if (authStep === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold cyber-text-primary">CHECK YOUR EMAIL</h3>
          <p className="cyber-text-dim mt-2">Enter the verification code sent to</p>
          <p className="cyber-text-accent font-mono text-sm">{email}</p>
        </div>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="000000"
          maxLength={6}
          className="cyber-input w-full text-center text-xl tracking-widest"
        />

        {error && (
          <div className="cyber-card border-cyber-pink p-4 rounded">
            <p className="text-sm cyber-text-pink">⚠ {error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
             onClick={async () => {
               setError('');
               const success = await verifyOtpAndConnect(otp);
               if (!success) {
                 setError('Failed to verify code. Please try again.');
               }
             }}
            disabled={otp.length !== 6 || isVerifying}
            className="cyber-button w-full"
          >
            {isVerifying ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          <button
            onClick={() => setAuthStep('email')}
            className="w-full px-4 py-2 cyber-text-dim hover:cyber-text-primary transition-colors"
          >
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  // Email input
  if (authStep === 'email') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold cyber-text-secondary">CREATE EMBEDDED WALLET</h3>
          <p className="cyber-text-dim mt-2">Enter your email to get started</p>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="cyber-input w-full"
        />

        {error && (
          <div className="cyber-card border-cyber-pink p-4 rounded">
            <p className="text-sm cyber-text-pink">⚠ {error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
           onClick={async () => {
             console.log('🔄 Starting email sign-in for:', email);
             setError('');
             try {
               const success = await signInWithEmbeddedWallet(email);
               console.log('📧 Email sign-in result:', success);
               if (success) {
                 console.log('✅ Email sign-in succeeded - checking if should go to OTP or signed in...');
                 // Let the state management decide what happens next
                 setTimeout(() => {
                   if (!isConnected) {
                     setAuthStep('otp');
                   }
                 }, 1000);
               } else {
                 setError('Failed to send verification code. Please try again.');
               }
             } catch (error) {
               console.error('❌ Email sign-in error:', error);
               setError('Failed to send verification code. Please check your email and try again.');
             }
           }}
            disabled={!email || isSigningIn}
            className="cyber-button w-full border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary"
          >
            {isSigningIn ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}
          </button>

          <button
            onClick={() => setAuthStep('select')}
            className="w-full px-4 py-2 cyber-text-dim hover:cyber-text-primary transition-colors"
          >
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  // Initial selection
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <button
          onClick={connectBaseAccount}
          className="w-full p-6 cyber-card hover:border-cyber-blue transition-all duration-300 rounded-lg group"
        >
          <div className="flex items-center justify-center">
            <span className="text-2xl group-hover:scale-110 transition-transform">🟦</span>
            <div style={{ width: '20px' }}></div>
            <div className="font-bold cyber-text-primary text-lg">
              Sign in with Base
            </div>
          </div>
        </button>

        <button
          onClick={() => setAuthStep('email')}
          className="w-full p-6 cyber-card hover:border-cyber-secondary transition-all duration-300 rounded-lg group"
        >
          <div className="flex items-center justify-center">
            <span className="text-2xl group-hover:scale-110 transition-transform">📧</span>
            <div style={{ width: '20px' }}></div>
            <div className="font-bold cyber-text-secondary text-lg">
              Sign in with email
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}