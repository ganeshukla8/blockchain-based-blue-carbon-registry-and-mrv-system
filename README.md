# 🌱 Blue Carbon Registry

A blockchain-based Blue Carbon Registry platform for registering, verifying, issuing, transferring, and retiring blue carbon credits.

The application combines a modern React frontend, Node.js/Express backend, MongoDB, Solidity smart contracts, Hardhat, MetaMask, and IPFS/Pinata to provide a transparent and verifiable carbon-credit management system.

---

## 🛠️ Tech Stack

### Frontend

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Chakra UI](https://img.shields.io/badge/Chakra%20UI-319795?style=for-the-badge&logo=chakraui&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Bcrypt](https://img.shields.io/badge/Bcrypt-003B57?style=for-the-badge)

### Blockchain & Web3

![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![MetaMask](https://img.shields.io/badge/MetaMask-E2761B?style=for-the-badge&logo=metamask&logoColor=white)

### Storage

![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)
![Pinata](https://img.shields.io/badge/Pinata-5E5CE6?style=for-the-badge)

### Tools

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

# ✨ Features

- Account creation, registration, login and logout
- Role-based access for Project Owners, Verifiers and Regulators
- JWT authentication
- Bcrypt password hashing
- Signup and login validation
- Blue carbon project registration
- Project document upload
- Content hashing of project documents
- IPFS-style document identification using `docHash`
- Automated MRV (Measurement, Reporting and Verification)
- Vegetation index evaluation
- Canopy percentage evaluation
- Area-consistency validation
- Document presence validation
- Rule-by-rule MRV pass/fail results
- Verifier project approval and rejection
- Regulator-controlled credit issuance
- ERC20-style Blue Carbon Credit (`BCC`) tokens
- MetaMask wallet integration
- On-chain credit transfers
- Carbon credit retirement
- MongoDB database integration
- RESTful backend APIs
- Smart contract integration
- Hardhat local Ethereum blockchain
- IPFS/Pinata integration
- Blockchain transaction verification

---

## ⚙️ Prerequisites

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

## 4. Demo walkthrough 

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
   show the actual mined transactions backing every step above
