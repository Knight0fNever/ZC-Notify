const Address = require('./address');

class Customer {
  constructor() {
    this.customerID = 0;
    this.firstName = '';
    this.lastName = '';
    this.company = '';
    this.address = new Address();
    this.shippingAddress = new Address();
    this.phoneNumber = '';
    this.faxNumber = '';
    this.email = '';
  }

  getCustomerID() {
    return this.customerID;
  }

  getFirstName() {
    return this.firstName;
  }

  getLastName() {
    return this.lastName;
  }

  getCompany() {
    return this.company;
  }

  getaddress() {
    return this.address;
  }

  getShippingAddress() {
    return this.shippingAddress;
  }

  getPhoneNumber() {
    return this.phoneNumber;
  }

  getFaxNumber() {
    return this.faxNumber;
  }

  getEmail() {
    return this.email;
  }
}

module.exports = Customer;
