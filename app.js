const db = require('./controllers/db');
const fs = require('fs');
var Sale = require('./models/sale');
const Tender = require('./models/tender');
const TransactionEntry = require('./models/transactionEntry');
const Layaway = require('./models/layaway');
const Email = require('./models/email');

// ---- STEPS ----
// 1. Check for running.json file.
//   a. If running.json is blank or doesn't exist, create it. EXIT.
//   b. Else move to step 2.
// 2. Check Tender table for new Tender
//   a. If new Tender(s) exist, move to step 3.
//   b. If no new Tender esists, EXIT.
// 3. Check tender type of each Tender.
//   a. If tender is a Sale over $2000, add to Sale Email Queue.
//   b. If tender is a New Layaway, add to New Layaway Email Queue.
//   c. If tender is a Payment, add to Payment Email Queue.
//   d. If tender is a GN Sale, add to GN Sale Email Queue.
//   e. If tender is a refund, add to Refund Queue.
// 4. Iterate through email queues and generate emails. Add each to Send Queue.
// 5. Iterate through send queue and send each email.
// 6. EXIT.

// let minutes = 0.5;
// let the_interval = minutes * 60 * 1000;
// setInterval(function() {
//   console.log('I am doing my 5 minutes check');
//   // do your stuff here
// }, the_interval);

let saleEmailQ = [];
let newLayawayEmailQ = [];
let paymentEmailQ = [];
let gnSaleEmailQ = [];
let refundEmailQ = [];

// 0. Check for dbconfig.json file.
if (fs.existsSync('./dbconfig.json')) {
  if (fs.readFileSync('./dbconfig.json', 'utf8') == '') {
    console.error('Database configuration file is corrupt.');
    process.exit(1);
  } else {
    start();
  }
} else {
  console.error('Database Configuration does not exist.');
  process.exit(1);
}

// 1. Check for running.json file.
if (fs.existsSync('./running.json')) {
  if (fs.readFileSync('./running.json', 'utf8') == '') {
    //TODO: populate running.js
  } else {
    start();
  }
} else {
  fs.writeFileSync('./running.json', '', 'utf-8');
  //TODO: Populate running.js
}

function start() {
  console.log('Tested');
}
