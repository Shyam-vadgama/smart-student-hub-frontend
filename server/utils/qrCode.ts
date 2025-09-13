import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export const generateQRCode = async (data: string, filename: string): Promise<string> => {
  try {
    const qrCodesDir = path.join(process.cwd(), 'uploads', 'qrcodes');
    
    // Create qrcodes directory if it doesn't exist
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }

    const qrCodePath = path.join(qrCodesDir, `${filename}.png`);
    
    await QRCode.toFile(qrCodePath, data, {
      width: 300,
      margin: 2
    });

    return qrCodePath;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const generateVerificationURL = (achievementId: string): string => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseURL}/verify/${achievementId}`;
};
