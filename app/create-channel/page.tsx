"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useSimulateContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChannelManagerABI } from "@ecp.eth/sdk/abis";
import {
  stringToHex,
  pad,
  encodeAbiParameters,
  parseAbiParameters,
  isAddress,
  toHex,
  type Hex,
} from "viem";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface MetadataFormEntry {
  key: string;
  value: string;
  type: string;
}

interface ContractMetadataEntry {
  key: Hex;
  value: Hex;
}

type MetadataType =
  | "string"
  | "uint256"
  | "int256"
  | "address"
  | "bool"
  | "bytes"
  | "bytes32";

/**
 * Creates a metadata key with correct RIGHT-padding (matching Solidity bytes32 string conversion).
 * Format: "type keyName" padded on the right with zeros to 32 bytes.
 */
function createMetadataKey(keyString: string, valueType: MetadataType): Hex {
  const keyTypeString = `${valueType} ${keyString}`;

  // Check if the UTF-8 encoded key exceeds 32 bytes
  const keyBytes = new TextEncoder().encode(keyTypeString);
  if (keyBytes.length > 32) {
    throw new Error(
      `Metadata key "${keyTypeString}" exceeds maximum length of 32 bytes`
    );
  }

  // Convert to hex and pad from RIGHT to exactly 32 bytes (matching Solidity bytes32)
  const hexString = stringToHex(keyTypeString);
  return pad(hexString, { size: 32, dir: "right" });
}

/**
 * Creates a metadata entry for contract use with proper encoding.
 */
function createMetadataEntry(
  keyString: string,
  valueType: MetadataType,
  value: string
): ContractMetadataEntry {
  const key = createMetadataKey(keyString, valueType);
  let encodedValue: Hex;

  switch (valueType) {
    case "address":
      if (!isAddress(value)) {
        throw new Error(`Invalid address: ${value}`);
      }
      // ABI encode the address (padded to 32 bytes)
      encodedValue = encodeAbiParameters(parseAbiParameters("address"), [
        value as `0x${string}`,
      ]);
      break;
    case "bool":
      encodedValue = toHex(value.toLowerCase() === "true" ? 1 : 0, {
        size: 32,
      });
      break;
    case "uint256":
      encodedValue = toHex(BigInt(value), { size: 32 });
      break;
    case "int256":
      const intValue = BigInt(value);
      if (intValue < 0n) {
        // Two's complement for negative numbers
        encodedValue = toHex((1n << 256n) + intValue, { size: 32 });
      } else {
        encodedValue = toHex(intValue, { size: 32 });
      }
      break;
    case "bytes32":
      // Assume value is already hex, pad if needed
      encodedValue = pad(value as Hex, { size: 32 });
      break;
    case "bytes":
      // Assume value is already hex
      encodedValue = value as Hex;
      break;
    case "string":
    default:
      encodedValue = stringToHex(value);
      break;
  }

  return { key, value: encodedValue };
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Channel name must be at least 2 characters.",
  }),
  description: z.string().default(""),
  hookAddress: z.string().default("0x0000000000000000000000000000000000000000"),
});

