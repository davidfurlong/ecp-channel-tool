"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-black max-w-screen-lg mx-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2 mr-4">
              <span className="text-xl font-bold text-white">
                ECP channel tool
              </span>
            </Link>
            <Link
              href="https://docs.ethcomments.xyz/channels"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="text-white !hover:bg-white/10 !hover:text-white"
              >
                Docs
              </Button>
            </Link>
            <Link
              href="https://github.com/ecp-eth/awesome-ecp-hooks"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="text-white !hover:bg-white/10 !hover:text-white"
              >
                Hooks
              </Button>
            </Link>
            <Link
              href="https://github.com/davidfurlong/ecp-channel-tool"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="text-white !hover:bg-white/10 !hover:text-white"
              >
                GitHub
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant={pathname === "/" ? "default" : "ghost"}
                className={`transition-colors ${
                  pathname === "/"
                    ? "bg-white text-black hover:bg-gray-200"
                    : "text-white !hover:bg-white/10 !hover:text-white"
                }`}
              >
                All channels
              </Button>
            </Link>

            <Link href="/create-channel">
              <Button
                variant={pathname === "/create-channel" ? "default" : "ghost"}
                className={`transition-colors ${
                  pathname === "/create-channel"
                    ? "bg-white text-black hover:bg-gray-200"
                    : "text-white !hover:bg-white/10 !hover:text-white"
                }`}
              >
                Create
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
