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
      <div className="flex flex-col items-center" style={{ gap: '24px' }}>
        {/* Base Account Button - Following Official Brand Guidelines */}
        <button
          onClick={connectBaseAccount}
          className="flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-300 group"
          style={{ padding: '20px 40px', width: '320px' }}
        >
          {/* Official Base Logo - Blue square on light background */}
          <div 
            className="w-5 h-5 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: '#0000FF' }}
          ></div>
          <div style={{ width: '12px' }}></div>
          <div className="font-semibold text-gray-900 text-lg">
            Sign in with Base
          </div>
        </button>

        {/* Email Button - Visually Consistent */}
        <button
          onClick={() => setAuthStep('email')}
          className="flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-300 group"
          style={{ padding: '20px 40px', width: '320px' }}
        >
          {/* Email Icon */}
          <div className="w-5 h-5 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div style={{ width: '12px' }}></div>
          <div className="font-semibold text-gray-900 text-lg">
            Sign in with Email
          </div>
        </button>
      </div>
    </div>
  );
}