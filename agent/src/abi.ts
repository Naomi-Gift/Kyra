// Auto-generated from contracts/out/ChoreAgent.sol/ChoreAgent.json
// Re-export only what the agent needs.

export const CHORE_AGENT_ABI = [
  // ── Read ────────────────────────────────────────────────────────────────────
  {
    name: "allGroups",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "count", type: "uint256" }],
  },
  {
    name: "getGroup",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [
      { name: "name",               type: "string"  },
      { name: "creator",            type: "address" },
      { name: "cUSD",               type: "address" },
      { name: "contributionAmount", type: "uint256" },
      { name: "cycleDurationSecs",  type: "uint256" },
      { name: "lastCycleAt",        type: "uint256" },
      { name: "currentRound",       type: "uint8"   },
      { name: "status",             type: "uint8"   },
      { name: "members",            type: "address[]" },
    ],
  },
  {
    name: "nextCycleAt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "agentAddress",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // ── Write ───────────────────────────────────────────────────────────────────
  {
    name: "runCycle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [],
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    name: "CycleRun",
    type: "event",
    inputs: [
      { name: "groupId",   type: "uint256", indexed: true  },
      { name: "round",     type: "uint8",   indexed: false },
      { name: "recipient", type: "address", indexed: true  },
      { name: "potAmount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
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
    name: "GroupCompleted",
    type: "event",
    inputs: [{ name: "groupId", type: "uint256", indexed: true }],
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
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
