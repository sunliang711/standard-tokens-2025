const defaultHDPATH = "m/44'/60'/0'/0";
const solidityVersion = "0.8.28";
const optimizerRuns = 2000;

const ETHERSCAN_API_KEY = "";
const mnemonic = "";
const INFURA_ID = "";

const config: any = {
    networks: {
        sepolia: {
            url: `https://sepolia.infura.io/v3/${INFURA_ID}`,
            accounts: { mnemonic, path: defaultHDPATH, initialIndex: 0, count: 10, passphrase: "" },
            // gas: 2100000,
            // gasPrice: 8000000000,
            // from: "0x26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5",
            // accounts: ["0x26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5507dcd2ae58c3130a7a97b48"],
            // gasMultiplier: 1,
            // timeout: 20000,  // unit: ms
        },
    },
    solidity: {
        version: `${solidityVersion}`,
        settings: {
            optimizer: {
                enabled: true,
                runs: optimizerRuns,
            }
        }
    },
    etherscan: {
        apiKey: `${ETHERSCAN_API_KEY}`,
        // customChains: [{
        //     network: "sepolia",
        //     chainId: 31337,
        //     urls: {
        //         apiURL: "https://api-sepolia.etherscan.io/api",
        //         browserURL: "https://sepolia.etherscan.io"
        //     }
        // }
        // ],
        enabled: true
    },
}

export default config;