// En: src/uploads/uploads.controller.ts  (Tu Backend)

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Límite de 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; 

@Controller('uploads') // Correcto (sin 'api/v1')
export class UploadsController {

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', { 
      storage: diskStorage({
        destination: './uploads', 
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|svg\+xml|mp4)$/)) {
          return cb(new BadRequestException('Tipo de archivo no soportado. Solo se permiten JPG, PNG, SVG o MP4.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ 
            maxSize: MAX_FILE_SIZE_BYTES,
            message: 'El archivo es muy pesado. El límite es 10 MB.'
          }),
        ],
        // Hacemos que la validación de tamaño no sea obligatoria
        // si el ParseFilePipe se ejecuta (ya lo hace el fileFilter)
        // Lo importante es que el MaxFileSizeValidator SÍ falle si se supera.
        fileIsRequired: false 
      }),
    )
    file: Express.Multer.File,
  ) {
    
    // ---
    // --- ¡ESTA ES LA PARTE IMPORTANTE! ---
    // ---
    
    // Construye la URL relativa
    const relativeUrl = `/uploads/${file.filename}`;
    
    // Devuelve el JSON que el frontend espera
    return {
      message: 'Archivo subido con éxito',
      url: relativeUrl, 
      filename: file.filename,
    };
  }
}