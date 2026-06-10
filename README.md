# ChoreAgent

Trustless rotating savings circles on Celo — fully automated.

ChoreAgent lets any group of people run a savings circle (ajo, susu, chama, tanda) on-chain with zero trust requirements. Every member contributes once per cycle; the full pot rotates automatically to a different member each round. Idle funds earn yield via Aave v3 while they wait. No coordinator, no spreadsheet, no chasing people for money.

---

## How it works

```
Member 1 ─┐
Member 2 ─┤  approve(vault, amount)    ┌─ collect() ──► Aave deposit
Member 3 ─┤  ──────────────────────►  │
Member 4 ─┤                           └─ release() ──► recipient + yield
Member 5 ─┘

Repeat every cycle. Every member receives the pot exactly once per rotation.
```

1. A group is created on-chain with an ordered member list, a contribution amount, and a cycle interval.
2. Each member approves the vault to spend their `amount` in cUSD — once, ever.
3. The off-chain agent calls `collect()` when the interval elapses. It pulls cUSD from every member, deposits the total to Aave, and records the amount per-group.
4. The agent calls `release()`. The vault withdraws the per-group Aave balance (principal + yield) and sends it directly to the current rotation recipient.
5. Rotation advances. The cycle repeats until everyone has been paid, then can restart.

If a member's `transferFrom` fails (insufficient allowance, insufficient balance), their contribution is skipped and their trust score is penalised. The cycle continues for all other members — one bad member never blocks the group.

---

## Repository layout

```
ChoreAgent/
├── src/                          Next.js 15 frontend (landing + app dashboard)
├── agent/                        Off-chain Node.js automation agent
│   └── src/
│       ├── index.ts              Entry point — cron scheduler
│       ├── agent.ts              Core cycle logic (collect + release per group)
│       ├── abi.ts                ChoreVault ABI (matches deployed contract)
│       ├── chain.ts              viem public + wallet clients for Celo
│       ├── config.ts             Environment variable validation
│       ├── notify.ts             Optional Telegram notifications
│       └── logger.ts             Structured pino logger
└── contracts/                    Foundry smart contract system
    ├── src/
    │   ├── interfaces/
    │   │   ├── IChoreVault.sol   Canonical ABI — all structs, events, errors
    │   │   └── IAavePool.sol     Minimal Aave v3 interface (supply + withdraw)
    │   ├── libraries/
    │   │   ├── TrustRegistry.sol Member trust score logic
    │   │   ├── GroupManager.sol  Group state CRUD
    │   │   └── ExitVoting.sol    Democratic exit ballot lifecycle
    │   ├── base/
    │   │   └── AgentAuth.sol     Agent + owner access control
    │   └── ChoreVault.sol        Main contract — thin orchestrator
    ├── test/
    │   ├── ChoreVault.t.sol      Integration tests (19 tests)
    │   └── unit/
    │       ├── TrustRegistry.t.sol  (8 tests)
    │       ├── GroupManager.t.sol   (11 tests)
    │       └── ExitVoting.t.sol     (8 tests)
    ├── mocks/
    │   ├── MockERC20.sol         Minimal cUSD mock with public mint
    │   └── MockAavePool.sol      Simulates yield: principal + 1e18 per withdraw
    └── script/
        └── Deploy.s.sol          Foundry broadcast deploy script
```

---

## Smart contract

### Test suite — 46/46 passing

```bash
cd contracts
forge test -vv
```

| Suite | Tests | What it covers |
|---|---|---|
| `TrustRegistry.t.sol` | 8 | Score init, reward cap, penalty floor, risk thresholds |
| `GroupManager.t.sol` | 11 | Create, rotation wrap, swap-and-pop removal, disband, validation |
| `ExitVoting.t.sol` | 8 | Open ballot, majority resolution, requester blocked, double-vote guard |
| `ChoreVault.t.sol` | 19 | Full lifecycle, partial failure, Aave yield, exit flow, 2-cycle e2e, agent rotation |

### Contract: `ChoreVault.sol`

