# Tirisano Mmogo School Management System - Frontend

React-based frontend application for the Tirisano Mmogo School Management System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Prerequisites

- Node.js v18.x or higher
- npm v9.x or higher

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=tirisano-mmogo-db.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tirisano-mmogo-db
VITE_FIREBASE_STORAGE_BUCKET=tirisano-mmogo-db.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Select your web app and copy the config values

### API Configuration

The backend API URL is configured in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

Update this if your backend runs on a different host/port.

## 📁 Project Structure

```
school-frontend/
├── public/                      # Static assets
├── src/
│   ├── components/              # React components
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── PendingApplications.jsx
│   │   │   ├── AnnouncementManagement.jsx
│   │   │   └── ...
│   │   ├── auth/               # Authentication components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ForgotPassword.css
│   │   └── parent/             # Parent portal components
│   │       ├── ParentDashboard.jsx
│   │       ├── AddChild.jsx
│   │       ├── AddChild.css
│   │       ├── ChildrenList.jsx
│   │       ├── DocumentUpload.jsx
│   │       ├── DocumentList.jsx
│   │       └── ...
│   ├── contexts/               # React Context providers
│   │   └── AuthContext.jsx    # Authentication context
│   ├── services/               # API services
│   │   ├── api.js             # Axios HTTP client & API endpoints
│   │   └── firebaseConfig.js  # Firebase configuration
│   ├── App.jsx                # Main application component
│   ├── App.css                # Global styles
│   └── main.jsx               # Application entry point
├── .env                        # Environment variables (create this)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── vite.config.js             # Vite configuration
└── README.md
```

## 🎨 Key Components

### Authentication
- **Login.jsx**: User login with email/password
- **Register.jsx**: New parent registration
- **ForgotPassword.jsx**: Password reset functionality

### Parent Portal
- **ParentDashboard.jsx**: Main parent dashboard
- **AddChild.jsx**: Child registration form with document upload
- **ChildrenList.jsx**: View and manage registered children
- **DocumentUpload.jsx**: Upload supporting documents
- **DocumentList.jsx**: View uploaded documents
- **StudentUpdateForm.jsx**: Edit child information

### Admin Portal
- **AdminDashboard.jsx**: Admin overview
- **PendingApplications.jsx**: Review and approve/reject applications
- **AnnouncementManagement.jsx**: Create and manage announcements
- **MeetingManagement.jsx**: Manage parent-teacher meetings
- **TripManagement.jsx**: Create and manage school trips

## 🔐 Authentication Flow

1. User navigates to login page
2. Enters email and password
3. Frontend sends credentials to backend API
4. Backend validates with Firebase Auth
5. On success, returns user data with JWT token
6. Frontend stores token in localStorage
7. Token included in subsequent API requests
8. On logout, token is removed

## 📄 Document Upload

### Supported Document Types
- Student Report
- Birth Certificate
- Immunization Record
- Previous School Report
- ID Document
- Proof of Residence
- Medical Certificate
- Other

### Upload Process
1. Select file from local device
2. File is validated (max 5MB, supported formats)
3. File is converted to base64
4. Uploaded to backend with metadata
5. Stored in Firebase Firestore

### Supported File Formats
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG
- **Max Size**: 5MB per file

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server (localhost:5173)
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Linting
```bash
npm run lint         # Run ESLint
```

## 🌐 API Integration

The frontend communicates with the backend via REST API. All endpoints are defined in `src/services/api.js`.

### API Structure

```javascript
// Authentication
authAPI.register(userData)
authAPI.login(credentials)
authAPI.forgotPassword(email)

// Parent Operations
parentAPI.addChild(parentId, childData)
parentAPI.getChildren(parentId)
parentAPI.updateChild(parentId, studentId, data)

// Document Operations
documentAPI.uploadDocument(documentData)
documentAPI.getDocumentsByStudentId(studentId)
documentAPI.deleteDocument(documentId)

// Student Operations
studentAPI.getAllStudents()
studentAPI.getPendingStudents()
studentAPI.approveStudent(studentId)
studentAPI.rejectStudent(studentId, reason)
```

### Request Interceptors

The API client includes automatic:
- JWT token attachment to requests
- Token refresh handling
- Error handling and redirects

## 🎯 Features

### For Parents
- ✅ Register and manage children
- ✅ Upload documents during registration
- ✅ Upload documents later from profile
- ✅ View application status (Pending/Approved/Rejected)
- ✅ View school announcements
- ✅ Register for trips and events
- ✅ Request parent-teacher meetings
- ✅ Make mock payments

### For Admins
- ✅ Review pending applications
- ✅ Approve/reject students
- ✅ Assign classes and teachers
- ✅ Create announcements
- ✅ Manage meetings and trips
- ✅ Verify documents

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
**Problem**: Firebase connection fails

**Solution**:
```bash
# Ensure .env file exists and has VITE_ prefix
# Restart dev server after changing .env
npm run dev
```

#### 2. API Connection Error
**Problem**: Cannot connect to backend

**Solution**:
- Verify backend is running on `localhost:8080`
- Check `src/services/api.js` for correct API_BASE_URL
- Check CORS configuration in backend

#### 3. Login Redirects to Home
**Problem**: Can't stay logged in

**Solution**:
- Check localStorage for authToken
- Verify token isn't expired
- Clear browser cache and cookies

#### 4. File Upload Fails
**Problem**: Document upload returns error

**Solution**:
- Verify file is under 5MB
- Check file format is supported
- Check console for specific error
- Verify backend document endpoint is accessible

## 🔒 Security Notes

- Never commit `.env` file to version control
- API tokens are stored in localStorage (consider httpOnly cookies for production)
- File uploads are validated on both client and server
- All API requests include authentication token

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920x1080 and above)
- Laptop (1366x768 and above)
- Tablet (768px and above)
- Mobile (320px and above)

## 🎨 Styling

- **CSS Framework**: Custom CSS
- **CSS Methodology**: Component-scoped styles
- **Responsive**: Mobile-first approach
- **Theme**: Green (#4CAF50) primary color

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Deploy to Hosting

The built files can be deployed to:
- Firebase Hosting
- Netlify
- Vercel
- Any static hosting service

Example (Firebase):
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📚 Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Axios Documentation](https://axios-http.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

**Need help?** Check the main project README or open an issue on GitHub.
