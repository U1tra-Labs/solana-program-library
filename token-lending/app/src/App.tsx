import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { ConnectionConfig } from "@solana/web3.js";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import 'bootstrap/dist/css/bootstrap.min.css';
import "@solana/wallet-adapter-react-ui/styles.css";
import { useMemo } from "react";
import Home from "./Home";
import { COMMITMENT, RPC_TIMEOUT } from "./utils/constants";

const connectionConfig: ConnectionConfig = {
  commitment: COMMITMENT,
  confirmTransactionInitialTimeout: RPC_TIMEOUT,
};
// devnet
const network = WalletAdapterNetwork.Devnet;
const endpoint = "https://devnet.genesysgo.net/";
// Mainnet
// const network = WalletAdapterNetwork.Mainnet;
// const endpoint = "https://ssc-dao.genesysgo.net/";

export default function App() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Home />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
