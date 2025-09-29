import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';

export async function POST(request: NextRequest) {
  try {
    const { address, token } = await request.json();

    if (!address || !token) {
      return NextResponse.json(
        { success: false, error: 'Address and token are required' },
        { status: 400 }
      );
    }

    console.log('🚰 Faucet request for:', address, 'token:', token);

    const cdp = new CdpClient();

    // Use the correct CDP faucet API
    const result = await cdp.evm.requestFaucet({
      address: address,
      network: 'base-sepolia',
      token: token === 'usdc' ? 'usdc' : 'eth'
    });

    console.log('🚰 Faucet response:', result);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      token: token.toUpperCase(),
      message: `${token.toUpperCase()} sent to your wallet!`
    });

  } catch (error) {
    console.error('❌ Faucet API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}