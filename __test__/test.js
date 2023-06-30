import { expect, it, describe, beforeEach } from 'vitest'
import fs from "fs";
import path from "path";
import { getModpackFileIds, getModpackId, getModpackVersionId, getFileUrl, getCurseForgeFileUrl,
    saveFile, 
    downloadModpack} from '../functions';

const testBaseDir = "test";

function getFiles(dirPath, files)
{
    const filesCurrentDir = fs.readdirSync(dirPath);
    
    let allFiles = files || [];
    
    for (const fileName of filesCurrentDir)
    {
        const filePath = path.join(dirPath, fileName);
    
        if (fs.statSync(filePath).isDirectory())
        {
            allFiles = getFiles(filePath, allFiles);
        }
        else
        {
            allFiles.push(fileName);
        }
    }

    return allFiles;
}

describe("Modpack Download", () => {

    beforeEach(() => {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
        fs.mkdirSync(testBaseDir, { recursive: true });
    });

    it("Get Modpack ID", async () => {
        expect(await getModpackId("Sky Factory 2.5")).toBeGreaterThan(0);
    });

    it("Get Modpack Version ID", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        expect(await getModpackVersionId(modId)).toBeGreaterThan(0);
    });

    it("Get Modpack Files ID", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        const modVersionId = await getModpackVersionId(modId);

        expect((await getModpackFileIds(modId, modVersionId)).length).toBeGreaterThan(0);
    });

    it("Get Curseforge File", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        const modVersionId = await getModpackVersionId(modId);

        const modFile = (await getModpackFileIds(modId, modVersionId)).filter(v => v.url.length > 0)[0].id;

        // console.log(`FILE: ${JSON.stringify(await getFileUrl(modFile))}`);
        expect(await getFileUrl(modFile)).toBeDefined();
    });

    it("Get Curseforge File URL", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        const modVersionId = await getModpackVersionId(modId);

        const files = (await getModpackFileIds(modId, modVersionId));

        const curseForgeFiles = files.filter(v => v.curseforge)[0];

        // console.log(`CURSE FORGE FILE: ${await getCurseForgeFileUrl(curseForgeFiles.curseforge.project,
        //     curseForgeFiles.curseforge.file)}`);

        expect((await getCurseForgeFileUrl(curseForgeFiles.curseforge.project,
            curseForgeFiles.curseforge.file)).length).toBeGreaterThan(0);
    });

    it("Download FTB File", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        const modVersionId = await getModpackVersionId(modId);

        const file = (await getModpackFileIds(modId, modVersionId)).filter(v => v.url)[0];

        const filePath = path.join(testBaseDir, file.name);

        // console.log(`${file.url}`);
        await saveFile(file.url, filePath);

        expect(fs.existsSync(filePath)).toBeTruthy();
    });

    it("Download Curseforge File", async () => {
        const modId = await getModpackId("Sky Factory 2.5");

        const modVersionId = await getModpackVersionId(modId);

        const file = (await getModpackFileIds(modId, modVersionId)).filter(v => v.curseforge)[0];

        const url = await getCurseForgeFileUrl(file.curseforge.project,
            file.curseforge.file);

        const filePath = path.join(testBaseDir, file.name);

        // console.log(`${url}`);
        await saveFile(url, filePath);

        expect(fs.existsSync(filePath)).toBeTruthy();
    });

    it("Download Entire Modpack", async () => {
        const baseDir = path.join(testBaseDir, "mpOutput");

        await downloadModpack("Sky Factory 2.5", baseDir, 1, 1, false);

        expect(getFiles(baseDir).length).toBe(2);
    });
});