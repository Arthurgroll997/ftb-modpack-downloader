import { read, downloadModpack } from "./functions.js";

console.log("Modpack: ");
const mpName = read();

if (!process.env.CURSEFORGE_API_KEY)
    console.log("CONFIGURE YOUR API KEY FIRST!");
else
    (async () => await downloadModpack(mpName, "modpack", -1, -1, true))();