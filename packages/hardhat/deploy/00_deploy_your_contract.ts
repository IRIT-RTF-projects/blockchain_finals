import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCopyrightRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("CopyrightRegistry", {
    from: deployer,
    // УДАЛИ ЭТУ СТРОКУ → args: [deployer],
    log: true,
    autoMine: true,
  });

  // Опционально: просто логируем адрес контракта
  const contract = await hre.ethers.getContract("CopyrightRegistry", deployer);
  console.log("CopyrightRegistry deployed at:", await contract.getAddress());
};

export default deployCopyrightRegistry;
deployCopyrightRegistry.tags = ["CopyrightRegistry"];
