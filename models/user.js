const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema({
    network: { type: String, required: true },
    userAddress: { type: String, required: true },
    pendingGasFees: { type: Number, required: true }
})

module.exports = mongoose.model("userSchema", userSchema);