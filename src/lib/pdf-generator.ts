import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generateProfessionalPDF(
  title: string, 
  processedContent: string, 
  fileName: string
) {
  const container = document.createElement('div');
  
  Object.assign(container.style, {
    width: '800px',
    padding: '60px',
    backgroundColor: '#ffffff',
    fontFamily: "'Helvetica', 'Arial', sans-serif",
    color: '#000000',
    position: 'absolute',
    left: '-9999px',
    top: '0',
    opacity: '1',
    lineHeight: '1.6'
  });

  const htmlContent = processedContent
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      
      // 1. Handle Markdown Images: ![alt](url)
      const imageMatch = trimmed.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch) {
        return `<div style="margin-bottom: 20pt; text-align: left;">
                  <img src="${imageMatch[1]}" style="max-height: 60px; width: auto; display: block;" crossorigin="anonymous" />
                </div>`;
      }

      // 2. Handle Headers
      if (trimmed.startsWith('# ')) return `<h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 15pt; color: #000;">${trimmed.substring(2)}</h1>`;
      if (trimmed.startsWith('## ')) return `<h2 style="font-size: 16pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; color: #000;">${trimmed.substring(3)}</h2>`;
      
      // 3. Handle Lists
      if (trimmed.startsWith('* ')) return `<div style="margin-left: 15pt; margin-bottom: 5pt; display: flex; gap: 8pt; color: #000;"><span>•</span><span>${trimmed.substring(2)}</span></div>`;
      
      // 4. Handle Bold text and Paragraphs
      if (!trimmed) return '<div style="height: 10pt;"></div>';
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return `<p style="margin-bottom: 8pt; font-size: 10.5pt; text-align: justify; color: #000;">${formattedLine}</p>`;
    })
    .join('');

  container.innerHTML = `
    <div style="width: 100%;">
        ${htmlContent}
        <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10pt; color: #444;">
            <p style="font-weight: bold; margin-bottom: 4pt;">Verified Digital Document</p>
            <p>Trac AI Engineering Platform • Generated on ${new Date().toLocaleDateString()}</p>
            <p style="font-size: 8pt; margin-top: 4pt; opacity: 0.7;">Ref: ${Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
       </div>
    </div>
  `;

  document.body.appendChild(container);

  // 3. Wait for the logo/images to load fully
  const images = container.getElementsByTagName('img');
  await Promise.all(Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if image fails
    });
  }));

  // Short delay to ensure browser paints the images
  await new Promise(resolve => setTimeout(resolve, 600));

  try {
    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true, // Crucial for loading the logo from Google URL
        allowTaint: true,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const scaledImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = scaledImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledImgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position = heightLeft - scaledImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledImgHeight);
        heightLeft -= pdfHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF Error:", error);
  } finally {
    document.body.removeChild(container);
  }
}