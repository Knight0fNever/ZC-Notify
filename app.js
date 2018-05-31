const fs = require("fs");

const db = require("./controllers/db");
var Sale = require("./models/sale");
const Tender = require("./models/tender");
const TransactionEntry = require("./models/transactionEntry");
const Layaway = require("./models/layaway");
const Email = require("./models/email");
const File = require("./controllers/file");
const Tenders = require("./controllers/tenders");

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
// }, the_interval);

let saleEmailQueue = [];
let newLayawayEmailQueue = [];
let paymentEmailQueue = [];
let gnSaleEmailQueue = [];
let refundEmailQueue = [];

// 1. Check for dbconfig.json file.
// if (fs.existsSync("./dbconfig.json")) {
//   if (fs.readFileSync("./dbconfig.json", "utf8") == "") {
//     console.error("Database configuration file is corrupt.");
//     process.exit(1);
//   } else {
//     start();
//   }
// } else {
//   console.error("Database Configuration does not exist.");
//   process.exit(1);
// }

async function start() {
  // 2. Check Tender table for new Tender
  let newTenders = await Tenders.getNewTenders();
  if (newTenders.length != 0) {
    console.log("correct");
  } else {
    end();
  }
}

function end() {}

test();

async function test() {
  // let trans = await db.getTransaction(31671, 229);

  let sale = new Sale("Sale", 31671);
  let rawSale = await db.getTransaction(31671, 229);

  // console.log(rawSale);

  sale.storeID = 229;
  sale.storeName = rawSale.Store;
  sale.transactionDate = rawSale.Time;
  sale.total = rawSale.Total;
  sale.salesTax = rawSale.SalesTax;
  // TODO: Generate Lot
  // sale.totalLot = db.calculateLot();
  sale.customer = await db.getCustomer(rawSale.CustomerID);
  sale.customerID = rawSale.CustomerID;
  // TODO: Get Tenders
  // sale.tenders = await db.getTenders(
  //   tenderEntry.getTransNumber(),
  //   tenderEntry.getStoreID()
  // );
  // TODO: Get Transaction Entries
  // sale.transactionEntries = await db.getTransactionEntries(
  //   rawSale.getTransNumber,
  //   rawSale.getStoreID
  // );
  sale.comment = rawSale.Comment;
  sale.referenceNumber = rawSale.ReferenceNumber;

  console.log(sale);
}
