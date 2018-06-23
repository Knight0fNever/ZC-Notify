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

function buildSaleHTML(sale, storeID) {
  let currentSale = sale;
  let currentStoreID = storeID;
  let logo = "";

  let tenders = buildTenders(currentSale.tenders);

  if (currentStoreID == 229) {
    logo = storeConfig[0].logo;
  } else if (currentStoreID == 213) {
    logo = storeConfig[1].logo;
  } else if (currentStoreID == 223) {
    logo = storeConfig[2].logo;
  } else if (currentStoreID == 1018) {
    logo = storeConfig[3].logo;
  }

  let html = `<style>
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
              </td>

              <!-- Customer Info -->
              <td style="padding: 5px 5px 40px;" align="right" valign="top">
                ${currentSale.customer.company}
                <br> ${currentSale.customer.firstName} ${
    currentSale.customer.lastName
  }
                <br>${currentSale.customer.address.address}
                <br>${currentSale.customer.address.address2}
                <br>${currentSale.customer.address.city}, ${
    currentSale.customer.address.state
  } ${currentSale.customer.address.zip} ${currentSale.customer.address.country}
  <br>${currentSale.customer.phoneNumber}
                <br>${currentSale.customer.email}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${tenders}

      <!-- Item Details -->
      <tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          bgcolor="#eee" valign="top">
          Item
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #ddd; border-bottom-style: solid; font-weight: bold; padding: 5px;"
          align="right" bgcolor="#eee" valign="top">
          Price
        </td>
      </tr>

      <tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          Website design
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          $300.00
        </td>
      </tr>

      <tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" valign="top">
          Hosting (3 months)
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: solid; padding: 5px;" align="right"
          valign="top">
          $75.00
        </td>
      </tr>

      <tr>
        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: none; padding: 5px;" valign="top">
          Domain name (1 year)
        </td>

        <td style="border-bottom-width: 1px; border-bottom-color: #eee; border-bottom-style: none; padding: 5px;" align="right" valign="top">
          $10.00
        </td>
      </tr>

      <!-- Totals -->
      <tr>
        <td style="padding: 5px;" valign="top"></td>

        <td style="border-top-width: 2px; border-top-color: #eee; border-top-style: solid; font-weight: bold; padding: 5px;" align="right"
          valign="top">
          Total: $385.00
        </td>
      </tr>
    </table>
  </div>
</body>`;
}

function buildPaymentHTML(layaway, storeID) {}

function buildLayawayHTML(layaway, storeID) {}

module.exports = {
  email: email,
  buildSaleHTML: buildSaleHTML,
  buildLayawayHTML: buildLayawayHTML,
  buildPaymentHTML: buildPaymentHTML
};
