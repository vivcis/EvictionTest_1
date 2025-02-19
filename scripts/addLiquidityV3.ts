import { ethers } from "hardhat";

async function main(): Promise<void> {

  const NONFUNGIBLE_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2";
  const fee = 3000; 

  console.log("Nonfungible Position Manager:", NONFUNGIBLE_POSITION_MANAGER);
  console.log("USDC:", USDC);
  console.log("WETH:", WETH);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
  ];

  const NPM_ABI = [
    `function mint(
      tuple(
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address recipient,
        uint256 deadline
      ) params
    ) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)`
  ];

  const positionManager = await ethers.getContractAt(NPM_ABI, NONFUNGIBLE_POSITION_MANAGER, deployer);
  const usdcContract = await ethers.getContractAt(ERC20_ABI, USDC, deployer);
  const wethContract = await ethers.getContractAt(ERC20_ABI, WETH, deployer);

  const amountWETHDesired = ethers.parseEther("1");       
  const amountUSDCDesired = ethers.parseUnits("1000", 6);  

  console.log("Approving USDC...");
  try {
    let tx = await usdcContract.approve(NONFUNGIBLE_POSITION_MANAGER, amountUSDCDesired);
    console.log("USDC approve tx hash:", tx.hash);
    await tx.wait();
    console.log("USDC approved.");
  } catch (error) {
    console.error("Error approving USDC:", error);
  }

  console.log("Approving WETH...");
  try {
    let tx = await wethContract.approve(NONFUNGIBLE_POSITION_MANAGER, amountWETHDesired);
    console.log("WETH approve tx hash:", tx.hash);
    await tx.wait();
    console.log("WETH approved.");
  } catch (error) {
    console.error("Error approving WETH:", error);
  }

  const tickLower = -60000;
  const tickUpper = 60000;
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const params = {
    token0: USDC,                
    token1: WETH,               
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amountUSDCDesired,
    amount1Desired: amountWETHDesired,
    amount0Min: 0n,              
    amount1Min: 0n,             
    recipient: deployer.address,
    deadline: deadline,
  };

  console.log("Minting liquidity with parameters:", params);
  try {
    let tx = await positionManager.mint(params, { gasLimit: 500000 });
    console.log("Mint tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Liquidity minted successfully in tx:", tx.hash);
  } catch (error) {
    console.error("Error minting liquidity:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("Fatal error:", error);
    process.exitCode = 1;
  });
