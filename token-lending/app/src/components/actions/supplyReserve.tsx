import { refreshReserveInstruction, depositReserveLiquidityInstruction } from "../../utils/instructions";
import { Button, Modal, InputGroup, Form, Toast } from "react-bootstrap";
import { useState } from "react";
import { AnchorProvider } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LENDING_PROGRAM_ID } from "../../utils/constants";


export default function SupplyReserve({
    element,
    provider
}: {
    element: any,
    provider: AnchorProvider | undefined
}) {
    const [show, setShow] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [amount, setAmount] = useState<number | undefined>(undefined);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const { connection } = useConnection();
    const wallet = useWallet();

    const supplyReserve = async(element: any) => {
        const tx = new Transaction()
        console.log(element)
        const refreshIx = refreshReserveInstruction(element.pubkey!, element.data?.liquidity.oraclePubkey!)
        tx.add(refreshIx)
        console.log(element)
        const sourceLiquidity = await getAssociatedTokenAddress(element.data?.liquidity.mintPubkey, wallet.publicKey!);
        const destinationCollateral = await getAssociatedTokenAddress(element.data?.collateral.mintPubkey, wallet.publicKey!);
        const [lendingMarketAuthority] = await PublicKey.findProgramAddress([element.data?.lendingMarket.toBuffer()], LENDING_PROGRAM_ID)
        console.log(element.data?.liquidity.supplyPubkey)
        console.log(sourceLiquidity.toBase58())
        
        const ataInfo = await connection.getAccountInfo(destinationCollateral)
        if (!ataInfo) {
            const createAtaIx = createAssociatedTokenAccountInstruction(
                wallet.publicKey!,
                destinationCollateral,
                wallet.publicKey!,
                element.data?.collateral.mintPubkey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
            tx.add(createAtaIx)
        }
        
        const depositReserveIx = depositReserveLiquidityInstruction(
            amount! * LAMPORTS_PER_SOL,
            sourceLiquidity,
            destinationCollateral,
            element.pubkey,
            element.data?.liquidity.supplyPubkey,
            element.data?.collateral.mintPubkey,
            element.data?.lendingMarket,
            lendingMarketAuthority,
            wallet.publicKey!
        )
        console.log(depositReserveIx)
        tx.add(depositReserveIx)
        console.log("We depositing it", amount)
        let txId: string | undefined;
        try {
            txId = await provider?.sendAndConfirm(tx, [], { commitment: 'confirmed'})
            console.log("Deposit successful", txId)
            setShow(false)
            setShowPopup(true)
        } catch (e) {
            console.log("Error", e)
            console.log("id", txId)
        }
    }
    
    return (
        <div className="mx-3">
                
            <Button 
                variant="primary"
                onClick={handleShow}
            >Deposit</Button>
            <Toast onClose={() => setShowPopup(false)} show={showPopup} delay={3000} bg='info' autohide>
                <Toast.Header>
                    <strong className="me-auto">Bootstrap</strong>
                    <small>11 mins ago</small>
                </Toast.Header>
                <Toast.Body className="text-white">Deposit processed succesfully!</Toast.Body>
            </Toast>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title>Enter amount to deposit</Modal.Title>
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
                <Button variant="primary" onClick={() => supplyReserve(element)}>
                    Deposit
                </Button>
                </Modal.Footer>
            </Modal>
        </div>
        
    )
}
