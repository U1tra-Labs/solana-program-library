import { AnchorProvider } from "@project-serum/anchor";
import InitObligation from "./actions/InitObligation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { Table } from 'react-bootstrap';
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import Loading from "./Loading";
import { LENDING_PROGRAM_ID, WRAPPED_SOL } from "../utils/constants";
import { parseObligation } from "../utils/state";

export default function Positions({
    reservesData,
    provider,
    callback
} : {
    reservesData: any | undefined;
    provider: AnchorProvider | undefined;
    callback?: () => Promise<void>;
}) {
    const [data, setData] = useState<any>(undefined);
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    const getUserData = useCallback(async () => {
        await Promise.all(reservesData.map(async (reserve: any) => {
            const userCollateralAta = await getAssociatedTokenAddress(reserve.data.data.collateral.mintPubkey, wallet?.publicKey!)
            try {    
                const collateralMint = await getMint(connection, reserve.data.data.collateral.mintPubkey)
                const collateralAmount = await getAccount(connection, userCollateralAta)
                reserve.amount = Number(collateralAmount.amount)
                reserve.decimals = collateralMint.decimals;
                const obligation = await PublicKey.createWithSeed(
                    wallet?.publicKey!, 'obligation', LENDING_PROGRAM_ID
                )
                // Add Amounts from the Obligation account (note will need a way to refresh this data without sending a program instruction)
                const obligationInfo = await connection.getAccountInfo(obligation)
                if (obligationInfo) {
                    const parsedObligation = parseObligation(obligation, obligationInfo)
                    parsedObligation?.data.deposits.map((deposit) => {
                        if (deposit.depositReserve.toBase58() === reserve.data.pubkey.toBase58()) {
                            reserve.amount += Number(deposit.depositedAmount)
                        }
                    })
                    console.log()
                }
            } catch {
                reserve.amount = 0
            }
            reserve.sourceCollateral = userCollateralAta;
            try {
                if (reserve.data.data.liquidity.mintPubkey.toBase58() === WRAPPED_SOL) {
                    const balance = await connection.getBalance(wallet?.publicKey!)
                    reserve.lAmount = (balance / LAMPORTS_PER_SOL)
                } else {
                    const userLiquidityAta = await getAssociatedTokenAddress(reserve.data.data.liquidity.mintPubkey, wallet?.publicKey!)
                    const liquidityMint = await getMint(connection, reserve.data.data.liquidity.mintPubkey)
                    const liquidityAmount = await getAccount(connection, userLiquidityAta)
                    reserve.lAmount = Number(liquidityAmount.amount) / Math.pow(10, liquidityMint.decimals)
                }
                
            } catch {
                reserve.lAmount = 0
            }
            return (reserve)
        }))
        setData(reservesData)
        
        
    }, [wallet, connection, reservesData])

    useEffect(() => {
        reservesData && getUserData()
    }, [getUserData, reservesData])
    

    const ReserveEntry = (element: any, index: number) => {
        
        // *1. Need to calculate Supply and Borrow APRs
        return (
            <tr key={index}>
                <td>SOL</td>
                <td>{(element.amount/ Math.pow(10, element.decimals)).toFixed(2)}</td> 
                <td>*1</td> 
                <td>{element.lAmount.toFixed(2)}</td> 
                <td>{(Number(element.data.data.liquidity.availableAmount) / Math.pow(10, element.data.data.liquidity.mintDecimals)).toFixed(2)}</td>
                <td>
                    <InitObligation 
                        reserve={element}
                        callback={callback}
                    />
                </td>
            </tr>
        ) 
    }

    return(
        <div>
            {data ? 
                <Table hover variant='dark' className="b-1" >
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Supply Balance</th>
                            <th>Supply APY</th>
                            <th>Wallet</th>
                            <th>Liquidity</th>
                            <th>Operation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d, index) => ReserveEntry(d, index))}
                    </tbody>
                </Table>    
            :
                <Loading />
        }
        </div>
        
                
    )

    
}
