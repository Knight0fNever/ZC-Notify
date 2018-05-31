const db = require("./db");
const Tender = require("../models/tender");
const Sale = require("../models/sale");
const Layaway = require("../models/layaway");
const Refund = require("../models/refund");
const Customer = require("../models/customer");
const Address = require("../models/address");
const TransactionEntry = require("../models/transactionEntry");

async function generateTransaction(tenderEntry) {
  let result = null;

  if (tenderEntry.getOrderHistoryID() == 0) {
    if (tenderEntry.getTenderAmount() >= 2000) {
      // Sale
      let sale = new Sale("Sale", tenderEntry.getTransNumber());
      let rawSale = await db.getTransaction(
        tenderEntry.getTransNumber(),
        tenderEntry.getStoreID()
      );
      sale.storeID = tenderEntry.getStoreID();
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

      result = sale;
    } else if (tenderEntry.getTenderAmount() < 0) {
      // Refund
      let refund = new Refund();

      result = refund;
    }
  } else {
    // Layaway
    let layaway = new Layaway();

    result = layaway;
  }

  return result;
}
