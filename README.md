## deploy contract

```shell
npx hardhat contract:deploy --contract <contractName>  arg1 arg2 ... argN --network <network> [--account <accountIndex>] [--noconfirm] [--noverify] [--confirmations 10]

```
## verify contract
```shell
npx hardhat verify --contract <Path/to/contract.sol>:<contractName> <contractAddress> arg1 arg2 ... argN   --network <network>
```

## write contract
```shell
npx hardhat contract:write --contract <contractName> --address <contractAddress> --method <methodName> arg1 arg2 ... argN --network <network> [--account <accountIndex>] [--noconfirm]

```