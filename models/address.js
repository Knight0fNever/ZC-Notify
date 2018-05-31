class Address {
  constructor(address, address2, city, state, zip, country) {
    this.address = address;
    this.address2 = address2;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.country = country;
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
