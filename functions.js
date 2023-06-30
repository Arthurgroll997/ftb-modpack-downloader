import ps from "prompt-sync";
import fetch from "node-fetch";
import https from "https";
import fs from "fs";
import path from "path";
import { modUrl, modpackUrl, curseForgeFileUrl, curseForgeApiKey } from "./constants.js";

export async function getModpackId(name)
{
    const res = await (await fetch(`${modpackUrl}/search/1?term=${name}`)).json();

    return res.packs[0];
}

export async function getModpackVersionId(modId)
{
    const res = await (await fetch(`${modpackUrl}${modId}`)).json();

    return res.versions[res.versions.length - 1].id;
}

export async function getModpackFileIds(modpackId, modpackVersionId)
{
    const res = (await fetch(`${modpackUrl}${modpackId}/${modpackVersionId}`)).json();

    return (await res).files;
}

export async function saveFile(url, filePath)
{
    return await new Promise((resolve, reject) => {
        https.get(url, response => {
            const code = response.statusCode ?? 0;
        
            if (code >= 400)
                return reject(new Error(response.statusMessage));
        
            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location)
                return resolve(saveFile(response.headers.location, filePath))
        
            // save the file to disk
            const fileWriter = fs.createWriteStream(filePath).on('finish', () => resolve({}));
        
            response.pipe(fileWriter);
        }).on('error', error => {
            reject(error);
        });
    });
}

export async function getFileUrl(fileId)
{
    const res = (await fetch(`${modUrl}${fileId}`)).json();

    return res;
}

export async function getCurseForgeFileUrl(project, file)
{
    const res = (await fetch(`${curseForgeFileUrl}${project}/files/${file}`, {
        headers: {
            'Accept':'application/json',
            'x-api-key': curseForgeApiKey,
        }
    })).json();

    return (await res).data.downloadUrl;
}

export function read()
{
    const prompt = ps();

    return prompt();
}

function showProgress(filesDownloaded, totalFiles)
{
    let progressStr = "";
    const percentage = filesDownloaded / totalFiles * 100.0;

    for (let i = 0; i < 10; i++)
        progressStr += (parseInt(percentage) / 10) - 1 >= i ? "#" : ".";

    console.clear();
    console.log(`Downloading...\n${percentage.toFixed(2)}% [${filesDownloaded}/${totalFiles}] (${progressStr})`);
}

export async function downloadModpack(name, basePath, ftbModLimit, curseForgeModLimit, waitUserInput)
{
    if (!fs.existsSync(basePath))
        fs.mkdirSync(basePath, { recursive: true });

    let modsWithError = [];

    console.log("Obtaining modpack information...");

    const modId = await getModpackId(name);
    const modVersionId = await getModpackVersionId(modId);

    const files = await getModpackFileIds(modId, modVersionId);

    const curseForgeFiles = files.filter(v => v.curseforge);
    const ftbFiles = files.filter(v => v.url);

    const totalFiles = curseForgeFiles.length + ftbFiles.length;
    let downloadedFiles = 0;

    console.log("Starting download...\n");

    for (let i = 0; i < curseForgeFiles.length; i++)
    {
        if (curseForgeModLimit != -1 && i >= curseForgeModLimit)
            break;

        let v = curseForgeFiles[i];

        const file = path.join(basePath, `${v.path}${v.name}`);

        if (fs.existsSync(file))
        {
            downloadedFiles++;
            continue;
        }

        if (!fs.existsSync(path.dirname(file)))
            fs.mkdirSync(path.dirname(file), { recursive: true });
        
        const url = await getCurseForgeFileUrl(v.curseforge.project,
            v.curseforge.file);

        if (!url)
        {
            modsWithError.push(v.name);
            downloadedFiles++;
            continue;
        }

        await saveFile(url, file);
        downloadedFiles++;
        showProgress(downloadedFiles, totalFiles);
    }

    for (let i = 0; i < ftbFiles.length; i++)
    {
        if (ftbModLimit != -1 && i >= ftbModLimit)
            break;

        let v = ftbFiles[i];

        const file = path.join(basePath, `${v.path}${v.name}`);

        if (fs.existsSync(file))
        {
            downloadedFiles++;
            continue;
        }

        if (!fs.existsSync(path.dirname(file)))
            fs.mkdirSync(path.dirname(file), { recursive: true });

        await saveFile(v.url, file);

        downloadedFiles++;

        showProgress(downloadedFiles, totalFiles);
    }

    showProgress(downloadedFiles, totalFiles);

    if (modsWithError.length > 0)
    {
        console.log("\nThe following mods could not be downloaded, please download them manually:\n");

        modsWithError.forEach(m => console.log(`- ${m}\n`));
    }

    console.log("\nDownload completed!\n\nPress <ENTER> to continue...");

    if (waitUserInput)
        read();
}