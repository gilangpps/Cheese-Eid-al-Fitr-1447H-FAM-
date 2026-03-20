# 📷 Camera Troubleshooting Guide

Jika kamera tidak bisa diakses, ikuti langkah-langkah berikut:

## 1. Check Browser Console
- Tekan `F12` atau `Ctrl+Shift+I` untuk membuka Developer Tools
- Pergi ke tab "Console"
- Lihat pesan error yang muncul
- Screenshot error dan referensikan ke troubleshooting di bawah

## 2. Error Messages & Solutions

### ❌ "NotAllowedError" atau "Permission Denied"
**Penyebab**: Browser atau sistem menolak akses kamera
**Solusi**:
1. Check permission browser:
   - **Chrome**: Settings → Privacy and security → Site settings → Camera → Allow
   - **Firefox**: Preferences → Privacy → Permissions → Camera → Allow
   - **Safari**: System Preferences → Security & Privacy → Camera → Allow
2. Refresh halaman (`Ctrl+F5`)
3. Coba browser lain

### ❌ "NotFoundError" atau "Device Not Found"
**Penyebab**: Kamera tidak terdeteksi oleh sistem
**Solusi**:
1. Pastikan kamera terhubung:
   - Jika external camera, check kabel USB
   - Restart komputer
2. Check Device Manager (Windows):
   - Search: "Device Manager"
   - Expand "Cameras"
   - Cari device kamera
   - Jika ada warning/error, update driver
3. Test kamera dengan aplikasi lain:
   - Build-in Camera app
   - Zoom/Teams
   - Jika bisa di app lain, ada compatibility issue

### ❌ "NotReadableError" atau "Device Already In Use"
**Penyebab**: Kamera sedang digunakan aplikasi lain
**Solusi**:
1. Tutup aplikasi lain yang menggunakan kamera:
   - Zoom, Teams, Skype, Discord
   - Browser tabs lain dengan camera feed
   - Webcam software
2. Refresh halaman ini
3. Restart device jika perlu

### ❌ "TypeError" atau "getUserMedia Not Supported"
**Penyebab**: Browser tidak support akses kamera
**Solusi**:
1. Update ke versi browser terbaru
2. Gunakan browser yang didukung:
   - ✅ Google Chrome (v50+)
   - ✅ Firefox (v55+)
   - ✅ Safari (v11+)
   - ✅ Microsoft Edge (v79+)
   - ❌ Internet Explorer (tidak support)

### ❌ "OverconstrainedError"
**Penyebab**: Browser tidak support spesifikasi kamera yang diminta
**Solusi**:
1. Refresh halaman
2. Browser akan otomatis fallback ke constraint basic
3. Jika masih error, update driver kamera

### ❌ Video placeholder hitam dengan no error
**Penyebab**: Setup kamera berhasil tapi video tidak ditampilkan
**Solusi**:
1. Check audio permissions (muted video perlu permission)
2. Tunggu 1-2 detik untuk video stream ini
3. Refresh halaman
4. Check browser console untuk detail

## 3. Checklist Konfigurasi Sistem

- [ ] Kamera hardware terpasang dan terdeteksi
- [ ] Camera driver terbaru diinstall
- [ ] Browser support camera API (Chrome, Firefox, Safari, Edge)
- [ ] Browser version terbaru
- [ ] Permission browser sudah di-allow untuk `http://localhost:3000`
- [ ] Tidak ada aplikasi lain yang menggunakan kamera
- [ ] Server berjalan (`npm start` - port 3000 listening)

## 4. Test dengan Tools Lain

### Windows
```powershell
# Test camera connection
wmic logicaldisk get name

# List video devices
Get-WmiObject Win32_PnPDevice | Where-Object {$_.Description -match 'camera|webcam'} | Select Name, Status
```

### macOS / Linux
```bash
# List connected devices
ls -la /dev/video*
```

## 5. Server-side Check

Pastikan server berjalan dengan benar:

```bash
# Verify server is running on port 3000
netstat -ano | findstr :3000  # Windows
netstat -tulnp | grep 3000    # Linux/Mac

# Should show:
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING

# If not running, restart:
npm start
```

## 6. Advanced Debugging

### Check di Browser Console:
```javascript
// Paste di console (F12)

// Check if browser supports getUserMedia
console.log('getUserMedia support:', !!navigator.mediaDevices?.getUserMedia);

// List all input devices
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('Available devices:');
  devices.forEach(device => {
    console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId);
  });
});

// Test camera access with detailed info
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => {
    console.log('✅ Camera access granted!');
    console.log('Video track settings:', stream.getVideoTracks()[0].getSettings());
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ Error:', err.name);
    console.error('Message:', err.message);
  });
```

## 7. Network & SSL Check

- Application uses `http://localhost:3000` (safe for localhost development)
- No SSL certificate needed for localhost
- If deploying online, make sure to use HTTPS (required for camera access)

## 8. Still Not Working?

1. **Collect error info**:
   - Browser name & version (check → Help → About)
   - Operating system
   - Camera model/type
   - Complete error message from console

2. **Try alternative approaches**:
   - Disable browser extensions/plugins
   - Test in Incognito mode
   - Test in different browser
   - Test on different device

3. **Contact Support**:
   - Provide all error information above
   - Screenshots of error messages
   - Steps you've already tried
   - Device/browser information

---

## Quick Reference: Camera Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Green video | Camera working | Ready to capture |
| ⚫ Black screen | Loading | Wait a moment |
| 🟡 No error but black | Permission pending | Check browser permission popup |
| 🔴 Error alert | Access denied | Follow troubleshooting above |
| 🔴 Console error | Technical issue | See error type above |

---

**Last Updated**: March 2026  
**For Help**: Check browser console (F12) for specific error messages
