import fs from "fs";
import { JsonServer } from "./JsonReader";

export class JsonWriter {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public writeJson(data: JsonServer[]) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Error reading or parsing JSON:", error);
      return data;
    }
  }
}
