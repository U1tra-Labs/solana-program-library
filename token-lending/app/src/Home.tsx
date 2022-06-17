import styled from "@emotion/styled";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import Loading from "./components/Loading";
import { parseLendingMarket, parseReserve } from "./utils/state";

export default function Home() {
  const wallet = useAnchorWallet() as AnchorWallet;
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  

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
        const lendingMarketPubkey = new PublicKey('7T12b6nyt6vbgj1rvaW2PVvicTvsrdSY5YNNSchGTqLg')
        const lendingMarketInfo = await connection.getAccountInfo(lendingMarketPubkey)
        console.log(lendingMarketInfo)
        const marketData = parseLendingMarket(lendingMarketPubkey, lendingMarketInfo!)
        console.log(marketData?.data.owner.toBase58())
        console.log(marketData?.data.tokenProgramId.toBase58())
        console.log(marketData?.data.oracleProgramId.toBase58())
    
    
        const reservePubkey = new PublicKey('5yUyBmzTAus5LGvEEtMdZSDPdP4zLaWCk1szxFkh86VE')
        const reserveInfo = await connection.getAccountInfo(reservePubkey)
        const data = parseReserve(reservePubkey, reserveInfo!)
        console.log(data?.data.lendingMarket.toBase58())
        console.log(data?.data.liquidity)
        console.log("////  Liquidity ////////")
        console.log("Mint pubkey", data?.data.liquidity.mintPubkey.toBase58())
        console.log("Supply pubkey", data?.data.liquidity.supplyPubkey.toBase58())
        console.log("Oracle pubkey", data?.data.liquidity.oraclePubkey.toBase58())
        console.log("Fee receiver", data?.data.liquidity.feeReceiver.toBase58())
        console.log("borrowed amount wads", data?.data.liquidity.borrowedAmountWads.toNumber())
        console.log("cumulative borrowed rate wads", data?.data.liquidity.cumulativeBorrowRateWads.toNumber())
        console.log("Market price", data?.data.liquidity.marketPrice.toNumber())
        console.log("////  Collateral ////////")
        console.log(data?.data.collateral)
        console.log("Mint pubkey", data?.data.collateral.mintPubkey.toBase58())
        console.log("Supply pubkey", data?.data.collateral.supplyPubkey.toBase58())
        console.log(data?.data.config.fees)
        console.log("////  Raw ////////")
        console.log(data?.data)
    //   const program = await loadProgram(connection, anchorWallet);
    //   setAnchorProgram(program);

      setLoading(false);
    }
  }, [anchorWallet, connection, wallet]);

  useEffect(() => {
    if (!loading) {
      refetchMarkets();
    }
  }, [refetchMarkets]);

  return (
    <AppWrapper>
      <Header>
        <img src="/logo.svg" alt="logo" width="50" />
        <HeaderRight>
          <SocialLink
            href="https://www.solsanctuary.io/"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faGlobe} size="lg" />
          </SocialLink>
          <SocialLink
            href="https://discord.gg/solsanctuary"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faDiscord} size="lg" />
          </SocialLink>
          <SocialLink
            href="https://twitter.com/SolanaSanctuary"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faTwitter} size="lg" />
          </SocialLink>
          {wallet && <WalletDisconnectButtonStyled />}
          {!wallet && <WalletMultiButtonStyled />}
        </HeaderRight>
      </Header>

      <Hero>
        <Title>The Greatest Derug&sbquo; Ever</Title>
        <Subtitle>I&#8217;m Reloadddiiinnnggg</Subtitle>
        <About>
          It costs 1 Solana per bear to Reload. Swap-backs are free. There will
          be 3 transactions.
        </About>
      </Hero>

      {loading && <Loading />}
      {!loading && (
        <div>Insert things here</div>
        // insert logic here
      )}

      <Footer>
        Powered by Ven, Solana Sanctuary, RadRugs, SolSlugs, Grape, and, most of
        all, <strong>your big bear body.</strong>
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
  color: var(--color-foreground);
  padding-bottom: 50px;
  background: radial-gradient(at bottom right, #f2a0ff, #401577);
  background: radial-gradient(at bottom right, #ffc4c3, #984fac, #44279c);
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

const SocialLink = styled.a`
  color: var(--color-accent);
  :hover {
    color: var(--color-accent-active);
  }
`;

const WalletDisconnectButtonStyled = styled(WalletDisconnectButton)`
  background: var(--color-accent);
  color: var(--color-base);
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
  color: var(--color-base);
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
  color: var(--color-primary);
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
    color: var(--fore-ground);
    font-weight: bold;
  }
`;

const Footer = styled.div`
  margin-top: 50px;
  font-size: 18px;
`;
