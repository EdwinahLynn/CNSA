/**
 * Seeds positions and recruiting sources.
 * Run: node src/seedLookups.js
 */
require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
};

const positions = [
  'Goalkeeper',
  'Center Back',
  'Left Back',
  'Right Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Left Midfielder',
  'Right Midfielder',
  'Left Winger',
  'Right Winger',
  'Striker',
  'Center Forward'
];

const recruitingSources = [
  { name: 'Local High School',      type: 'High School' },
  { name: 'Regional Club',          type: 'Club'        },
  { name: 'Provincial Academy',     type: 'Provincial'  },
  { name: 'Community College',      type: 'College'     },
  { name: 'National Youth Program', type: 'Provincial'  },
  { name: 'Club Team',              type: 'Club'        },
];

async function seed() {
  const pool = await sql.connect(config);
  let added = 0;

  console.log('--- Seeding Positions ---');
  for (const name of positions) {
    const exists = await pool.request()
      .input('name', sql.VarChar(50), name)
      .query('SELECT PositionID FROM Position WHERE PositionName = @name');

    if (exists.recordset.length > 0) {
      console.log(`  skipped (exists): ${name}`);
    } else {
      await pool.request()
        .input('name', sql.VarChar(50), name)
        .query('INSERT INTO Position (PositionName) VALUES (@name)');
      console.log(`  added: ${name}`);
      added++;
    }
  }

  console.log('\n--- Seeding Recruiting Sources ---');
  for (const src of recruitingSources) {
    const exists = await pool.request()
      .input('name', sql.VarChar(100), src.name)
      .query('SELECT RecruitSourceID FROM RecruitingSource WHERE SourceName = @name');

    if (exists.recordset.length > 0) {
      console.log(`  skipped (exists): ${src.name}`);
    } else {
      await pool.request()
        .input('name', sql.VarChar(100), src.name)
        .input('type', sql.VarChar(50),  src.type)
        .query('INSERT INTO RecruitingSource (SourceName, SourceType) VALUES (@name, @type)');
      console.log(`  added: ${src.name} (${src.type})`);
      added++;
    }
  }

  console.log(`\nDone — ${added} records added.`);
  await pool.close();
}

seed().catch(console.error);
