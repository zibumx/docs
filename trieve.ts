import { TrieveSDK } from 'trieve-ts-sdk';
import fs from 'fs';
import path from 'path';

const trieveSdk = new TrieveSDK({
  apiKey: process.env.TRIEVE_API_KEY!,
  baseUrl: process.env.TRIEVE_URL!,
  datasetId: process.env.TRIEVE_DATASET_ID!,
});

async function main() {
  try {
    console.log('Clearing dataset...');
    await trieveSdk.clearDataset(process.env.TRIEVE_DATASET_ID!);
    console.log('Dataset cleared.');

    // List all elements inside the AI folder
    console.log('Reading ./ai directory...');
    const dir = fs.readdirSync('./ai', {
      recursive: true,
    });
    console.log('Directory contents:', dir);

    // Filter for files only (not directories) - handle both string and Buffer paths
    const files: string[] = [];
    for (const item of dir) {
      const itemStr = typeof item === 'string' ? item : item.toString();
      const fullPath = path.join('./ai', itemStr);

      try {
        const stat = fs.statSync(fullPath);
        const isFile = stat.isFile();
        console.log(`Checking ${itemStr}: isFile=${isFile}`);
        if (isFile) {
          files.push(itemStr);
        }
      } catch (err) {
        console.error(`Error checking ${itemStr}:`, err);
      }
    }
    console.log('Files to upload:', files);

    // Upload each file
    for (const file of files) {
      const filePath = path.join('./ai', file);
      console.log(`Reading file: ${filePath}`);

      // Read file content
      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');
      console.log(
        `File ${file} size: ${fileContent.length} bytes, base64 length: ${base64Content.length}`,
      );

      // Determine content type based on extension
      const ext = path.extname(file);
      const contentType =
        ext === '.mdx' ? 'text/markdown' : 'application/octet-stream';
      console.log(`Content type for ${file}: ${contentType}`);

      // Upload to Trieve
      console.log(`Uploading ${file}...`);
      await trieveSdk.uploadFile({
        base64_file: base64Content,
        file_name: file,
        tag_set: ['ai', 'documentation'],
      });
      console.log(`Successfully uploaded: ${file}`);
    }

    console.log('All files uploaded successfully!');
  } catch (error) {
    console.error('Error during upload process:', error);
    process.exit(1);
  }
}

main();
