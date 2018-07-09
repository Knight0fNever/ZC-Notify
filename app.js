const fs = require('fs');
const email = require('./controllers/email');

const storeConfig = JSON.parse(fs.readFileSync('./storeConfig2.json', 'utf8'));

const db = require('./controllers/db');
const File = require('./controllers/file');
const Tenders = require('./controllers/tenders');

let date = new Date();

// ---- STEPS ----
// 1. Check for lastCheckTender entry in AWS DB.
//   a. If entry does not exist. Create entry and EXIT.
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
// 4. Iterate through email queues and generate emails.
// 5. EXIT.

let saleEmailQueue = [];
let newLayawayEmailQueue = [];
let paymentEmailQueue = [];
let refundPaymentQueue = [];
let gnSaleEmailQueue = [];
let refundEmailQueue = [];
let notCatQueue = [];

let minutes = 0.1;
let the_interval = minutes * 60 * 1000;
var options = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};

// test();

async function test() {
  let sale = await db.getTransaction('Sale', 31778, 229);
  // console.log(sale);
  email.email(email.buildSaleHTML(sale), 'Sale', 229);
}

setInterval(async function() {
  pre();
  await startCheckTenders();
  sendEmails();
  console.log('Checked: ', new Date().toLocaleTimeString('en-us', options));
  saleEmailQueue = [];
  newLayawayEmailQueue = [];
  paymentEmailQueue = [];
  refundPaymentQueue = [];
  gnSaleEmailQueue = [];
  refundEmailQueue = [];
  notCatQueue = [];
}, the_interval);

function sendEmails() {
  // console.log("Sales: ", saleEmailQueue.length);
  // console.log("New Layaways: ", newLayawayEmailQueue.length);
  // console.log("Payments: ", paymentEmailQueue.length);
  // console.log("Refund Payments: ", refundPaymentQueue.length);
  // console.log("GN Sales: ", gnSaleEmailQueue.length);
  // console.log("Refunds: ", refundEmailQueue.length);
  // console.log("Not Catagorized: ", notCatQueue.length);

  if (saleEmailQueue.length <= 5) {
    saleEmailQueue.forEach(sale => {
      email.email(
        email.buildSaleHTML(sale, sale.Store.ID),
        'Sale',
        sale.Store.ID,
        sale.TransactionNumber
      );
    });
  } else {
    console.log('Too many Sale Emails');
  }

  if (newLayawayEmailQueue.length <= 5) {
    newLayawayEmailQueue.forEach(newLayaway => {
      email.email(
        email.buildLayawayHTML(newLayaway, newLayaway.StoreID),
        'Layaway',
        newLayaway.StoreID,
        newLayaway.ID
      );
    });
  } else {
    console.log('Too many Layaway Emails');
  }

  if (paymentEmailQueue.length <= 5) {
    paymentEmailQueue.forEach(payment => {
      email.email(
        email.buildPaymentHTML(payment, payment.StoreID),
        'Payment',
        payment.StoreID,
        payment.ID
      );
    });
  } else {
    console.log('Too many Payment Emails');
  }

  if (refundPaymentQueue.length <= 5) {
    refundPaymentQueue.forEach(refPayment => {
      email.email(
        email.buildPaymentHTML(refPayment, refPayment.StoreID),
        'Payment Refund',
        refPayment.StoreID,
        refPayment.ID
      );
    });
  } else {
    console.log('Too many Refund Payment Emails');
  }

  if (gnSaleEmailQueue.length <= 5) {
    gnSaleEmailQueue.forEach(gnSale => {
      email.email(
        email.buildSaleHTML(gnSale, gnSale.Store.ID),
        'GN Sale',
        gnSale.Store.ID,
        gnSale.TransactionNumber
      );
    });
  } else {
    console.log('Too many GN Sale Emails');
  }

  if (refundEmailQueue.length <= 5) {
    refundEmailQueue.forEach(refund => {
      email.email(
        email.buildSaleHTML(refund, refund.Store.ID),
        'Refund',
        refund.Store.ID,
        refund.TransactionNumber
      );
    });
  } else {
    console.log('Too many Refund Emails');
  }
}

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
    // Sale
    if (newTenders[i].TransactionNumber != 0 && newTenders[i].Amount > 2000) {
      // SALE
      createSale(newTenders[i]);
    } else if (
      newTenders[i].TransactionNumber != 0 &&
      newTenders[i].Amount < 0
    ) {
      // Refund
      createRefund(newTenders[i]);
    } else if (
      newTenders[i].TransactionNumber == 0 &&
      newTenders[i].Amount < 0
    ) {
      // Layaway Payment Refund
      createPaymentRefund(newTenders[i]);
      // console.log(layaway);
    } else if (newTenders[i].TransactionNumber == 0) {
      //Layaway Payment
      let orderID = await db.getOrderID(newTenders[i].OrderHistoryID);
      let layaway = await db.getLayaway(orderID, newTenders[i].StoreID);
      paymentEmailQueue.push(layaway);
    } else {
      let nonCatSale = await createNotCatSale(newTenders[i]);
      // console.log(nonCatSale);
      notCatQueue.push(nonCatSale);
    }
  }

  // Look for GN sale
  await checkForGNSale();
  await checkForNewLayaway();
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
      await db
        .insertLatestTender(storeConfig[i].storeID, updatedTender)
        .then(() => {
          console.log(
            'No previous tender entried found in AWS DB. Created them.'
          );
          end();
        });
    }
  }
}

async function createSale(newTender) {
  let sale = await db.getTransaction(
    'Sale',
    newTender.TransactionNumber,
    newTender.StoreID
  );
  // console.log(sale);
  // console.log("Sale: ", sale.TransactionNumber);
  saleEmailQueue.push(sale);
}

async function createRefund(newTender) {
  let sale = await db.getTransaction(
    'Refund',
    newTender.TransactionNumber,
    newTender.StoreID
  );
  // console.log("Refund Total: ", sale.Total);
  if (sale.Total < 0) {
    refundEmailQueue.push(sale);
  } else {
    notCatQueue.push(sale);
  }
}

async function createPaymentRefund(newTender) {
  let orderID = await db.getOrderID(newTender.OrderHistoryID);
  let layaway = await db.getLayaway(orderID, newTender.StoreID);
  refundPaymentQueue.push(layaway);
}

async function createNotCatSale(newTender) {
  // console.log("Not Catagorized: ", newTender.TransactionNumber);

  let sale = await db.getTransaction(
    'Sale',
    newTender.TransactionNumber,
    newTender.StoreID
  );
  return sale;
}

async function checkForGNSale() {
  // Look for GN sale
  for (let i = 0; i < notCatQueue.length; i++) {
    let containsGN = false;
    for (let j = 0; j < notCatQueue[i].TransactionEntries.length; j++) {
      if (notCatQueue[i].TransactionEntries[j].Item.ItemLookupCode == 'GN') {
        containsGN = true;
      }
    }
    // console.log(containsGN);
    if (containsGN == true) {
      gnSaleEmailQueue.push(notCatQueue[i]);
    }
  }
}

async function checkForNewLayaway() {
  let lastChecked = await db.getLastCheckedTime();

  let dateString = lastChecked
    .toISOString()
    .split('T')
    .join(' ')
    .slice(0, -1);
  // console.log(dateString);
  let newLayaways = await db.getNewLayaways(dateString);
  // console.log(newLayaways);
  newLayaways.forEach(layaway => {
    let newLayaway = db.getLayaway(layaway.ID, layaway.StoreID);
    newLayawayEmailQueue.push(newLayaway);
  });
}
