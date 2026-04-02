-- CNSA Recruiting System — SQL Server Schema
-- Run via: npm run initdb

USE CNSA;
GO

-- =============================================
-- ADDRESS
-- =============================================
IF OBJECT_ID('dbo.Address', 'U') IS NULL
CREATE TABLE Address (
    PostalCode   VARCHAR(10)  NOT NULL PRIMARY KEY,
    CityName     VARCHAR(100) NOT NULL,
    ProvinceName VARCHAR(100) NOT NULL
);
GO

-- =============================================
-- SCHOOL
-- =============================================
IF OBJECT_ID('dbo.School', 'U') IS NULL
CREATE TABLE School (
    SchoolID         INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SchoolName       VARCHAR(100) NOT NULL,
    SchoolPopulation INT,
    StreetAddress    VARCHAR(100) NOT NULL,
    PostalCode       VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode)
);
GO

-- =============================================
-- POSITION
-- =============================================
IF OBJECT_ID('dbo.Position', 'U') IS NULL
CREATE TABLE Position (
    PositionID   INT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PositionName VARCHAR(50) NOT NULL UNIQUE
);
GO

-- =============================================
-- RECRUITING SOURCE
-- =============================================
IF OBJECT_ID('dbo.RecruitingSource', 'U') IS NULL
CREATE TABLE RecruitingSource (
    RecruitSourceID INT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SourceName      VARCHAR(100) NOT NULL,
    SourceType      VARCHAR(50)  NOT NULL
        CHECK (SourceType IN ('High School','Club','Provincial','College'))
);
GO

-- =============================================
-- HIGH SCHOOL
-- =============================================
IF OBJECT_ID('dbo.HighSchool', 'U') IS NULL
CREATE TABLE HighSchool (
    HighSchoolID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    HighSchoolName VARCHAR(100) NOT NULL,
    PostalCode     VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode)
);
GO

-- =============================================
-- PROVINCIAL ORGANIZATION
-- =============================================
IF OBJECT_ID('dbo.ProvincialOrganization', 'U') IS NULL
CREATE TABLE ProvincialOrganization (
    OrganizationID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    OrganizationName VARCHAR(100) NOT NULL
);
GO

-- =============================================
-- COACH
-- =============================================
IF OBJECT_ID('dbo.Coach', 'U') IS NULL
CREATE TABLE Coach (
    CoachID       INT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FirstName     VARCHAR(50) NOT NULL,
    LastName      VARCHAR(50) NOT NULL,
    Sex           CHAR(1)     NOT NULL CHECK (Sex IN ('M','F','O')),
    PhoneNumber   VARCHAR(15),
    Email         VARCHAR(100),
    StreetAddress VARCHAR(100) NOT NULL,
    PostalCode    VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode),
    SchoolID      INT          NOT NULL REFERENCES School(SchoolID)
);
GO

-- =============================================
-- COACH HISTORY (previous schools/positions)
-- =============================================
IF OBJECT_ID('dbo.CoachHistory', 'U') IS NULL
CREATE TABLE CoachHistory (
    HistoryID  INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CoachID    INT          NOT NULL REFERENCES Coach(CoachID),
    SchoolName VARCHAR(100) NOT NULL,
    Position   VARCHAR(100) NOT NULL
);
GO

-- =============================================
-- PLAYER
-- =============================================
IF OBJECT_ID('dbo.Player', 'U') IS NULL
CREATE TABLE Player (
    PlayerID             INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FirstName            VARCHAR(50)  NOT NULL,
    LastName             VARCHAR(50)  NOT NULL,
    Sex                  CHAR(1)      NOT NULL CHECK (Sex IN ('M','F','O')),
    PhoneNumber          VARCHAR(15),
    Email                VARCHAR(100),
    StreetAddress        VARCHAR(100) NOT NULL,
    PostalCode           VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode),
    SchoolID             INT          NOT NULL REFERENCES School(SchoolID),
    Status               VARCHAR(20)  NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active','Graduated','Inactive')),
    RecruitingRank       INT,
    HighSchoolID         INT          REFERENCES HighSchool(HighSchoolID),
    RecruitSourceID      INT          REFERENCES RecruitingSource(RecruitSourceID)
);
GO

-- =============================================
-- RECRUITING INCIDENT
-- =============================================
IF OBJECT_ID('dbo.RecruitingIncident', 'U') IS NULL
CREATE TABLE RecruitingIncident (
    IncidentID   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PlayerID     INT          NOT NULL REFERENCES Player(PlayerID),
    Description  VARCHAR(255) NOT NULL,
    IncidentDate DATE         NOT NULL
);
GO

-- =============================================
-- RECRUITING RANKING
-- =============================================
IF OBJECT_ID('dbo.RecruitingRanking', 'U') IS NULL
CREATE TABLE RecruitingRanking (
    RankingID    INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PlayerID     INT NOT NULL REFERENCES Player(PlayerID),
    RankingValue INT NOT NULL CHECK (RankingValue >= 0),
    RankingYear  INT NOT NULL
);
GO

