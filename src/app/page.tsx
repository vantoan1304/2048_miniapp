// src/app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { keccak256, encodePacked, toBytes, type Hex } from "viem";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/wagmi";

const SIZE = 4;

function idx(r: number, c: number) {
  return r * SIZE + c;
}

function slideAndMerge(line: number[]) {
  const filtered = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      out.push(val);
      gained += val;
      i++;
    } else {
      out.push(filtered[i]);
    }
  }

  while (out.length < SIZE) out.push(0);
  return { out, gained };
}

function randomTileValue() {
  return Math.random() < 0.9 ? 2 : 4;
}

function emptyCells(grid: number[]) {
  const out: number[] = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0) out.push(i);
  return out;
}

function addRandomTile(grid: number[]) {
  const empties = emptyCells(grid);
  if (empties.length === 0) return grid;
  const i = empties[Math.floor(Math.random() * empties.length)];
  const next = grid.slice();
  next[i] = randomTileValue();
  return next;
}

function canMove(grid: number[]) {
  if (emptyCells(grid).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[idx(r, c)];
      if (c < SIZE - 1 && v === grid[idx(r, c + 1)]) return true;
      if (r < SIZE - 1 && v === grid[idx(r + 1, c)]) return true;
    }
  }
  return false;
}

type MoveResult = { next: number[]; changed: boolean; gained: number };

function move(grid: number[], dir: "L" | "R" | "U" | "D"): MoveResult {
  let changed = false;
  let gainedTotal = 0;
  const next = grid.slice();

  const readRow = (r: number) => [
    grid[idx(r, 0)],
    grid[idx(r, 1)],
    grid[idx(r, 2)],
    grid[idx(r, 3)],
  ];

  const writeRow = (r: number, row: number[]) => {
    for (let c = 0; c < SIZE; c++) {
      if (next[idx(r, c)] !== row[c]) changed = true;
      next[idx(r, c)] = row[c];
    }
  };

  const readCol = (c: number) => [
    grid[idx(0, c)],
    grid[idx(1, c)],
    grid[idx(2, c)],
    grid[idx(3, c)],
  ];

  const writeCol = (c: number, col: number[]) => {
    for (let r = 0; r < SIZE; r++) {
      if (next[idx(r, c)] !== col[r]) changed = true;
      next[idx(r, c)] = col[r];
    }
  };

  if (dir === "L") {
    for (let r = 0; r < SIZE; r++) {
      const line = readRow(r);
      const { out, gained } = slideAndMerge(line);
      gainedTotal += gained;
      writeRow(r, out);
    }
  } else if (dir === "R") {
    for (let r = 0; r < SIZE; r++) {
      const line = readRow(r).slice().reverse();
      const { out, gained } = slideAndMerge(line);
      gainedTotal += gained;
      writeRow(r, out.slice().reverse());
    }
  } else if (dir === "U") {
    for (let c = 0; c < SIZE; c++) {
      const line = readCol(c);
      const { out, gained } = slideAndMerge(line);
      gainedTotal += gained;
      writeCol(c, out);
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      const line = readCol(c).slice().reverse();
      const { out, gained } = slideAndMerge(line);
      gainedTotal += gained;
      writeCol(c, out.slice().reverse());
    }
  }

  return { next, changed, gained: gainedTotal };
}

// match contract bản cũ:
// keccak256( encodePacked("2048|", stateHash, "|", score) )
function makeMessageHash(stateHash: Hex, score: bigint): Hex {
  return keccak256(
    encodePacked(
      ["string", "bytes32", "string", "uint256"],
      ["2048|", stateHash, "|", score]
    )
  );
}

