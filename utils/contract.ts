import { ethers } from "ethers"

export const CONTRACT_ADDRESS = "0x945F1F1Ba6D88040aFE590A3BAC702f00E53f651" // Replace with your new contract address if it has changed

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_vrfCoordinator", type: "address" },
      { internalType: "uint256", name: "_subscriptionId", type: "uint256" },
      { internalType: "bytes32", name: "_keyHash", type: "bytes32" },
      { internalType: "address payable", name: "_devTeam", type: "address" },
      { internalType: "address", name: "_MNGToken", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "uint256", name: "_guess", type: "uint256" }],
    name: "enterGuess",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "ENTRY_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PLAYERS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "gameActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vrfRequested",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winningNumber",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "players",
    outputs: [
      { internalType: "address payable", name: "playerAddress", type: "address" },
      { internalType: "uint256", name: "guess", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasGuessed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PLAYER_REWARD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WINNER_REWARD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "guess", type: "uint256" },
    ],
    name: "PlayerJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "requestId", type: "uint256" }],
    name: "RandomNumberRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "winner", type: "address" },
      { indexed: false, internalType: "uint256", name: "winningNumber", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "ethReward", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "mngReward", type: "uint256" },
    ],
    name: "WinnerDeclared",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "MNGRewardDistributed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "string", name: "reason", type: "string" }],
    name: "VRFFailure",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "GameReset",
    type: "event",
  },
]

export const getContract = async (signer: ethers.Signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

