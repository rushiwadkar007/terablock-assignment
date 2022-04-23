const Web3 = require('web3');
const paymentContractABI = require("../contractDetails/payment.json");
const ETx = require("ethereumjs-tx").Transaction;
const dotenv = require("dotenv");
const USER = require("../models/user");
dotenv.config();
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/0480f6f61a2c48d18ca1365c7de71013"));
const contractABI = paymentContractABI.abi;
const contractAddress = paymentContractABI.networks[3].address;
const contract = new web3.eth.Contract(contractABI, contractAddress);

const saveUser = async (req, res) => {
    try {
        const { userAddress } = req.body;

        const USERObject = new USER({ network: 'Ethereum', userAddress: userAddress, pendingGasFees: 0 });

        USERObject.save()
            .then((result) => {

                console.log("User details saved! ", result);

            })

            .catch((err) => {

                console.log(err);

            });

        res.status(200).send({
            success: true,
            status: "user saved!"
        })
    }
    catch (e) {
        res.status(500).send({
            success: false,
            status: "server error"
        })
    }
}

const transferTokens = async (req, res) => {

    try {

        const { tokenSender, tokenReceiver, tokenTransferAmount } = req.body;

        console.log(tokenSender, tokenReceiver, tokenTransferAmount);

        const userByAddress = await USER.findOne({ userAddress: tokenSender });

        let getAuthority = await contract.methods.getCompany().call();

        console.log('get authority ', getAuthority);

        let nonce = await web3.eth.getTransactionCount(tokenSender.toLowerCase(), 'pending');
        console.log(nonce);

        const NetworkId = await web3.eth.net.getId();
        console.log(NetworkId);

        const privateKey = process.env.privateKey;
        console.log('private key ', privateKey);

        const pvt = Buffer.from(privateKey, "hex");

        const transferFunction = await contract.methods.transferFrom(tokenSender, tokenReceiver, tokenTransferAmount).encodeABI();

        console.log(transferFunction);

        const rawTx = {
            from: tokenSender.toLowerCase(),
            to: tokenReceiver.toLowerCase(),
            data: transferFunction,
            nonce: nonce,
            value: "0x00000000000000",
            gas: web3.utils.toHex(1500000),
            gasPrice: web3.utils.toHex(30000000000 * 2),
            chainId: NetworkId,
        };

        let trans = new ETx(rawTx, { chain: "rinkeby", hardfork: "petersburg" });

        trans.sign(pvt);

        console.log(userByAddress);

        await web3.eth.sendSignedTransaction("0x" + trans.serialize().toString("hex"))
            .on("receipt", (data) => {
                const pendingGasFees = userByAddress.pendingGasFees + data.gasUsed;

                USER.updateOne(

                    { userAddress: tokenSender },

                    {

                        $set: {
                            pendingGasFees: pendingGasFees
                        },

                    }

                )
                    .then((result) => console.log("Gas Fees are updated...!", result))

                    .catch((err) => console.log(err));

                res.status(200).send({ success: true, transactionHash: data });

            })
            .on("error", async (data) => {

                res.status(404).send({ status: 'data not found', data: data });

            });

    }
    catch (e) {
        res.status(500).send({
            success: false,
            status: "server error"
        })
    }
}

const setGasPricePerUser = async (req, res) => {

    try {

        const { userAddress } = req.body;
        console.log(userAddress);

        const userByAddress = await USER.findOne({ userAddress: userAddress });
        console.log(userByAddress);

        if (!userByAddress) res.status(404).send({ success: false, status: 'User Not Found!' });

        const gasPrice = userByAddress.pendingGasFees;

        let getAuthority = await contract.methods.getCompany().call();

        let address = getAuthority.toString();
        const privateKey = process.env.privateKey;
        console.log(privateKey);
        let nonce = await web3.eth.getTransactionCount(address.toLowerCase(), 'pending');
        console.log(nonce);

        const pvt = Buffer.from(privateKey, "hex");

        const NetworkId = await web3.eth.net.getId();

        const transferFunction = await contract.methods.setGasPricePerUser(userByAddress.userAddress, gasPrice).encodeABI();
        console.log(transferFunction);

        const rawTx = {
            from: getAuthority.toLowerCase(),
            to: contractAddress.toLowerCase(),
            data: transferFunction,
            nonce: nonce,
            value: "0x00000000000000",
            gas: web3.utils.toHex(1500000),
            gasPrice: web3.utils.toHex(30000000000 * 2),
            chainId: NetworkId,
        };

        let trans = new ETx(rawTx, { chain: "rinkeby", hardfork: "petersburg" });

        trans.sign(pvt);

        await web3.eth.sendSignedTransaction("0x" + trans.serialize().toString("hex"))
            .on("receipt", async (data) => {

                USER.updateOne(

                    { userAddress: userAddress },

                    {

                        $set: {
                            pendingGasFees: 0
                        },

                    }

                )
                    .then((result) => console.log("Gas Fees are updated to zero after successful payment...!", result))

                    .catch((err) => console.log(err));

                res.status(200).send({ success: true, transactionHash: data });

            })
            .on("error", async (data) => {

                res.status(404).send({ status: 'data not found', data: data });

            });

    }
    catch (e) {
        res.status(500).send({
            success: false,
            status: "server error"
        })
    }

}

