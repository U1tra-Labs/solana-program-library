import { AnchorProvider } from "@project-serum/anchor";
import InitObligation from "./actions/InitObligation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { Table } from 'react-bootstrap';
import { getAccount, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import Loading from "./Loading";

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
            try {
                const userCollateralAta = await getAssociatedTokenAddress(reserve.data.data.collateral.mintPubkey, wallet?.publicKey!)
                const collateralMint = await getMint(connection, reserve.data.data.collateral.mintPubkey)
                const collateralAmount = await getAccount(connection, userCollateralAta)
                reserve.amount = Number(collateralAmount.amount) / Math.pow(10, collateralMint.decimals)
            } catch {
                reserve.amount = 0
            }
            try {
                const userLiquidityAta = await getAssociatedTokenAddress(reserve.data.data.liquidity.mintPubkey, wallet?.publicKey!)
                const liquidityMint = await getMint(connection, reserve.data.data.liquidity.mintPubkey)
                const liquidityAmount = await getAccount(connection, userLiquidityAta)
                reserve.lAmount = Number(liquidityAmount.amount) / Math.pow(10, liquidityMint.decimals)
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
                <td>{element.amount}</td> 
                <td>*1</td> 
                <td>{element.lAmount}</td> 
                <td>{Number(element.data.data.liquidity.availableAmount) / Math.pow(10, element.data.data.liquidity.mintDecimals)}</td>
                <td>
                    <InitObligation callback={callback}/>
                    
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
