const fs = require("fs");
const email = require("./controllers/email");

const storeConfig = JSON.parse(fs.readFileSync("./storeConfig.json", "utf8"));

const db = require("./controllers/db");
let Sale = require("./models/sale");
const Tender = require("./models/tender");
const TransactionEntry = require("./models/transactionEntry");
const Layaway = require("./models/layaway");
const Email = require("./models/email");
const File = require("./controllers/file");
const Tenders = require("./controllers/tenders");

let date = new Date();

// ---- STEPS ----
// 1. Check for dbconfig.json file.
//   a. If running.json is blank or doesn't exist, console.log warning. EXIT.
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
//   test();
//   date = Date.now();
// }, the_interval);

let saleEmailQueue = [];
let newLayawayEmailQueue = [];
let paymentEmailQueue = [];
let refundPaymentQueue = [];
let gnSaleEmailQueue = [];
let refundEmailQueue = [];

// 1. Check for lastCheckTender entry in AWS DB.
// pre();
startCheckTenders();

async function startCheckTenders() {
  // 2. Check Tender table for new Tender
  let newTenders = [];
  for (let i = 0; i < storeConfig.length; i++) {
    let newTender = await checkNewTenders(storeConfig[i].storeID);
    if (!(Object.keys(newTender).length === 0)) {
      newTender.forEach(tender => {
        newTenders.push(tender);
      });
    }
    await db.updateLatestTender(
      storeConfig[i].storeID,
      await db.getLatestTender(storeConfig[i].storeID, 0)
    );
  }

  for (let i = 0; i < newTenders.length; i++) {
    newTenders[i] = await db.getTenderEntry(
      newTenders[i].ID,
      newTenders[i].storeID
    );
  }

  // console.log(newTenders);

  // 3. Check tender type of each Tender.
  for (let i = 0; i < newTenders.length; i++) {
    let sale;
    // Sale
    if (newTenders[i].TransactionNumber != 0 && newTenders[i].Amount > 2000) {
      sale = await db.getTransaction(
        "Sale",
        newTenders[i].TransactionNumber,
        newTenders[i].StoreID
      );
      // console.log(sale);
      saleEmailQueue.push(sale);
    } else if (
      newTenders[i].TransactionNumber != 0 &&
      newTenders[i].Amount < 0
    ) {
      // Refund
      sale = await db.getTransaction(
        "Refund",
        newTenders[i].TransactionNumber,
        newTenders[i].StoreID
      );
      refundEmailQueue.push(sale);
    } else if (
      newTenders[i].TransactionNumber == 0 &&
      newTenders[i].Amount < 0
    ) {
      // Layaway Payment Refund
      let orderID = await db.getOrderID(newTenders[i].OrderHistoryID);
      let layaway = await db.getLayaway(orderID, newTenders[i].StoreID);
      refundPaymentQueue.push(layaway);
      // console.log(layaway);
    } else if (newTenders[i].TransactionNumber == 0) {
      //Layaway Payment
      let orderID = await db.getOrderID(newTenders[i].OrderHistoryID);
      let layaway = await db.getLayaway(orderID, newTenders[i].StoreID);
      paymentEmailQueue.push(layaway);
    } else {
      console.log("Not Catagorized");
    }
  }
  console.log("Sales: ", saleEmailQueue);
  console.log("Refunds: ", refundEmailQueue);
  console.log("Payments: ", paymentEmailQueue);
  console.log("Payment Refunds: ", refundPaymentQueue);
}

async function checkNewTenders(storeID) {
  let newMaxTender = await db.getLatestTender(storeID, 0);
  let oldMaxTender = await db.getLatestTender(storeID, 1);
  let result = {};
  if (newMaxTender > oldMaxTender) {
    result = await db.getAllNewTenders(storeID, oldMaxTender);
    result.forEach(tender => {
      tender.storeID = storeID;
    });
    // console.log(result);
  }
  return result;
}

function end() {}

async function pre() {
  for (let i = 0; i < storeConfig.length; i++) {
    let latestTender = await db.getLatestTender(storeConfig[i].storeID, 1);
    if (latestTender == null) {
      let updatedTender = await db.getLatestTender(storeConfig[i].storeID, 0);
      await db.insertLatestTender(storeConfig[i].storeID, updatedTender);
    }
  }
}

// test();

async function test() {}
