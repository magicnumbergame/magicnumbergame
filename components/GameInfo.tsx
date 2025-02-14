"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getContract } from "@/utils/contract"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface GameInfoProps {
  walletAddress: string | null
}

export function GameInfo({ walletAddress }: GameInfoProps) {
  const [gameInfo, setGameInfo] = useState({
    gameActive: false,
    vrfRequested: false,
    currentPlayers: 0,
    maxPlayers: 3,
    totalPot: "0",
    entryFee: "0",
    playerReward: "0",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGameInfo = async () => {
      console.log("Fetching game info...")
      if (typeof window.ethereum !== "undefined" && walletAddress) {
        try {
          setIsLoading(true)
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const contract = await getContract(signer)
          const contractAddress = await contract.getAddress()

          const fetchData = async (method: string, ...args: any[]) => {
            try {
              const result = await contract[method](...args)
              console.log(`${method} fetched:`, result)
              return result
            } catch (error) {
              console.error(`Error fetching ${method}:`, error)
              return null
            }
          }

          const formatBigNumber = (value: ethers.BigNumberish | null) => {
            if (value === null) return "0"
            try {
              return ethers.formatEther(value)
            } catch (error) {
              console.error("Error formatting BigNumber:", error)
              return "0"
            }
          }

          const handleFetchError = (error: any, defaultValue: string) => {
            console.error("Error fetching data:", error)
            return defaultValue
          }

          const [gameActive, vrfRequested, maxPlayers, entryFee, playerReward] = await Promise.all([
            fetchData("gameActive").catch((error) => handleFetchError(error, false)),
            fetchData("vrfRequested").catch((error) => handleFetchError(error, false)),
            fetchData("MAX_PLAYERS").catch((error) => handleFetchError(error, 3)),
            fetchData("ENTRY_FEE").catch((error) => handleFetchError(error, "0")),
            fetchData("PLAYER_REWARD").catch((error) => handleFetchError(error, "0")),
          ])

          // Get the number of players
          let currentPlayers = 0
          while (true) {
            try {
              await contract.players(currentPlayers)
              currentPlayers++
            } catch (error) {
              break
            }
          }

          // Get the total pot
          const totalPot = await provider.getBalance(contractAddress)

          setGameInfo({
            gameActive: gameActive ?? false,
            vrfRequested: vrfRequested ?? false,
            currentPlayers,
            maxPlayers: Number(maxPlayers) || 3,
            totalPot: formatBigNumber(totalPot),
            entryFee: formatBigNumber(entryFee),
            playerReward: formatBigNumber(playerReward),
          })
          setError(null)
        } catch (error) {
          console.error("Error fetching game info:", error)
          setError(
            `Failed to fetch game information: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
          )
        } finally {
          setIsLoading(false)
        }
      } else {
        setGameInfo({
          gameActive: false,
          vrfRequested: false,
          currentPlayers: 0,
          maxPlayers: 3,
          totalPot: "0",
          entryFee: "0",
          playerReward: "0",
        })
        if (!walletAddress) {
          setError("Wallet not connected. Please connect your wallet to view game information.")
        } else {
          setError("MetaMask not detected. Please install MetaMask to use this feature.")
        }
        setIsLoading(false)
      }
    }

    fetchGameInfo()
    const interval = setInterval(fetchGameInfo, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [walletAddress])

  if (!walletAddress) {
    return null
  }

  return (
    <Card className="w-full bg-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Magic Number Game Info</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="font-semibold">Game Status:</div>
            <div className={gameInfo.gameActive ? "text-green-300" : "text-red-300"}>
              {gameInfo.gameActive ? "Active" : gameInfo.vrfRequested ? "Waiting for VRF" : "Inactive"}
            </div>
            <div className="font-semibold"># of Players:</div>
            <div>
              {gameInfo.currentPlayers} / {gameInfo.maxPlayers}
            </div>
            <div className="font-semibold">Total Pot:</div>
            <div>{gameInfo.totalPot} ETH</div>
            <div className="font-semibold">Entry Fee:</div>
            <div>{gameInfo.entryFee} ETH</div>
            <div className="font-semibold">Player Reward:</div>
            <div>{gameInfo.playerReward} MNG</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

