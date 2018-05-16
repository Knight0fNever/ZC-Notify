class Address {
  constructor() {
    this.address = '';
    this.address2 = '';
    this.city = '';
    this.state = '';
    this.zip = '';
    this.country = '';
  }

  getAddress() {
    return this.address;
  }

  getAddress2() {
    return this.address2;
  }

  getCity() {
    return this.city;
  }

  getState() {
    return this.state;
  }

  getZip() {
    return this.zip;
  }

  getCountry() {
    return this.country;
  }
}

module.exports = Address;
