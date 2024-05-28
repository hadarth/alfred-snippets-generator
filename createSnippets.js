const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const csv = require("csv-parser");
const AdmZip = require("adm-zip");

const RESULT_COLLECTION_NAME = "My New Snippet Collection";

function buildJsonFiles() {
  const sourceFile = "snippets.csv";
  const fieldnames = ["name", "keyword", "content"];

  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(sourceFile)
      .pipe(csv({ headers: fieldnames }))
      .on("data", (row) => {
        const uid = crypto.randomBytes(15).toString("hex");
        const output = JSON.stringify(
          {
            alfredsnippet: {
              snippet: row["content"],
              uid: uid,
              keyword: row["keyword"],
              name: row["name"],
            },
          },
          null,
          4
        );

        const outputFile = path.join(
          RESULT_COLLECTION_NAME,
          `${row["name"]} [${uid}].json`
        );
        fs.writeFileSync(outputFile, output);
        results.push(outputFile);
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

function zipFiles() {
  const zip = new AdmZip();
  const folderPath = RESULT_COLLECTION_NAME;
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    zip.addLocalFile(filePath);
  });

  zip.writeZip(`${RESULT_COLLECTION_NAME}.zip`);
}

function changeZipExtension() {
  const zipPath = `${RESULT_COLLECTION_NAME}.zip`;
  const newPath = `${RESULT_COLLECTION_NAME}.alfredsnippets`;
  fs.renameSync(zipPath, newPath);
}

function main() {
  if (!fs.existsSync(RESULT_COLLECTION_NAME)) {
    fs.mkdirSync(RESULT_COLLECTION_NAME);
  }

  fs.copyFileSync("./info.plist", `./${RESULT_COLLECTION_NAME}/info.plist`);

  buildJsonFiles()
    .then(() => {
      zipFiles();
      changeZipExtension();
      fs.rmdirSync(RESULT_COLLECTION_NAME, { recursive: true });
      console.log("Snippet collection created successfully.");
    })
    .catch((err) => {
      console.error("Error creating snippet collection:", err);
    });
}

main();
