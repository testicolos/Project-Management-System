import sharp from "sharp";

const source = "src/app/icon.svg";
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#081522"/>
  <g transform="translate(96 96) scale(5)">
    <path d="M18 44V20h16c9 0 14 5 14 12s-5 12-14 12H18Zm10-8h6c4 0 6-1 6-4s-2-4-6-4h-6v8Z" fill="#4ee4d0"/>
    <path d="M13 13h38" stroke="#65a6ff" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

await Promise.all([
  sharp(source).resize(192, 192).png().toFile("public/pwa-192.png"),
  sharp(source).resize(512, 512).png().toFile("public/pwa-512.png"),
  sharp(Buffer.from(maskable)).png().toFile("public/pwa-maskable-512.png"),
]);

console.log("PWA icons generated");
