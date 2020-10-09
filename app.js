const express = require('express');
const app = new express();
const http = require('http');
const server = http.createServer(app);
require('dotenv').config();

const path = require('path');
const port = process.env.PORT || 5000;
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({ secret: '$ekreT', saveUninitialized: false, resave: false, cookie: { maxAge: 86400 }}));
app.use(morgan('dev'));

let corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET,POST,PUT,DELETE'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors());
//cors
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'OPTIONS, GET, POST, PUT, PATCH, DELETE'
//   );
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

//все роуты происходят с главной страницы, так как приложение на Vue (Spa)
const freelanceRoutes = require('./routes/freelance')(router);
app.use('/', freelanceRoutes);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/', (req, res) => {
  res.status(200).sendFile('index.html', { root: path.join(__dirname, 'dist') });
});

function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack,
  });
}

app.use(notFound);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`API started on localhost: ${port}`);
});
