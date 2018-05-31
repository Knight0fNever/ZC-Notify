const db = require("./db");
const Tender = require("../models/tender");

async function getNewTenders(storeID) {
  return getLatestTenders(storeID).then(async function(result) {
    let newTenderID = result[0];
    let oldTenderID = result[1];

    // console.log(newTenderID, oldTenderID);

    let tenders = [];
    let newTenders = [];

    if (newTenderID > oldTenderID) {
      for (let i = oldTenderID + 1; i <= newTenderID; i++) {
        let newTenderRaw = await db.getTenderEntry(i);
        let newTender = new Tender();
        newTender.tenderID = newTenderRaw.success.recordset[0].tenderID;
        newTender.tenderType = newTenderRaw.success.recordset[0].Description;
        newTender.tenderAmount = newTenderRaw.success.recordset[0].Amount;
        newTender.storeID = newTenderRaw.success.recordset[0].StoreID;
        newTender.orderHistoryID =
          newTenderRaw.success.recordset[0].OrderHistoryID;
        newTenders.push(newTender);
      }
    }

    return newTenders;
  });
}

async function getLatestTenders(storeID) {
  let localResult = await db.getLatestTender(storeID, 0);
  let cachedResult = await db.getLatestTender(storeID, 1);
  return [
    localResult.success.recordset[0].tenderID,
    cachedResult.success.recordset[0].tenderID
  ];
}

module.exports = {
  getNewTenders: getNewTenders
};
