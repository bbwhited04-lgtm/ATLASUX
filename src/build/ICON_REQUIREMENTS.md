# 🎨 Icon Requirements for Atlas UX

## **Required Icon Files**

Place your app icons in the `/build` folder:

---

## **Windows Icons**

### **`icon.ico`** (Windows app icon)
- **Format:** ICO
- **Sizes included:** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **Location:** `/build/icon.ico`

#### How to create:
1. Design a 256x256 PNG icon
2. Convert to ICO online: https://www.icoconverter.com/
3. Make sure to include all sizes (16, 32, 48, 64, 128, 256)

---

## **macOS Icons**

### **`icon.icns`** (macOS app icon)
- **Format:** ICNS
- **Sizes included:** 16x16 through 1024x1024 @1x and @2x
- **Location:** `/build/icon.icns`

#### How to create on macOS:
```bash
# 1. Create a 1024x1024 PNG called icon.png
# 2. Run this script:

mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
mv icon.icns build/icon.icns
rm -rf icon.iconset
```

#### Alternative (online converter):
- Use: https://cloudconvert.com/png-to-icns
- Upload your 1024x1024 PNG
- Download and save as `/build/icon.icns`

---

## **Linux Icons**

### **`icons/` folder**
- **Format:** PNG
- **Sizes:** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
- **Location:** `/build/icons/`

#### Create folder structure:
```
build/
└── icons/
    ├── 16x16.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    └── 512x512.png
```

---

## **DMG Background (macOS only)**

### **`dmg-background.png`** (macOS installer background)
- **Format:** PNG
- **Size:** 660x480 pixels
- **Location:** `/build/dmg-background.png`

#### Design Tips:
- Use your brand colors (cyan/blue gradient for Atlas UX)
- Add your logo
- Keep it clean - this appears behind the drag-to-install UI

---

## **Quick Icon Design Guide**

### **Atlas UX Branding:**
- **Primary Color:** Cyan (#00D9FF)
- **Secondary Color:** Blue (#3B82F6)
- **Background:** Dark slate (#0f172a)

### **Icon Design Ideas:**
1. **Atom/Network Symbol** - representing AI connections
2. **Brain with Circuit Pattern** - AI intelligence
3. **Compass Rose** - navigation/control (Neptune theme)
4. **Abstract "A"** - Atlas UX monogram
5. **Rocket/Launch Icon** - productivity boost

### **Design Tools:**
- **Figma** (recommended): https://figma.com
- **Adobe Illustrator**
- **Inkscape** (free): https://inkscape.org/
- **Canva** (easy): https://canva.com

---

## **Example Icon Template**

Here's a simple SVG template you can customize:

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00D9FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded square background -->
  <rect width="1024" height="1024" rx="226" fill="url(#bg)"/>
  
  <!-- Your icon graphic here -->
  <circle cx="512" cy="512" r="300" fill="white" opacity="0.9"/>
  <text x="512" y="600" text-anchor="middle" font-size="400" font-weight="bold" fill="#0f172a">A</text>
</svg>
```

Save as SVG, then export to PNG at 1024x1024.

---

## **Testing Your Icons**

### **Windows:**
```bash
npm run package:win:nsis
```
Check the generated EXE - right-click → Properties → see icon

### **macOS:**
```bash
npm run package:mac:dmg
```
Open the DMG - verify icon looks good

### **Quick Preview:**
- **Windows:** Place icon.ico on desktop, view in File Explorer
- **macOS:** Open icon.icns in Preview app
- **All platforms:** Use online previewer: https://www.websiteplanet.com/webtools/favicon-generator/

---

## **Placeholder Icons (Temporary)**

If you don't have icons yet, electron-builder will use defaults, but they'll look generic.

For now, you can use these free icon resources:
- **Flaticon:** https://www.flaticon.com/
- **Icons8:** https://icons8.com/
- **Noun Project:** https://thenounproject.com/

---

## **File Checklist**

Before building, ensure you have:
- ✅ `/build/icon.ico` (Windows)
- ✅ `/build/icon.icns` (macOS)
- ✅ `/build/icons/*.png` (Linux - all sizes)
- ✅ `/build/dmg-background.png` (macOS DMG, optional)

---

## **🎨 FINAL TIP**

Your icon is the **first impression** users get!

Make it:
- **Simple** - recognizable at 16x16
- **Bold** - strong shapes, high contrast
- **Unique** - stands out from other apps
- **On-brand** - matches your cyan/blue theme

---

**Need help?** Use this AI prompt:
```
"Design a modern, minimalist app icon for 'Atlas UX', an AI productivity platform. 
Use cyan (#00D9FF) and blue (#3B82F6) gradients. 
The icon should represent AI, automation, and control. 
Make it simple enough to work at 16x16 pixels but striking at 512x512."
```

Upload to: ChatGPT/DALL-E, Midjourney, or Adobe Firefly!
