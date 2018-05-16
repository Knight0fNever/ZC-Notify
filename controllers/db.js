const sql = require('mssql');
const fs = require('fs');
let myExports = {};

const config = JSON.parse(fs.readFileSync('./dbconfig.json', 'utf8'));

let query = (myExports.query = async function query(query) {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(query);

    pool.close();
    return result;
  } catch (err) {
    console.log('Query Error:', err);
  }
});

sql.on('error', err => {
  console.log('Server Error:', err);
});

module.exports = myExports;
