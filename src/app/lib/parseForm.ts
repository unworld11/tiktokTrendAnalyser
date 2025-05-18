import { IncomingMessage } from 'http';
import formidable from 'formidable';
import { Writable } from 'stream';

interface FormidableFile {
  _writeStream?: {
    buffer?: Buffer;
  };
  buffer?: Buffer;
}

type FormidableFiles = {
  [key: string]: FormidableFile[];
};

/**
 * Parses a NextRequest as a multipart form with file upload support
 */
export const parseForm = async (request: Request) => {
  return new Promise<{ fields: formidable.Fields, files: FormidableFiles }>(async (resolve, reject) => {
    const form = formidable({
      keepExtensions: true,
      multiples: true,
      // Store files in memory as buffers
      fileWriteStreamHandler: () => {
        let fileData = Buffer.alloc(0);
        const stream = new Writable({
          write(chunk: Buffer, _encoding: string, callback: () => void) {
            fileData = Buffer.concat([fileData, chunk]);
            callback();
          },
        });
        
        // Add buffer property to the stream
        Object.defineProperty(stream, 'buffer', {
          get: () => fileData,
          enumerable: true,
        });
        
        return stream;
      },
    });

    try {
      // Get the request body as ArrayBuffer
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Create a custom IncomingMessage-like object that formidable can work with
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customReq = new IncomingMessage({} as any);
      
      // Add necessary properties to mimic a proper request object
      Object.defineProperties(customReq, {
        headers: { 
          value: Object.fromEntries(request.headers.entries()),
          writable: true
        },
        url: { 
          value: request.url,
          writable: true
        },
        method: { 
          value: request.method,
          writable: true 
        }
      });
      
      // Add the request body to the customReq
      customReq.push(buffer);
      customReq.push(null);

      form.parse(customReq, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }

        // Attach buffer data to file objects
        Object.values(files as FormidableFiles).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (file._writeStream?.buffer) {
              file.buffer = file._writeStream.buffer;
            }
          });
        });

        resolve({ fields, files: files as FormidableFiles });
      });
    } catch (error) {
      reject(error);
    }
  });
}; 