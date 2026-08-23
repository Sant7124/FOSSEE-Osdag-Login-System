import { Request, Response, NextFunction } from 'express';
import * as fileService from '../services/fileService';
import { AppError } from '../utils/AppError';
import fs from 'fs'; // For streaming streams
import path from 'path';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    if (!req.file) {
      throw new AppError('No file provided', 400);
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Securely upload
    const fileMetadata = await fileService.uploadFile(userId, originalname, mimetype, size, buffer);

    res.status(201).json({
      status: 'success',
      data: { file: fileMetadata }
    });
  } catch (error) {
    next(error);
  }
};

export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const files = await fileService.listUserFiles(userId);

    res.status(200).json({
      status: 'success',
      data: { files }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const fileId = req.params.id;
    
    // Securely retrieve metadata ensuring exact ownership
    const file = await fileService.getUserFileMetadata(fileId, userId);

    // Set safe content disposition
    // We use attachment to encourage download instead of potentially dangerous inline execution
    // Sanitize the filename to prevent header injection
    const safeFilename = file.original_name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.size.toString());

    // Stream the physical file rather than loading the entire file into memory
    const fileStream = fs.createReadStream(file.storage_path);
    
    fileStream.on('error', (err) => {
      console.error('File Stream Error:', err);
      // Stream errors are hard to recover to JSON cleanly if headers are sent.
      if (!res.headersSent) {
        next(new AppError('Error reading file', 500));
      } else {
        res.end();
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const fileId = req.params.id;

    // Securely delete
    await fileService.deleteUserFile(fileId, userId);

    res.status(200).json({
      status: 'success',
      message: 'File successfully deleted'
    });
  } catch (error) {
    next(error);
  }
};
