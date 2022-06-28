import { PublicKey } from "@solana/web3.js";

export const COMMITMENT = "confirmed";
export const RPC_TIMEOUT = 120 * 1000;
export const LENDING_PROGRAM_ID = new PublicKey("HCHiaAK26t9MFTj933s3Te71NGpwgb6Lbuev7q6phaSL");
export const ORACLE_PROGRAM_ID = new PublicKey('5mkqGkkWSaSk2NL9p4XptwEQu4d5jFTJiurbbzdqYexF');
export const MAX_RETRIES = 3;

export const OBLIGATION = Buffer.from("obligation");
export const lendingMarketPubkey = new PublicKey('7T12b6nyt6vbgj1rvaW2PVvicTvsrdSY5YNNSchGTqLg');
export const WRAPPED_SOL = 'So11111111111111111111111111111111111111112';