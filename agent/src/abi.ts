/**
 * KyraVault ABI — matches contracts/src/KyraVault.sol exactly.
 * Regenerate with: forge inspect KyraVault abi
 */

export const KYRA_VAULT_ABI = [
  // ── createGroup ────────────────────────────────────────────────────────────
  {
    name: "createGroup",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "members",      type: "address[]" },
      { name: "amount",       type: "uint256"   },
      { name: "intervalDays", type: "uint256"   },
    ],
    outputs: [{ name: "groupId", type: "uint256" }],
  },

  // ── collect ────────────────────────────────────────────────────────────────
  {
    name: "collect",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "groupId", type: "uint256" }],
    outputs: [],
  },

  // ── release ────────────────────────────────────────────────────────────────
  {
    name: "release",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "groupId", type: "uint256" }],
    outputs: [],
  },

  // ── requestExit ────────────────────────────────────────────────────────────
  {
    name: "requestExit",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "groupId", type: "uint256" }],
    outputs: [],
  },

  // ── voteExit ───────────────────────────────────────────────────────────────
  {
    name: "voteExit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "member",  type: "address" },
      { name: "approve", type: "bool"    },
    ],
    outputs: [],
  },

  // ── rotateAgent ────────────────────────────────────────────────────────────
  {
    name: "rotateAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "newAgent", type: "address" }],
    outputs: [],
  },

  // ── emergencyRotateAgent ───────────────────────────────────────────────────
  {
    name: "emergencyRotateAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "newAgent", type: "address" }],
    outputs: [],
  },

  // ── transferOwnership ──────────────────────────────────────────────────────
  {
    name: "transferOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "newOwner", type: "address" }],
    outputs: [],
  },

  // ── Views ──────────────────────────────────────────────────────────────────
  {
    name: "groupCount",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getGroup",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [
      { name: "members",        type: "address[]" },
      { name: "amount",         type: "uint256"   },
      { name: "interval",       type: "uint256"   },
      { name: "nextCollection", type: "uint256"   },
      { name: "rotationIndex",  type: "uint256"   },
      { name: "active",         type: "bool"      },
      { name: "pendingRelease", type: "uint256"   },
    ],
  },
  {
    name: "isMember",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getTrustScore",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "agent",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "address" }],
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  {
    name: "GroupCreated",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256",   indexed: true  },
      { name: "creator", type: "address",   indexed: true  },
      { name: "members", type: "address[]", indexed: false },
      { name: "amount",  type: "uint256",   indexed: false },
      { name: "interval",type: "uint256",   indexed: false },
    ],
  },
  {
    name: "Collected",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true  },
      { name: "member",  type: "address", indexed: true  },
      { name: "amount",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "CollectionFailed",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true  },
      { name: "member",  type: "address", indexed: true  },
      { name: "reason",  type: "string",  indexed: false },
    ],
  },
  {
    name: "PotReleased",
    type: "event",
    inputs: [
      { name: "groupId",   type: "uint256", indexed: true  },
      { name: "recipient", type: "address", indexed: true  },
      { name: "principal", type: "uint256", indexed: false },
      { name: "yield",     type: "uint256", indexed: false },
      { name: "total",     type: "uint256", indexed: false },
    ],
  },
  {
    name: "TrustScoreUpdated",
    type: "event",
    inputs: [
      { name: "member",   type: "address", indexed: true  },
      { name: "oldScore", type: "uint256", indexed: false },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ExitRequested",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "member",  type: "address", indexed: true },
    ],
  },
  {
    name: "ExitApproved",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "member",  type: "address", indexed: true },
    ],
  },
  {
    name: "ExitRejected",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "member",  type: "address", indexed: true },
    ],
  },
  {
    name: "GroupDisbanded",
    type: "event",
    inputs: [{ name: "groupId", type: "uint256", indexed: true }],
  },
  {
    name: "AgentRotated",
    type: "event",
    inputs: [
      { name: "oldAgent", type: "address", indexed: true },
      { name: "newAgent", type: "address", indexed: true },
    ],
  },
] as const;

export const CUSD_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
