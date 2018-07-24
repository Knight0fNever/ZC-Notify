const fs = require('fs');
const nodemailer = require('nodemailer');

const emailConfig = JSON.parse(fs.readFileSync('./emailConfig.json', 'utf8'));
const storeConfig = JSON.parse(fs.readFileSync('./storeConfig.json', 'utf8'));

Number.prototype.formatMoney = function(c, d, t) {
  var n = this,
    c = isNaN((c = Math.abs(c))) ? 2 : c,
    d = d == undefined ? '.' : d,
    t = t == undefined ? ',' : t,
    s = n < 0 ? '-' : '',
    i = String(parseInt((n = Math.abs(Number(n) || 0).toFixed(c)))),
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : '')
  );
};

let timeOptions = {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit'
};

async function email(html, typeOfEmail, storeID, transID) {
  var transporter = nodemailer.createTransport({
    auth: {
      user: emailConfig.userName,
      pass: emailConfig.password
    },
    direct: true,
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true
  });

  let store = '';
  if (storeID == 229) {
    store = 'Hermitage';
  } else if (storeID == 213) {
    store = 'ZK';
  } else if (storeID == 223) {
    store = 'Eden';
  } else if (storeID == 1018) {
    store = 'Royal';
  }

  var mailOptions = {
    from: emailConfig.from,
    to: emailConfig.to,
    subject: '',
    html: html
  };

  if (typeOfEmail == 'Sale') {
    mailOptions.subject = `New Sale in ${store} - Transaction #${transID}`;
  } else if (typeOfEmail == 'Payment') {
    mailOptions.subject = `New Payment in ${store} - Order #${transID}`;
  } else if (typeOfEmail == 'Layaway') {
    mailOptions.subject = `New Layaway in ${store} - Order #${transID}`;
  } else if (typeOfEmail == 'Refund') {
    mailOptions.subject = `Refund in ${store} - Transaction #${transID}`;
  } else if (typeOfEmail == 'Payment Refund') {
    mailOptions.subject = `Payment Refund in ${store} - Order #${transID}`;
  } else if (typeOfEmail == 'GN Sale') {
    mailOptions.subject = `GN Sold in ${store} - Transaction #${transID}`;
  } else if (typeOfEmail == 'Closed Layaway') {
    mailOptions.subject = `Closed Layaway in ${store} - Transaction #${transID}`;
  }

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function buildTenders(tenders) {
  let result = `<tr>
          <td colspan="8" style="padding: 0;" valign="top">
            <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
              <tbody>
                <tr>
                  <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    bgcolor="#eee" valign="middle">
                    Payment Method
                  </td>
                  <td colspan="6" style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="right" bgcolor="#eee" valign="top"></td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="right" bgcolor="#eee" valign="middle">
                    Amount
                  </td>
                </tr>
        `;
  if (Array.isArray(tenders)) {
    // Multiple Tenders
    tenders.forEach(tender => {
      // console.log(tenders);
      result += `<tr>
                  <td style="padding: 5px 5px 20px;" valign="middle">
                    ${tender.Description}
                  </td>
                  <td colspan="6" style="padding: 5px 5px 20px;" align="right" valign="top"></td>
                  <td style="padding: 5px 5px 20px;" align="right" valign="middle">
                    $${tender.Amount.formatMoney(2)}
                  </td>
                </tr>`;
    });
  } else {
    result += `<tr>
                  <td style="padding: 5px 5px 20px;" valign="middle">
                    ${tenders.Description}
                  </td>
                  <td colspan="6" style="padding: 5px 5px 20px;" align="right" valign="top"></td>
                  <td style="padding: 5px 5px 20px;" align="right" valign="middle">
                    $${tender.Amount.formatMoney(2)}
                  </td>
                </tr>`;
  }

  return (
    result +
    `</tbody>
            </table>
          </td>
        </tr>`
  );
}

function buildCustomer(customer) {
  // console.log(customer);
  let currentCustomer = `<!-- Customer Info -->
  `;

  if (customer.Company != undefined) {
    if (customer.Company != '') {
      currentCustomer += `
    ${customer.Company}<br>
    `;
    }
  }

  let address2 = '';
  if (customer.Address2 != '') {
    address2 = `
    <!-- Address 2 -->
    <br>${customer.Address2}
    `;
  } else {
    address2 = '';
  }
  currentCustomer += `${customer.FirstName} ${customer.LastName}
                <br>${customer.Address}
                ${address2}
                <br>${customer.City}, ${customer.State} ${customer.Zip} ${
    customer.Country
  }`;

  if (customer.PhoneNumber != '') {
    currentCustomer += `
    <!-- Phone Number -->
    <br>${customer.PhoneNumber}`;
  }
  if (customer.EmailAddress != '') {
    currentCustomer += `
    <!-- Email -->
    <br>${customer.EmailAddress}`;
  }

  if (Object.keys(customer).length === 0 && customer.constructor === Object) {
    return '';
  }
  // console.log("Returned Customer");
  return currentCustomer;
}

function buildItemRows(transactionEntries) {
  let header = `<tr>
          <td colspan="8" style="padding: 0;" valign="top">
            <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
              <tbody>
                <tr>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">
                    SKU
                  </td>
                  <td style="min-width: 20%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Description</td>
                  <td style="min-width: 15%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Extended Description</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Quantity</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Price</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Tax</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Lot</td>
                  <td style="min-width: 12%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">
                    Sales Rep
                  </td>
                </tr>

      `;

  let result = header;

  if (Array.isArray(transactionEntries)) {
    transactionEntries.forEach(entry => {
      if (entry.Item != undefined) {
        result += `<tr>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.Item.ItemLookupCode}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">
                    ${entry.Item.Description}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.Item.ExtendedDescription}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.Quantity}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">
                    $${entry.Price.formatMoney(2)}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">$${entry.SalesTax.formatMoney(2)}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">$${entry.Lot.formatMoney(2)}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.SalesRep}</td>
                </tr>

      `;
      }
    });
  } else {
    if (entry.Item != undefined) {
      result += `<tr>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${entry.Item.ItemLookupCode}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">
                    ${entry.Item.Description}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${entry.Item.ExtendedDescription}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${entry.Quantity}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">
                    $${entry.Price.formatMoney(2)}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">$${entry.SalesTax.formatMoney(2)}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">$${entry.lot.formatMoney(2)}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${entry.SalesRep}</td>
                </tr>

      `;
    }
  }
  return result;
}

function buildItemRowsLayaway(orderEntries) {
  let header = `<tr>
          <td colspan="8" style="padding: 0;" valign="top">
            <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
              <tbody>
                <tr>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">
                    SKU
                  </td>
                  <td colspan="2" style="min-width: 28%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Description</td>
                  <td style="min-width: 15%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Extended Description</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Quantity</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Price</td>
                  <td style="min-width: 8%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">Lot</td>
                  <td style="min-width: 12%; border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
                    align="center" bgcolor="#eee" valign="middle">
                    Sales Rep
                  </td>
                </tr>
      
      `;

  let result = header;

  // console.log("Order Entries: ", orderEntries);

  if (Array.isArray(orderEntries)) {
    orderEntries.forEach(entry => {
      if (entry.Item != undefined) {
        result += `<tr>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.Item.ItemLookupCode}</td>
                  <td colspan="2" style="min-width: 28%; border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">
                    ${entry.Item.Description}
                  </td>
                  <td style="min-width: 15%; border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.Item.ExtendedDescription}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.QuantityOnOrder}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">
                    $${entry.Price.formatMoney(2)}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">$${entry.Item.Lot.formatMoney(2)}
                    </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="middle">${entry.SalesRep}</td>
                </tr>
      
      `;
      }
    });
  } else {
    if (entry != undefined) {
      result += `<tr>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${orderEntries.Item.ItemLookupCode}</td>
                  <td colspan="2" style="min-width: 28%; border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">
                    ${orderEntries.Item.Description}
                  </td>
                  <td style="min-width: 15%; border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${orderEntries.Item.ExtendedDescription}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${orderEntries.QuantityOnOrder}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">
                    $${orderEntries.Price.formatMoney(2)}
                  </td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">$${orderEntries.Item.Lot.formatMoney(2)}</td>
                  <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="center"
                    valign="top">${orderEntries.SalesRep}</td>
                </tr>
      
      `;
    }
  }
  return result;
}

function buildTotalsLayaway(currentLayaway) {
  let result = `
  <!-- Totals -->
      <tr>
                  <td colspan="4" style="padding: 5px;" align="right" valign="top">
                    <strong style="margin-top: 5px;">Total: </strong>
                  </td>
                  <!-- Quantity Total -->
                  <td style="font-weight: bold; padding: 5px;" align="center" valign="top">
                    ${currentLayaway.TotalQty}
                  </td>
                  <!-- Sales Total -->
                  <td style="font-weight: bold; padding: 5px;" align="center" valign="top">
                    $${currentLayaway.Total.formatMoney(2)}
                  </td>
                  <td style="font-weight: bold; padding: 5px;" align="center"; valign="top">$${currentLayaway.TotalLot.formatMoney(
                    2
                  )}</td>
                  <td style="font-weight: bold; padding: 5px;" align="center"; valign="top"></td>
                </tr>`;

  return result;
}

function buildTotals(currentSale) {
  let result = `
  <!-- Totals -->
      <tr>
                  <td colspan="3" style="padding: 5px;" align="right" valign="top">
                    <strong style="margin-top: 5px;">Total: </strong>
                  </td>
                  <!-- Quantity Total -->
                  <td style="font-weight: bold; padding: 5px;" align="center" valign="top">
                    ${currentSale.TotalQty}
                  </td>
                  <!-- Sales Total -->
                  <td style="font-weight: bold; padding: 5px;" align="center" valign="top">
                    $${currentSale.Total.formatMoney(2)}
                  </td>
                  <!-- Tax Total -->
                  <td style="font-weight: bold; padding: 5px;" align="center"; valign="top">
                    $${currentSale.SalesTax.formatMoney(2)}
                  </td>
                  <td style="font-weight: bold; padding: 5px;" align="center"; valign="top">$${currentSale.TotalLot.formatMoney(
                    2
                  )}</td>
                  <td style="font-weight: bold; padding: 5px;" align="center"; valign="top"></td>
                </tr>`;

  return result;
}

function getHTMLTemplate(currentSale) {
  // console.log(currentSale);
  let logo = '';

  var options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  let currentCustomer = '';
  if (currentSale.Customer != undefined) {
    currentCustomer = buildCustomer(currentSale.Customer);
  } else {
    currentCustomer = 'No Customer Selected';
  }

  return `<html>

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta charset="utf-8">
    <title></title>


    <style>
      @media only screen and (max-width: 600px) {
        .invoice-box table tr.top table td {
          width: 100%;
          display: block;
          text-align: center;
        }
        .invoice-box table tr.information table td {
          width: 100%;
          display: block;
          text-align: center;
        }
      }

    </style>
  </head>

  <body>
    <div style="max-width: 1000px; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; margin: auto; padding: 30px; border: 1px solid #eee;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
        <tr>
          <td colspan="8" style="padding: 5px;" valign="top">
            <table style="width: 100%; line-height: inherit; text-align: left;">
              <tr>
                <td style="font-size: 45px; line-height: 45px; color: #333; padding: 5px 5px 20px;" valign="top">
                  <img src="${
                    currentSale.logo
                  }" style="width: 100%; max-width: 140px;">
                </td>
                <td colspan="6" style="padding: 5px 5px 20px;" align="right" valign="top"></td>
                <td style="padding: 5px 5px 20px;" align="right" valign="top">
                  <strong>Transaction #: </strong>${
                    currentSale.TransactionNumber
                  }
                  <br><strong>Date: </strong>${currentSale.Time.toLocaleDateString(
                    'en-US',
                    options
                  )}
                  <br><strong>Time: </strong>${currentSale.Time.toLocaleTimeString(
                    'en-US',
                    timeOptions
                  )}
                  <br><strong>Cashier: </strong>${currentSale.Cashier}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td colspan="8" style="padding: 5px;" valign="top">
            <table style="width: 100%; line-height: inherit; text-align: left;">
              <tr>
                <td style="padding: 5px 5px 40px;" valign="top">
                  ${currentSale.Store.Name}
                  <br>${currentSale.Store.Address1}
                  <br> ${
                    currentSale.Store.City
                  }, ${currentSale.Store.State.toUpperCase()} ${
    currentSale.Store.Zip
  }
                </td>
                <td colspan="6" style="padding: 5px 5px 40px;" align="right" valign="top"></td>
                <td style="padding: 5px 5px 40px;" align="right" valign="top">
                  ${currentCustomer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
              `;
}

function buildSaleHTML(sale, storeID) {
  let currentSale = sale;
  let currentStoreID = storeID;
  let logo = '';

  if (currentStoreID == 229) {
    logo = storeConfig[0].logo;
  } else if (currentStoreID == 213) {
    logo = storeConfig[1].logo;
  } else if (currentStoreID == 223) {
    logo = storeConfig[2].logo;
  } else if (currentStoreID == 1018) {
    logo = storeConfig[3].logo;
  }

  let html = getHTMLTemplate(currentSale);

  if (
    Object.keys(currentSale.Tenders).length != 0 &&
    currentSale.Tenders.constructor === Object
  ) {
    html += buildTenders(currentSale.Tenders) + '\n';
  } else if (Array.isArray(currentSale.Tenders)) {
    html += buildTenders(currentSale.Tenders) + '\n';
  }

  if (currentSale.TransactionEntries.length > 0) {
    html += buildItemRows(currentSale.TransactionEntries);
  }

  html += buildTotals(currentSale);

  let comment = '';

  if (currentSale.Comment != '') {
    comment = `<tr>
          <td>
            <table>
              <tr>
                <td style="padding-top: 50px;">
                  Transaction Comment: ${currentSale.Comment}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
  }

  html += `</tbody>
            </table>
          </td>
        </tr>`;

  return (
    html +
    ` ${comment}  
      </table>
    </div>
  </body>

</html>`
  );
}

function getHTMLTemplateLayaway(currentSale) {
  // console.log(currentSale);
  let logo = '';

  var options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  let currentCustomer = buildCustomer(currentSale.Customer);
  return `<html>

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta charset="utf-8">
    <title></title>


    <style>
      @media only screen and (max-width: 600px) {
        .invoice-box table tr.top table td {
          width: 100%;
          display: block;
          text-align: center;
        }
        .invoice-box table tr.information table td {
          width: 100%;
          display: block;
          text-align: center;
        }
      }

    </style>
  </head>

  <body>
    <div style="max-width: 1000px; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; margin: auto; padding: 30px; border: 1px solid #eee;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
        <tr>
          <td colspan="8" style="padding: 5px;" valign="top">
            <table style="width: 100%; line-height: inherit; text-align: left;">
              <tr>
                <td style="font-size: 45px; line-height: 45px; color: #333; padding: 5px 5px 20px;" valign="top">
                  <img src="${
                    currentSale.logo
                  }" style="width: 100%; max-width: 140px;">
                </td>
                <td colspan="6" style="padding: 5px 5px 20px;" align="right" valign="top"></td>
                <td style="padding: 5px 5px 20px;" align="right" valign="top">
                  <strong>Order #: </strong>${currentSale.ID}
                  <br><strong>Date: </strong>${currentSale.Time.toLocaleDateString(
                    'en-US',
                    options
                  )}
                  <br><strong>Time: </strong>${currentSale.Time.toLocaleTimeString(
                    'en-US',
                    timeOptions
                  )}
                  
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td colspan="8" style="padding: 5px;" valign="top">
            <table style="width: 100%; line-height: inherit; text-align: left;">
              <tr>
                <td style="padding: 5px 5px 40px;" valign="top">
                  ${currentSale.Store.Name}
                  <br>${currentSale.Store.Address1}
                  <br> ${
                    currentSale.Store.City
                  }, ${currentSale.Store.State.toUpperCase()} ${
    currentSale.Store.Zip
  }
                </td>
                <td colspan="6" style="padding: 5px 5px 40px;" align="right" valign="top"></td>
                <td style="padding: 5px 5px 40px;" align="right" valign="top">
                  ${currentCustomer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
              `;
}

function buildPaymentHTML(layaway, storeID) {
  let currentLayaway = layaway;
  // console.log(currentLayaway);
  let currentStoreID = storeID;
  let logo = '';

  if (currentStoreID == 229) {
    logo = storeConfig[0].logo;
  } else if (currentStoreID == 213) {
    logo = storeConfig[1].logo;
  } else if (currentStoreID == 223) {
    logo = storeConfig[2].logo;
  } else if (currentStoreID == 1018) {
    logo = storeConfig[3].logo;
  }

  let html = getHTMLTemplateLayaway(currentLayaway);

  if (
    Object.keys(currentLayaway.Tenders).length != 0 &&
    currentLayaway.Tenders.constructor === Object
  ) {
    html += buildTenders(currentLayaway.Tenders) + '\n';
  }

  if (currentLayaway.OrderEntries.length > 0) {
    html += buildItemRowsLayaway(currentLayaway.OrderEntries);
  }

  html += buildTotalsLayaway(currentLayaway);

  let comment = '';

  if (currentLayaway.Comment != '') {
    comment = `<tr>
          <td>
            <table>
              <tr>
                <td style="padding-top: 50px;">
                  Comment: ${currentLayaway.Comment}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
  }

  html += `</tbody>
            </table>
          </td>
        </tr>`;

  return (
    html +
    ` ${comment}  
      </table>
    </div>
  </body>

</html>`
  );
}

function buildLayawayHTML(layaway, storeID) {
  let currentLayaway = layaway;
  // console.log(currentLayaway);
  let currentStoreID = storeID;
  let logo = '';

  if (currentStoreID == 229) {
    logo = storeConfig[0].logo;
  } else if (currentStoreID == 213) {
    logo = storeConfig[1].logo;
  } else if (currentStoreID == 223) {
    logo = storeConfig[2].logo;
  } else if (currentStoreID == 1018) {
    logo = storeConfig[3].logo;
  }

  let html = getHTMLTemplateLayaway(currentLayaway);

  if (
    Object.keys(currentLayaway.Tenders).length != 0 &&
    currentLayaway.Tenders.constructor === Object
  ) {
    html += buildTenders(currentLayaway.Tenders) + '\n';
  }

  if (currentLayaway.OrderEntries.length > 0) {
    html += buildItemRowsLayaway(currentLayaway.OrderEntries);
  }

  html += buildTotalsLayaway(currentLayaway);

  let comment = '';

  if (currentLayaway.Comment != '') {
    comment = `<tr>
          <td>
            <table>
              <tr>
                <td style="padding-top: 50px;">
                  Comment: ${currentLayaway.Comment}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
  }

  html += `</tbody>
            </table>
          </td>
        </tr>`;

  return (
    html +
    ` ${comment}  
      </table>
    </div>
  </body>

</html>`
  );
}

module.exports = {
  email: email,
  buildSaleHTML: buildSaleHTML,
  buildLayawayHTML: buildLayawayHTML,
  buildPaymentHTML: buildPaymentHTML
};
