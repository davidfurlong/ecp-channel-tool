"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Hash, User, Calendar, Copy, Check } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  description: string;
  owner: string;
  hook: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  metadata: Array<{
    key: string;
    value: string;
  }>;
  chainId: number;
}

interface ChannelsResponse {
  results: Channel[];
  pagination: {
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

export default function ChannelsList() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels(cursorParam?: string) {
    try {
      setIsLoading(true);

      // Build query parameters based on the OpenAPI spec
      const params = new URLSearchParams({
        chainId: "8453", // Base chain ID
        limit: "50",
        sort: "desc",
      });

      if (cursorParam) {
        params.append("cursor", cursorParam);
      }

      const response = await fetch(
        `https://api.ethcomments.xyz/api/channels?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`);
      }

      const data: ChannelsResponse = await response.json();

      if (cursorParam) {
        // Append to existing channels for pagination
        setChannels((prev) => [...prev, ...data.results]);
      } else {
        // Replace channels for initial load
        setChannels(data.results);
      }

      setHasNext(data.pagination.hasNext);
      setCursor(data.pagination.endCursor);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError("Failed to fetch channels");
    } finally {
      setIsLoading(false);
    }
  }

  const loadMore = () => {
    if (cursor && hasNext) {
      fetchChannels(cursor);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const abbreviateId = (id: string) => {
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  if (isLoading && channels.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchChannels()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No channels found</p>
          <p className="text-sm text-gray-500">
            Be the first to create a channel!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Owner
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Hook
              </th>
              <th className="text-left py-3 px-4 font-semibold text-sm">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr
                key={channel.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-sm" title={channel.name}>
                        {truncateText(channel.name, 30)}
                      </div>
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs"
                        title={channel.description}
                      >
                        {truncateText(channel.description, 40)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyToClipboard(channel.id, channel.id)}
                      className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      title="Click to copy full ID"
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer"
                      >
                        #{abbreviateId(channel.id)}
                      </Badge>
                      {copiedId === channel.id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <a
                      href={`https://basescan.org/address/${channel.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {channel.owner.slice(0, 6)}...{channel.owner.slice(-4)}
                    </a>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {channel.hook &&
                  channel.hook !==
                    "0x0000000000000000000000000000000000000000" ? (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <a
                        href={`https://basescan.org/address/${channel.hook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {channel.hook.slice(0, 6)}...{channel.hook.slice(-4)}
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No hook</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  {channel.createdAt ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-xs">
                        {new Date(channel.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unknown</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {channels.map((channel) => (
          <Card key={channel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Channel ID and Copy Button */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => copyToClipboard(channel.id, channel.id)}
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  title="Click to copy full ID"
                >
                  <Badge variant="secondary" className="text-xs">
                    #{abbreviateId(channel.id)}
                  </Badge>
                  {copiedId === channel.id ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Channel Name and Description */}
              <div className="mb-3">
                <h3 className="font-medium text-sm mb-1" title={channel.name}>
                  {truncateText(channel.name, 40)}
                </h3>
                <p
                  className="text-xs text-gray-500 dark:text-gray-400"
                  title={channel.description}
                >
                  {truncateText(channel.description, 60)}
                </p>
              </div>

              {/* Channel Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Owner */}
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Owner:
                  </span>
                  <a
                    href={`https://basescan.org/address/${channel.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {channel.owner.slice(0, 6)}...{channel.owner.slice(-4)}
                  </a>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Created:
                  </span>
                  <span>
                    {channel.createdAt
                      ? new Date(channel.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>

                {/* Hook */}
                <div className="col-span-2 flex items-center gap-2">
                  <Hash className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Hook:
                  </span>
                  {channel.hook &&
                  channel.hook !==
                    "0x0000000000000000000000000000000000000000" ? (
                    <a
                      href={`https://basescan.org/address/${channel.hook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                    >
                      {channel.hook.slice(0, 6)}...{channel.hook.slice(-4)}
                    </a>
                  ) : (
                    <span className="text-gray-400">No hook</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} disabled={isLoading} variant="outline">
            {isLoading ? "Loading..." : "Load More Channels"}
          </Button>
        </div>
      )}
    </div>
  );
}
