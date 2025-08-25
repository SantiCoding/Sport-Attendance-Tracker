import sharp from "sharp"
import fs from "fs"

async function resizeIcons() {
  try {
    // Read the source image
    const sourceImagePath = "public/icons/source-icon.jpg"
    const sourceBuffer = fs.readFileSync(sourceImagePath)

    console.log("Processing source image...")

    // Create 192x192 icon
    const icon192 = await sharp(sourceBuffer)
      .resize(192, 192, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer()

    // Create 512x512 icon
    const icon512 = await sharp(sourceBuffer)
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer()

    // Ensure icons directory exists
    const iconsDir = "public/icons"
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    // Save the resized icons
    fs.writeFileSync("public/icons/icon-192x192.png", icon192)
    fs.writeFileSync("public/icons/icon-512x512.png", icon512)

    console.log("✅ Successfully created icon-192x192.png")
    console.log("✅ Successfully created icon-512x512.png")
    console.log("📁 Icons saved to /public/icons/")

    // Verify file sizes
    const stats192 = fs.statSync("public/icons/icon-192x192.png")
    const stats512 = fs.statSync("public/icons/icon-512x512.png")

    console.log(`📊 icon-192x192.png: ${(stats192.size / 1024).toFixed(2)} KB`)
    console.log(`📊 icon-512x512.png: ${(stats512.size / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error("❌ Error processing icons:", error)
  }
}

// Run the icon resizing
resizeIcons()
