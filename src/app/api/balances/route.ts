import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';

export async function POST(request: NextRequest) {
  try {
    const { address, network } = await request.json();

    if (!address || !network) {
      return NextResponse.json(
        { success: false, error: 'Address and network are required' },
        { status: 400 }
      );
    }

    console.log('💰 Fetching balances for:', address, 'on', network);

    const cdp = new CdpClient({
        apiKeyId: process.env.CDP_API_KEY_ID!,
        apiKeySecret: process.env.CDP_API_KEY_SECRET!,
      });

    const result = await cdp.evm.listTokenBalances({
      address: address,
      network: network === 'base-sepolia' ? 'base-sepolia' : 'base',
    });

    // Process balances to human readable format
    const processedBalances = result.balances.map((item) => {
      const readableAmount = Number(item.amount.amount) / Math.pow(10, item.amount.decimals);
      return {
        symbol: item.token.symbol,
        name: item.token.name,
        amount: readableAmount.toString(),
        contractAddress: item.token.contractAddress,
      };
    });

    // Filter for ETH and USDC only
    const filteredBalances = processedBalances.filter(balance => 
      balance.symbol === 'ETH' || balance.symbol === 'USDC'
    );

    return NextResponse.json({
      success: true,
      balances: filteredBalances,
    });

  } catch (error) {
    console.error('❌ Balance API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}