-- =============================================
-- PLAYER POSITION (junction)
-- =============================================
IF OBJECT_ID('dbo.PlayerPosition', 'U') IS NULL
CREATE TABLE PlayerPosition (
    PlayerID   INT NOT NULL REFERENCES Player(PlayerID),
    PositionID INT NOT NULL REFERENCES Position(PositionID),
    PRIMARY KEY (PlayerID, PositionID)
);
GO

-- =============================================
-- STADIUM
-- =============================================
IF OBJECT_ID('dbo.Stadium', 'U') IS NULL
CREATE TABLE Stadium (
    StadiumID       INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    StadiumName     VARCHAR(100) NOT NULL,
    StreetAddress   VARCHAR(100) NOT NULL,
    PostalCode      VARCHAR(10)  NOT NULL REFERENCES Address(PostalCode),
    StadiumCapacity  INT          NOT NULL,
    OrganizationID   INT          NULL REFERENCES ProvincialOrganization(OrganizationID)
);
GO

-- =============================================
-- TEAM
-- =============================================
IF OBJECT_ID('dbo.Team', 'U') IS NULL
CREATE TABLE Team (
    TeamID   INT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SchoolID INT        NOT NULL REFERENCES School(SchoolID),
    CoachID  INT        NOT NULL REFERENCES Coach(CoachID),
    Season   VARCHAR(10) NOT NULL,
    Gender   VARCHAR(10) NOT NULL CHECK (Gender IN ('Men','Women','Mixed'))
);
GO

-- =============================================
-- TEAM PLAYER (junction)
-- =============================================
IF OBJECT_ID('dbo.TeamPlayer', 'U') IS NULL
CREATE TABLE TeamPlayer (
    TeamID   INT NOT NULL REFERENCES Team(TeamID),
    PlayerID INT NOT NULL REFERENCES Player(PlayerID),
    PRIMARY KEY (TeamID, PlayerID)
);
GO

-- =============================================
-- GAME
-- =============================================
IF OBJECT_ID('dbo.Game', 'U') IS NULL
CREATE TABLE Game (
    GameID        INT      NOT NULL IDENTITY(1,1) PRIMARY KEY,
    HomeTeamID    INT      NOT NULL REFERENCES Team(TeamID),
    AwayTeamID    INT      NOT NULL REFERENCES Team(TeamID),
    StadiumID     INT      NOT NULL REFERENCES Stadium(StadiumID),
    GameDate      DATE     NOT NULL,
    HomeTeamScore INT      NOT NULL DEFAULT 0,
    AwayTeamScore INT      NOT NULL DEFAULT 0,
    Attendance    INT
);
GO

-- =============================================
-- GAME STATS (junction)
-- =============================================
IF OBJECT_ID('dbo.GameStats', 'U') IS NULL
CREATE TABLE GameStats (
    PlayerID    INT NOT NULL REFERENCES Player(PlayerID),
    GameID      INT NOT NULL REFERENCES Game(GameID),
    PositionID  INT REFERENCES Position(PositionID),
    Goals       INT NOT NULL DEFAULT 0,
    Assists     INT NOT NULL DEFAULT 0,
    YellowCards INT NOT NULL DEFAULT 0,
    RedCards    INT NOT NULL DEFAULT 0,
    PRIMARY KEY (PlayerID, GameID)
);
GO

-- =============================================
-- INJURY
-- =============================================
IF OBJECT_ID('dbo.Injury', 'U') IS NULL
CREATE TABLE Injury (
    InjuryID       INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PlayerID       INT          NOT NULL REFERENCES Player(PlayerID),
    GameID         INT          NOT NULL REFERENCES Game(GameID),
    InjuryStatus   VARCHAR(50)  NOT NULL
        CHECK (InjuryStatus IN ('New','From this soccer season','From previous')),
    InjuryCause    VARCHAR(100),
    InjuryLocation VARCHAR(100),
    SurfaceType    VARCHAR(20) CHECK (SurfaceType IN ('Indoor','Outdoor')),
    Notes          TEXT
);
GO

-- =============================================
-- SCHOLARSHIP
-- =============================================
IF OBJECT_ID('dbo.Scholarship', 'U') IS NULL
CREATE TABLE Scholarship (
    ScholarshipID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PlayerID          INT           NOT NULL REFERENCES Player(PlayerID),
    ScholarshipName   VARCHAR(100)  NOT NULL,
    ScholarshipAmount DECIMAL(10,2),
    DateAwarded       DATE          NOT NULL
);
GO

-- =============================================
-- USERS
-- =============================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE Users (
    UserID       INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Username     VARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role         VARCHAR(20)  NOT NULL CHECK (Role IN ('CNSA_ADMIN','SCHOOL_ADMIN','COACH')),
    SchoolID     INT          REFERENCES School(SchoolID),
    IsActive     BIT          NOT NULL DEFAULT 1
);
GO

-- =============================================
-- AUDIT LOG
-- =============================================
IF OBJECT_ID('dbo.AuditLog', 'U') IS NULL
CREATE TABLE AuditLog (
    AuditID        INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    UserID         INT           NOT NULL REFERENCES Users(UserID),
    ActionType     VARCHAR(100)  NOT NULL,
    AffectedEntity VARCHAR(100)  NOT NULL,
    AffectedID     VARCHAR(50),
    Details        VARCHAR(500),
    Timestamp      DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO
