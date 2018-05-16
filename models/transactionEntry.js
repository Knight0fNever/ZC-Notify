class TransactionEntry {
  constructor() {
    this.itemLookupCode = '';
    this.description = '';
    this.extendedDescription = '';
    this.quantity = 0;
    this.price = 0.0;
    this.lot = '';
    this.salesTax = 0.0;
    this.salesRep = '';
    this.transactionEntryID = 0;
  }

  getItemLookupCode() {
    return this.itemLookupCode;
  }

  getDescription() {
    return this.description;
  }

  getExtendedDescription() {
    return this.extendedDescription;
  }

  getQuantity() {
    return this.quantity;
  }

  getPrice() {
    return this.price;
  }

  getLot() {
    return this.lot;
  }

  getSalesTax() {
    return this.salesTax;
  }

  getSalesRep() {
    return this.salesRep;
  }

  getTransactionEntryID() {
    return this.transactionEntryID;
  }
}

module.exports = TransactionEntry;
