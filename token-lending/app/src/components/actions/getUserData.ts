import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LENDING_PROGRAM_ID } from '../../utils/constants';
import { OBLIGATION_SIZE, parseLendingMarket, parseObligation, parseReserve } from '../../utils/state';
import { useConnection, useAnchorWallet, AnchorWallet } from "@solana/wallet-adapter-react";

const connection = new Connection('https://api.devnet.solana.com');
const lendingMarketPubkey = new PublicKey('7T12b6nyt6vbgj1rvaW2PVvicTvsrdSY5YNNSchGTqLg')

export const getObligationData = async (obligationPubkey: PublicKey) => {
    const obligationInfo = await connection.getAccountInfo(obligationPubkey)
    const data = parseObligation(obligationPubkey, obligationInfo!)
    return { data }
}

// this will get all reserve accounts for a given lendingMarket pubkey
export const getUserData = async (authority: PublicKey) => {
    const accounts = await connection.getParsedProgramAccounts(
        LENDING_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: OBLIGATION_SIZE, // number of bytes
                },
                {
                    memcmp: {
                        offset: 1 + 8 + 1 + 32, // number of bytes
                        bytes: authority.toBase58(), // base58 encoded string
                    },
                },
                {
                    memcmp: {
                        offset: 1 + 8 + 1, // number of bytes
                        bytes: lendingMarketPubkey.toBase58(), // base58 encoded string
                    },
                },
            ],
            
        }
      );
      const result = await Promise.all(
        accounts.map((account) =>
            getObligationData(account.pubkey)
        )
      );
    return { result }
    
}


