"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CopyrightRegistryUI } from "~~/components/CopyrightRegistry";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-5xl">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Copyright Registry</span>
            <span className="block text-xl mt-2 text-gray-600">Регистрация авторских прав на файлы через блокчейн</span>
          </h1>

          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-8">
            <p className="my-2 font-medium">Подключённый адрес:</p>
            <Address
              address={connectedAddress}
              chain={targetNetwork}
              blockExplorerAddressLink={isLocalNetwork ? `/blockexplorer/address/${connectedAddress}` : undefined}
            />
          </div>

          <CopyrightRegistryUI />
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-10 w-10 fill-secondary" />
              <p className="mt-4">
                Отладка смарт-контрактов —{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-10 w-10 fill-secondary" />
              <p className="mt-4">
                Локальный обозреватель —{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
