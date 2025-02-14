import { Book, Github, Twitter, MessageSquare } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-6 bg-white/5 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="https://magic-number-game.gitbook.io/magic-number-game-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <Book className="h-5 w-5" />
            <span>Documentation</span>
          </Link>
          <Link
            href="https://github.com/magicnumbergame/magicnumbergame"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
          </Link>
          <Link
            href="https://x.com/guessMNG"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <Twitter className="h-5 w-5" />
            <span>Twitter</span>
          </Link>
          <Link
            href="https://discord.gg/WQZpYsmCAA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Discord</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}

