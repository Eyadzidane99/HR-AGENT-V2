const fs = require("fs");
const path = require("path");

const nextDirectory = path.join(__dirname, "..", ".next");

fs.rmSync(nextDirectory, { recursive: true, force: true });
