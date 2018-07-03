const sql = require("mssql");
const fs = require("fs");

let Sale = require("../models/sale");

const config = JSON.parse(fs.readFileSync("./dbconfig.json", "utf8"));
const storeConfig = JSON.parse(fs.readFileSync("./storeConfig.json", "utf8"));

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

async function getTenderEntry(tenderEntryID, storeId) {
  let query =
    "SELECT TenderEntry.ID as 'tenderID', TenderEntry.StoreID, TenderEntry.TransactionNumber, TenderEntry.[Description], TenderEntry.Amount, TenderEntry.OrderHistoryID FROM TenderEntry WHERE TenderEntry.ID = " +
    tenderEntryID +
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
    // console.log(result.recordset);
    return result.recordset;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getTenderByID(tenderID) {
  let query = `SELECT * FROM TenderEntry
  WHERE ID = ${tenderID}`;
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

async function getLastTenderByOrder(orderID, storeID) {
  let query = `SELECT TOP 1 TenderEntry.* FROM TenderEntry
LEFT JOIN OrderHistory ON TenderEntry.OrderHistoryID = OrderHistory.ID AND TenderEntry.StoreID = OrderHistory.StoreID
LEFT JOIN [Order] ON OrderHistory.OrderID = [Order].ID AND OrderHistory.StoreID = [Order].StoreID
WHERE [Order].ID = ${orderID} AND [Order].StoreID = ${storeID}
ORDER BY ID DESC`;
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

async function getTransaction(transactionType, transactionNumber, storeId) {
  let query = `SELECT ShipToID, [Time], CustomerID, Cashier.Name as 'Cashier', [Total], SalesTax, Comment, ReferenceNumber, ShipToID, Store.Name as 'Store', RecallID, Store.Address1 as 'StoreAddress', Store.City as 'StoreCity', Store.[State] as 'StoreState', Store.Zip as 'StoreZip'
  FROM [Transaction] 
  LEFT JOIN Cashier ON [Transaction].CashierID = Cashier.ID AND [Transaction].StoreID = Cashier.StoreID 
  LEFT JOIN Store ON [Transaction].StoreID = Store.ID 
  WHERE [Transaction].TransactionNumber = ${transactionNumber} AND [Transaction].StoreID = ${storeId}`;

  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result.recordset[0]);
    // saleResult = new Sale(transactionType, transactionNumber, storeId);
    let saleResult = result.recordset[0];
    let recallId = result.recordset[0].RecallID;
    let saleTotal = result.recordset[0].Total;

    saleResult.storeID = storeId;
    if (storeId == 229) {
      saleResult.logo = storeConfig[0].logo;
    } else if (storeId == 213) {
      saleResult.logo = storeConfig[1].logo;
    } else if (storeId == 223) {
      saleResult.logo = storeConfig[2].logo;
    } else if (storeId == 1018) {
      saleResult.logo = storeConfig[3].logo;
    } else {
      saleResult.logo = "";
    }
    saleResult.TransactionNumber = transactionNumber;
    saleResult.Store = await getStoreInfo(storeId);
    saleResult.TransactionEntries = await getTransactionEntries(
      transactionNumber,
      storeId
    );
    saleResult.TotalQty = await getSaleSum(saleResult.TransactionEntries);
    saleResult.TransactionEntries = await getItems(
      saleResult.TransactionEntries
    );
    saleResult.TotalLot = await calculateLot(saleResult.TransactionEntries);
    if (result.recordset[0].CustomerID != 0) {
      saleResult.Customer = await getCustomer(saleResult.CustomerID);
    }
    if (result.recordset[0].ShipToID[0] != 0) {
      saleResult.Customer.ShippingAddress = await getShippingAddress(
        result.recordset[0].ShipToID[0]
      );
    }
    saleResult.Tenders = await getTenders(transactionNumber, storeId);
    // saleResult.referenceNumber = result.recordset[0].ReferenceNumber;
    // saleResult.recallID = result.recordset[0].RecallID;
    // console.log(saleResult);
    // fs.writeFileSync("./saleExport.json", JSON.stringify(saleResult));
    return saleResult;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getSaleSum(transactionEntries) {
  // console.log("Entries:".transactionEntries);
  let total = 0;
  transactionEntries.forEach(entry => {
    total += entry.Quantity;
  });
  return total;
}

function getLotSum(transactionEntries) {
  let total = 0;
  transactionEntries.forEach(entry => {
    total += entry.lot;
  });
  return total;
}

async function getStoreInfo(storeID) {
  let query = `SELECT * FROM Store WHERE Store.ID = ${storeID}`;

  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);

    let store = result.recordset[0];

    return store;
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

    return result.recordset[0];
  } catch (err) {
    console.log("Query Error: ", err);
    return {};
  } finally {
    pool.close();
  }
}

async function getTransactionEntries(transactionNumber, storeId) {
  let query = `SELECT TransactionEntry.*, SalesRep.Name as 'SalesRep' FROM TransactionEntry
  LEFT JOIN SalesRep ON TransactionEntry.SalesRepID = SalesRep.ID AND TransactionEntry.StoreID = SalesRep.StoreID
  WHERE TransactionEntry.TransactionNumber = ${transactionNumber} AND TransactionEntry.StoreID = ${storeId}`;

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
    transactionEntries[i].Item = await getItem(transactionEntries[i].ItemID);
    transactionEntries[i].Lot = await getLot(
      transactionEntries[i].Item.SubDescription2
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
    let item = result.recordset[0];
    // console.log("Lot: ", getLot(result.recordset[0].SubDescription2));
    item.Lot = await getLot(result.recordset[0].SubDescription2);
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

async function insertLatestTender(storeID, tenderID) {
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
    // console.log(result);
    // return result.recordset[0];
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function updateLatestTender(storeID, tenderID) {
  let query = `UPDATE tenderEntries SET lastCheckedTenderID = ${tenderID}, lastCheckedTime = GETDATE() WHERE storeID = ${storeID}`;

  // console.log(query);
  const pool = new sql.ConnectionPool(config[1]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log(result);
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

async function getOrderEntries(orderID, storeID) {
  let query = `SELECT OrderEntry.*, SalesRep.Name as 'SalesRep' FROM OrderEntry 
  LEFT JOIN SalesRep ON OrderEntry.SalesRepID = SalesRep.ID AND OrderEntry.StoreID = SalesRep.StoreID
  WHERE OrderEntry.OrderID = ${orderID} AND OrderEntry.StoreID = ${storeID}`;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.log("Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getLayaway(orderID, storeID) {
  let query = `SELECT * FROM [Order]
    WHERE [Order].ID = ${orderID} AND [Order].StoreID = ${storeID}`;

  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    let order = result.recordset[0];
    // console.log(order);
    // let orderID = order.ID;
    if (storeID == 229) {
      order.logo = storeConfig[0].logo;
    } else if (storeID == 213) {
      order.logo = storeConfig[1].logo;
    } else if (storeID == 223) {
      order.logo = storeConfig[2].logo;
    } else if (storeID == 1018) {
      order.logo = storeConfig[3].logo;
    } else {
      order.logo = "";
    }
    order.Tenders = await getLastTenderByOrder(3184, 229);
    order.OrderEntries = await getOrderEntries(orderID, storeID);
    order.TotalQty = await getSaleSumLayaway(order.OrderEntries);

    // console.log(order.TotalQty);

    for (let i = 0; i < order.OrderEntries.length; i++) {
      order.OrderEntries[i].Item = await getItem(order.OrderEntries[i].ItemID);
    }
    order.TotalLot = await calculateLotLayaway(order.OrderEntries);
    order.Customer = await getCustomer(order.CustomerID);
    order.Store = await getStoreInfo(storeID);

    // console.log(order);
    return order;
  } catch (err) {
    console.log("Get Layaway Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getLayawayPayment(orderID, storeID) {
  // let query = `SELECT [Order].*, Cashier.Name as 'Cashier' FROM [Order]
  // LEFT JOIN Cashier ON [Order].CashierID = Cashier.ID AND [Order].StoreID = Cashier.StoreID
  //   WHERE [Order].ID = ${orderID} AND [Order].StoreID = ${storeID}`;

  let query = `SELECT TOP 1 [Order].*, OrderHistory.ID as 'OrderHistoryID', Cashier.Name as 'Cashier' FROM [Order]
LEFT JOIN OrderHistory ON [Order].ID = OrderHistory.OrderID AND [Order].StoreID = OrderHistory.StoreID
LEFT JOIN Cashier ON OrderHistory.CashierID = Cashier.ID AND OrderHistory.StoreID = Cashier.StoreID
WHERE [Order].ID = ${orderID} AND [Order].StoreID = ${storeID}
ORDER BY OrderHistory.ID DESC`;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    let order = result.recordset[0];
    // console.log(order);
    // let orderID = order.ID;
    if (storeID == 229) {
      order.logo = storeConfig[0].logo;
    } else if (storeID == 213) {
      order.logo = storeConfig[1].logo;
    } else if (storeID == 223) {
      order.logo = storeConfig[2].logo;
    } else if (storeID == 1018) {
      order.logo = storeConfig[3].logo;
    } else {
      order.logo = "";
    }
    order.Tenders = await getLastTenderByOrder(3184, 229);
    order.OrderEntries = await getOrderEntries(orderID, storeID);
    order.TotalQty = await getSaleSumLayaway(order.OrderEntries);

    // console.log(order.TotalQty);

    for (let i = 0; i < order.OrderEntries.length; i++) {
      order.OrderEntries[i].Item = await getItem(order.OrderEntries[i].ItemID);
    }
    order.TotalLot = await calculateLotLayaway(order.OrderEntries);
    order.Customer = await getCustomer(order.CustomerID);
    order.Store = await getStoreInfo(storeID);

    // console.log(order);
    return order;
  } catch (err) {
    console.log("Get Layaway Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function calculateLot(transactionEntries) {
  let totalLot = 0;
  transactionEntries.map(entry => {
    totalLot += entry.Lot * entry.Quantity;
  });
  return totalLot;
}

async function calculateLotLayaway(transactionEntries) {
  let totalLot = 0;
  transactionEntries.map(entry => {
    // console.log("Entry:", entry);
    totalLot += entry.Item.Lot * entry.QuantityOnOrder;
  });
  return totalLot;
}

async function getSaleSum(transactionEntries) {
  let total = 0;
  transactionEntries.forEach(entry => {
    total += entry.Quantity;
  });
  return total;
}

async function getSaleSumLayaway(transactionEntries) {
  let total = 0;
  transactionEntries.forEach(entry => {
    total += entry.QuantityOnOrder;
  });
  return total;
}

async function getOrderID(orderHistoryID, storeId) {
  let query = `SELECT OrderID FROM OrderHistory WHERE OrderHistory.ID = ${orderHistoryID}`;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    // console.log("Get OrderID query: ", query);

    return result.recordset[0].OrderID;
  } catch (err) {
    console.log("Get Order ID Query Error: ", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getLastCheckedTime() {
  let query = `SELECT TOP 1 lastCheckedTime FROM tenderEntries
  ORDER BY lastCheckedTime DESC`;

  const pool = new sql.ConnectionPool(config[1]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    return result.recordset[0].lastCheckedTime;
  } catch (err) {
    console.log("Query Error:", err);
    return { err: err };
  } finally {
    pool.close();
  }
}

async function getNewLayaways(lastCheckedTime) {
  let query = `SELECT * FROM [Order]
  WHERE [Time] > '${lastCheckedTime}' AND Closed = 0`;

  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.log("Query Error:", err);
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
  insertLatestTender: insertLatestTender,
  updateLatestTender: updateLatestTender,
  getAllNewTenders: getAllNewTenders,
  getLayaway: getLayaway,
  getLayawayPayment: getLayawayPayment,
  getOrderEntries: getOrderEntries,
  getOrderID: getOrderID,
  getStoreInfo: getStoreInfo,
  getTenderByID: getTenderByID,
  getLastTenderByOrder: getLastTenderByOrder,
  getLastCheckedTime: getLastCheckedTime,
  getNewLayaways: getNewLayaways
};
