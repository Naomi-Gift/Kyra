# ChoreAgent

Trustless rotating savings circles on Celo. Set it up once — ChoreAgent handles every collection, rotation, and payout automatically.

---

## Repository layout

```
ChoreAgent/
├── src/                   # Next.js 15 frontend
├── contracts/             # Foundry smart contract
│   ├── src/ChoreAgent.sol
│   ├── test/ChoreAgent.t.sol
│   └── script/Deploy.s.sol
└── agent/                 # Off-chain automation agent (Node.js + viem)
    └── src/
        ├── index.ts       # Entry point / cron scheduler
        ├── agent.ts       # Core cycle logic
        ├── chain.ts       # viem clients
        ├── abi.ts         # Contract ABI
        ├── notify.ts      # Telegram notifications
        └── config.ts      # Env config
```

---

## Smart contract

### Build & test

```bash
cd contracts
forge install   # installs forge-std
forge build
forge test -vv
```

### Deploy to Alfajores (testnet)

```bash
cp .env.example .env   # fill in PRIVATE_KEY, AGENT_ADDRESS
forge script script/Deploy.s.sol \
  --rpc-url celo_alfajores \
  --broadcast \
  --verify \
  -vvvv
```

### Deploy to Celo Mainnet

```bash
forge script script/Deploy.s.sol \
  --rpc-url celo \
  --broadcast \
  --verify \
  -vvvv
```

### Contract: ChoreAgent.sol

| Function | Who | Description |
|---|---|---|
| `createGroup(...)` | Anyone | Creates a new savings circle |
| `runCycle(groupId)` | Agent only | Collects from all members, sends pot to recipient |
| `restartGroup(groupId)` | Creator / owner | Restarts a completed group |
| `setAgentAddress(addr)` | Owner | Rotates the agent wallet |
| `pauseGroup / resumeGroup` | Owner | Emergency controls |

---

## Agent

### Setup

```bash
cd agent
cp .env.example .env   # fill in all values
npm install
```

### Run (development)

```bash
npm run dev
```

### Run (production)

```bash
npm start
# or deploy as a systemd service / Railway / Fly.io app
```

### How it works

1. On startup (and every `CRON_SCHEDULE` tick), the agent calls `allGroups()`.
2. For each active group, it checks if `nextCycleAt` ≤ now.
3. It simulates `runCycle` first — if simulation fails it skips and logs.
4. If simulation passes, it broadcasts the transaction and waits for 1 confirmation.
5. It posts a summary to Telegram (optional).

---

## Frontend

```bash
npm run dev     # http://localhost:3000
npm run build
npm start
```

---

## Environment variables

### contracts / deploy
| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key |
| `AGENT_ADDRESS` | Agent wallet address |
| `CELO_RPC_URL` | Celo RPC endpoint |
| `CELOSCAN_API_KEY` | For contract verification |

### agent
| Variable | Description |
|---|---|
| `CELO_RPC_URL` | Celo RPC endpoint |
| `AGENT_PRIVATE_KEY` | Agent wallet private key |
| `CHORE_AGENT_ADDRESS` | Deployed contract address |
| `CUSD_ADDRESS` | cUSD token address |
| `CRON_SCHEDULE` | Cron string (default: `0 * * * *`) |
| `TELEGRAM_BOT_TOKEN` | Optional — Telegram bot token |
| `TELEGRAM_CHAT_ID` | Optional — Telegram chat ID |

---

## cUSD addresses

| Network | Address |
|---|---|
| Celo Mainnet | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Alfajores Testnet | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
