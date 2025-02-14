"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getContract } from "@/utils/contract"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UserGameStatusProps {
  walletAddress: string | null
}

export function UserGameStatus({ walletAddress }: UserGameStatusProps) {
  const [userStatus, setUserStatus] = useState({
    isInGame: false,
    guessedNumber: null as number | null,
  })
  const [error, setError] = useState<string | null>(null)
  const [guess, setGuess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gameInfo, setGameInfo] = useState({
    isActive: false,
    vrfRequested: false,
    currentPlayers: 0,
    maxPlayers: 3,
    entryFee: ethers.parseEther("0"),
  })

  useEffect(() => {
    const fetchUserStatusAndGameInfo = async () => {
      if (typeof window.ethereum !== "undefined" && walletAddress) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const contract = await getContract(signer)

          // Fetch game info
          const [isActive, vrfRequested, maxPlayers, entryFee] = await Promise.all([
            contract.gameActive(),
            contract.vrfRequested(),
            contract.MAX_PLAYERS(),
            contract.ENTRY_FEE(),
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

          setGameInfo({
            isActive,
            vrfRequested,
            currentPlayers,
            maxPlayers: Number(maxPlayers),
            entryFee,
          })

          // Fetch user status
          const isInGame = await contract.hasGuessed(walletAddress)
          let guessedNumber = null

          if (isInGame) {
            for (let i = 0; i < currentPlayers; i++) {
              const player = await contract.players(i)
              if (player.playerAddress.toLowerCase() === walletAddress.toLowerCase()) {
                guessedNumber = Number(player.guess)
                break
              }
            }
          }

          setUserStatus({ isInGame, guessedNumber })
          setError(null)
        } catch (error) {
          console.error("Error fetching user status and game info:", error)
          setError("Failed to fetch latest game information. Please check your connection and try again.")
        }
      } else {
        setUserStatus({ isInGame: false, guessedNumber: null })
        setGameInfo({
          isActive: false,
          vrfRequested: false,
          currentPlayers: 0,
          maxPlayers: 3,
          entryFee: ethers.parseEther("0"),
        })
        setError(null)
      }
    }

    fetchUserStatusAndGameInfo()
    const interval = setInterval(fetchUserStatusAndGameInfo, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [walletAddress])

  const handleSubmitGuess = async () => {
    if (!guess) {
      setError("Please enter a guess")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const guessNumber = Number.parseInt(guess)
      if (isNaN(guessNumber) || guessNumber < 1 || guessNumber > 10000) {
        throw new Error("Invalid guess. Please enter a number between 1 and 10000.")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = await getContract(signer)

      // Get the entry fee
      const entryFee = await contract.ENTRY_FEE()

      // Add this check before the gas estimation
      if (!gameInfo.isActive) {
        throw new Error("The game is not active. Please wait for the next round.")
      }

      if (gameInfo.currentPlayers >= gameInfo.maxPlayers) {
        throw new Error("The game is full. Please wait for the next round.")
      }

      // Check user's balance
      const balance = await provider.getBalance(walletAddress!)
      if (balance < entryFee) {
        throw new Error(
          "Insufficient funds. Please make sure you have enough ETH to cover the entry fee and gas costs.",
        )
      }

      let gasLimit
      try {
        // Estimate gas for the transaction
        const gasEstimate = await contract.enterGuess.estimateGas(guessNumber, { value: entryFee })
        // Add a 20% buffer to the gas estimate
        gasLimit = Math.floor(Number(gasEstimate) * 1.2)
      } catch (estimateError: any) {
        console.warn("Gas estimation failed:", estimateError)
        // If gas estimation fails, use a higher fixed gas limit
        gasLimit = 500000 // Adjust this value based on your contract's typical gas usage
      }

      // Submit the guess
      const tx = await contract.enterGuess(guessNumber, {
        value: entryFee,
        gasLimit: gasLimit,
      })

      await tx.wait()

      // Refresh user status
      setUserStatus({ isInGame: true, guessedNumber: guessNumber })
      setGuess("")
    } catch (error: any) {
      console.error("Error submitting guess:", error)
      let errorMessage = "An unknown error occurred. Please try again."

      if (error.code === "CALL_EXCEPTION") {
        errorMessage = "The transaction was reverted by the contract. This could be because:"
        errorMessage += "\n- The game is not active"
        errorMessage += "\n- The game is full"
        errorMessage += "\n- You have already submitted a guess"
        errorMessage += "\n- The entry fee is incorrect"
        errorMessage += "\nPlease check the game status and try again."
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient funds. Please make sure you have enough ETH to cover the entry fee and gas costs."
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        errorMessage = "Unable to estimate gas. The transaction may fail."
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      if (error.reason) {
        errorMessage += `\nReason: ${error.reason}`
      }

      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!walletAddress) {
    return null
  }

  return (
    <Card className="w-full bg-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Your Game Status</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <p>
            Game Status:{" "}
            <span className="font-bold">
              {gameInfo.isActive ? "Active" : gameInfo.vrfRequested ? "Waiting for VRF" : "Inactive"}
            </span>
          </p>
          <p>
            Players:{" "}
            <span className="font-bold">
              {gameInfo.currentPlayers} / {gameInfo.maxPlayers}
            </span>
          </p>
          <p>
            Am I in this game? <span className="font-bold">{userStatus.isInGame ? "Yes" : "No"}</span>
          </p>
          {userStatus.isInGame && userStatus.guessedNumber !== null && (
            <p>
              Your guessed number: <span className="font-bold">{userStatus.guessedNumber}</span>
            </p>
          )}
          {userStatus.isInGame && userStatus.guessedNumber === null && (
            <p>You are in the game, but we couldn't retrieve your guess.</p>
          )}
          {!userStatus.isInGame && gameInfo.isActive && gameInfo.currentPlayers < gameInfo.maxPlayers && (
            <>
              <p>You haven't made a guess in the current game yet.</p>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter your guess (1-10000)"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  min="1"
                  max="10000"
                  className="bg-white/20 border-white/30 text-white placeholder-white/50"
                />
                <Button onClick={handleSubmitGuess} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Make Guess"}
                </Button>
              </div>
            </>
          )}
          {(!gameInfo.isActive || gameInfo.currentPlayers >= gameInfo.maxPlayers) && (
            <p>
              The game is {gameInfo.isActive ? "full" : gameInfo.vrfRequested ? "waiting for VRF" : "not active"}.
              Please wait for the next round.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

