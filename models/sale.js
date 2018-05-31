const Customer = require("./customer");
class Sale {
  constructor(transactonType, transNumber) {
    this.transactionType = "";
    this.transNumber = transNumber;
    this.storeID = 0;
    this.storeName = "";
    this.transactionDate = new Date();
    this.transactionTime = new Date();
    this.total = 0.0;
    this.salesTax = 0.0;
    this.totalLot = 0.0;
    this.customer = new Customer();
    this.customerID = 0;
    this.tenders = [];
    this.transactionEntries = [];
    this.comment = "";
    this.referenceNumber = "";
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

  getTransactionTime() {
    return this.transactionTime;
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
