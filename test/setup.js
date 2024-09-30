// // test/setup.js

// import chaiHttp from "chai-http";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Use require for CommonJS modules
// const chaiCommonJS = require("chai");

// // Dynamically import the app
// const appPath = join(__dirname, "..", "server.js");
// const app = await import(appPath);

// chaiCommonJS.use(chaiHttp);
// chaiCommonJS.should();

// export const expect = chaiCommonJS.expect;
// export const request = chaiCommonJS.request(app.default || app);
