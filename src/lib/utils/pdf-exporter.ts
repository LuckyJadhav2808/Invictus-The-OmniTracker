"use client";

import { domToCanvas } from "modern-screenshot";
import { jsPDF } from "jspdf";

export async function exportElementToPDF(elementId: string, filename: string = "Invictus_Statement.pdf") {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found for PDF export.`);
  }

  // 1. High-resolution canvas capture
  const fullCanvas = await domToCanvas(element, {
    scale: 1.5,
    backgroundColor: "#FAF8F5",
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 10;
  const printableWidth = pdfWidth - margin * 2; // 190mm
  const printableHeight = pdfHeight - margin * 2; // 277mm

  let imgWidth = printableWidth;
  let imgHeight = (fullCanvas.height * imgWidth) / fullCanvas.width;

  // 2. Single-Page Auto Scale: If statement fits within 1.25x of A4 page height, scale to 1 single page
  if (imgHeight <= printableHeight * 1.25) {
    if (imgHeight > printableHeight) {
      const scaleFactor = printableHeight / imgHeight;
      imgWidth = imgWidth * scaleFactor;
      imgHeight = printableHeight;
    }
    const xPos = (pdfWidth - imgWidth) / 2;
    const imgData = fullCanvas.toDataURL("image/jpeg", 0.82);
    pdf.addImage(imgData, "JPEG", xPos, margin, imgWidth, imgHeight);
    pdf.save(filename);
    return;
  }

  // 3. Multi-Page Enterprise Discrete Canvas Cropping Engine (Zero Overlap & Zero Duplicated Rows)
  const pageCanvasPixelHeight = (printableHeight * fullCanvas.width) / printableWidth;
  const totalPages = Math.ceil(fullCanvas.height / pageCanvasPixelHeight);

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const sourceY = i * pageCanvasPixelHeight;
    const currentSlicePixelHeight = Math.min(pageCanvasPixelHeight, fullCanvas.height - sourceY);

    // Create a dedicated cropped canvas for this PDF page
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = currentSlicePixelHeight;

    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        fullCanvas,
        0,
        sourceY,
        fullCanvas.width,
        currentSlicePixelHeight,
        0,
        0,
        fullCanvas.width,
        currentSlicePixelHeight
      );

      const sliceHeightMm = (currentSlicePixelHeight * printableWidth) / fullCanvas.width;
      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.82);
      pdf.addImage(pageImgData, "JPEG", margin, margin, printableWidth, sliceHeightMm);
    }
  }

  // 4. Trigger direct PDF download
  pdf.save(filename);
}
