const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());
let db = null;

const initializationDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error at ${e.message}`);
  }
};
initializationDBandServer();

const connectDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state`;
  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((each) => {
      return connectDbObjectToResponseObject(each);
    })
  );
});

//API 2

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(connectDbObjectToResponseObject(state));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const postDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths) 
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT * FROM district NATURAL JOIN state WHERE district_id = ${districtId}`;
  const state = await db.get(getStateNameQuery);
  response.send({
    stateName: state.state_name,
  });
});

module.exports = app;
