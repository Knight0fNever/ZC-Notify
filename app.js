const fs = require('fs');
const email = require('./controllers/email');

const storeConfig = JSON.parse(fs.readFileSync('./storeConfig.json', 'utf8'));

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

let emailCount = 0;

let saleEmailQueue = [];
let newLayawayEmailQueue = [];
let paymentEmailQueue = [];
let refundPaymentQueue = [];
let gnSaleEmailQueue = [];
let refundEmailQueue = [];
let closedLayawayQueue = [];

let notCatQueue = [];

let minutes = 0.1;
let the_interval = minutes * 60 * 1000;
var options = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};

test();

async function test() {
  // db.getLastOrder(229).then(orderID => {
  //   console.log(orderID);
  // });
  // console.log(await db.getLayaway(3305, 229));
  // console.log(await db.getLatestOrder(229));
}

setInterval(async function() {
  pre();
  await startCheckTenders();
  sendEmails();
  console.log(
    'Checked: ',
    new Date().toLocaleTimeString('en-us', options),
    'Email Count:',
    emailCount
  );
  saleEmailQueue = [];
  newLayawayEmailQueue = [];
  paymentEmailQueue = [];
  refundPaymentQueue = [];
  gnSaleEmailQueue = [];
  refundEmailQueue = [];
  notCatQueue = [];
  closedLayawayQueue = [];
}, the_interval);

function sendEmails() {
  let emailQueue = [];

  saleEmailQueue.forEach(sale => {
    sale.Type = 'Sale';
    emailQueue.push(sale);
  });

  closedLayawayQueue.forEach(sale => {
    sale.Type = 'Closed Layaway';
    emailQueue.push(sale);
  });

  newLayawayEmailQueue.forEach(newLayaway => {
    newLayaway.Type = 'Layaway';
    emailQueue.push(newLayaway);
  });

  paymentEmailQueue.forEach(payment => {
    payment.Type = 'Payment';
    emailQueue.push(payment);
  });

  refundPaymentQueue.forEach(refPayment => {
    refPayment.Type = 'Payment Refund';
    emailQueue.push(refPayment);
  });

  gnSaleEmailQueue.forEach(gnSale => {
    gnSale.Type = 'GN Sale';
    emailQueue.push(gnSale);
  });

  refundEmailQueue.forEach(refund => {
    refund.Type = 'Refund';
    emailQueue.push(refund);
  });

  emailCount += emailQueue.length;

  if (emailCount < 50) {
    emailQueue.forEach(transaction => {
      // console.log(transaction.Type);
      if (transaction.Type == 'Sale') {
        email.email(
          email.buildSaleHTML(transaction),
          transaction.Type,
          transaction.Store.ID,
          transaction.TransactionNumber
        );
      } else if (transaction.Type == 'Closed Layaway') {
        email.email(
          email.buildSaleHTML(transaction),
          transaction.Type,
          transaction.Store.ID,
          transaction.TransactionNumber
        );
      } else if (transaction.Type == 'Layaway') {
        email.email(
          email.buildLayawayHTML(transaction),
          transaction.Type,
          transaction.StoreID,
          transaction.ID
        );
      } else if ((transaction.Type = 'Payment')) {
        email.email(
          email.buildPaymentHTML(transaction),
          transaction.Type,
          transaction.StoreID,
          transaction.ID
        );
      } else if ((transaction.Type = 'Payment Refund')) {
        email.email(
          email.buildPaymentHTML(transaction),
          transaction.Type,
          transaction.StoreID,
          transaction.ID
        );
      } else if ((transaction.Type = 'Refund')) {
        email.email(
          email.buildSaleHTML(transaction),
          transaction.Type,
          transaction.StoreID,
          transaction.ID
        );
      } else if ((transaction.Type = 'GN Sale')) {
        email.email(
          email.buildSaleHTML(transaction),
          transaction.Type,
          transaction.StoreID,
          transaction.ID
        );
      }
    });
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
    if (
      newTenders[i].TransactionNumber != 0 &&
      newTenders[i].Amount > 2000 &&
      newTenders[i].OrderHistoryID == 0
    ) {
      // SALE
      createSale(newTenders[i]);
    } else if (
      newTenders[i].TransactionNumber != 0 &&
      newTenders[i].Amount > 0 &&
      newTenders[i].OrderHistoryID != 0
    ) {
      // Closed Layaway
      createClosedLayaway(newTenders[i]);
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
  // console.log(newLayawayEmailQueue);
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

function end() {
  console.log('Ended.');
}

async function pre() {
  let addedSales = false;
  let addedOrders = false;
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
          addedSales = true;
        });
    }
  }
  for (let i = 0; i < storeConfig.length; i++) {
    let lastOrder = await db.getLastOrder(storeConfig[i].storeID, 1);
    if (lastOrder == undefined) {
      db.getLatestOrder(storeConfig[i].storeID).then(orderID => {
        db.insertLatestOrder(orderID, storeConfig[i].storeID).then(() => {
          // console.log('Inserted');
        });
      });
      addedOrders = true;
    } else if (Array.isArray(lastOrder)) {
      if (lastOrder.length == 0) {
        db.getLatestOrder(storeConfig[i].storeID).then(orderID => {
          db.insertLatestOrder(orderID, storeConfig[i].storeID).then(() => {
            console.log('Inserted');
          });
        });
        addedOrders = true;
      }
    }
  }
  if (addedOrders || addedSales) {
    end();
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

async function createClosedLayaway(newTender) {
  let sale = await db.getTransaction(
    'Closed Layaway',
    newTender.TransactionNumber,
    newTender.StoreID
  );
  // console.log(sale);
  // console.log("Sale: ", sale.TransactionNumber);
  closedLayawayQueue.push(sale);
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
  for (let i = 0; i < storeConfig.length; i++) {
    let lastChecked = await db.getLastOrder(storeConfig[i].storeID);
    lastChecked = lastChecked[0].lastOrder;
    // console.log('Last Checked:', lastChecked);

    let newLayaways = await db.getLatestOrders(
      lastChecked,
      storeConfig[i].storeID
    );

    // console.log('New Layaways:', newLayaways);
    for (let j = 0; j < newLayaways.length; j++) {
      let newLayaway = await db.getLayaway(
        newLayaways[j].ID,
        newLayaways[j].StoreID
      );
      newLayawayEmailQueue.push(newLayaway);
    }
  }
  for (let i = 0; i < storeConfig.length; i++) {
    let latestOrder = await db.getLatestOrder(storeConfig[i].storeID);
    // console.log('LatestOrder:', latestOrder);
    await db.updateLatestOrder(latestOrder, storeConfig[i].storeID);
  }
  // console.log(newLayawayEmailQueue);
}
