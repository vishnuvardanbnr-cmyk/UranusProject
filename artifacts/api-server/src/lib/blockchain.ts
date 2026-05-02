import { ethers } from "ethers";
import { db, platformSettingsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
export const USDT_DECIMALS = 18;

const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

export async function getSettings() {
  const [s] = await db.select().from(platformSettingsTable).limit(1);
  return s ?? null;
}

export function getProvider(rpcUrl: string) {
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function generateDepositWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return { address: wallet.address, privateKey: wallet.privateKey };
}

export async function getUsdtBalance(address: string, rpcUrl: string): Promise<bigint> {
  const provider = getProvider(rpcUrl);
  const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
  return await contract.balanceOf(address);
}

export async function getBnbBalance(address: string, rpcUrl: string): Promise<bigint> {
  const provider = getProvider(rpcUrl);
  return await provider.getBalance(address);
}

export interface SweepResult {
  success: boolean;
  amount: number;
  txHash?: string;
  error?: string;
}

export async function sweepUsdtToMaster(
  depositPrivateKey: string,
  gasWalletPrivateKey: string,
  masterWallet: string,
  rpcUrl: string,
): Promise<SweepResult> {
  const provider = getProvider(rpcUrl);
  const depositWallet = new ethers.Wallet(depositPrivateKey, provider);
  const gasWallet = new ethers.Wallet(gasWalletPrivateKey, provider);

  // 1. Check USDT balance
  const usdtBalance = await getUsdtBalance(depositWallet.address, rpcUrl);
  if (usdtBalance === 0n) {
    return { success: false, amount: 0, error: "No USDT balance found" };
  }

  const amountFormatted = parseFloat(ethers.formatUnits(usdtBalance, USDT_DECIMALS));
  logger.info({ address: depositWallet.address, amount: amountFormatted }, "USDT found, initiating sweep");

  // 2. Check if deposit wallet has enough BNB for gas
  const bnbBalance = await getBnbBalance(depositWallet.address, rpcUrl);

  // Estimate gas needed for USDT transfer (~65000 gas, at 3 gwei = ~0.000195 BNB)
  const GAS_LIMIT = 100000n;
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");
  const estimatedGas = GAS_LIMIT * gasPrice;

  // If not enough BNB, send from gas wallet
  if (bnbBalance < estimatedGas) {
    const needed = estimatedGas - bnbBalance + ethers.parseEther("0.0001"); // small buffer
    logger.info({ needed: ethers.formatEther(needed) }, "Sending BNB for gas");

    const gasTx = await gasWallet.sendTransaction({
      to: depositWallet.address,
      value: needed,
      gasLimit: 21000n,
    });
    await gasTx.wait(1);
    logger.info({ txHash: gasTx.hash }, "BNB gas sent");
  }

  // 3. Sweep USDT to master wallet
  const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, depositWallet);
  const sweepTx = await usdtContract.transfer(masterWallet, usdtBalance, {
    gasLimit: GAS_LIMIT,
    gasPrice,
  });
  const receipt = await sweepTx.wait(1);
  logger.info({ txHash: sweepTx.hash }, "USDT swept to master wallet");

  return {
    success: true,
    amount: amountFormatted,
    txHash: sweepTx.hash,
  };
}

export async function ensureDepositWallet(userId: number): Promise<{ address: string }> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  if (user.depositAddress) return { address: user.depositAddress };

  const { address, privateKey } = generateDepositWallet();
  await db.update(usersTable)
    .set({ depositAddress: address, depositPrivateKey: privateKey })
    .where(eq(usersTable.id, userId));

  return { address };
}
