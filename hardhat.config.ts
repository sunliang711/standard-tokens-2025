import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import cfg from "./private";
import "./tasks/contractDeploy";
import "./tasks/contractWrite";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: cfg.networks,
  solidity: cfg.solidity,
  etherscan: cfg.etherscan,
};

export default config;

// https://hardhat.org/hardhat-runner/docs/config