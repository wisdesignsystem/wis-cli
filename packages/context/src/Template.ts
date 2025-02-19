import fs from "node:fs";
import path from "node:path";
import handlebars from "handlebars";

interface TemplateFile {
  name: string;
  filePath: string;
  fileContent: string;
}

export class Template {
  data: Record<string, unknown> = {};

  templateFiles: TemplateFile[] = [];

  getData() {
    return this.data;
  }

  setData(key: string, value: unknown) {
    this.data[key] = value;
  }

  hasTemplate(name: string) {
    return this.templateFiles.some(item => item.name === name);
  }

  getTemplate(name: string) {
    return this.templateFiles.find(item => item.name === name);
  }

  addTemplate(name: string, filePath: string, fileContent: string) {
    if (this.hasTemplate(name)) {
      this.updateTemplate(name, filePath, fileContent);
      return;
    }

    this.templateFiles.push({
      name,
      filePath,
      fileContent,
    });
  }

  updateTemplate(name: string, filePath: string, fileContent: string) {
    const template = this.getTemplate(name);
    if (!template) {
      return;
    }

    template.filePath = filePath;
    template.fileContent = fileContent;
  }

  renderTemplate(name: string) {
    const template = this.getTemplate(name);
    if (!template) {
      return;
    }

    const filePath = template.filePath
    const fileContent = handlebars.compile(template.fileContent)(this.data);
    const fileDirectory = path.dirname(filePath);

    if (!fs.existsSync(fileDirectory)) {
      fs.mkdirSync(fileDirectory, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent);
  }

  render() {
    for (const templateFile of this.templateFiles) {
      this.renderTemplate(templateFile.name);
    }
  }
}
