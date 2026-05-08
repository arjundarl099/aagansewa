const {getAllServices} = require('../Controllers/services');
const express = require('express');
const router = express.Router();

router
.route('/')
.get(getAllServices);

module.exports = router ; 