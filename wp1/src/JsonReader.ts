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
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading or parsing JSON:", error);
      return []; // wat moet doen error!!
    }
  }
}
