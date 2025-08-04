const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fsPromises = require("fs").promises;

const extractTextFromFile = async (fileData, mimetype) => {
  try {
    if (mimetype === "application/pdf") {
      const dataBuffer = Buffer.isBuffer(fileData)
        ? fileData
        : await fsPromises.readFile(fileData);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (Buffer.isBuffer(fileData)) {
        const result = await mammoth.extractRawText({ buffer: fileData });
        return result.value;
      } else {
        const result = await mammoth.extractRawText({ path: fileData });
        return result.value;
      }
    } else if (mimetype === "text/plain") {
      if (Buffer.isBuffer(fileData)) {
        return fileData.toString("utf8");
      } else {
        const data = await fsPromises.readFile(fileData, "utf8");
        return data;
      }
    }
    throw new Error("Unsupported file type");
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

const cleanupFile = async (filePath) => {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    console.log("Cleanup warning:", error.message);
  }
};

const ensureUploadsDir = async () => {
    try {
      await fsPromises.access("/tmp");
    } catch {
      await fsPromises.mkdir("/tmp", { recursive: true });
    }
    try {
      await fsPromises.access("/tmp/uploads");
    } catch {
      await fsPromises.mkdir("/tmp/uploads", { recursive: true });
    }
  };

module.exports = { extractTextFromFile, cleanupFile, ensureUploadsDir };
