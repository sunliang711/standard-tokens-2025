import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as readline from "readline";

// Helper function for confirmation prompt
const confirmTransaction = async (message: string, skipConfirmation: boolean): Promise<boolean> => {
    if (skipConfirmation) {
        return true;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const answer = await new Promise<string>((resolve) => {
            rl.question(`${message} (y/N): `, resolve);
        });
        return answer.toLowerCase() === 'y';
    } finally {
        rl.close();
    }
};

// Helper function to format arguments
const formatArgs = (args: any[]): string => {
    return args.map((arg, index) => {
        const formattedArg = typeof arg === 'object' ? JSON.stringify(arg) : arg;
        return `  ${index}: ${formattedArg} (${typeof arg})`;
    }).join('\n');
};

task("contract:write", "Execute a write method on a smart contract")
    .addParam("contract", "The contract name or address")
    .addParam("address", "The contract address")
    .addParam("method", "The method name to call")
    .addOptionalVariadicPositionalParam(
        "args",
        "Method arguments (optional)",
        []
    )
    .addParam("account", "The account index to use for transaction", 0, types.int)
    .addFlag("noconfirm", "Skip transaction confirmation")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        try {
            // Get the signer
            const accounts = await hre.ethers.getSigners();
            if (taskArgs.account >= accounts.length) {
                throw new Error(`Account index ${taskArgs.account} is out of range. Available accounts: ${accounts.length}`);
            }

            const signer = accounts[taskArgs.account];
            const balance = await hre.ethers.provider.getBalance(signer.address);

            let contract;
            try {
                // First try to get contract from artifacts
                console.log("Attempting to load contract from artifacts...");
                const ContractFactory = await hre.ethers.getContractFactory(taskArgs.contract);
                contract = ContractFactory.attach(taskArgs.address).connect(signer);
            } catch (error) {
                // If that fails, try to get the contract ABI from Etherscan
                console.log("Loading contract from blockchain...");
                contract = await hre.ethers.getContractAt(
                    ["function " + taskArgs.method + "(address) external"],
                    taskArgs.address,
                    signer
                );
            }

            if (!contract.interface) {
                throw new Error("Failed to load contract interface");
            }

            // Print transaction information
            console.log("\nTRANSACTION INFORMATION");
            console.log("=======================");
            console.log(`Network: ${hre.network.name}`);
            console.log(`Contract Address: ${taskArgs.address}`);
            console.log(`Method: ${taskArgs.method}`);
            console.log(`Sender: ${signer.address}`);
            console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
            console.log("\nArguments:");
            console.log(formatArgs(taskArgs.args));

            // Estimate gas
            let estimatedGas;
            try {
                estimatedGas = await contract[taskArgs.method].estimateGas(...taskArgs.args);
                console.log(`\nEstimated gas: ${estimatedGas.toString()}`);
            } catch (error) {
                console.warn("\nWarning: Failed to estimate gas. The transaction might fail.", error);
            }

            const gasPrice = await hre.ethers.provider.getFeeData();
            console.log("\nGAS INFORMATION");
            console.log("===============");
            console.log(`Gas Price: ${hre.ethers.formatUnits(gasPrice.gasPrice ?? 0, 'gwei')} gwei`);
            if (gasPrice.maxFeePerGas) {
                console.log(`Max Fee Per Gas: ${hre.ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei')} gwei`);
                console.log(`Max Priority Fee Per Gas: ${hre.ethers.formatUnits(gasPrice.maxPriorityFeePerGas ?? 0, 'gwei')} gwei`);
            }

            // If you want to estimate total cost (after getting estimatedGas)
            if (estimatedGas && gasPrice.gasPrice) {
                const estimatedCost = estimatedGas * gasPrice.gasPrice;
                console.log(`Estimated Cost: ${hre.ethers.formatEther(estimatedCost)} ETH`);
            }

            // Ask for confirmation unless --noconfirm is set
            const confirmed = await confirmTransaction(
                "\nDo you want to proceed with the transaction?",
                taskArgs.noconfirm
            );

            if (!confirmed) {
                console.log("Transaction cancelled");
                return;
            }

            // Execute transaction
            console.log("\nSending transaction...");
            const tx = await contract[taskArgs.method](...taskArgs.args);

            console.log(`Transaction hash: ${tx.hash}`);
            console.log("Waiting for confirmation...");

            const receipt = await tx.wait();

            console.log("\nTransaction successful!");
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);

            return receipt;
        } catch (error) {
            console.error("\nTransaction failed:", error);
            throw error;
        }
    });
