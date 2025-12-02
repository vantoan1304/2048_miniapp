"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/wagmi";

export function GmButton() {
  const { address, isConnected } = useAccount();
  const [tx, setTx] = useState<`0x${string}` | undefined>();

  const { data: streak, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "streak",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: tx });

  const gm = async () => {
    if (!address) return;

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "gm",
      });

      setTx(hash);
      setTimeout(() => refetch(), 2000);
    } catch (e) {
      console.error(e);
      alert("GM failed");
    }
  };

  return (
    <div className="space-y-4">
      <p>Streak: {streak ? Number(streak) : 0} ngày</p>

      <button
        onClick={gm}
        disabled={isPending}
        className="px-4 py-2 bg-yellow-400 text-black rounded-lg disabled:opacity-40"
      >
        {isPending ? "Sending..." : "GM Today ☀️"}
      </button>

      {tx && (
        <a
          href={`https://basescan.org/tx/${tx}`}
          target="_blank"
          className="underline text-sky-400"
        >
          View Basescan
        </a>
      )}

      {isSuccess && <p>✅ GM thành công!</p>}
    </div>
  );
}
