async const uploadFiles () =>{
    if (req.files && req.files.image) {
    const image = req.files.image as UploadedFile;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = image.name + '-' + uniqueSuffix;
    const uploadPath = path.join(__dirname, '..', 'uploads', filename);

    await image.mv(uploadPath);
    imagePath = `/uploads/${filename}`;
  }
}