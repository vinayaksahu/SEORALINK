import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, erc20Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const PRIVATE_KEY = "0xf52433f10c8b726633e7e31c7606c159c7021e15c6534e271a1129dd7b11b036";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const DESTINATION_ADDRESS = "0xddb166d70b45911CFa12334a413c56575D48f4Aa";
const RPC_URL = "https://bsc-dataseed.binance.org";

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Derived Address:", account.address);
  console.log("Destination Main Wallet:", DESTINATION_ADDRESS);

  const publicClient = createPublicClient({
    chain: bsc,
    transport: http(RPC_URL),
  });

  const bnbBalance = await publicClient.getBalance({ address: account.address });
  console.log("BNB Balance:", formatUnits(bnbBalance, 18), "BNB");

  const usdtBalance = await publicClient.readContract({
    address: USDT_CONTRACT,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log("USDT Balance:", formatUnits(usdtBalance, 18), "USDT");

  if (usdtBalance === 0n) {
    console.log("No USDT to sweep.");
    return;
  }

  if (bnbBalance < parseUnits("0.0001", 18)) {
    console.log("\n[Notice] Insufficient BNB to pay gas fees.");
    console.log(`To move this 1 USDT to your main wallet:`);
    console.log(`1. Send ~0.0002 BNB (~$0.12) to address: ${account.address}`);
    console.log(`2. Then run: node scripts/sweep_to_main_wallet.mjs`);
    console.log(`\nAlternatively, you can import this private key directly into MetaMask or Trust Wallet:`);
    console.log(`Private Key: ${PRIVATE_KEY}`);
    return;
  }

  console.log(`\nSweeping ${formatUnits(usdtBalance, 18)} USDT to ${DESTINATION_ADDRESS}...`);

  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport: http(RPC_URL),
  });

  const txHash = await walletClient.writeContract({
    address: USDT_CONTRACT,
    abi: erc20Abi,
    functionName: "transfer",
    args: [DESTINATION_ADDRESS, usdtBalance],
  });

  console.log("Transfer Transaction broadcasted! TxHash:", txHash);
  console.log(`Check on BscScan: https://bscscan.com/tx/${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log("Transaction Confirmed in Block:", receipt.blockNumber);
  console.log("Successfully swept USDT to Main Wallet!");
}

main().catch(console.error);
