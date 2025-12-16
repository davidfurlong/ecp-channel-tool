"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChannelManagerABI } from "@ecp.eth/sdk/abis";
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!creationFee) {
        console.error("Failed to fetch creation fee");
        return;
      }

      await writeContract({
        address: "0xa1043eDBE1b0Ffe6C12a2b8ed5AfD7AcB2DEA396" as `0x${string}`,
        abi: ChannelManagerABI,
        functionName: "createChannel",
        args: [
          values.name,
          values.description,
          [],
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
                Don't worry about getting everything perfect!
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
                    Optional hook contract address for custom channel behavior.{" "}
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
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isConfirming || isLoadingFee}
            >
              {isConfirming
                ? "Creating..."
                : isLoadingFee
                ? "Loading fee..."
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
