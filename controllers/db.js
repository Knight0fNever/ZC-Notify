const sql = require("mssql");
const fs = require("fs");

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
    return { success: result };
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

async function getTransaction(transactionNumber, storeId) {
  let query =
    "SELECT [Time], CustomerID, Cashier.Name as 'Cashier', [Total], SalesTax, Comment, ReferenceNumber, ShipToID, Store.Name as 'Store' FROM [Transaction] LEFT JOIN Cashier ON [Transaction].CashierID = Cashier.ID AND [Transaction].StoreID = Cashier.StoreID LEFT JOIN Store ON [Transaction].StoreID = Store.ID WHERE [Transaction].TransactionNumber = " +
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

    return result.recordset[0];
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

    return { success: customer };
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
  getCustomer: getCustomer,
  getTransaction: getTransaction
};
