import styled from "@emotion/styled";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Table, Container, ButtonGroup } from 'react-bootstrap';
import { getReserveAccounts } from './actions/getReserveData';
import { getAccount, getAssociatedTokenAddress, getMint, Mint } from "@solana/spl-token";
import { AnchorProvider } from "@project-serum/anchor";
import SupplyReserveLiquidity from "./SupplyReserveLiquidity";
import BorrowObligationLiquidity from "./BorrowObligationLiquidity";
import { WRAPPED_SOL } from "../utils/constants";

export default function Reserves({
    reservesData,
    provider,
    callback
} : {
    reservesData: any;
    provider: AnchorProvider | undefined;
    callback?: () => Promise<void>;
}) {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    const data: any = reservesData.map((reserve: any) => reserve.data)

    const ReserveEntry = (element: any, index: number) => {
        const [info, setInfo] = useState<number | undefined>(undefined)
        
        useEffect(() => {
            // const mintInfo = getMint(connection, element.data.liquidity.mintPubkey);
            if (element.data.liquidity.mintPubkey.toBase58() === WRAPPED_SOL) {
                Promise.resolve(connection.getBalance(wallet?.publicKey!)
                    .then((res) => setInfo(res / LAMPORTS_PER_SOL))
                );
            } else {
                const userAta = getAssociatedTokenAddress(element.data.liquidity.mintPubkey, wallet?.publicKey!)
                Promise.resolve(userAta).then((res) => {    
                    const ataInfo = getAccount(connection, res)
                    Promise.resolve(ataInfo).then((info) => setInfo(Number(info.amount) / Math.pow(10, element.data.liquidity.mintDecimals)))
                        .catch(() => setInfo(0))
                });
            }     
        }, [index])
        
        // *1. Need to calculate Supply and Borrow APRs
        // *2 Need to read connected wallet to get amount held by user in this market 
        // *3 Need a better way to get the mint decimals - this seems to be slow and calling multiple times
        if (info !== undefined) {
            return (
                <tr key={index}>
                    <td>SOL</td>
                    <td>*1</td> 
                    <td>*1</td> 
                    <td>{info.toFixed(2)}</td> 
                    <td>{(Number(element.data.liquidity.availableAmount) / Math.pow(10, element.data.liquidity.mintDecimals)).toFixed(2)}</td>
                    <td>
                        <ButtonGroup>
                            <SupplyReserveLiquidity
                                element={element}
                                provider={provider}
                                callback={callback}
                            />
                            <BorrowObligationLiquidity
                                element={element}
                                provider={provider}
                                callback={callback}
                            />
                        </ButtonGroup>
                        
                    </td>
                </tr>
            )
        }
        
    }

    return(
        <Table hover variant='dark' className="b-1" >
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Supply APR</th>
                    <th>Borrow APR</th>
                    <th>Wallet</th>
                    <th>Liquidity</th>
                    <th>Operation</th>
                </tr>
            </thead>
            <tbody>
                {data.map((d, index) => ReserveEntry(d, index))}
            </tbody>
        </Table>
        
    
    
        
    )
}

