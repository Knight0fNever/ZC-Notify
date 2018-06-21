const sql = require("mssql");
const fs = require("fs");

let Sale = require("../models/sale");
const Customer = require("../models/customer");
const Address = require("../models/address");

const config = JSON.parse(fs.readFileSync("./dbconfig.json", "utf8"));

// Return promise that resolves into latest tenderID. 0 for local, 1 for AWs
async function getLatestTender(storeId, location) {
  let query;

  if (location == 1) {
    query =
      "SELECT MAX(lastCheckedTenderID) as 'tenderID' FROM tenderEntries WHERE tenderEntries.storeID = " +
      storeId;
  } else {
    query =
      "SELECT MAX(id) as 'tenderID' FROM TenderEntry WHERE tenderEntry.storeID = " +
      storeId;
  }
  const pool = new sql.ConnectionPool(config[location]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    return result.recordset[0].tenderID;
  } catch (err) {
    console.log("Query Error:", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getTenderEntry(tenderEntryID) {
  let query =
    "SELECT TenderEntry.ID as 'tenderID', TenderEntry.StoreID, TenderEntry.TransactionNumber, TenderEntry.[Description], TenderEntry.Amount, TenderEntry.OrderHistoryID FROM TenderEntry WHERE TenderEntry.ID = " +
    tenderEntryID;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);

    return { success: result };
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getTenders(transactionNumber, storeId) {
  let query =
    "SELECT * FROM TenderEntry WHERE TenderEntry.TransactionNumber = " +
    transactionNumber +
    " AND TenderEntry.StoreID = " +
    storeId;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);

    return result.recordset[0];
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getTransaction(transactionNumber, storeId) {
  let query =
    "SELECT ShipToID, [Time], CustomerID, Cashier.Name as 'Cashier', [Total], SalesTax, Comment, ReferenceNumber, ShipToID, Store.Name as 'Store', RecallID FROM [Transaction] LEFT JOIN Cashier ON [Transaction].CashierID = Cashier.ID AND [Transaction].StoreID = Cashier.StoreID LEFT JOIN Store ON [Transaction].StoreID = Store.ID WHERE [Transaction].TransactionNumber = " +
    transactionNumber +
    " AND [Transaction].StoreID = " +
    storeId;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset[0]);
    let saleResult;
    let recallId = result.recordset[0].RecallID;
    let saleTotal = result.recordset[0].Total;
    if (recallId == 0) {
      saleResult = new Sale("Sale", transactionNumber);
    } else if (recallId != 0 && saleTotal > 0) {
      saleResult = new Sale("Closed Layaway", transactionNumber);
    } else {
      saleResult = new Sale("Return", transactionNumber);
    }

    saleResult.storeID = storeId;
    saleResult.storeName = result.recordset[0].Store;
    saleResult.transactionDate = result.recordset[0].Time;
    saleResult.total = result.recordset[0].Total;
    saleResult.salesTax = result.recordset[0].SalesTax;
    saleResult.transactionEntries = await getTransactionEntries(
      transactionNumber,
      storeId
    );
    saleResult.transactionEntries = await getItems(
      saleResult.transactionEntries
    );
    // TODO: Create calculateTotalLot()
    saleResult.totalLot = await calculateLot(saleResult.transactionEntries);
    saleResult.comment = result.recordset[0].Comment;
    saleResult.customerID = result.recordset[0].CustomerID;
    saleResult.customer = await getCustomer(saleResult.customerID);
    if (result.recordset[0].ShipToID[0] != 0) {
      saleResult.customer.shippingAddress = await getShippingAddress(
        result.recordset[0].ShipToID[0]
      );
    } else {
      saleResult.customer.shippingAddress = null;
    }
    saleResult.tenders = await getTenders(transactionNumber, storeId);
    saleResult.referenceNumber = result.recordset[0].ReferenceNumber;
    saleResult.recallID = result.recordset[0].RecallID;
    console.log(saleResult);
    return saleResult;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getCustomer(customerId) {
  let query =
    "SELECT Customer.FirstName, Customer.LastName, Customer.Company, Customer.[Address], Customer.Address2, Customer.City, Customer.[State], Customer.Zip, Customer.Country, Customer.PhoneNumber, Customer.EmailAddress FROM Customer WHERE Customer.ID = " +
    customerId;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);

    let dbresult = { success: result }.success.recordset[0];

    let customer = new Customer();
    customer.customerID = customerId;
    customer.firstName = dbresult.FirstName;
    customer.lastName = dbresult.LastName;
    customer.company = dbresult.Company;
    customer.address = new Address(
      dbresult.Address,
      dbresult.Address2,
      dbresult.City,
      dbresult.State,
      dbresult.Zip,
      dbresult.Country
    );
    customer.phoneNumber = dbresult.PhoneNumber;
    customer.email = dbresult.EmailAddress;

    return customer;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getTransactionEntries(transactionNumber, storeId) {
  let query =
    "SELECT * FROM TransactionEntry WHERE TransactionEntry.TransactionNumber = " +
    transactionNumber +
    " AND TransactionEntry.StoreID = " +
    storeId;

  // console.log(query);
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset);
    return result.recordset;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getShippingAddress(shipToID) {
  let query = "SELECT * FROM ShipTo WHERE ShipTo.ID = " + shipToID;

  // console.log(query);
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset[0]);
    return result.recordset;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getItems(transactionEntries) {
  let totalLot = 0;
  for (let i = 0; i < transactionEntries.length; i++) {
    transactionEntries[i].item = await getItem(transactionEntries[i].ItemID);
    transactionEntries[i].lot = await getLot(
      transactionEntries[i].item.SubDescription2
    );
  }
  // console.log(transactionEntries);
  return transactionEntries;
}

async function getItem(itemID) {
  let query = "SELECT * FROM Item WHERE Item.ID = " + itemID;

  // console.log(query);
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset[0]);
    return result.recordset[0];
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getLot(lotString) {
  let result = lotString
    .substr(1, lotString.length)
    .substr(0, lotString.length - 2);
  // console.log(parseInt(result));
  return parseInt(result);
}

async function calculateLot(transactionEntries) {
  let totalLot = 0;
  transactionEntries.map(entry => {
    totalLot += entry.lot * entry.Quantity;
  });
  return totalLot;
}

async function updateLatestTender(storeID, tenderID) {
  let query =
    "INSERT INTO tenderEntries VALUES(" +
    storeID +
    ", " +
    tenderID +
    ", GETDATE())";

  // console.log(query);
  const pool = new sql.ConnectionPool(config[1]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    console.log(result);
    // return result.recordset[0];
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getAllNewTenders(storeID, startTenderID) {
  let query =
    "SELECT ID FROM TenderEntry WHERE StoreID = " +
    storeID +
    " AND ID > " +
    startTenderID;

  // console.log(query);
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset[0]);
    return result.recordset;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

sql.on("error", err => {
  console.log("Server Error:", err);
});

module.exports = {
  getLatestTender: getLatestTender,
  getTenderEntry: getTenderEntry,
  getTenders: getTenders,
  getCustomer: getCustomer,
  getTransaction: getTransaction,
  getTransactionEntries: getTransactionEntries,
  getShippingAddress: getShippingAddress,
  getItems: getItems,
  updateLatestTender: updateLatestTender,
  getAllNewTenders: getAllNewTenders
};
