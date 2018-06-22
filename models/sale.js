const Customer = require("./customer");
class Sale {
  constructor(transactionType, transNumber, storeID) {
    this.transactionType = transactionType;
    this.transNumber = transNumber;
    this.storeID = storeID;
    this.storeName = "";
    this.transactionDate = new Date();
    this.total = 0.0;
    this.salesTax = 0.0;
    this.totalLot = 0.0;
    this.customer = new Customer();
    this.customerID = 0;
    this.tenders = [];
    this.transactionEntries = [];
    this.comment = "";
    this.referenceNumber = "";
    this.recallID = 0;
  }

  getRecallID() {
    return this.recallID;
  }

  getTransactionType() {
    return this.transactionType;
  }

  getTransNumber() {
    return this.transNumber;
  }

  getStoreID() {
    return this.storeID;
  }

  getStoreName() {
    return this.storeName;
  }

  getTransactionDate() {
    return this.transactionDate;
  }

  getTotal() {
    return this.total;
  }

  getSalesTax() {
    return this.salesTax;
  }

  getTotalLot() {
    return this.totalLot;
  }

  getCustomer() {
    return this.customer;
  }

  getCustomerID() {
    return this.customerID;
  }

  getTenders() {
    return this.tenders;
  }

  getTransactionEntries() {
    return this.transactionEntries;
  }

  getComment() {
    return this.comment;
  }

  getReferenceNumber() {
    return this.referenceNumber;
  }
}

module.exports = Sale;
