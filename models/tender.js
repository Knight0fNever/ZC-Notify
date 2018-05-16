class Tender {
  constructor() {
    this.tenderType = '';
    this.tenderAmount = 0.0;
    this.tenderID = 0;
    this.orderHistoryID = 0;
    this.transNumber = 0;
  }

  getTenderType() {
    return this.tenderType;
  }

  getTenderAmount() {
    return this.tenderAmount;
  }

  getTenderID() {
    return this.tenderID;
  }

  getOrderHistoryID() {
    return this.orderHistoryID;
  }

  getTransNumber() {
    return this.transNumber;
  }
}

module.exports = Tender;
