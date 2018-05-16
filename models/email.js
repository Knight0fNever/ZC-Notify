class Email {
  constructor(emailType, sale) {
    this.emailType = emailType;
    this.sale = sale;
    this.subject = '';
    this.message = '';
    this.toList = [];
    this.from = '';
    this.ccList = [];
  }

  getEmailType() {
    return this.emailType;
  }

  getSale() {
    return this.sale;
  }

  getSubject() {
    return this.subject;
  }

  getMessage() {
    return this.message;
  }

  getToList() {
    return this.toList;
  }

  getFrom() {
    return this.from;
  }

  getCcList() {
    return this.ccList;
  }
}

module.exports = Email;
