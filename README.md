# Blockchain-Based Blue Carbon Registry and MRV System

Full implementation for the synopsis (Group 26MPA37), built exactly on the stated stack:
Ethereum/Polygon + Solidity smart contracts, React.js frontend, Node.js/Express backend,
MongoDB, IPFS-style document storage, MetaMask, and JWT authentication.

## How the three synopsis modules map to this code

| Synopsis module | Where it lives |
|---|---|
| 1. Blue Carbon Registry | `contracts/BlueCarbonRegistry.sol` → `registerProject()`; `backend/src/controllers/projectController.js`; `frontend/src/pages/RegisterProject.jsx` |
| 2. Automated MRV | `backend/src/services/mrvEngine.js` (rule engine) + `submitMrvResult()` / `verifierDecision()` on-chain; `frontend/src/pages/MrvVerification.jsx` |
| 3. Smart-contract credit management | `contracts/BlueCarbonRegistry.sol` (`issueCredits`) + `CarbonCreditToken` (ERC20-style mint/transfer/burn); `backend/src/controllers/creditController.js`; `frontend/src/pages/Credits.jsx` |

## Architecture notes (worth mentioning in your viva)

- **Credits are a real ERC20-style token** (`CarbonCreditToken`), not just a database
  number. `mint()` is restricted to the registry contract and only fires after MRV +
  verifier approval; `burn()` **is** the retirement operation — once burned, supply is
  gone forever, which is the anti-double-counting guarantee.
- **Who signs what:** the backend holds one "oracle" key used only for administrative
  actions it's authorized for (submitting automated MRV results, and — in this simplified
  single-key demo setup — issuing credits as the regulator). Project owners **transfer and
  retire their own credits by signing directly with their own MetaMask wallet** from the
  frontend (`frontend/src/context/Web3Context.jsx`); the backend never holds a user's key
  and only records the resulting transaction hash for the activity feed.
- **Graceful degradation:** every on-chain call is wrapped in a try/catch that falls back
  to MongoDB-only operation. This means the app is fully usable — register projects, run
  MRV, approve/reject, issue/transfer/retire credits — the moment MongoDB is running, even
  before you've deployed the contracts. Once you deploy (steps below) and set the contract
  addresses in `.env`, the same actions also write real transactions to your local chain.
  This is deliberate: it keeps the app demoable at any stage of setup, and you can show
  your evaluator the transaction hashes and the block explorer output once the chain is
  wired in.

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongod`) or a free MongoDB Atlas cluster
- [MetaMask](https://metamask.io) browser extension (only needed to demo real on-chain
  transfers/retirement — everything else works without it)

## 1. Smart contracts

```bash
npm install                     # installs Hardhat at the repo root
npx hardhat compile             # compiles contracts/BlueCarbonRegistry.sol

# terminal 1: start a local Ethereum node (keep this running)
npx hardhat node

# terminal 2: deploy both contracts to it
npm run deploy:local
```

The deploy script prints two addresses — copy them into `backend/.env` as
`CREDIT_TOKEN_ADDRESS` and `REGISTRY_CONTRACT_ADDRESS` (and into `frontend/.env` as
`VITE_CREDIT_TOKEN_ADDRESS` / leave the registry one out of the frontend, it's backend-only).

It also prints ~20 test accounts with 10,000 test ETH each — import one into MetaMask
(Import Account → paste private key) to sign transfers/retirement in the UI. **These are
Hardhat's well-known public test keys with zero real value; never reuse them elsewhere.**

## 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and the two contract addresses from step 1
npm install
npm run dev          # http://localhost:5000
```

## 3. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: set VITE_CREDIT_TOKEN_ADDRESS from step 1 (optional — app works without it)
npm install
npm run dev           # http://localhost:5173
```

## 4. Demo walkthrough (what to show in your viva)

1. Register three accounts at `/register`: one as **Project Owner**, one as **Verifier**,
   one as **Regulator**.
2. As the owner, go to **Registry** and submit a project (try a mangrove project, ~40 ha,
   with a PDF attached — it gets content-hashed for the IPFS-style `docHash`).
3. As the verifier, go to **MRV**, click **Run automated MRV** — this evaluates the rule
   engine (vegetation index, canopy %, area-consistency %, document presence) and shows a
   pass/fail breakdown per rule.
4. Still as verifier, **Approve** (or **Reject**) based on the automated result.
5. As the regulator, on the same **MRV** page, click **Issue credits** — this mints
   ERC20-style `BCC` tokens to the project owner's wallet (on-chain if configured).
6. As the owner, go to **Credits**, connect MetaMask, and **transfer** or **retire**
   credits — retirement is irreversible, exactly like real carbon-credit retirement.
7. Open Hardhat's terminal 1 log, or a block explorer if you deployed to a testnet, to
   show the actual mined transactions backing every step above.

## 5. Going further (nice additions for the report / research paper track)

- Swap `services/mrvEngine.js`'s deterministic pseudo-indices for a real NDVI computation
  against Sentinel-2 bands via Google Earth Engine's Python/REST API — the rule-evaluation
  logic (`runRules`) doesn't need to change, only where `vegIndex`/`canopyPct` come from.
- Swap the manual access control in the Solidity contracts for
  `@openzeppelin/contracts`' `AccessControl` + `ERC20` for a production-hardened version
  (mentioned inline in the contract comments).
- Deploy to Polygon Amoy testnet (uncomment the network block in `hardhat.config.js`) so
  your registered projects and transactions are visible on a public explorer like
  PolygonScan for the demo — strong visual proof of "on-chain" for evaluators.
- Add a `/verify/:projectId` public read-only page so anyone (not just logged-in users)
  can audit a project's status and credit history — reinforces the "transparent, public
  registry" pitch from your Need & Significance section.

## Repository structure

```
blue-carbon-registry/
├── contracts/BlueCarbonRegistry.sol   # CarbonCreditToken + BlueCarbonRegistry
├── scripts/deploy.js                  # Hardhat deploy script
├── hardhat.config.js
├── backend/
│   ├── src/
│   │   ├── config/db.js               # MongoDB connection
│   │   ├── models/                    # User, Project, Transaction (Mongoose)
│   │   ├── middleware/auth.js         # JWT auth + role guard
│   │   ├── services/
│   │   │   ├── blockchain.js          # ethers.js contract calls
│   │   │   ├── mrvEngine.js           # automated verification rule engine
│   │   │   └── ipfs.js                # content-hash / web3.storage document storage
│   │   ├── controllers/               # auth, project, mrv, credit
│   │   ├── routes/
│   │   └── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.js              # axios + JWT interceptor
    │   ├── context/AuthContext.jsx    # login/register/session
    │   ├── context/Web3Context.jsx    # MetaMask connect + on-chain transfer/retire
    │   ├── components/                # Navbar, ProtectedRoute, StatusPill
    │   └── pages/                     # Login, Register, Dashboard, RegisterProject,
    │                                   # MrvVerification, Credits
    └── .env.example
```

## About the interactive demo artifact

Alongside this repository, you were given a single-file interactive prototype
(`BlueCarbonRegistry.jsx`) that runs entirely in-browser with a real SHA-256-linked block
chain simulation and persistent storage — no setup required. It's the fastest way to
click through and understand the full flow (and a good backup demo if your local
blockchain/MongoDB setup has issues on viva day), while this repository is the real,
submittable full-stack codebase matching your synopsis's technology list.
