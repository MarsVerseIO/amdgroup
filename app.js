const express = require("express");
const app = express();

app.use(express.json());

app.use('/', express.static('public'));

app.listen(3000, function(){
  console.log("The server is waiting for connection...");
});