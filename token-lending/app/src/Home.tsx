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
import Loading from "./components/Loading";
import Reserves from "./components/Reserves";
import { parseLendingMarket, parseReserve } from "./utils/state";
import { getReserveAccounts } from "./components/actions/getReserveData";
import { getUserData } from './components/actions/getUserData';
import { Tabs, Tab, Row, Col } from 'react-bootstrap';
import Positions from "./components/Positions";
import { startPyth } from './utils/util/startPyth';
import * as pyth from "@pythnetwork/client";
import BigNumber from "bignumber.js";
import { bigInt } from "@solana/buffer-layout-utils";
import { getMint } from "@solana/spl-token";

export default function Home() {
  const wallet = useAnchorWallet() as AnchorWallet;
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [reservesData, setReservesData] = useState<any>(undefined);
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
      
      const possiblyReservesData = await getReserveAccounts()
      console.log(possiblyReservesData.result[0].data?.data.config)
      const total_supply = (Number(possiblyReservesData.result[0].data?.data.liquidity.availableAmount) + possiblyReservesData.result[0].data!.data.liquidity.borrowedAmountWads.toNumber()) / Math.pow(10, possiblyReservesData.result[0].data!.data.liquidity.mintDecimals)
      console.log("Here", total_supply )
      const collateralMintInfo = await getMint(connection, possiblyReservesData.result[0].data!.data.collateral.mintPubkey)
      console.log(collateralMintInfo)
      const mint_total_supply =  Number(possiblyReservesData.result[0].data?.data.collateral.mintTotalSupply) / Math.pow(10, collateralMintInfo.decimals)
      console.log(possiblyReservesData.result[0].data?.data)
      console.log("Exchange rate", total_supply / mint_total_supply)
      const pythClient = new pyth.PythHttpClient(connection, pyth.getPythProgramKeyForCluster("devnet"));
      const data = await pythClient.getData();
      const oracleIds = possiblyReservesData.result.map((reserve) => reserve.data?.data.liquidity.oraclePubkey.toBase58())
      const filtered = data.products.filter((product => oracleIds.includes(product.price_account)))
      possiblyReservesData.result.forEach((reserve) => {
        const symbol = filtered.filter((product) => product.price_account === reserve.data?.data.liquidity.oraclePubkey.toBase58())[0].symbol
        const price = data.productPrice.get(symbol)!.price
        reserve!.data!.data.liquidity.marketPrice = new BigNumber(price!);
      });
      console.log("After", possiblyReservesData.result[0].data?.data.liquidity.marketPrice.toNumber())
      
      const possiblyUserData = await getUserData(wallet.publicKey);
      
      if (possiblyUserData.result.length > 0) {
        const userBorrows = possiblyUserData.result.map((obligation) => 
          obligation.data?.data.borrows.map((borrow) => {
            console.log(obligation.data)
            const reserveInfo = possiblyReservesData.result.filter(x => x.data?.pubkey.toBase58() === borrow.borrowReserve.toBase58())  
            return ([borrow.borrowReserve.toBase58(), borrow.borrowedAmountWads.toNumber() / Math.pow(10, reserveInfo[0].data?.data.liquidity.mintDecimals!), borrow.cumulativeBorrowRateWads.toNumber(), borrow.marketValue.toNumber()])
        }))
        const userDeposits = possiblyUserData.result.map((obligation) => 
          obligation.data?.data.deposits.map((deposit) => {
            const reserve = possiblyReservesData.result.filter(reserve => reserve.data?.pubkey.toBase58() === deposit.depositReserve.toBase58())[0]
            const newPrice = reserve.data?.data.liquidity.marketPrice
            console.log("Dep amount:", deposit.depositedAmount)
            deposit!.marketValue = new BigNumber(newPrice!.toNumber() * Number(deposit.depositedAmount) / Math.pow(10, reserve.data?.data.liquidity.mintDecimals!))
            return ([deposit.depositReserve.toBase58(), Number(deposit.depositedAmount), deposit.marketValue.toNumber()])
        }))
        // set the total value of deposits and borrows
        console.log("Borrowed:", possiblyUserData.result[0].data?.data.borrowedValue.toNumber()) 
        console.log("Deposited:", possiblyUserData.result[0].data?.data.depositedValue.toNumber())
        console.log(userDeposits)
        console.log(userBorrows)
      } else {
        console.log("No user obligation account")
      }
      
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
          {/* Insert activate obligation account here */}
          <Body>
            <Positions
              reservesData={reservesData}
              provider={provider}
              callback={refetchMarkets}
            />
          </Body>
          
        </Tab>
        <Tab eventKey="contact" title="Contact" disabled>
          <div>Test</div>
        </Tab>
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