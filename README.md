# FTB Modpack Downloader

The FTB Modpack Downloader is a Node.JS application created to download the modpack files of a FTB Modpack.
It was created after a friend of mine tried downloading Sky Factory 2.5 _manually_, and didn't know about the feature of downloading the modpack files within the FTB page. He discovered that functionality only after I finished this project, so I decided to post it here.

## Requirements

- Node.JS v18 or greater

## Usage

- Rename the `env.example` file to `.env` and enter your Curseforge API key according to the instructions in that file.
- Run `npm install`.
- Run `npm run start`
- Enter the modpack's name
- Enjoy the download's beautiful progress bar

## Important notes

This application will download the latest version of the modpack only. If you want to download a specific version, I recommend going to the FTB page and browse through the files of the version you want.

## License

This project is under the MIT License