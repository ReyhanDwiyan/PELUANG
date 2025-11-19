const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');

mongoose.connect('mongodb+srv://Reyhandwynn:motor12345@webservice.yhl8jpr.mongodb.net/?appName=WebService')
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});