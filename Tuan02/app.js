require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public'));

const productRoutes = require('./routes/productRoutes');
app.use('/', productRoutes);


app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});
