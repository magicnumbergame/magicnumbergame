"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export function GameRules() {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <Card className="w-full bg-white/10 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">🔥 Magic Number Game Rules</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white hover:text-white/80"
        >
          {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {!isMinimized && (
          <div className="space-y-4 text-sm">
            <div>
              <p>🔹 Guess a Magic Number between 1 and 10,000.</p>
              <p>🔹 Provably Fair using Chainlink VRF for verifiable randomness.</p>
              <p>🔹 Entry Fee: 0.025 ETH is required to submit a guess.</p>
              <p>🔹 The Game Ends when 3 players have submitted their guesses.</p>
              <p>🔹 Closest Guess Wins: The player(s) with the closest guess wins the pot.</p>
              <p>🔹 Fair Distribution: If multiple players have the same closest guess, the pot is split equally.</p>
              <p>🔹 Developer Fee: A 1.5% fee is taken from the pot to support game development.</p>
            </div>
            <div>
              <p className="font-semibold">💰 MNG Token Rewards</p>
              <p>🔹 Earn 50 MNG per game just for participating.</p>
              <p>🔹 Winners Receive an Extra 500 MNG alongside their ETH winnings.</p>
              <p>🔹 MNG Rewards Halve Every 3,500 Games to ensure long-term sustainability.</p>
              <p>
                🔹 MNG is Fully On-Chain & Cannot Be Refilled—once the supply runs out, no more MNG rewards are
                distributed.
              </p>
            </div>
            <p className="font-semibold">🚀 Think you can guess the magic number? Join now!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

