/**
 * Wrapper called by the Python API:
 *   node generate_consent_api.js input.json output.docx
 */
const { buildDocument } = require('./generate_consent.js');
const { Packer } = require('docx');
const fs = require('fs');

const inputFile  = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node generate_consent_api.js input.json output.docx');
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const doc  = buildDocument(data);
  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputFile, buffer);
    process.exit(0);
  });
} catch (err) {
  console.error('Error generating document:', err.message);
  process.exit(1);
}
