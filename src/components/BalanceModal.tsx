'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

interface TokenBalance {
  symbol: string;
  name: string;
  amount: string;
  contractAddress: string;
}

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BalanceModal({ isOpen, onClose }: BalanceModalProps) {
  const { address } = useUnifiedAuth();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && address) {
      fetchBalances();
    }
  }, [isOpen, address]);

  const fetchBalances = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('💰 Fetching balances for:', address);
      
      // Call our API route which will use CDP SDK
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          network: 'base-sepolia'
        })
      });

      if (!response.ok) {
        throw new Error(`Balance API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('💰 Balance response:', data);

      if (data.success) {
        // Filter for ETH and USDC only
        const filteredBalances = data.balances.filter((balance: TokenBalance) => 
          balance.symbol === 'ETH' || balance.symbol === 'USDC'
        );
        setBalances(filteredBalances);
      } else {
        setError(data.error || 'Failed to fetch balances');
      }
    } catch (error) {
      console.error('❌ Balance fetch failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="cyber-modal p-8 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold cyber-text-primary cyber-text-glow">
            WALLET BALANCE
          </h2>
          <button
            onClick={onClose}
            className="text-cyber-text-dim hover:text-cyber-pink transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Address Display */}
        <div className="mb-6 p-3 cyber-card rounded border border-cyber-blue">
          <div className="text-xs cyber-text-dim mb-1">BASE SEPOLIA ADDRESS</div>
          <div className="font-mono text-sm cyber-text-primary">
            {address?.slice(0, 8)}...{address?.slice(-8)}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="cyber-pulse cyber-text-blue text-2xl mb-4">⟳</div>
            <p className="cyber-text-dim">Fetching balances...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="cyber-card border-cyber-pink p-4 rounded mb-6">
            <p className="text-sm cyber-text-pink">⚠ {error}</p>
            <button
              onClick={fetchBalances}
              className="mt-3 cyber-button text-sm px-4 py-2"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Balances Display */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {balances.length > 0 ? (
              balances.map((balance, index) => (
                <div key={index} className="cyber-card p-4 rounded border-l-4 border-l-cyber-blue">
                  <div className="flex items-center justify-between">
                    <div className="font-bold cyber-text-primary text-lg">
                      {balance.symbol}
                    </div>
                    <div className="font-bold cyber-text-green text-lg">
                      {parseFloat(balance.amount).toFixed(6)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl mb-4">🪙</div>
                <p className="cyber-text-dim">No ETH or USDC balances found</p>
                <p className="text-xs cyber-text-dim mt-2">
                  Use the faucet to get testnet tokens
                </p>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        {!isLoading && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchBalances}
              className="cyber-button text-sm px-6 py-2"
            >
              REFRESH BALANCES
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
