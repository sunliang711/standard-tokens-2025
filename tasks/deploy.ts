import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as readline from "readline";

// Helper function for confirmation prompt
const confirmDeployment = async (message: string, skipConfirmation: boolean): Promise<boolean> => {
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

// Helper function to format constructor arguments
const formatConstructorArgs = (args: any[]): string => {
    return args.map((arg, index) => {
        const formattedArg = typeof arg === 'object' ? JSON.stringify(arg) : arg;
        return `  ${index}: ${formattedArg} (${typeof arg})`;
    }).join('\n');
};

task("contract:deploy", "Deploy a contract with constructor arguments")
    .addParam("contract", "The contract name to deploy")
    .addOptionalVariadicPositionalParam(
        "constructorArgs",
        "Constructor arguments for the contract (optional)",
        []
    )
    .addParam("account", "The account index to use for deployment", 0, types.int)
    .addFlag("noconfirm", "Skip deployment confirmation")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        try {
            // Compile contracts
            console.log("Compiling contracts...");
            await hre.run("compile");
            console.log("Compilation completed successfully");

            // Get the deployer account based on index
            const accounts = await hre.ethers.getSigners();
            if (taskArgs.account >= accounts.length) {
                throw new Error(`Account index ${taskArgs.account} is out of range. Available accounts: ${accounts.length}`);
            }

            const deployer = accounts[taskArgs.account];
            const balance = await hre.ethers.provider.getBalance(deployer.address);

            // Print deployment information
            console.log("\nDEPLOYMENT INFORMATION");
            console.log("=====================");
            console.log(`Network: ${hre.network.name}`);
            console.log(`Contract: ${taskArgs.contract}`);
            console.log(`Deployer: ${deployer.address}`);
            console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
            console.log("\nConstructor Arguments:");
            console.log(formatConstructorArgs(taskArgs.constructorArgs));

            // Get estimated gas
            const ContractFactory = await hre.ethers.getContractFactory(
                taskArgs.contract,
                deployer
            );

            let estimatedGas;
            try {
                const deployTx = await ContractFactory.getDeployTransaction(...taskArgs.constructorArgs);
                estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
                console.log(`\nEstimated gas: ${estimatedGas.toString()}`);
            } catch (error) {
                console.warn("\nWarning: Failed to estimate gas", error);
            }

            // Ask for confirmation unless --noconfirm is set
            const confirmed = await confirmDeployment(
                "\nDo you want to proceed with the deployment?",
                taskArgs.noconfirm
            );

            if (!confirmed) {
                console.log("Deployment cancelled");
                return;
            }

            // Deploy the contract
            console.log("\nDeploying contract...");
            const contract = await ContractFactory.deploy(...taskArgs.constructorArgs);

            console.log("Waiting for deployment transaction...");
            await contract.waitForDeployment();

            const address = await contract.getAddress();

            console.log("\nDeployment successful!");
            console.log(`Contract ${taskArgs.contract} deployed to: ${address}`);
            console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`);

            // Verify source code if not on local network
            const networkName = hre.network.name;
            if (networkName !== "hardhat" && networkName !== "localhost") {
                console.log("\nWaiting for block confirmations...");
                // Wait for 5 block confirmations
                await contract.deploymentTransaction()?.wait(5);

                console.log("Starting contract verification...");
                try {
                    await hre.run("verify:verify", {
                        address: address,
                        constructorArguments: taskArgs.constructorArgs,
                    });
                    console.log("Contract verified successfully");
                } catch (error) {
                    console.log("Verification failed:", error);
                }
            }

            return address;
        } catch (error) {
            console.error("\nDeployment failed:", error);
            throw error;
        }
    });
