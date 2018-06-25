const fs = require("fs");
const nodemailer = require("nodemailer");

const emailConfig = JSON.parse(fs.readFileSync("./emailConfig.json", "utf8"));
const storeConfig = JSON.parse(fs.readFileSync("./storeConfig.json", "utf8"));

async function email(html) {
  var transporter = nodemailer.createTransport({
    auth: {
      user: emailConfig.userName,
      pass: emailConfig.password
    },
    direct: true,
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true
  });

  var mailOptions = {
    from: emailConfig.from,
    to: emailConfig.to,
    subject: "Sending Email using Node.js",
    html: html
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function buildTenders(tenders) {
  let result = `<tr>
      <!-- Tenders -->
      <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          bgcolor="#eee" valign="top">
          Payment Method(s)
        </td>
        <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          align="right" bgcolor="#eee" valign="top">
          Amount
        </td>
      </tr>
        `;
  if (Array.isArray(tenders)) {
    // Multiple Tenders
    tenders.forEach(tender => {
      result += `<tr>
        <td style="padding: 5px 5px 20px;" valign="top">
          ${tender.Description}
        </td>

        <td style="padding: 5px 5px 20px;" align="right" valign="top">
          ${tender.Amount}
        </td>
      </tr>`;
    });
  } else {
    result += `<tr>
        <td style="padding: 5px 5px 20px;" valign="top">
          ${tenders.Description}
        </td>

        <td style="padding: 5px 5px 20px;" align="right" valign="top">
          ${tenders.Amount}
        </td>
      </tr>`;
  }

  return result;
}

function buildCustomer(customer) {
  let currentCustomer = `<!-- Customer Info -->
              <td style="padding: 5px 5px 40px;" align="right" valign="top">
                ${customer.Company}
                <br> ${customer.FirstName} ${customer.LastName}
                <br>${customer.Address}
                <br>${customer.Address2}
                <br>${customer.City}, ${customer.State} ${customer.Zip} ${
    customer.Country
  }
  <br>${customer.PhoneNumber}
                <br>${customer.Email}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  return currentCustomer;
}

function buildItemRows(transactionEntries) {
  let header = `<tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          bgcolor="#eee" valign="top">
          SKU
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          align="right" bgcolor="#eee" valign="top">
          Description
        </td>
      </tr>

      <tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          Extended Description
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          Quantity
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          Price
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          Tax
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          Lot
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          Sales Rep
        </td>
      </tr>
      
      `;

  let result = header;

  if (Array.isArray(transactionEntries)) {
    transactionEntries.forEach(entry => {
      result += `<tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.ItemLookupCode}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.Description}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.ExtendedDescription}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.Quantity}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.Price}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.SalesTax}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.lot}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.SalesRep}
        </td>

      </tr>
      
      `;
    });
  } else {
    result += `<tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.ItemLookupCode}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.Description}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.item.ExtendedDescription}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.Quantity}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.Price}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.SalesTax}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.lot}
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          ${entry.SalesRep}
        </td>

      </tr>
      
      `;
  }
  return result;
}

function buildTotals(currentSale) {
  let result = `
  <!-- Totals -->
      <tr>
        <td style="padding: 5px;" valign="top"></td>
        <td style="padding: 5px;" valign="top"></td>
        <td style="padding: 5px;" valign="top"></td>
        <td style="padding: 5px;" valign="top"></td>

        <td style="border-top-width: 2px; border-top-color: #eee; border-top-style: solid; font-weight: bold; padding: 5px;" align="right"
          valign="top">
          Total: ${currentSale.total}
        </td>
      </tr>
    </table>
  </div>
</body>`;
}

function getHTMLTemplate(currentSale) {
  let logo = "";
  return `<style>
  body {
    font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
    text-align: center;
    color: #777;
  }

  body h1 {
    font-weight: 300;
    margin-bottom: 0px;
    padding-bottom: 0px;
    color: #000;
  }

  body h3 {
    font-weight: 300;
    margin-top: 10px;
    margin-bottom: 20px;
    font-style: italic;
    color: #555;
  }

  body a {
    color: #06F;
  }

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

<body style="font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; text-align: center; color: #777;">

  <div style="max-width: 800px; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; margin: auto; padding: 30px; border: 1px solid #eee;">
    <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
      <tr>
        <td colspan="2" style="padding: 5px;" valign="top">
          <table style="width: 100%; line-height: inherit; text-align: left;">
            <tr>
              <!-- LOGO -->
              <td style="font-size: 45px; line-height: 45px; color: #333; padding: 5px 5px 20px;" valign="top">
                <img src="${logo}" style="width: 100%; max-width: 300px;">
              </td>

              <!-- Invoice Info -->
              <td style="padding: 5px 5px 20px;" align="right" valign="top">
                Invoice #: ${currentSale.transNumber}
                <br> Date: ${currentSale.transactionDate}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td colspan="2" style="padding: 5px;" valign="top">
          <table style="width: 100%; line-height: inherit; text-align: left;">
            <tr>
              <!-- Gallery Info -->
              <td style="padding: 5px 5px 40px;" valign="top">
                ${currentSale.storeName}
                <br> ${currentSale.store.Address1}
                <br> ${currentSale.store.City}, ${currentSale.store.State} ${
    currentSale.store.Zip
  }
              </td>`;
}

function buildSaleHTML(sale, storeID) {
  let currentSale = sale;
  let currentStoreID = storeID;
  let logo = "";

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
    Object.keys(currentSale.customer).length != 0 &&
    currentSale.tenders.constructor === Object
  ) {
    html += buildCustomer(currentSale.customer) + "\n";
  }

  if (
    Object.keys(currentSale.tenders).length != 0 &&
    currentSale.tenders.constructor === Object
  ) {
    html += buildTenders(currentSale.tenders) + "\n";
  }

  if (currentSale.transactionEntries.length > 0) {
    html += buildItemRows(currentSale.transactionEntries);
  }

  html += buildTotals(currentSale);

  return html;
}

function buildPaymentHTML(layaway, storeID) {}

function buildLayawayHTML(layaway, storeID) {}

module.exports = {
  email: email,
  buildSaleHTML: buildSaleHTML,
  buildLayawayHTML: buildLayawayHTML,
  buildPaymentHTML: buildPaymentHTML
};