| Function | Caller | Description |
|---|---|---|
| `createGroup(members, amount, intervalDays)` | Anyone | Creates a new savings group on-chain |
| `collect(groupId)` | Agent only | Pulls cUSD from all members, deposits to Aave |
| `release(groupId)` | Agent only | Withdraws from Aave, sends pot + yield to recipient |
| `requestExit(groupId)` | Member | Opens a democratic exit ballot |
| `voteExit(groupId, member, approve)` | Member | Votes on an open exit request |
| `rotateAgent(newAgent)` | Agent | Agent rotates its own key |
| `emergencyRotateAgent(newAgent)` | Owner | Owner recovers if agent key is lost |
| `transferOwnership(newOwner)` | Owner | Transfers contract ownership |
| `getTrustScore(member)` | Anyone | Returns member's trust score (default 100) |
| `getGroup(groupId)` | Anyone | Returns all group fields |
| `isMember(groupId, account)` | Anyone | Membership check |
| `groupCount()` | Anyone | Total groups ever created |

### Trust scores

Every member starts at 100. On-time contributions earn +5 (capped at 200). Failed contributions cost −20 (floored at 0). Scores are stored with a +1 offset internally so a legitimately penalised-to-zero score is distinguished from an uninitialised address.

### Safety properties

- **Per-group Aave tracking** — `pendingRelease` is stored per group. Multiple concurrent groups never share an Aave balance.
- **Collect-before-release gate** — `release()` reverts with `NothingToRelease` if `pendingRelease == 0`.
- **Non-reverting collection** — each member's `transferFrom` is a low-level call. One failed member never rolls back the whole transaction.
- **CEI pattern** — `pendingRelease` is zeroed before the Aave withdrawal in `release()`.
- **Agent key recovery** — owner can call `emergencyRotateAgent()` if the agent key is compromised or lost.
- **All ERC-20 return values checked** — `transfer()` result checked via custom error `TransferFailed`.

### Deploy

```bash
cp contracts/.env.example contracts/.env  # fill in values

# Alfajores testnet
forge script contracts/script/Deploy.s.sol \
  --rpc-url alfajores \
  --broadcast --verify -vvvv

# Celo Mainnet
forge script contracts/script/Deploy.s.sol \
  --rpc-url celo \
  --broadcast --verify -vvvv
```

Required env vars:

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key |
| `AGENT_ADDRESS` | Off-chain agent wallet address |
| `AAVE_POOL_ADDRESS` | Aave v3 Pool proxy on the target chain |
| `CELOSCAN_API_KEY` | For contract verification |

cUSD addresses:

| Network | Address |
|---|---|
| Celo Mainnet | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Alfajores Testnet | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |

---

## Agent

### Setup

```bash
cd agent
cp .env.example .env    # fill in all values
npm install
```

### Run

```bash
npm run dev             # watch mode with tsx
npm start               # production
```

### How it works

On startup and on every `CRON_SCHEDULE` tick:

1. Reads `groupCount()` from the contract.
2. For each group, reads `getGroup()`.
3. Skips inactive groups.
4. If `block.timestamp >= nextCollection`, simulates then calls `collect(groupId)`.
5. Re-reads the group. If `pendingRelease > 0`, simulates then calls `release(groupId)`.
6. Waits for 1 confirmation on each transaction before moving to the next group.
7. Sends a plain-English summary to Telegram (optional).

Agent env vars:

| Variable | Description |
|---|---|
| `CELO_RPC_URL` | Celo RPC endpoint |
| `AGENT_PRIVATE_KEY` | Agent wallet private key (hex with 0x prefix) |
| `CHORE_VAULT_ADDRESS` | Deployed ChoreVault contract address |
| `CUSD_ADDRESS` | cUSD token address |
| `CRON_SCHEDULE` | Cron expression (default: `0 * * * *` — hourly) |
| `TELEGRAM_BOT_TOKEN` | Optional — for run summaries |
| `TELEGRAM_CHAT_ID` | Optional — for run summaries |

---

## Frontend

```bash
npm run dev       # http://localhost:3000
npm run build
npm start
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity 0.8.20, Foundry |
| Blockchain | Celo Mainnet (chainId 42220) |
| Yield | Aave v3 |
| Stable coin | cUSD |
| Agent | Node.js, viem, node-cron |
| Frontend | Next.js 15, Tailwind CSS, Framer Motion |
| Notifications | Telegram Bot API |
