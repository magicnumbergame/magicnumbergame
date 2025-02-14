"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ExternalLink } from "lucide-react"
import { CONTRACT_ADDRESS } from "@/utils/contract"

interface Winner {
  address: string
  winningNumber: number
  ethReward: string
  mngReward: string
  timestamp: number
  transactionHash: string
}

export function PreviousWinners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPreviousWinners = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Fetching previous winners...")
        const apiKey = "4F7WKF24MX5DVE6QRGCYKXAFQIRQ7CIJGE"
        const network = "sepolia"
        const eventSignature = ethers.id("WinnerDeclared(address,uint256,uint256,uint256)")
        const url = `https://api-${network}.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${CONTRACT_ADDRESS}&topic0=${eventSignature}&apikey=${apiKey}`

        console.log("Fetching from URL:", url)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("Received data:", JSON.stringify(data, null, 2))

        if (data.status !== "1" || !Array.isArray(data.result)) {
          console.warn(`Invalid data received from Etherscan: ${JSON.stringify(data)}`)
          setWinners([])
          return
        }

        const winnersData = data.result
          .map((log: any) => {
            if (!log.data || !log.topics || log.topics.length < 2) {
              console.warn("Invalid log data:", log)
              return null
            }
            try {
              const [winner] = ethers.AbiCoder.defaultAbiCoder().decode(["address"], log.topics[1])
              const [winningNumber, ethReward, mngReward] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "uint256", "uint256"],
                log.data,
              )

              return {
                address: winner,
                winningNumber: Number(winningNumber),
                ethReward: ethers.formatEther(ethReward),
                mngReward: ethers.formatEther(mngReward),
                timestamp: Number.parseInt(log.timeStamp, 16),
                transactionHash: log.transactionHash,
              }
            } catch (decodeError) {
              console.error("Error decoding log data:", decodeError, "Log:", log)
              return null
            }
          })
          .filter((winner): winner is Winner => winner !== null)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)

        console.log("Processed winners data:", winnersData)
        setWinners(winnersData)
      } catch (error) {
        console.error("Error fetching previous winners:", error)
        setError(`Failed to fetch previous winners: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreviousWinners()
    const interval = setInterval(fetchPreviousWinners, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getEtherscanLink = (transactionHash: string) => {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`
  }

  return (
    <Card className="w-full bg-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Previous Winners</CardTitle>
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
        ) : winners.length > 0 ? (
          <ul className="space-y-2">
            {winners.map((winner, index) => (
              <li key={index} className="bg-white/5 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{shortenAddress(winner.address)}</span>
                  <div className="text-sm">
                    <span className="text-green-300 mr-2">{winner.ethReward} ETH</span>
                    <span className="text-blue-300">{winner.mngReward} MNG</span>
                  </div>
                </div>
                <div className="text-sm text-gray-300">Winning Number: {winner.winningNumber}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{formatDate(winner.timestamp)}</span>
                  <a
                    href={getEtherscanLink(winner.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-xl font-semibold text-gray-300">No Winners Found</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to win in the Magic Number Game!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

