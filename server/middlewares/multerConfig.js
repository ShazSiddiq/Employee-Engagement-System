import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

// Custom storage engine
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Allow files up to 50MB
  fileFilter: (req, file, cb) => {
    // Define minimum and maximum file size in bytes
    const minFileSize = 200 * 1024; // 200KB
    const maxFileSize = 50 * 1024 * 1024; // 50MB

    // Check file size
    if (file.size > maxFileSize) {
      return cb(new Error(`File must be less than ${maxFileSize / (1024 * 1024)} MB`));
    }

    // Only accept image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Middleware to handle image compression and saving
const compressAndSaveImage = async (req, res, next) => {
  if (!req.file) return next();

  const { buffer, originalname } = req.file;
  const uniqueName = Date.now() + path.extname(originalname);
  const outputPath = `uploads/profile-images/${uniqueName}`;

  try {
    // Check if file size is greater than 200 KB
    const minFileSize = 10 * 1024; // 200KB
    if (buffer.length > minFileSize) {
      // Compress the image if file size is greater than 200 KB
      await sharp(buffer)
        .resize(800, 800, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .toFormat('jpeg', { quality: 80 })
        .toFile(`uploads/profile-images/compressed-${uniqueName}`);

      // Update the file info to point to the compressed image
      req.file.path = `uploads/profile-images/compressed-${uniqueName}`;
      req.file.filename = `compressed-${uniqueName}`;
    } else {
      // Save the image as usual if it's less than or equal to 200 KB
      fs.writeFileSync(outputPath, buffer);
      req.file.path = outputPath;
      req.file.filename = uniqueName;
    }

    next();
  } catch (err) {
    next(err);
  }
};

export { upload, compressAndSaveImage };
