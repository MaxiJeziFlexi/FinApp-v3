import { useState } from "react";
import Tesseract from "tesseract.js";

const OCRUploader = ({ onExtractedData }) => {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      processImage(file);
    }
  };

  const processImage = async (file) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (info) => console.log(info),
      });
      onExtractedData(result.data.text); // Send extracted text back to the parent
    } catch (error) {
      console.error("Error processing image:", error.message);
    }
    setIsProcessing(false);
  };

  return (
    <div>
      <h3 className="text-lg font-bold">Upload Image</h3>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="Uploaded Preview" className="w-64 h-auto mt-4" />}
      {isProcessing && <p>Processing image, please wait...</p>}
    </div>
  );
};

export default OCRUploader;