const returnGasFees = async (req, res) => {

    try {

        const { userAddress } = req.body;
        console.log(userAddress);

        const userByAddress = await USER.findOne({ userAddress: userAddress });
        console.log(userByAddress);

        if (!userByAddress) res.status(404).send({ success: false, status: 'User Not Found!' });

        const gasPrice = userByAddress.pendingGasFees;

        let getAuthority = await contract.methods.getCompany().call();

        let address = getAuthority.toString();
        const privateKey = process.env.privateKey;
        console.log(privateKey);

        const getGasPricePerUser = await contract.methods.getGasPricePerUser(userAddress).call();
        console.log('gas price of a user ', getGasPricePerUser);

        let nonce = await web3.eth.getTransactionCount(address.toLowerCase(), 'pending');
        console.log(nonce);

        const pvt = Buffer.from(privateKey, "hex");

        const NetworkId = await web3.eth.net.getId();

        const transferFunction = await contract.methods.setGasPricePerUser(userByAddress.userAddress, gasPrice).encodeABI();
        console.log(transferFunction);

        const rawTx = {
            from: getAuthority.toLowerCase(),
            to: userAddress.toLowerCase(),
            data: transferFunction,
            nonce: nonce,
            value: web3.utils.toBN(getGasPricePerUser),
            gas: web3.utils.toHex(1500000),
            gasPrice: web3.utils.toHex(30000000000 * 2),
            chainId: NetworkId,
        };

        let trans = new ETx(rawTx, { chain: "rinkeby", hardfork: "petersburg" });

        trans.sign(pvt);

        await web3.eth.sendSignedTransaction("0x" + trans.serialize().toString("hex"))
            .on("receipt", async (data) => {

                res.status(200).send({ success: true, status: 'Gas fees paid by a company', transactionHash: data });

            })
            .on("error", async (data) => {

                res.status(404).send({ status: 'data not found', data: data });

            });

    }
    catch (e) {
        res.status(500).send({
            success: false,
            status: "server error"
        })
    }

}

const balanceOfUser = async (req, res) => {
    try {
        const userAddress = req.query.userAddress;

        const totalTokens = await contract.methods.balanceOf(userAddress).call();

        console.log(totalTokens);
        if (totalTokens != null) {
            res.status(200).send({
                success: true,
                balance: totalTokens
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }

}

const getCompanyAddress = async (req, res) => {
    try {

        const getCompany = await contract.methods.getCompany().call();

        console.log('company address ', getCompany);

        if (getCompany != null) {
            res.status(200).send({
                success: true,
                Authority: getCompany
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }

}

const getTokenName = async (req, res) => {
    try {

        const getTokenName = await contract.methods.name().call();

        if (getTokenName != null) {
            res.status(200).send({
                success: true,
                tokenName: getTokenName
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }
}

const getTokensymbol = async (req, res) => {
    try {

        const getTokensymbol = await contract.methods.symbol().call();

        if (getTokensymbol != null) {
            res.status(200).send({
                success: true,
                symbol: getTokensymbol
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }

}

const getTokenSupply = async (req, res) => {
    try {

        const getTotalSupply = await contract.methods.totalSupply().call();

        if (getTotalSupply != null) {
            res.status(200).send({
                success: true,
                totalSupply: getTotalSupply
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }
}

const getGasPricePerUser = async (req, res) => {

    try {

        const { user } = req.query;

        const gasPrice = await contract.methods.getGasPricePerUser(user).call();

        if (getCompany != null) {
            res.status(200).send({
                success: true,
                gasPricePerUser: gasPrice
            })
        }

    }
    catch (error) {
        res.status(500).send({
            success: false,
            status: 'server error'
        })
    }
}

module.exports = { saveUser, transferTokens, balanceOfUser, getCompanyAddress, getTokenName, getTokensymbol, getTokenSupply, getGasPricePerUser, setGasPricePerUser, returnGasFees };