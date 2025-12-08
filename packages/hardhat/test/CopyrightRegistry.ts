import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

describe("CopyrightRegistry", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("CopyrightRegistry");
    const contract = await factory.deploy();
    return { contract, owner, addr1, addr2 };
  }

  it("Should register a file successfully", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("testfile"));
    const filename = "testfile.txt";

    const tx = await contract.registerFile(fileHash, filename);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt?.blockNumber ?? "");
    const expectedTimestamp = block?.timestamp;

    await expect(tx).to.emit(contract, "FileRegistered").withArgs(fileHash, owner.address, expectedTimestamp, filename);

    const [retrievedOwner, registrationDate, retrievedFilename] = await contract.getFileRecord(fileHash);
    expect(retrievedOwner).to.equal(owner.address);
    expect(registrationDate).to.be.gt(0);
    expect(retrievedFilename).to.equal(filename);

    const owned = await contract.getOwnedFiles(owner.address);
    expect(owned).to.deep.equal([fileHash]);
  });

  it("Should prevent registering the same file hash twice", async function () {
    const { contract, addr1 } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("testfile"));
    const filename = "testfile.txt";
    await contract.registerFile(fileHash, filename);
    await expect(contract.connect(addr1).registerFile(fileHash, "other.txt")).to.be.revertedWith(
      "File already registered",
    );
  });

  it("Should transfer ownership successfully", async function () {
    const { contract, owner, addr1 } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("testfile"));
    const filename = "testfile.txt";
    await contract.registerFile(fileHash, filename);

    const tx = await contract.transferOwnership(fileHash, addr1.address);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt?.blockNumber ?? "");
    const expectedTimestamp = block?.timestamp;

    await expect(tx)
      .to.emit(contract, "OwnershipTransferred")
      .withArgs(fileHash, owner.address, addr1.address, expectedTimestamp);

    const [newOwner] = await contract.getFileRecord(fileHash);
    expect(newOwner).to.equal(addr1.address);

    const oldOwned = await contract.getOwnedFiles(owner.address);
    expect(oldOwned).to.deep.equal([]);
    const newOwned = await contract.getOwnedFiles(addr1.address);
    expect(newOwned).to.deep.equal([fileHash]);
  });

  it("Should prevent non-owner from transferring", async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("testfile"));
    const filename = "testfile.txt";
    await contract.registerFile(fileHash, filename);
    await expect(contract.connect(addr1).transferOwnership(fileHash, addr2.address)).to.be.revertedWith(
      "Only owner can transfer",
    );
  });

  it("Should revert getFileRecord for unregistered file", async function () {
    const { contract } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("unregistered"));
    await expect(contract.getFileRecord(fileHash)).to.be.revertedWith("File not registered");
  });

  it("Should require filename on registration", async function () {
    const { contract } = await loadFixture(deployFixture);
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("testfile"));
    await expect(contract.registerFile(fileHash, "")).to.be.revertedWith("Filename required");
  });
});
