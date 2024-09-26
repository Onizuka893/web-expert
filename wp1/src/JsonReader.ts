import fs from "fs";

export interface JsonServer {
  route: string;
  properties: string[];
  data: string;
}

export class JsonReader {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public readJson(): JsonServer[] {
    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      const json = JSON.parse(data);
      for (let i = 0; i < json.length; i++) {
        const element: JsonServer = json[i];
        element.data = JSON.stringify(element.data);
      }
      return json;
    } catch (error) {
      console.error("Error reading or parsing JSON:", error);
      return []; // wat moet doen error!!
    }
  }
}
