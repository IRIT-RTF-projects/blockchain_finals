import { useState } from "react";
import { Button, Card, Input, List, Typography, message } from "antd";
import { keccak256 } from "viem";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { Title, Text } = Typography;

const MyFileItem = ({ hash }: { hash: `0x${string}` }) => {
  const { data: record, isLoading } = useScaffoldReadContract({
    contractName: "CopyrightRegistry",
    functionName: "getFileRecord",
    args: [hash],
    query: {
      enabled: true,
      retry: false,
    },
  });

  if (isLoading)
    return (
      <List.Item>
        <Text type="secondary">Loading...</Text>
      </List.Item>
    );
  if (!record) return null;

  const [, date, fileName] = record;

  return (
    <List.Item>
      <div>
        <Text strong>{fileName}</Text>
        <br />
        <Text code copyable>
          {hash}
        </Text>
        <br />
        <Text type="secondary">Зарегистрировано: {new Date(Number(date) * 1000).toLocaleString()}</Text>
      </div>
    </List.Item>
  );
};

export const CopyrightRegistryUI = () => {
  const { address } = useAccount();
  const [fileHash, setFileHash] = useState<`0x${string}` | undefined>(undefined);
  const [filename, setFilename] = useState("");
  const [searchHash, setSearchHash] = useState<`0x${string}` | undefined>(undefined);
  const [transferHash, setTransferHash] = useState<`0x${string}` | undefined>(undefined);
  const [transferTo, setTransferTo] = useState<Address | undefined>(undefined);
  const [historyHash, setHistoryHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract: registerFile } = useScaffoldWriteContract("CopyrightRegistry");
  const { writeContract: transferOwnership } = useScaffoldWriteContract("CopyrightRegistry");

  const { data: fileRecord } = useScaffoldReadContract({
    contractName: "CopyrightRegistry",
    functionName: "getFileRecord",
    args: searchHash ? [searchHash] : [undefined],
    query: {
      enabled: !!searchHash,
      retry: false,
    },
  });

  const { data: myFileHashes = [], refetch: refetchMyFiles } = useScaffoldReadContract({
    contractName: "CopyrightRegistry",
    functionName: "getOwnedFiles",
    args: address ? [address] : [undefined],
    query: {
      enabled: !!address,
      retry: false,
    },
  });

  const { data: registeredEvents = [] } = useScaffoldEventHistory({
    contractName: "CopyrightRegistry",
    eventName: "FileRegistered",
    fromBlock: 0n,
  });

  const { data: transferEvents = [] } = useScaffoldEventHistory({
    contractName: "CopyrightRegistry",
    eventName: "OwnershipTransferred",
    fromBlock: 0n,
  });

  const fileHistory = [...registeredEvents, ...transferEvents]
    .filter(event => event.args.fileHash === historyHash)
    .sort((a, b) => Number(a.blockNumber - b.blockNumber));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const buffer = await file.arrayBuffer();
    const hash = keccak256(new Uint8Array(buffer));
    setFileHash(hash);
  };

  return (
    <Card title={<Title level={3}>Copyright Registry</Title>} style={{ maxWidth: 900, margin: "2rem auto" }}>
      <Title level={4}>Register New File</Title>
      <input type="file" onChange={handleFile} style={{ marginBottom: 8 }} />
      <Input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename" />
      <Text code copyable>
        {fileHash || "—"}
      </Text>
      <br />
      <Button
        type="primary"
        size="large"
        disabled={!fileHash || !filename}
        onClick={() => {
          if (!fileHash) return;
          registerFile({
            functionName: "registerFile",
            args: [fileHash, filename],
          });
          message.success("Регистрация отправлена!");
        }}
        style={{ marginTop: 8 }}
      >
        Register File
      </Button>

      <br />
      <br />

      <Title level={4}>Search by Hash</Title>
      <Input
        placeholder="0x..."
        value={searchHash || ""}
        onChange={e => setSearchHash(e.target.value as `0x${string}` | undefined)}
      />
      {fileRecord && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Filename:</Text> {fileRecord[2]}
          <br />
          <Text strong>Owner:</Text> {fileRecord[0]}
          <br />
          <Text strong>Date:</Text> {new Date(Number(fileRecord[1]) * 1000).toLocaleString()}
        </div>
      )}

      <br />

      <Title level={4}>Transfer Ownership</Title>
      <Input
        placeholder="File hash"
        value={transferHash || ""}
        onChange={e => setTransferHash(e.target.value as `0x${string}` | undefined)}
        style={{ marginBottom: 8 }}
      />
      <Input
        placeholder="New owner address"
        value={transferTo || ""}
        onChange={e => setTransferTo(e.target.value as Address | undefined)}
      />
      <Button
        type="primary"
        onClick={() => {
          if (!transferHash || !transferTo) return;
          transferOwnership({
            functionName: "transferOwnership",
            args: [transferHash, transferTo],
          });
          message.success("Передача прав отправлена!");
        }}
        disabled={!transferHash || !transferTo}
      >
        Transfer
      </Button>

      <br />
      <br />
      <Title level={4}>My Files ({myFileHashes.length})</Title>
      <Button onClick={() => refetchMyFiles()}>Refresh My Files</Button>
      <List
        dataSource={[...myFileHashes]}
        renderItem={(hash: `0x${string}`) => <MyFileItem hash={hash} key={hash} />}
      />

      <br />

      <Title level={4}>File History</Title>
      <Input
        placeholder="0x..."
        value={historyHash || ""}
        onChange={e => setHistoryHash(e.target.value as `0x${string}` | undefined)}
      />
      <List
        dataSource={fileHistory}
        renderItem={event => (
          <List.Item>
            {event.eventName === "FileRegistered" ? (
              <>
                Registered &#34;{event.args.filename}&#34; by {event.args.owner} at{" "}
                {new Date(Number(event.args.registrationDate) * 1000).toLocaleString()}
              </>
            ) : (
              <>
                Transferred from {event.args.oldOwner} to {event.args.newOwner} at{" "}
                {new Date(Number(event.args.transferDate) * 1000).toLocaleString()}
              </>
            )}
          </List.Item>
        )}
      />
    </Card>
  );
};
