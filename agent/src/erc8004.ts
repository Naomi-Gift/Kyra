/**
 * ERC-8004 Agent Identity Registration
 *
 * Registers the Kyra on-chain before the cron loop starts.
 * The agentId is a deterministic hash of the agent address + chainId.
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-8004 (draft)
 * Registry on Celo: https://agentscan.io
 *
 * The registration call is idempotent — if already registered it returns
 * the existing agentId without re-submitting a transaction.
 */

import { createPublicClient, createWalletClient, http, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, account, publicClient, walletClient } from "./chain.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

// ── ERC-8004 Registry ABI (minimal) ──────────────────────────────────────────
const REGISTRY_ABI = [
  {
    name: "isRegistered",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "agentId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId",      type: "bytes32" },
      { name: "agentAddress", type: "address" },
      { name: "chainId",      type: "uint256" },
      { name: "endpoint",     type: "string"  },
      { name: "metadata",     type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { name: "agentId",      type: "bytes32", indexed: true  },
      { name: "agentAddress", type: "address", indexed: true  },
      { name: "chainId",      type: "uint256", indexed: false },
    ],
  },
] as const;

// Celo mainnet ERC-8004 registry (update once deployed / confirmed)
const REGISTRY_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

// Chain ID
const CHAIN_ID = 42220n;

/**
 * Derive a deterministic agentId from the agent address and chain.
 * agentId = keccak256(abi.encodePacked(agentAddress, chainId))
 */
export function deriveAgentId(agentAddress: `0x${string}`, chainId: bigint): `0x${string}` {
  return keccak256(
    encodePacked(["address", "uint256"], [agentAddress, chainId])
  );
}

/**
 * Register the agent identity on-chain if not already registered.
 * Returns the agentId (bytes32 hex string).
 */
export async function registerAgent(): Promise<`0x${string}`> {
  const agentAddress = account.address;
  const agentId      = deriveAgentId(agentAddress, CHAIN_ID);
  const endpoint     = config.publicUrl ?? "";
  const metadata     = JSON.stringify({
    name:        "Kyra",
    description: "Autonomous savings circle agent on Celo",
    version:     "1.0.0",
    vault:       config.contractAddress,
    actions:     ["collect", "release"],
  });

  logger.info({ agentId, agentAddress }, "Checking ERC-8004 registration");

  // Check if registry is a real contract (skip on missing registry)
  if (REGISTRY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    logger.warn(
      "ERC-8004 registry address not set (REGISTRY_ADDRESS is zero). " +
      "Update agent/src/erc8004.ts with the deployed registry address."
    );
    logger.info({ agentId }, "AgentId derived (not submitted)");
    return agentId;
  }

  try {
    const registered = await publicClient.readContract({
      address:      REGISTRY_ADDRESS,
      abi:          REGISTRY_ABI,
      functionName: "isRegistered",
      args:         [agentId],
    });

    if (registered) {
      logger.info({ agentId }, "Agent already registered on ERC-8004 registry");
      return agentId;
    }

    // Submit registration
    const hash = await walletClient.writeContract({
      address:      REGISTRY_ADDRESS,
      abi:          REGISTRY_ABI,
      functionName: "register",
      args:         [agentId, agentAddress, CHAIN_ID, endpoint, metadata],
      account,
    });

    logger.info({ agentId, hash }, "ERC-8004 registration submitted");

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

    if (receipt.status !== "success") {
      logger.error({ hash }, "ERC-8004 registration transaction reverted");
    } else {
      logger.info({ agentId, hash }, "ERC-8004 agent registered successfully");
    }
  } catch (err) {
    // Non-fatal: agent still runs, just not registered
    logger.warn({ err }, "ERC-8004 registration failed — agent will run without registration");
  }

  return agentId;
}
