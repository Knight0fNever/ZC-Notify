const Sale = require("./sale");

class Layaway extends Sale {
  constructor() {
    this.layawayStatus = 0;
    this.previousDeposit = 0.0;
    this.currentDeposit = 0.0;
    this.remainingBalance = 0.0;
    this.orderEntries = [];
    this.orderHistoryID = 0;
    this.isRecalledOrder = false;
    this.recalledOrderID = 0;
  }

  getLayawayStatus() {
    return this.layawayStatus;
  }

  getPreviousDeposit() {
    return this.previousDeposit;
  }

  getCurrentDeposit() {
    return this.currentDeposit;
  }

  getRemainingBalance() {
    return this.remainingBalance;
  }

  getOrderEntries() {
    return this.orderEntries;
  }

  getOrderHistoryID() {
    return this.orderHistoryID;
  }

  getIsRecalledOrder() {
    return this.isRecalledOrder;
  }

  getRecalledOrderID() {
    return this.recalledOrderID;
  }
}

module.exports = Layaway;
