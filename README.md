# P2P.ORG Unified API Staking Showcase

This repository provides a reference implementation demonstrating how crypto intermediaries (exchanges, wallets, and custodians) can integrate P2P.ORG's Unified API to offer staking, unstaking, and withdrawal functionalities to their end-users.

## Overview

The P2P.ORG Unified API Staking Showcase is a functional demonstration of integrating P2P.ORG's Unified API, allowing users to:

- Perform staking operations across multiple blockchain networks
- Execute unstaking transactions

All API interactions are handled through a internal proxy layer that manages authentication and abstracts direct API calls.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A P2P.ORG API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AndreGZommerfelds/p2p-unified-api-demo-example-1.git
cd p2p-unified-api-demo-example-1
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Edit `.env` with your specific configuration:

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Usage

### Staking Flow

1. Select a blockchain network
2. Select your address and amount to stake
3. Click "Stake" to create a stake request
4. Sign and broadcast the transaction

### Unstaking Flow

1. Select a blockchain network
2. Choose the position to unstake
3. Enter the amount to unstake
4. Click "Unstake"
5. Sign and broadcast the transaction

## 🛠️ Technology Stack

- **Framework**: Next.js (App Router)
- **UI Library**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Proxy**: Next.js API routes

## 💼 Business Advantages of the P2P.ORG Unified API

### Simplified Integration

The P2P.ORG Unified API provides a single integration point for staking operations across 10+ leading networks, including ETH, SOL, BTC (Babylon), TON, DOT, KSM, AVAIL, ATOM, TIA, and MATIC.

### Significant Development Resource Savings

- Integration time can be reduced significantly compared to individual network integrations
- Unified operational flow for staking, unstaking, and withdrawing across all supported networks

### Future-Ready Scalability

- The API is designed to accommodate both existing and future networks
- Adding support for new blockchains requires only updating network parameters
- Long-term flexibility without additional integrations as new networks emerge

## 🔍 Project Structure

The application uses Next.js App Router architecture:

```
/api                # API Proxy Routes
/app                # Next.js App Router
/components         # UI Components
/config             # Configuration files
/hooks              # Custom React Hooks
/lib                # Utilities and API client
/public             # Static assets
```

## 📄 API Documentation

For detailed API documentation, please refer to the [P2P.ORG Developer Portal](https://docs.p2p.org/docs/unified-api-overview) or the `/api` directory in this repository for implementation examples.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Legal Disclaimer

**DEMONSTRATION PURPOSE ONLY - NOT FOR PRODUCTION USE**

This software is provided strictly as a demonstration and reference implementation of the P2P.ORG Unified API integration. It is not intended, designed, or suitable for production environments or commercial applications.

P2P.ORG PROVIDES THIS SOFTWARE "AS IS" WITHOUT WARRANTY OF ANY KIND.

### Security and Risk Notice

This software has not undergone comprehensive security auditing or penetration testing. Any entity considering adapting this code for their own purposes must:

- Conduct a thorough security assessment and code review
- Implement appropriate security controls and safeguards
- Test extensively in a controlled environment before any production consideration
- Ensure compliance with relevant regulations and industry standards

By using this software, you acknowledge that you have read and understood this disclaimer and agree to these terms.

## 📞 Contact Support

Need assistance with the Unified API implementation? Our product team is ready to help!

If you encounter any issues or have questions about implementation, please reach out to our dedicated support contacts:

- André Zommerfelds: [andre.zommerfelds@p2p.org](mailto:andre.zommerfelds@p2p.org)

When contacting support, please include specific details about your question or issue to help us provide faster and more effective assistance.

---

Built with ❤️ by P2P.ORG
