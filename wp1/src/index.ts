import express, { Request, Response } from "express";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { JsonReader, JsonServer } from "./JsonReader";
import { JsonWriter } from "./JsonWriter";

const app = express();
const port = 3000;

app.use(express.json());

interface CommandLineArgs {
  jsonFile: string;
}

const argv = yargs(hideBin(process.argv)).options({
  jsonFile: {
    type: "string",
    demandOption: true,
    describe: "Pad naar configuratie Bestand",
  },
}).argv as unknown as CommandLineArgs;

const jsonFilePath = argv.jsonFile;

const jsonReader = new JsonReader(jsonFilePath);
const jsonWriter = new JsonWriter(jsonFilePath);
const db = jsonReader.readJson();

app.get("/:route", (req: Request, res: Response) => {
  const server = db.find(
    (jsonServer: JsonServer) => jsonServer.route === req.params.route
  );
  if (!server) {
    res.status(404).json("Route doesn't exist");
  }

  res.status(200).json(server?.data);
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
  jsonWriter.writeJson(db);
  jsonReader.readJson();

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
  jsonWriter.writeJson(db);
  jsonReader.readJson();

  res.status(200).json(updatedItem);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
