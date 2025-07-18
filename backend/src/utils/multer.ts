import multer from 'multer'
import path from 'path'
import fs from 'fs'

const tempDirForTempUploads = path.join(__dirname, '../../temp/generals')
fs.mkdirSync(tempDirForTempUploads, { recursive: true })

export const tempUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tempDirForTempUploads),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
})

const tempDirForReports = path.join(__dirname, '../../temp/reports')
fs.mkdirSync(tempDirForReports, { recursive: true })
