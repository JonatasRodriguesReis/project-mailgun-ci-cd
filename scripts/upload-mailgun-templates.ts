import "dotenv/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import FormData from "form-data";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_USERNAME = process.env.MAILGUN_USERNAME ?? "api";

const uploadTemplate = async (
  templateName: string,
  templateContent: string
) => {
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/templates`;

  try {
    if (!MAILGUN_API_KEY) {
      throw new Error("MAILGUN_API_KEY is not set");
    }

    const form = new FormData();
    form.append("name", templateName);
    form.append("description", `Template for ${templateName}`);
    form.append("template", templateContent);

    await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization:
          "Basic " +
          Buffer.from(`${MAILGUN_USERNAME}:${MAILGUN_API_KEY}`).toString(
            "base64"
          ),
      },
    });
    console.log(`Uploaded template: ${templateName}`);
  } catch (error) {
    console.error(`Failed to upload template: ${templateName}`, error);
  }
};

const preprocessTemplate = (templateContent: string, partialsDir: string) => {
  // Register partials
  const partialFiles = fs.readdirSync(partialsDir);
  partialFiles.forEach((file) => {
    const partialName = path.basename(file, path.extname(file));
    const partialContent = fs.readFileSync(
      path.join(partialsDir, file),
      "utf-8"
    );
    Handlebars.registerPartial(partialName, partialContent);
  });

  // Compile template
  const template = Handlebars.compile(templateContent);
  return template({});
};

const uploadTemplates = async () => {
  const templatesDir = path.join(__dirname, "../mailgun-templates");
  const partialsDir = path.join(__dirname, "../mailgun-templates/partials");
  const templateFiles = fs
    .readdirSync(templatesDir)
    .filter((file) => !file.startsWith("partials"));

  for (const file of templateFiles) {
    const templateName = path.basename(file, path.extname(file));
    const templateContent = fs.readFileSync(
      path.join(templatesDir, file),
      "utf-8"
    );
    const processedContent = preprocessTemplate(templateContent, partialsDir);
    await uploadTemplate(templateName, processedContent);
  }
};

uploadTemplates();
