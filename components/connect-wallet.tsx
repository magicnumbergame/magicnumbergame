"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface ConnectWalletProps {
  onConnect: (address: string | null) => void
  onDisconnect: () => void
}

export function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setAccount(accounts[0].address)
          onConnect(accounts[0].address)
        } else {
          setAccount(null)
          onConnect(null)
        }
      } catch (error) {
        console.error("Error checking connection:", error)
        setAccount(null)
        onConnect(null)
      }
    } else {
      setError("MetaMask not detected! Please install MetaMask to use this app.")
    }
  }, [onConnect])

  useEffect(() => {
    checkConnection()

    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          onConnect(accounts[0])
        } else {
          disconnectWallet()
        }
      })

      window.ethereum.on("disconnect", () => {
        disconnectWallet()
      })
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("disconnect")
      }
    }
  }, [onConnect, checkConnection])

  const connectWallet = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof window.ethereum !== "undefined") {
        // Force MetaMask to show the account selection screen
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        })

        // After permissions are granted, request accounts
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

        if (accounts.length > 0) {
          setAccount(accounts[0])
          onConnect(accounts[0])
        } else {
          throw new Error("No accounts found")
        }
      } else {
        throw new Error("MetaMask not detected! Please install MetaMask to use this app.")
      }
    } catch (error) {
      console.error("Wallet connection error:", error)
      if (error instanceof Error) {
        setError(`Failed to connect wallet: ${error.message}`)
      } else {
        setError("An unknown error occurred while connecting the wallet")
      }
      disconnectWallet()
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    onConnect(null)
    onDisconnect()
    setError(null)

    // Clear any stored permissions
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
        .catch(console.error)
    }
  }, [onConnect, onDisconnect])

  return (
    <Card className="w-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Magic Number Game</CardTitle>
        <CardDescription className="text-purple-200">
          {account ? "Your wallet is connected!" : "Connect your wallet to start playing the Magic Number Game!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-500 text-white border-red-700">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!account ? (
          <Button
            onClick={connectWallet}
            className="w-full bg-white text-purple-700 hover:bg-purple-100"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-purple-800 bg-opacity-50">
              <p className="text-sm font-medium text-purple-200">Connected Account:</p>
              <p className="text-xs text-purple-100 break-all">{account}</p>
            </div>
            <Button onClick={disconnectWallet} className="w-full bg-white text-purple-700 hover:bg-purple-100">
              Disconnect dApp
            </Button>
          </div>
        )}
        {account && (
          <p className="text-xs text-purple-200 mt-2">
            Note: Disconnecting will only stop the dApp from accessing your wallet. To fully disconnect, please use
            MetaMask's interface.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

