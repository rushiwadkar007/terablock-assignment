const express = require("express");

const app = express();

const dotenv = require('dotenv');

dotenv.config();

const mongoose = require("mongoose");

const userRoute = require('./routes/user');

const { MongoClient, ServerApiVersion } = require('mongodb');

var bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('error', err => {
    console.log('Connection failed.');
});

mongoose.connection.on('connected', connected => {
    console.log('Connection successful.');
});

app.use("/user", userRoute);

app.listen(5050, () => { console.log("backend server is running on 5050..."); })