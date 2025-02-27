import fs from "node:fs";
import path from "node:path";
import handlebars from "handlebars";

interface File {
  path: string;
  content: string;
}

export interface TemplateMeta {
  name: string;
  file: File;
  data: Record<string, unknown>;
}

enum ActionType {
  ADD = 'add',
  UPDATE = 'update',
  REMOVE = 'remove',
}
interface Action {
  type: ActionType;
  template: TemplateMeta;
}

function createFile(filePath: string, fileContent: string) {
  const fileDirectory = path.dirname(filePath);

  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  fs.writeFileSync(filePath, fileContent);
}

export class Template {
  templateMeta: TemplateMeta[] = [];

  actions: Action[] = [];

  isExist(name: string) {
    return this.templateMeta.some(item => item.name === name);
  }

  get(name: string): undefined | TemplateMeta {
    return this.templateMeta.find(item => item.name === name);
  }

  create(name: string, file: File, data: Record<string, unknown>): TemplateMeta {
    return {
      name,
      file,
      data,
    }
  }

  add(template: TemplateMeta) {
    if (this.isExist(template.name)) {
      this.update(template);
      return;
    }
    this.templateMeta.push(template);

    this.actions.push({
      type: ActionType.ADD,
      template,
    })
  }

  update(template: TemplateMeta) {
    if (!this.isExist(template.name)) {
      return;
    }

    this.templateMeta = this.templateMeta.map(item => {
      if (item.name === template.name) {
        return template;
      }

      return item;
    })

    this.actions.push({
      type: ActionType.UPDATE,
      template,
    })
  }

  remove(name: string) {
    let template: TemplateMeta | undefined;
    this.templateMeta = this.templateMeta.filter(item => {
      if (item.name === name) {
        template = item;
        return true;
      }

      return false;
    });

    if (!template) {
      return;
    }

    this.actions.push({
      type: ActionType.REMOVE,
      template,
    });
  }

  render() {
    for (const action of this.actions) {
      const template = action.template;
      switch (action.type) {
        case ActionType.ADD:
        case ActionType.UPDATE: {
          const filePath = template.file.path;
          const fileContent = handlebars.compile(template.file.content)(template.data);
          createFile(filePath, fileContent);
          break;
        }
        case ActionType.REMOVE:
          fs.rmSync(template.file.path);
          break;
        default:
          break;
      }
    }

    this.actions = [];
  }
}
