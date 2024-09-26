import express, { Request, Response } from "express";
import request from "supertest";
import yargs, { demandOption, describe } from "yargs";
import { hideBin } from "yargs/helpers";
import { JsonReader, JsonServer } from "./JsonReader";
import { JsonWriter } from "./JsonWriter";

const app = express();
const port = 3000;

app.use(express.json());

interface CommandLineArgs {
  jsonFile: string;
  test: boolean;
}

const argv = yargs(hideBin(process.argv)).options({
  jsonFile: {
    type: "string",
    demandOption: true,
    describe: "Pad naar configuratie Bestand",
  },
  test: {
    type: "boolean",
    demandOption: true,
    describe:
      "Test Mode true/false in test mode word de config bestand niet aangepast",
  },
}).argv as unknown as CommandLineArgs;

const jsonFilePath = argv.jsonFile;
const testMode = argv.test;

const jsonReader = new JsonReader(jsonFilePath);
const jsonWriter = new JsonWriter(jsonFilePath);
const db = jsonReader.readJson();

app.get("/:route", (req: Request, res: Response) => {
  // query om te searchen
  let query = req.query.q;
  let data: object[];

  const server = db.find(
    (jsonServer: JsonServer) => jsonServer.route === req.params.route
  );
  if (!server) {
    return res.status(404).json("Route doesn't exist");
  }

  if (query) {
    try {
      data = JSON.parse(server!.data);
    } catch (error) {}

    // search de value van de object keys
    data = data!.filter((obj) =>
      Object.values(obj).some((value) =>
        String(value).toLowerCase().includes(String(query).toLowerCase())
      )
    );
  } else {
    data = JSON.parse(server!.data);
  }

  res.status(200).json(data!);
});

app.delete("/:route/:id", (req: Request, res: Response) => {
  const server = db.find(
    (jsonServer: JsonServer) => jsonServer.route === req.params.route
  );

  if (!server) {
    return res.status(404).json("Route doesn't exist");
  }

  let items: any[] = [];

  try {
    items = JSON.parse(server.data);
  } catch (error) {
    return res.status(500).json("Error parsing server data");
  }

  const itemId = parseInt(req.params.id);
  const indexToRemove = items.findIndex((item: any) => item.id === itemId);

  if (indexToRemove === -1) {
    return res.status(404).json({ error: "Person not found" });
  }

  items.splice(indexToRemove, 1);
  server.data = JSON.stringify(items);
  if (!testMode) {
    jsonWriter.writeJson(db);
    jsonReader.readJson();
  }

  res.status(204).send();
});

app.patch("/:route/:id", (req: Request, res: Response) => {
  const server = db.find(
    (jsonServer: JsonServer) => jsonServer.route === req.params.route
  );

  if (!server) {
    return res.status(404).json("Route doesn't exist");
  }

  const itemId = parseInt(req.params.id);
  const items = JSON.parse(server.data);
  const indexToUpdate = items.findIndex((item: any) => item.id === itemId);

  if (indexToUpdate === -1) {
    return res.status(404).json({ error: "Person not found" });
  }

  const validProperties = server.properties;
  const requestBodyKeys = Object.keys(req.body);

  for (const key of requestBodyKeys) {
    if (!validProperties.includes(key)) {
      return res.status(400).json({ error: `Invalid property: ${key}` });
    }
  }

  const updatedItem = { ...items[indexToUpdate], ...req.body };
  items[indexToUpdate] = updatedItem;

  server.data = JSON.stringify(items);
  if (!testMode) {
    jsonWriter.writeJson(db);
    jsonReader.readJson();
  }

  res.status(200).json(updatedItem);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// tests
// non exsisting route *NOTFOUND*
function Tests() {
  request(app)
    .get("/nonexistingroute")
    .expect(404)
    .end(function (err, res) {
      if (err) throw err;
    });

  // get from test route *SUCCES*
  request(app)
    .get("/test")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "74")
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
    });

  // patch test with id 2 *SUCCES*
  request(app)
    .patch("/test/2")
    .send({ test: "fromTest" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
    });

  // search from test found *SUCCES*
  request(app)
    .get("/test?q=test3")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "25")
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
    });

  // search from test not found *SUCCES*
  request(app)
    .get("/test?q=nonexistingtest")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "2")
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
    });

  // delete from test with id 1 *SUCCES*
  request(app)
    .delete("/test/1")
    .expect(204)
    .end(function (err, res) {
      if (err) throw err;
    });

  // delete from test with id 99 *NOTFOUND*
  request(app)
    .delete("/test/99")
    .expect(404)
    .end(function (err, res) {
      if (err) throw err;
    });
}

if (testMode) {
  Tests();
}
