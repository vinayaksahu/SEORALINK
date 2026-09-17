const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const inputLogo = path.join(rootDir, 'logo.png');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'src', 'app');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

  console.log('Loading logo from:', inputLogo);
  fs.copyFileSync(inputLogo, path.join(publicDir, 'logo.png'));
  console.log('Copied full logo to public/logo.png');

  // Extract emblem (top 650px) and trim transparent space
  const emblemRawBuf = await sharp(inputLogo)
    .extract({ left: 0, top: 0, width: 1536, height: 650 })
    .toBuffer();

  const trimmed = await sharp(emblemRawBuf)
    .trim()
    .toBuffer();

  // Create 512x512 contained icon
  const emblem512 = await sharp(trimmed)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'logo-icon.png'), emblem512);
  console.log('Saved public/logo-icon.png');

  // Create 32x32 favicon
  const fav32 = await sharp(trimmed)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32.png'), fav32);

  // Create 192x192 icon
  const icon192 = await sharp(trimmed)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

  // Create SVG icon
  const base64 = emblem512.toString('base64');
  const svgContent = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">\n' +
    '  <image href=\"data:image/png;base64,' + base64 + '\" x=\"0\" y=\"0\" width=\"512\" height=\"512\" preserveAspectRatio=\"xMidYMid meet\" />\n' +
    '</svg>\n';

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent, 'utf8');
  console.log('Saved public/icon.svg and src/app/icon.svg');

  console.log('Successfully generated all logo assets!');
}

main().catch(err => {
  console.error('Error generating logo assets:', err);
  process.exit(1);
});
