"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { isConnected, address } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg"
      >
        {address?.slice(0, 6)}…{address?.slice(-4)} (Disconnect)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((c) => (
        <button
          key={c.uid}
          disabled={!c.ready || isPending}
          onClick={() => connect({ connector: c })}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-40"
        >
          Connect {c.name}
        </button>
      ))}
    </div>
  );
}
