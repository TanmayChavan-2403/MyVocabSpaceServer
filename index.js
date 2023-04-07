const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const dataRouter = require('./routers/data');
const accountRouter = require('./routers/account');
dotenv.config();

mongoose.set('strictQuery', true);
mongoose.pluralize(null);

const app = express();
app.use(express.json());
app.use(cors({credentials: true, origin: ["http://localhost:3000"]}));
app.use(cookieParser());

app.use(dataRouter);
app.use(accountRouter);

// Mongo DB connection [ MAIN ACC ]
const URL = `mongodb+srv://HTech:${process.env.MONGOPASS}@myvocabspace.a9z5g6s.mongodb.net/UserData?retryWrites=true&w=majority`
mongoose.connect(URL)
.then(resp => console.log('Mongodb connection successfully!'))
.catch(err => console.log('ERROR', err))

// Mongo DB connection [ Test account ]
// const URL = `mongodb+srv://hackytech:mydocuments@cluster0.sl8ip.mongodb.net/userData?retryWrites=true&w=majority`
// mongoose.connect(URL)
// .then(resp => console.log('Mongodb connection successfully!'))
// .catch(err => console.log('ERROR', err))

app.get('/', (req, res) => {
    res.json('Server is up and running...😄')
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})