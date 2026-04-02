/**
 * Migration: add CoachID to Player and Users tables
 * Run: node src/config/migrate.js
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

async function migrate() {
  const pool = await sql.connect(config);

  // ── New tables ──────────────────────────────────────────────────────────────

  await pool.request().query(`
    IF OBJECT_ID('dbo.HighSchool','U') IS NULL
    CREATE TABLE HighSchool (
      HighSchoolID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
      HighSchoolName VARCHAR(100) NOT NULL,
      PostalCode     VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode)
    )
  `);
  console.log('HighSchool table — done');

  await pool.request().query(`
    IF OBJECT_ID('dbo.ProvincialOrganization','U') IS NULL
    CREATE TABLE ProvincialOrganization (
      OrganizationID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
      OrganizationName VARCHAR(100) NOT NULL
    )
  `);
  console.log('ProvincialOrganization table — done');

  await pool.request().query(`
    IF OBJECT_ID('dbo.RecruitingIncident','U') IS NULL
    CREATE TABLE RecruitingIncident (
      IncidentID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
      PlayerID     INT          NOT NULL REFERENCES Player(PlayerID),
      Description  VARCHAR(255) NOT NULL,
      IncidentDate DATE         NOT NULL
    )
  `);
  console.log('RecruitingIncident table — done');

  await pool.request().query(`
    IF OBJECT_ID('dbo.RecruitingRanking','U') IS NULL
    CREATE TABLE RecruitingRanking (
      RankingID    INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
      PlayerID     INT NOT NULL REFERENCES Player(PlayerID),
      RankingValue INT NOT NULL CHECK (RankingValue >= 0),
      RankingYear  INT NOT NULL
    )
  `);
  console.log('RecruitingRanking table — done');

  // ── New columns on existing tables ──────────────────────────────────────────

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Player' AND COLUMN_NAME='CoachID')
    ALTER TABLE Player ADD CoachID INT NULL REFERENCES Coach(CoachID)
  `);
  console.log('Player.CoachID — done');

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Player' AND COLUMN_NAME='HighSchoolID')
    ALTER TABLE Player ADD HighSchoolID INT NULL REFERENCES HighSchool(HighSchoolID)
  `);
  console.log('Player.HighSchoolID — done');

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Stadium' AND COLUMN_NAME='OrganizationID')
    ALTER TABLE Stadium ADD OrganizationID INT NULL REFERENCES ProvincialOrganization(OrganizationID)
  `);
  console.log('Stadium.OrganizationID — done');

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME='Users' AND COLUMN_NAME='CoachID')
    ALTER TABLE Users ADD CoachID INT NULL REFERENCES Coach(CoachID)
  `);
  console.log('Users.CoachID — done');

  await pool.close();
  console.log('Migration complete.');
}

migrate().catch(console.error);
