"use client"

import { useState, useCallback } from "react"
import { ConnectWallet } from "@/components/connect-wallet"
import { GameRules } from "@/components/GameRules"
import { GameInfo } from "@/components/GameInfo"
import { UserGameStatus } from "@/components/UserGameStatus"
import { PreviousWinners } from "@/components/PreviousWinners"
import { Footer } from "@/components/footer"

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const handleConnect = useCallback((address: string | null) => {
    setWalletAddress(address)
  }, [])

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null)
  }, [])

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-between p-4 overflow-hidden">
      <div className="animated-bg"></div>
      <div className="w-full max-w-7xl space-y-8 relative z-10 flex-1">
        <h1 className="text-5xl font-bold text-center font-display magic-text animate-strobe">Magic Number Game</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <ConnectWallet onConnect={handleConnect} onDisconnect={handleDisconnect} />
            {walletAddress && <UserGameStatus walletAddress={walletAddress} />}
            <GameRules />
            {walletAddress && <GameInfo walletAddress={walletAddress} />}
            <PreviousWinners />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

