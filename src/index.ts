import express, { urlencoded, json, ErrorRequestHandler } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { authorizationMiddleware, HttpError } from "./utils";

const port = process.env.PORT || 8000;

const app = express();

const TMP_DIR = path.join(__dirname + "/../tmp");
let dirExists = fs.existsSync(TMP_DIR);
if (!dirExists) {
  fs.mkdirSync(TMP_DIR);
}

const OUT_DIR = path.join(__dirname + "/../out");
dirExists = fs.existsSync(OUT_DIR);
if (!dirExists) {
  fs.mkdirSync(OUT_DIR);
}

const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    // Set the destination where files will be stored
    cb(null, "tmp/");
  },
  filename: function (_req, file, cb) {
    const newFilename = file.originalname;
    cb(null, newFilename); // Rename the file with a unique suffix
  },
});

const upload = multer({ storage });

app.use(urlencoded({ extended: true }));
app.use(cors());
app.use(json());

// this will serve the static files hosted in OUT directory
app.use(express.static(OUT_DIR));

app.get("/", (_req, res) => {
  res.status(200).json({ msg: "Server is up and running" });
});

app.post(
  "/fuxam-scorm",
  authorizationMiddleware,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const filePath = req.file?.path;
      if (!filePath) throw new HttpError("Missing file", 400);

      const filenameArr = req.file?.filename.split(".");
      const extension = filenameArr?.pop();
      const filename = filenameArr?.join(".");
      const OUT = path.join(OUT_DIR + "/" + filename);

      // delete folder if already exist
      if (fs.existsSync(OUT)) {
        await new Promise<void>((resolve, reject) =>
          fs.rm(OUT, { recursive: true, force: true }, (err) =>
            err ? reject(err) : resolve()
          )
        );
      }

      fs.mkdirSync(OUT, { recursive: true });

      const pathToZip = TMP_DIR + "/" + req.file?.filename;
      const zip = new AdmZip(pathToZip);

      // extract zip contents to out
      zip.extractAllTo(OUT);

      // remove file from tmp dir
      fs.rmSync(TMP_DIR + "/" + filename + "." + extension);

      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

app.all("*", (_req, _res, next) => {
  next(Error("Not Found"));
});

app.use(((error, req, res, _next) => {
  if (error instanceof HttpError) {
    const data = {
      message: error.message,
      path: `${req.method} ${req.url}`,
    };

    console.log({ ...data, status: error.status || 500 });

    return res.status(error.status || 500).json(data);
  }

  res.status(404).json({
    message: "Not Found",
    path: `${req.method} ${req.url}`,
  });
}) as ErrorRequestHandler);

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
