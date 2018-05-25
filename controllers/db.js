const sql = require("mssql");
const fs = require("fs");

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
    "SELECT TenderEntry.ID as 'tenderID', TenderEntry.StoreID, TenderEntry.TransactionNumber, TenderEntry.[Description], TenderEntry.Amount FROM TenderEntry WHERE TenderEntry.ID = " +
    tenderEntryID;
  const pool = new sql.ConnectionPool(config[0]);
  pool.on("error", err => {
    console.log("SQL Error: ", err);
  });

  try {
    await pool.connect();
    let result = await pool.request().query(query);

    return await { success: result };
  } catch (err) {
    console.log("Query Error: ", err);
    return await { err: err };
  } finally {
    pool.close();
  }
}

sql.on("error", err => {
  console.log("Server Error:", err);
});

module.exports = {
  getLatestTender: getLatestTender,
  getTenderEntry: getTenderEntry
};
