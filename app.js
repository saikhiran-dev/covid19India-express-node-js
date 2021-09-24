const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            state_id as stateId, state_name as stateName, 
            population
        FROM state;
    `;
  const states = await db.all(getStatesQuery);
  response.send(states);
});

//2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT
            state_id as stateId,
            state_name as stateName,
            population
        FROM state
        WHERE state_id = ${stateId};
    `;
  const getState = await db.get(getStateQuery);
  response.send(getState);
});

//3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
        VALUES (
            '${districtName}', ${stateId}, ${cases},
             ${cured}, ${active}, ${deaths}
        );
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
        district_id as districtId, district_name as districtName,
        state_id as stateId, cases, cured, active, deaths
    FROM district
    WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//6
app.put("/districts/:districtId", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetails = `
        UPDATE district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT
             SUM(cases) as totalCases,
             SUM(cured) as totalCured,
             SUM(active) as totalActive,
             SUM(deaths) as totalDeaths
        FROM district
        WHERE state_id = ${stateId};
    `;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

//8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
        SELECT state.state_name as stateName
        FROM district INNER JOIN state ON district.state_id = state.state_id
        WHERE district_id = ${districtId};
    `;
  const state = await db.get(getStateQuery);
  response.send(state);
});

module.exports = app;
