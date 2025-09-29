'use client';

import { TopNav } from '../components/TopNav';
import { WalletAuthButton } from '../components/WalletAuthButton';
import { SendTransaction } from '../components/SendTransaction';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

export default function HomePage() {
  const { isConnected } = useUnifiedAuth();

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        {!isConnected ? (
          /* Authentication Screen */
          <div className="flex flex-col items-center justify-center space-y-20 px-6">
            <div className="text-center">
              <h1 className="text-6xl font-bold cyber-text-primary cyber-text-glow">
                SIMPLE SEND
              </h1>
              
              <div style={{ height: '80px' }}></div>
              
              <p className="text-xl cyber-text-dim max-w-3xl mx-auto leading-relaxed px-4">
                Example using CDP Embedded Wallet and Base Account sign-in in a unified interface
              </p>
              
              <div style={{ height: '80px' }}></div>
            </div>

            {/* Authentication Component */}
            <div className="cyber-card p-8 rounded-lg max-w-md w-full">
              <WalletAuthButton />
            </div>
          </div>
        ) : (
          /* Connected State - Transaction Interface */
          <div className="w-full max-w-2xl mx-auto px-6">
            <SendTransaction />
          </div>
        )}
      </main>
    </div>
  );
}