export default function CreateChannelPage() {
  const { isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [metadata, setMetadata] = useState<MetadataFormEntry[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Fetch the channel creation fee
  const { data: creationFee, isLoading: isLoadingFee } = useReadContract({
    address: "0xa1043eDBE1b0Ffe6C12a2b8ed5AfD7AcB2DEA396" as `0x${string}`,
    abi: ChannelManagerABI,
    functionName: "getChannelCreationFee",
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      hookAddress: "0x0000000000000000000000000000000000000000",
    },
  });

  // Watch form values to update simulation
  const formValues = form.watch();

  // Prepare metadata for simulation
  const ecpMetadataForSim = metadata
    .filter((entry) => entry.key.trim() && entry.value.trim())
    .map((entry) => {
      const keyName = entry.key.trim();
      const valueType = entry.type as MetadataType;
      const value = entry.value.trim();

      return createMetadataEntry(keyName, valueType, value);
    }) as readonly { key: `0x${string}`; value: `0x${string}` }[];

  // Simulate the transaction to catch errors early
  const { error: simError } = useSimulateContract({
    address: "0xa1043eDBE1b0Ffe6C12a2b8ed5AfD7AcB2DEA396" as `0x${string}`,
    abi: ChannelManagerABI,
    functionName: "createChannel",
    args: [
      formValues.name || "",
      formValues.description || "",
      ecpMetadataForSim,
      (formValues.hookAddress ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    value: creationFee,
    query: {
      enabled:
        !!creationFee &&
        !!formValues.name &&
        formValues.name.length >= 2 &&
        isConnected,
    },
  });

  // Update simulation error state
  useEffect(() => {
    if (simError) {
      console.error("Simulation error:", simError);
      let errorMessage = "Transaction simulation failed";

      if (simError instanceof Error) {
        errorMessage = simError.message;

        // Extract error signature if present
        const errorDataMatch = simError.message.match(/0x[a-fA-F0-9]{8}/);
        if (errorDataMatch) {
          const errorSignature = errorDataMatch[0];
          errorMessage += `\n\nError signature: ${errorSignature}`;
          errorMessage += `\nLook up error: https://openchain.xyz/signatures?query=${errorSignature}`;
        }
      }

      setSimulationError(errorMessage);
    } else {
      setSimulationError(null);
    }
  }, [simError, formValues]);

  // Helper function to check if a key is duplicate
  const isDuplicateKey = (key: string, currentIndex: number) => {
    if (!key.trim()) return false;
    return metadata.some(
      (entry, index) =>
        index !== currentIndex && entry.key.trim() === key.trim()
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!creationFee) {
        console.error("Failed to fetch creation fee");
        return;
      }

      // Convert metadata to ECP format
      const ecpMetadata = metadata
        .filter((entry) => entry.key.trim() && entry.value.trim())
        .map((entry) => {
          const keyName = entry.key.trim();
          const valueType = entry.type as MetadataType;
          const value = entry.value.trim();

          return createMetadataEntry(keyName, valueType, value);
        }) as readonly { key: `0x${string}`; value: `0x${string}` }[];

      // Log the metadata for debugging
      console.log("Creating channel with:", {
        name: values.name,
        description: values.description,
        metadata: ecpMetadata,
        hookAddress: values.hookAddress,
        fee: creationFee?.toString(),
      });
      console.log(
        "Metadata entries:",
        ecpMetadata.map((m) => ({
          key: m.key,
          value: m.value,
          keyHex: m.key,
          valueHex: m.value,
        }))
      );

      await writeContract({
        address: "0xa1043eDBE1b0Ffe6C12a2b8ed5AfD7AcB2DEA396" as `0x${string}`,
        abi: ChannelManagerABI,
        functionName: "createChannel",
        args: [
          values.name,
          values.description,
          ecpMetadata,
          values.hookAddress as `0x${string}`,
        ],
        value: creationFee,
      });
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a channel
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Convert fee from wei to ETH for display
  const feeInEth = creationFee ? Number(creationFee) / 1e18 : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create Channel</h1>
          <p className="text-gray-600">
            Create a new channel on the Ethereum Comments Protocol
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              💡{" "}
              <span className="font-medium">
                Don&apos;t worry about getting everything perfect!
              </span>{" "}
              All fields can be edited later after your channel is created.
            </p>
          </div>
          {!isLoadingFee && creationFee && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Channel creation fee (to deter spam):{" "}
                <span className="font-semibold">{feeInEth.toFixed(6)} ETH</span>
              </p>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter channel name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be the display name for your channel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter channel description" {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe what your channel is about.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Options Collapsible */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">Advanced Options</span>
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isAdvancedOpen && (
                <div className="p-4 space-y-6 border-t">
                  {/* Hook Address */}
                  <FormField
                    control={form.control}
                    name="hookAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hook Address (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x0000000000000000000000000000000000000000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional hook contract address for custom channel
                          behavior.{" "}
                          <a
                            href="https://docs.ethcomments.xyz/hooks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Learn more about hooks
                          </a>{" "}
                          <a
                            href="https://github.com/ecp-eth/awesome-ecp-hooks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Discover hooks
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Metadata Section */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Metadata</FormLabel>
                      <FormDescription className="mt-1">
                        Add key-value pairs with Solidity types. Check your
                        hook&apos;s documentation for required metadata fields.
                        Keys must be unique.
                      </FormDescription>
                    </div>
                    <div className="space-y-3">
                      {metadata.map((entry, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="Key (e.g., nftAddress)"
                              value={entry.key}
                              onChange={(e) => {
                                const newMetadata = [...metadata];
                                newMetadata[index].key = e.target.value;
                                setMetadata(newMetadata);
                              }}
                              className={
                                isDuplicateKey(entry.key, index)
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {isDuplicateKey(entry.key, index) && (
                              <p className="text-xs text-red-500 mt-1">
                                Duplicate key
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="Value"
                              value={entry.value}
                              onChange={(e) => {
                                const newMetadata = [...metadata];
                                newMetadata[index].value = e.target.value;
                                setMetadata(newMetadata);
                              }}
                            />
                          </div>
                          <div className="w-32">
                            <select
                              value={entry.type}
                              onChange={(e) => {
                                const newMetadata = [...metadata];
                                newMetadata[index].type = e.target.value;
                                setMetadata(newMetadata);
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="string">string</option>
                              <option value="uint256">uint256</option>
                              <option value="int256">int256</option>
                              <option value="address">address</option>
                              <option value="bool">bool</option>
                              <option value="bytes">bytes</option>
                              <option value="bytes32">bytes32</option>
                            </select>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newMetadata = metadata.filter(
                                (_, i) => i !== index
                              );
                              setMetadata(newMetadata);
                            }}
                            className="mt-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMetadata([
                            ...metadata,
                            { key: "", value: "", type: "string" },
                          ]);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Metadata Entry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Error Display */}
            {simulationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Transaction Simulation Failed
                </p>
                <div className="text-sm text-red-700 whitespace-pre-line">
                  {simulationError.split("\n\n").map((part, idx) => {
                    if (part.startsWith("Debug: http")) {
                      return (
                        <a
                          key={idx}
                          href={part.replace("Debug: ", "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline block mt-2"
                        >
                          🔍 Simulate on Tenderly
                        </a>
                      );
                    }
                    return <p key={idx}>{part}</p>;
                  })}
                </div>
                <p className="text-xs text-red-600 mt-2">
                  Check the browser console for more details.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isConfirming || isLoadingFee || !!simulationError}
            >
              {isConfirming
                ? "Creating..."
                : isLoadingFee
                ? "Loading fee..."
                : simulationError
                ? "Fix errors to continue"
                : "Create Channel"}
            </Button>
          </form>
        </Form>

        {isConfirmed && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">Channel created successfully!</p>
            <p className="text-sm text-green-600 mt-1">
              Transaction hash: {hash}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}