export default function Page() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();

  const [grid, setGrid] = useState<number[]>(() => {
    let g = new Array(SIZE * SIZE).fill(0);
    g = addRandomTile(g);
    g = addRandomTile(g);
    return g;
  });

  const [score, setScore] = useState(0);

  // ✅ FIX localStorage: init = 0, đọc sau khi mount
  const [best, setBest] = useState<number>(0);

  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<string | undefined>();

  // Mini App ready (tắt splash)
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // load best from localStorage after mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("best2048");
    setBest(saved ? Number(saved) : 0);
  }, []);

  // persist best
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (score > best) {
      setBest(score);
      window.localStorage.setItem("best2048", String(score));
    }
  }, [score, best]);

  // auto switch Base inside mini app
  useEffect(() => {
    if (isConnected && chainId !== base.id) switchChain({ chainId: base.id });
  }, [isConnected, chainId, switchChain]);

  const doMove = (dir: "L" | "R" | "U" | "D") => {
    const res = move(grid, dir);
    if (!res.changed) return;

    let next = res.next;
    next = addRandomTile(next);

    setGrid(next);
    setScore((s) => s + res.gained);

    setStatus(canMove(next) ? "" : "Game over. New game?");
  };

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dir =
        k === "arrowleft" || k === "a"
          ? "L"
          : k === "arrowright" || k === "d"
          ? "R"
          : k === "arrowup" || k === "w"
          ? "U"
          : k === "arrowdown" || k === "s"
          ? "D"
          : null;

      if (!dir) return;
      e.preventDefault();
      doMove(dir);
    };

    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  // touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 18) return;

    const dir = ax > ay ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U";
    doMove(dir);
  };

  const newGame = () => {
    let g = new Array(SIZE * SIZE).fill(0);
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setStatus("");
    setTxHash(undefined);
  };

  // leaderboard read
  const { data: leaderboard, refetch: refetchLb, isLoading: loadingLb } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getLeaderboard",
      query: { enabled: !!CONTRACT_ADDRESS },
    });

  const rows = useMemo(() => {
    const lb = (leaderboard as any[]) || [];
    return lb.map((x) => ({
      player: x.player as string,
      score: BigInt(x.score?.toString?.() ?? x.score),
      timestamp: BigInt(x.timestamp?.toString?.() ?? x.timestamp),
    }));
  }, [leaderboard]);

  const submitScore = async () => {
    if (!isConnected || !address) return setStatus("Connect wallet first.");
    if (chainId !== base.id) return setStatus("Please switch to Base.");

    try {
      setStatus("Signing message...");

      // stateHash: hash của state game (grid + score)
      const stateStr = JSON.stringify({ g: grid, s: score });
      const stateHash = keccak256(toBytes(stateStr)); // bytes32

      const msgHash = makeMessageHash(stateHash, BigInt(score));

      // personal_sign (EIP-191)
      // param order: [data, address] (most wallets)
      const sig = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [msgHash, address],
      });

      setStatus("Submitting onchain (Base)...");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "submitScore",
        args: [BigInt(score), stateHash, sig],
      });

      setTxHash(hash);
      setStatus("Submitted! Refreshing leaderboard...");
      setTimeout(() => refetchLb(), 1500);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.shortMessage || e?.message || "Submit failed");
    }
  };

  useEffect(() => {
    refetchLb?.();
  }, [refetchLb]);

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">2048 on Base</h1>
            <p className="text-xs text-white/60">
              Farcaster Mini App • Hybrid leaderboard
            </p>
          </div>
          <button
            onClick={newGame}
            className="rounded-xl bg-yellow-400 text-black font-semibold px-3 py-2"
          >
            New
          </button>
        </div>

        <div className="mt-4">
          <ConnectButton />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Score</div>
            <div className="text-xl font-bold text-yellow-300">{score}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Best</div>
            <div className="text-xl font-bold">{best}</div>
          </div>
        </div>

        {status && <div className="mt-3 text-sm text-white/70">{status}</div>}

        <div
          className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: "none" }}
        >
          {grid.map((v, i) => (
            <div
              key={i}
              className={[
                "aspect-square rounded-xl flex items-center justify-center font-extrabold",
                v === 0 ? "bg-white/5 text-transparent" : "bg-white/10 text-white",
                v >= 128 ? "text-lg" : "text-2xl",
              ].join(" ")}
            >
              {v === 0 ? "" : v}
            </div>
          ))}
        </div>

        <button
          onClick={submitScore}
          disabled={!isConnected || isPending}
          className="mt-4 w-full rounded-xl bg-yellow-400 text-black font-semibold py-3 disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Submit score to Base"}
        </button>

        {txHash && (
          <a
            className="mt-2 block text-xs underline text-sky-400 break-all"
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View tx on Basescan
          </a>
        )}

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Leaderboard</div>
            <button
              onClick={() => refetchLb()}
              className="text-xs text-sky-400 underline"
            >
              Refresh
            </button>
          </div>

          {loadingLb ? (
            <div className="text-sm text-white/60 mt-2">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-white/60 mt-2">No entries yet.</div>
          ) : (
            <ol className="mt-2 space-y-2 text-sm">
              {rows.slice(0, 20).map((r, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-white/80">
                    #{i + 1} {r.player.slice(0, 6)}…{r.player.slice(-4)}
                  </span>
                  <span className="font-semibold text-yellow-300">
                    {r.score.toString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="mt-4 text-xs text-white/50">
          Controls: Arrow keys / WASD / Swipe.
        </p>
      </div>
    </main>
  );
}
