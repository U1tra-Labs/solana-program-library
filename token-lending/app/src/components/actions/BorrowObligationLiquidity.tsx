import { refreshReserveInstruction, depositReserveLiquidityInstruction } from "../../utils/instructions";
import { Button, Modal, InputGroup, Form, Toast } from "react-bootstrap";
import { useState } from "react";
import { AnchorProvider } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { useConnection, useAnchorWallet, AnchorWallet } from "@solana/wallet-adapter-react";
import { LENDING_PROGRAM_ID } from "../../utils/constants";
import { SmartInstructionSender, InstructionSet } from "@holaplex/solana-web3-tools";
import { useSmartSender } from '../../utils/hooks';
import { COMMITMENT, MAX_RETRIES } from "../../utils/constants";
import { parseObligation } from "../../utils/state";
import { connect } from "tls";

export default function BorrowObligationLiquidity({
    element,
    provider,
    callback
}: {
    element: any;
    provider: AnchorProvider | undefined;
    callback?: () => Promise<void>;
}) {
    const [show, setShow] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [amount, setAmount] = useState<number | undefined>(undefined);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const { connection } = useConnection();
    const wallet = useAnchorWallet() as AnchorWallet;
    const { failureCallback } = useSmartSender();

    const borrowObligation = async(element: any) => {
        
        console.log(element)

        const obligation = await PublicKey.createWithSeed(
            wallet.publicKey, 'obligation', LENDING_PROGRAM_ID
        )
        const obligationInfo = await connection.getAccountInfo(obligation)
        const parsedObligation = parseObligation(obligation, obligationInfo!);
        console.log(parsedObligation?.data)
        console.log(parsedObligation?.data.allowedBorrowValue.toNumber())
        // const instructions: TransactionInstruction[] = [];
        // const refreshIx = refreshReserveInstruction(element.pubkey!, element.data?.liquidity.oraclePubkey!);
        // instructions.push(refreshIx);

        // const sourceLiquidity = await getAssociatedTokenAddress(element.data?.liquidity.mintPubkey, wallet.publicKey!);
        // const destinationCollateral = await getAssociatedTokenAddress(element.data?.collateral.mintPubkey, wallet.publicKey!);
        // const [lendingMarketAuthority] = await PublicKey.findProgramAddress([element.data?.lendingMarket.toBuffer()], LENDING_PROGRAM_ID)
        // console.log(element.data?.liquidity.supplyPubkey)
        // console.log(sourceLiquidity.toBase58())
        
        // const ataInfo = await connection.getAccountInfo(destinationCollateral)
        // if (!ataInfo) {
        //     const createAtaIx = createAssociatedTokenAccountInstruction(
        //         wallet?.publicKey!,
        //         destinationCollateral,
        //         wallet?.publicKey!,
        //         element.data?.collateral.mintPubkey,
        //         TOKEN_PROGRAM_ID,
        //         ASSOCIATED_TOKEN_PROGRAM_ID
        //     );
        //     instructions.push(createAtaIx);
        // }
        
        // const depositReserveIx = depositReserveLiquidityInstruction(
        //     amount! * LAMPORTS_PER_SOL,
        //     sourceLiquidity,
        //     destinationCollateral,
        //     element.pubkey,
        //     element.data?.liquidity.supplyPubkey,
        //     element.data?.collateral.mintPubkey,
        //     element.data?.lendingMarket,
        //     lendingMarketAuthority,
        //     wallet?.publicKey!
        // )
        
        // instructions.push(depositReserveIx);
        // console.log("We depositing it", amount)
        // try {
        //     const instructionGroups: InstructionSet[] = [
        //         {
        //           instructions,
        //           signers: [],
        //         },
        //       ];
      
        //     const sender = SmartInstructionSender.build(
        //     wallet,
        //     connection
        //     )
        //     .config({
        //         maxSigningAttempts: MAX_RETRIES,
        //         abortOnFailure: true,
        //         commitment: COMMITMENT,
        //     })
        //     .withInstructionSets(instructionGroups)
        //     .onProgress((_ind, txId) => {
        //         console.log("Transaction sent successfully:", txId);
        //     })
        //     .onFailure(failureCallback)
        //     .onReSign((attempt, i) => {
        //         const msg = `Resigning: ${i} attempt: ${attempt}`;
        //         console.warn(msg);
        //     });

        //     await sender
        //     .send()
        //     .then(() => {
        //         console.log("Transaction success");
        //         if (callback) {
        //         callback();
        //         }
        //     })
        //     .finally(() => {
        //     //   setIsDisentangling(false);
        //     });
        // } catch (e) {
        //     console.log("Error", e)
        // }
    }
    
    return (
        <div className="mx-3">
                
            <Button 
                variant="primary"
                onClick={handleShow}
            >Borrow</Button>
            <Toast onClose={() => setShowPopup(false)} show={showPopup} delay={3000} bg='info' autohide>
                <Toast.Header>
                    <strong className="me-auto">Bootstrap</strong>
                    <small>11 mins ago</small>
                </Toast.Header>
                <Toast.Body className="text-white">Borrow processed succesfully!</Toast.Body>
            </Toast>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title>Enter amount to borrow</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-3">
                        <Form.Control 
                            placeholder="Enter amount"
                            type="number"
                            // aria-label="Amount (to the nearest dollar)" 
                            onChange={(event => {
                                setAmount(Number(event.target.value))
                            })}
                            value={amount ? amount : ""}
                        />
                    </InputGroup>
                </Modal.Body>
                <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={() => borrowObligation(element)}>
                    Borrow
                </Button>
                </Modal.Footer>
            </Modal>
        </div>
        
    )
}
