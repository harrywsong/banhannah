# Backend Setup Guide for File Storage

## Quick Answer

**Yes, you need to set up file storage.** The current `fileUrl` field expects a URL to an actual file stored somewhere. Here are your options:

---

## Option 1: Firebase Storage (Easiest - Recommended)

### Setup Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Storage
4. Install Firebase SDK: `npm install firebase`
5. Copy config from Firebase Console

### Code Implementation:
```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

```javascript
// In AdminPanel.jsx
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase-config';

const handleFileUpload = async (file) => {
  // Upload to Firebase Storage
  const storageRef = ref(storage, `files/${file.name}`);
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  // Use this URL as fileUrl
  setFileFormData({ ...fileFormData, fileUrl: downloadURL });
};
```

**Pros:** Free tier (5GB), easy setup, no backend server needed  
**Cons:** Costs increase with usage

---

## Option 2: Supabase Storage (Open Source Alternative)

### Setup Steps:
1. Go to [Supabase](https://supabase.com/)
2. Create a project
3. Go to Storage section
4. Create a bucket called "files"
5. Install: `npm install @supabase/supabase-js`

### Code Implementation:
```javascript
// supabase-config.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

```javascript
// In AdminPanel.jsx
import { supabase } from './supabase-config';

const handleFileUpload = async (file) => {
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('files')
    .upload(`${Date.now()}_${file.name}`, file);
  
  if (error) {
    console.error('Upload error:', error);
    return;
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('files')
    .getPublicUrl(data.path);
  
  // Use this URL as fileUrl
  setFileFormData({ ...fileFormData, fileUrl: urlData.publicUrl });
};
```

**Pros:** Free tier (500MB), open source, includes database  
**Cons:** Less established than Firebase

---

## Option 3: Node.js Backend + File System

### Setup Steps:
1. Create a backend folder: `mkdir backend && cd backend`
2. Initialize: `npm init -y`
3. Install: `npm install express multer cors`
4. Create server.js

### Backend Code:
```javascript
// backend/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload endpoint
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `http://localhost:3001/api/files/download/${req.file.filename}`;
  
  res.json({
    success: true,
    fileUrl: fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size
  });
});

// Download endpoint
app.get('/api/files/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Frontend Code:
```javascript
// In AdminPanel.jsx
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('http://localhost:3001/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setFileFormData({ ...fileFormData, fileUrl: data.fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    alert('파일 업로드에 실패했습니다.');
  }
};
```

**Pros:** Full control, no external dependencies  
**Cons:** Requires server setup, deployment complexity

---

## Option 4: AWS S3 (Enterprise Solution)

Best for production apps with high traffic. More complex setup but most scalable.

---

## Recommendation

**For quick setup:** Use **Supabase** or **Firebase Storage**
- ✅ No backend code needed
- ✅ Free tier available
- ✅ Easy integration
- ✅ Handles file serving automatically

**For production with control:** Build a **Node.js backend**
- ✅ Full control over files
- ✅ Can add custom logic
- ✅ No vendor lock-in

---

## What I'll Implement Now

Since you don't have a backend yet, I can implement a **temporary base64 storage solution** that stores files in localStorage. This will:
- ✅ Let you test the upload/download functionality
- ⚠️ Has size limits (~5-10MB per file)
- ⚠️ Only works on same browser
- ❌ Not suitable for production

Would you like me to:
1. Implement the base64 localStorage solution (for testing)?
2. Help you set up Firebase/Supabase?
3. Show you how to build the Node.js backend?
