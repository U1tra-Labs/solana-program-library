import styled from "@emotion/styled";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import Loading from "./components/Loading";
import Reserves from "./components/Reserves";
import { parseLendingMarket, parseReserve } from "./utils/state";
import { getReserveAccounts } from "./components/actions/getReserveData";
import { refreshReserveInstruction } from "./utils/instructions/";
import { ORACLE_PROGRAM_ID } from "./utils/constants";
import { connect } from "http2";

export default function Home() {
  const wallet = useAnchorWallet() as AnchorWallet;
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [reservesData, setReservesData] = useState<any>();
  const [provider, setProvider] = useState<AnchorProvider | undefined>(undefined);

  const anchorWallet = useMemo(() => {
    const walletIsLoaded = wallet?.publicKey;

    if (walletIsLoaded) {
      return {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as unknown as typeof anchor.Wallet;
    }
  }, [wallet]);

  const refetchMarkets = useCallback(async () => {
    if (wallet && anchorWallet) {
      console.log("Loading Ultra info");
      setLoading(true);
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
      setProvider(provider)

      const lendingMarketPubkey = new PublicKey('7T12b6nyt6vbgj1rvaW2PVvicTvsrdSY5YNNSchGTqLg')
      const lendingMarketInfo = await connection.getAccountInfo(lendingMarketPubkey)
      const marketData = parseLendingMarket(lendingMarketPubkey, lendingMarketInfo!)
      
      const reservePubkey = new PublicKey('5yUyBmzTAus5LGvEEtMdZSDPdP4zLaWCk1szxFkh86VE')
      const reserveInfo = await connection.getAccountInfo(reservePubkey)
      const data = parseReserve(reservePubkey, reserveInfo!)

      const possiblyReservesData = await getReserveAccounts()
      if (possiblyReservesData) {
          setReservesData(possiblyReservesData.result)
          
          // Code below to refresh reserve data

          // for (let i=0; i<possiblyReservesData.result.length; i++) {
          //   console.log(possiblyReservesData.result[i].data?.pubkey.toBase58())
          //   const refreshIx = refreshReserveInstruction(possiblyReservesData.result[i].data?.pubkey!, possiblyReservesData.result[i].data?.data.liquidity.oraclePubkey!)
            
          //   await provider.sendAndConfirm(new Transaction().add(refreshIx), [])
          //   console.log(refreshIx)
          //   console.log("Oracle", possiblyReservesData.result[i].data?.data.liquidity.oraclePubkey.toBase58())
          //   console.log(possiblyReservesData.result[i].data?.data.liquidity.marketPrice.toNumber())
          // }
          
      }
      console.log("Here it is:", possiblyReservesData.result[0].data?.data)
        
    //   const program = await loadProgram(connection, anchorWallet);
    //   setAnchorProgram(program);

      setLoading(false);
    }
  }, [anchorWallet, connection, wallet]);

  useEffect(() => {
    refetchMarkets();
  }, [refetchMarkets]);

  const connect = () => {
    return (
      <div>Connect Wallet</div>
    )
  }
  return (
    <AppWrapper>
      <Header>
        <Title>Ultra</Title>
        {/* <img src="/logo.svg" alt="logo" width="50" /> */}
        <HeaderRight>
          <SocialLink
            // href="https://www.solsanctuary.io/"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faGlobe} size="lg" />
          </SocialLink>
          <SocialLink
            // href="https://discord.gg/solsanctuary"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faDiscord} size="lg" />
          </SocialLink>
          <SocialLink
            // href="https://twitter.com/SolanaSanctuary"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faTwitter} size="lg" />
          </SocialLink>
          {wallet && <WalletDisconnectButtonStyled />}
          {!wallet && <WalletMultiButtonStyled />}
        </HeaderRight>
      </Header>

      {!wallet ? connect(): loading && <Loading />}
      {!loading && (
        <Body>
          <Reserves 
            reservesData={reservesData}
            provider={provider}
          />
        </Body>
        
        // insert logic here
      )}

      <Footer>
        Powered by Big Dogs. <strong>WAGMI.</strong>
      </Footer>
    </AppWrapper>
  );
}

const AppWrapper = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  color: white;
  padding-bottom: 50px;
  background: #202A44;
  min-height: 100vh;
`;

const Header = styled.div`
  max-width: 1300px;
  position: relative;
  top: 0px;
  left: 0px;
  width: 100vw;
  background: transparent;
  margin-bottom: 20px;
  padding: 32px 84px 10px 84px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 800px) {
    & {
      padding: 10px;
    }
  }
`;

const HeaderRight = styled.div`
  grid-gap: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Body = styled.div`
  width: 95vw;
  margin: 20px;
`;

const SocialLink = styled.a`
  color: white;
  :hover {
    color: var(--color-accent-active);
  }
`;

const WalletDisconnectButtonStyled = styled(WalletDisconnectButton)`
  background: var(--color-accent);
  color: white;
  height: 40px;
  justify-content: center;
  border-radius: 9px;
  padding: 5px;
  min-width: 150px;
  :not([disabled]):hover {
    background: var(--color-accent-active);
  }
  i {
    display: none;
  }
`;

const WalletMultiButtonStyled = styled(WalletMultiButton)`
  background: var(--color-accent);
  color: white;
  height: 40px;
  justify-content: center;
  border-radius: 9px;
  padding: 5px;
  min-width: 150px;
  :not([disabled]):hover {
    background: var(--color-accent-active);
  }
  i {
    display: none;
  }
`;

const Hero = styled.div`
  padding: 0px 5px;
`;

const Title = styled.div`
  color: white;
  font-weight: bold;
  font-size: 24px;
`;

const Subtitle = styled.div`
  font-weight: bold;
  font-style: italic;
  font-size: 74px;
  text-transform: uppercase;
  @media (max-width: 800px) {
    & {
      font-size: 40px;
    }
  }
`;

const About = styled.div`
  font-size: 18px;
  font-weight: light;
  margin-bottom: 32px;
  a {
    color: white;
    font-weight: bold;
  }
`;

const Footer = styled.div`
  margin-top: 50px;
  font-size: 18px;
`;