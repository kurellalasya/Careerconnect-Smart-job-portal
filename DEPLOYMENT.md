# Deployment Guide for CareerConnect Job Portal

This project is a MERN stack application. Follow these steps to deploy it to production.

## 1. Backend Deployment (e.g., Render, Railway, or Heroku)

### Environment Variables
Set the following environment variables on your hosting platform:
- `PORT`: 4000 (or let the platform assign one)
- `MONGO_URI`: Your MongoDB Atlas connection string
- `FRONTEND_URL`: The URL where your frontend will be hosted (e.g., `https://your-app.vercel.app`)
- `JWT_SECRET_KEY`: A long random string
- `JWT_EXPIRE`: `7d`
- `COOKIE_EXPIRE`: `7`
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: For email notifications
- `OPENAI_API_KEY`: For AI features
- `GEMINI_API_KEY`: For AI features

### Deployment Steps
1. Connect your GitHub repository to the hosting platform.
2. Set the root directory to `backend` or configure the build command to `npm install` and start command to `npm start`.

## 2. Frontend Deployment (e.g., Vercel or Netlify)

### Environment Variables
- `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-backend.onrender.com`)

### Deployment Steps
1. Connect your GitHub repository.
2. Set the root directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`

## 3. Important Code Changes for Production

### API Configuration
I have already created `frontend/src/config.js` to handle the API URL dynamically. 
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export default API_BASE_URL;
```

### Update Hardcoded URLs
You should replace all remaining instances of `http://localhost:4000` in the `frontend/src` directory with `${API_BASE_URL}`. 

Example:
```javascript
// Before
axios.get("http://localhost:4000/api/v1/job/getall")

// After (ensure API_BASE_URL is imported)
axios.get(`${API_BASE_URL}/api/v1/job/getall`)
```

## 4. Database
Ensure your MongoDB Atlas cluster allows access from "Everywhere" (0.0.0.0/0) or add the IP addresses of your hosting providers to the whitelist.
