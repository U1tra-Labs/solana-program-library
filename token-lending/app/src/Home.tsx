import styled from "@emotion/styled";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import Loading from "./components/Loading";
import Reserves from "./components/Reserves";
import { parseLendingMarket } from "./utils/state";
import { getReserveAccounts } from "./components/actions/getReserveData";
import { getUserData } from './components/actions/getUserData';
import { Tabs, Tab } from 'react-bootstrap';
import Positions from "./components/Positions";
import * as pyth from "@pythnetwork/client";
import BigNumber from "bignumber.js";

export default function Home() {
  const wallet = useAnchorWallet() as AnchorWallet;
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [reservesData, setReservesData] = useState<any>(undefined);
  const [userData, setUserData] = useState<any>(undefined);
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
      
      const possiblyReservesData = await getReserveAccounts();
      const pythClient = new pyth.PythHttpClient(connection, pyth.getPythProgramKeyForCluster("devnet"));
      const data = await pythClient.getData();
      const oracleIds = possiblyReservesData.result.map((reserve) => reserve.data?.data.liquidity.oraclePubkey.toBase58())
      const filtered = data.products.filter((product => oracleIds.includes(product.price_account)))
      possiblyReservesData.result.forEach((reserve) => {
        const symbol = filtered.filter((product) => product.price_account === reserve.data?.data.liquidity.oraclePubkey.toBase58())[0].symbol
        const price = data.productPrice.get(symbol)!.price
        reserve!.data!.data.liquidity.marketPrice = new BigNumber(price!);
      });
      
      const { possiblyUserData, updatedReservesData } = await getUserData(wallet.publicKey, possiblyReservesData.result);
      if (possiblyUserData.length > 0) {
        setUserData(possiblyUserData)
      } else {
        console.log("No user obligation account")
        setUserData([]);
      }
      
      if (possiblyReservesData) {
          setReservesData(updatedReservesData)
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
      console.log("Here it is:", possiblyReservesData.result[0].data?.data);
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
        {/* <img src="/logo.svg" alt="logo" width="50" /> */}
        <Title>Ultra</Title>
            <HeaderRight>              
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
      <Tabs defaultActiveKey="home" id="uncontrolled-tab-example" className="mb-3">
            
        <Tab eventKey="home" title="Home">
          {!loading ? (
            <Body>
              <Reserves 
                reservesData={reservesData}
                userData={userData}
                provider={provider}
                callback={refetchMarkets}
              />
            </Body>
          ) : (
            <Body>
              {!wallet ? connect() : <Loading />}
            </Body>           
          )}
        </Tab>
        <Tab eventKey="positions" title="Positions">
          {!loading ? (
            <Body>
              <Positions
                reservesData={reservesData}
                userData={userData}
                callback={refetchMarkets}
                provider={provider!}
              />
            </Body>
          ) : (
            <Body>
              {!wallet ? connect() : <Loading />}
            </Body>
          )}
        </Tab>
        {/* <Tab eventKey="contact" title="Contact" disabled>
          <div>Test</div>
        </Tab> */}
      </Tabs>  
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
  background: black;
  color: white;
  height: 40px;
  justify-content: center;
  border-radius: 9px;
  padding: 5px;
  min-width: 150px;
  :not([disabled]):hover {
    background: #D42FB8;
  }
  i {
    display: none;
  }
`;

const WalletMultiButtonStyled = styled(WalletMultiButton)`
  background: blue;
  color: white;
  height: 40px;
  justify-content: center;
  border-radius: 9px;
  padding: 5px;
  min-width: 150px;
  :not([disabled]):hover {
    background: #D42FB8;
  }
  i {
    display: none;
  }
`;

const Title = styled.div`
  color: white;
  font-weight: bold;
  font-size: 24px;
`;

const Footer = styled.div`
  margin-top: 50px;
  font-size: 18px;
`;