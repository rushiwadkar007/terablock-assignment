const router = require("express").Router();

const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: true });

const { saveUser, transferTokens, balanceOfUser, getCompanyAddress, getTokenName, getTokensymbol, getTokenSupply, getGasPricePerUser, setGasPricePerUser, returnGasFees } = require('../controllers/userController');

router.post("/saveUser", urlencodedParser, saveUser);

router.post("/transferTokens", urlencodedParser, transferTokens);

router.get("/balanceOf", balanceOfUser);

router.get("/getTokenName", getTokenName);

router.get("/getTokensymbol", getTokensymbol);

router.get("/getTokenSupply", getTokenSupply);

router.get("/getGasPricePerUser", getGasPricePerUser);

router.post("/setGasPricePerUser", urlencodedParser, setGasPricePerUser);

router.post("/returnGasFees", urlencodedParser, returnGasFees);

router.get("/getCompanyAddress", getCompanyAddress);

module.exports = router;