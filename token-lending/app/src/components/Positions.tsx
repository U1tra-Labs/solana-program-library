import { AnchorProvider } from "@project-serum/anchor";
import InitObligation from "./InitObligation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { Table, Form, Row, ProgressBar, Col } from 'react-bootstrap';
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import Loading from "./Loading";
import { LENDING_PROGRAM_ID, WRAPPED_SOL } from "../utils/constants";
import { parseObligation } from "../utils/state";

export default function Positions({
    reservesData,
    userData,
    callback
} : {
    reservesData: any | undefined;
    userData: any | undefined;
    callback?: () => Promise<void>;
}) {
    const loanRatio = userData[0].data.data.borrowedValue / userData[0].data.data.allowedBorrowValue
    let variant: string;
    if (loanRatio < 0.2) {
        variant = 'sucess'
    } else if (loanRatio < 0.7) {
        variant = 'warning'
    } else {
        variant = 'danger'
    }

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
            <Form  style={{"background":"royalBlue", "borderRadius": "10px"}} className="p-3">
                <Row className="mb-3">
                    <Form.Group as={Col} controlId="deposits">    
                        <Form.Label>Value of deposits</Form.Label>
                        <Form.Control readOnly className="text-center"
                            defaultValue={`$${userData[0].data.data.depositedValue.toFixed(2)}`} 
                        />
                    </Form.Group>
                    <Form.Group as={Col} controlId="borrowedValue">
                        <Form.Label>Borrowed Value</Form.Label>
                        <Form.Control readOnly className="text-center"
                            defaultValue={`$${userData[0].data.data.borrowedValue.toFixed(2)}`}
                        />
                    </Form.Group>

                </Row>
            
                <Row className="mb-3">
                    <Form.Group as={Col} controlId="allowedBorrowValue">    
                        <Form.Label>Allowed Borrow Value</Form.Label>
                        <Form.Control readOnly className="text-center"
                            defaultValue={`$${userData[0].data.data.allowedBorrowValue.toFixed(2)}`} 
                        />
                    </Form.Group>
                    
                    <Form.Group as={Col} controlId="liquidationThreshold">
                        <Form.Label>Liquidation Threshold</Form.Label>
                        <Form.Control readOnly className="text-center"
                            defaultValue={`$${userData[0].data.data.unhealthyBorrowValue.toFixed(2)}`}
                        />
                    </Form.Group>
                </Row>
                <Row className="m-1">
                    <Form.Label>Loan health score</Form.Label>
                    <ProgressBar 
                        now={loanRatio * 100} 
                        variant={variant} label={`${(loanRatio * 100).toFixed(0)}%`}
                    />
                </Row>
            </Form>
            
            <br />
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
                    {reservesData.map((d, index) => ReserveEntry(d, index))}
                </tbody>
            </Table>  
        </div>  
    )
}
