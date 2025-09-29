'use client';

import { useState } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { BalanceModal } from './BalanceModal';

export function TopNav() {
  const { address, isConnected, walletType, disconnect } = useUnifiedAuth();
  const [copied, setCopied] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [faucetModalOpen, setFaucetModalOpen] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  console.log('🔍 TopNav Debug:', { 
    address: address || 'undefined', 
    isConnected: !!isConnected, 
    walletType: walletType || 'none',
    addressTruthy: !!address,
    condition: !!(isConnected && address)
  });

  return (
    <nav className="w-full bg-cyber-dark border-b-2 border-cyber-blue p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-end">
        {/* Right Side Navigation */}
        <div className="flex items-center space-x-4">
          {isConnected && address ? (
            <>
              {/* Faucet Button */}
              <button 
                onClick={() => setFaucetModalOpen(true)}
                className="cyber-button text-sm px-4 py-2"
              >
                FAUCET
              </button>

              {/* Balance Button */}
              <button 
                onClick={() => setBalanceModalOpen(true)}
                className="cyber-button text-sm px-4 py-2 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-black"
              >
                BALANCE
              </button>

              {/* Connected Wallet Display */}
              <div className="flex items-center cyber-card p-4 rounded" style={{ gap: '16px' }}>
                {/* Wallet Type Indicator */}
                <div className="flex items-center space-x-2">
                  {walletType === 'base_account' && (
                    <>
                      <span className="text-lg">🟦</span>
                      <div className="text-xs cyber-text-primary font-bold">BASE</div>
                    </>
                  )}
                  {walletType === 'embedded' && (
                    <>
                      <span className="text-lg">📱</span>
                      <div className="text-xs cyber-text-secondary font-bold">EMBEDDED</div>
                    </>
                  )}
                </div>

                {/* Address with Copy */}
                <button
                  onClick={copyAddress}
                  className="flex items-center hover:bg-cyber-gray p-2 rounded transition-all duration-200 group"
                  title="Click to copy address"
                  style={{ gap: '12px' }}
                >
                  <code className="text-sm cyber-text-primary font-mono">
                    {formatAddress(address)}
                  </code>
                  <div className="flex items-center space-x-1">
                    {/* Copy Icon */}
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      className="cyber-text-blue group-hover:cyber-text-glow transition-all"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {/* Copy Feedback */}
                    {copied && (
                      <span className="text-xs cyber-text-green font-bold">✓</span>
                    )}
                  </div>
                </button>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    console.log('🔌 Disconnecting wallet...');
                    disconnect();
                  }}
                  className="text-cyber-text-dim hover:text-cyber-pink transition-colors p-2"
                  title="Disconnect wallet"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      
      {/* Modals */}
      <BalanceModal 
        isOpen={balanceModalOpen} 
        onClose={() => setBalanceModalOpen(false)} 
      />
      
      {/* Faucet Modal - Placeholder until API route is ready */}
      {faucetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="cyber-modal p-8 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold cyber-text-primary cyber-text-glow">
                BASE SEPOLIA FAUCET
              </h2>
              <button
                onClick={() => setFaucetModalOpen(false)}
                className="text-cyber-text-dim hover:text-cyber-pink transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="cyber-text-dim text-center">
                Get testnet tokens for {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={async () => {
                    console.log('🚰 Requesting ETH from faucet');
                    try {
                      const response = await fetch('/api/faucet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          address,
                          token: 'eth'
                        })
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        alert(`✅ Success! ${result.amount} ${result.token} sent to your wallet. Tx: ${result.transactionHash}`);
                        setFaucetModalOpen(false);
                      } else {
                        alert(`❌ Faucet failed: ${result.error}`);
                      }
                    } catch (error) {
                      console.error('❌ Faucet error:', error);
                      alert('❌ Faucet request failed. Please try again.');
                    }
                  }}
                  className="cyber-button p-4"
                >
                  GET ETH
                </button>
                <button 
                  onClick={async () => {
                    console.log('🚰 Requesting USDC from faucet');
                    try {
                      const response = await fetch('/api/faucet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          address,
                          token: 'usdc'
                        })
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        alert(`✅ Success! ${result.amount} ${result.token} sent to your wallet. Tx: ${result.transactionHash}`);
                        setFaucetModalOpen(false);
                      } else {
                        alert(`❌ Faucet failed: ${result.error}`);
                      }
                    } catch (error) {
                      console.error('❌ Faucet error:', error);
                      alert('❌ Faucet request failed. Please try again.');
                    }
                  }}
                  className="cyber-button p-4 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-black"
                >
                  GET USDC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}