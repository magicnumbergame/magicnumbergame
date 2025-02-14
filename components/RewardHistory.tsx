"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { CONTRACT_ADDRESS } from "@/utils/contract"

interface Reward {
  amount: string
  timestamp: number
  transactionHash: string
}

interface RewardHistoryProps {
  walletAddress: string | null
}

export function RewardHistory({ walletAddress }: RewardHistoryProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRewardHistory = async () => {
      if (walletAddress) {
        try {
          setIsLoading(true)
          setError(null)
          console.log("Fetching reward history...")
          const apiKey = "4F7WKF24MX5DVE6QRGCYKXAFQIRQ7CIJGE"
          const network = "sepolia"
          const eventSignature = ethers.id("MNGRewardDistributed(address,uint256)")
          const url = `https://api-${network}.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${CONTRACT_ADDRESS}&topic0=${eventSignature}&topic1=0x000000000000000000000000${walletAddress.slice(2)}&apikey=${apiKey}`

          console.log("Fetching from URL:", url)
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          console.log("Received data:", JSON.stringify(data, null, 2))

          if (data.status === "1" && Array.isArray(data.result)) {
            const rewardsData = data.result
              .map((log: any) => {
                if (!log.data) {
                  console.warn("Invalid log data:", log)
                  return null
                }
                try {
                  const [amount] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], log.data)
                  return {
                    amount: ethers.formatEther(amount),
                    timestamp: Number.parseInt(log.timeStamp, 16),
                    transactionHash: log.transactionHash,
                  }
                } catch (decodeError) {
                  console.error("Error decoding log data:", decodeError, "Log:", log)
                  return null
                }
              })
              .filter((reward): reward is Reward => reward !== null)
              .sort((a, b) => b.timestamp - a.timestamp)

            console.log("Processed rewards data:", rewardsData)
            setRewards(rewardsData)
          } else {
            console.error("Invalid data received from Etherscan:", data)
            throw new Error("Invalid data received from Etherscan")
          }
        } catch (error) {
          console.error("Error fetching reward history:", error)
          setError(`Failed to fetch reward history: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
        } finally {
          setIsLoading(false)
        }
      } else {
        setRewards([])
        setError(null)
        setIsLoading(false)
      }
    }

    fetchRewardHistory()
    const interval = setInterval(fetchRewardHistory, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [walletAddress])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getEtherscanLink = (transactionHash: string) => {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`
  }

  if (!walletAddress) {
    return null
  }

  return (
    <Card className="w-full bg-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Your MNG Reward History</CardTitle>
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
        ) : rewards.length > 0 ? (
          <ul className="space-y-2">
            {rewards.map((reward, index) => (
              <li key={index} className="bg-white/5 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">{reward.amount} MNG</span>
                  <span className="text-xs text-gray-400">{formatDate(reward.timestamp)}</span>
                </div>
                <div className="mt-1">
                  <a
                    href={getEtherscanLink(reward.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View on Etherscan
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-300">No MNG rewards found.</p>
        )}
      </CardContent>
    </Card>
  )
}

