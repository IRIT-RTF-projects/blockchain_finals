//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract CopyrightRegistry {
    struct FileRecord {
        address owner;
        uint256 registrationDate;
        string filename;
    }

    mapping(bytes32 => FileRecord) private fileRecords;
    mapping(address => bytes32[]) public ownedFiles;

    event FileRegistered(bytes32 indexed fileHash, address indexed owner, uint256 registrationDate, string filename);
    event OwnershipTransferred(bytes32 indexed fileHash, address indexed oldOwner, address indexed newOwner, uint256 transferDate);

    function registerFile(bytes32 fileHash, string calldata filename) external {
        require(bytes(filename).length > 0, "Filename required");
        require(fileRecords[fileHash].owner == address(0), "File already registered");
        uint256 currentDate = block.timestamp;
        fileRecords[fileHash] = FileRecord({
            owner: msg.sender,
            registrationDate: currentDate,
            filename: filename
        });
        ownedFiles[msg.sender].push(fileHash);
        emit FileRegistered(fileHash, msg.sender, currentDate, filename);
    }

    function getFileRecord(bytes32 fileHash) external view returns (address owner, uint256 registrationDate, string memory filename) {
        FileRecord memory record = fileRecords[fileHash];
        require(record.owner != address(0), "File not registered");
        return (record.owner, record.registrationDate, record.filename);
    }

    function transferOwnership(bytes32 fileHash, address newOwner) external {
        require(newOwner != address(0), "Invalid new owner");
        FileRecord storage record = fileRecords[fileHash];
        require(record.owner == msg.sender, "Only owner can transfer");
        address oldOwner = record.owner;
        record.owner = newOwner;
        uint256 transferDate = block.timestamp;

        bytes32[] storage oldList = ownedFiles[oldOwner];
        for (uint256 i = 0; i < oldList.length; i++) {
            if (oldList[i] == fileHash) {
                oldList[i] = oldList[oldList.length - 1];
                oldList.pop();
                break;
            }
        }

        ownedFiles[newOwner].push(fileHash);

        emit OwnershipTransferred(fileHash, oldOwner, newOwner, transferDate);
    }

    function getOwnedFiles(address _owner) external view returns (bytes32[] memory) {
        return ownedFiles[_owner];
    }
}