# CareerConnect - Job Portal

CareerConnect is a comprehensive job portal built using the MERN stack. It offers a platform for job seekers to find opportunities and for employers to manage job listings and applications.

## 🚀 Features

- **User Authentication:** Secure JWT-based authentication for Job Seekers and Employers.
- **Job Management:** Employers can post, update, and delete jobs. Job seekers can browse and apply.
- **Peer Interviews:** Connect with others for peer-to-peer interview practice using PeerJS and Socket.io.
- **Interview Experiences:** Share and read interview experiences from other candidates.
- **Real-time Chat:** Integrated messaging features.
- **Responsive Design:** Fully responsive UI built with React and modern CSS.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS (or custom CSS), PeerJS
- **Backend:** Node.js, Express.js, MongoDB, Socket.io
- **File Handling:** Cloudinary (for images), Mammoth (DOCX), PDF-parse
- **Authentication:** JWT, Bcrypt, Validator
- **Communication:** Nodemailer (Email verification)

## 🏁 Getting Started

### Prerequisites

- Node.js (v22.2.0 or above)
- MongoDB Atlas account or local MongoDB
- Cloudinary account
### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/akankshanimmagadda/CareerConnect.git
   cd CareerConnect
   ```

2. **Install dependencies:**
   ```sh
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the `backend` directory and add the following:
   ```env
   PORT=4000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET_KEY=your_secret_key
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:5173
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

### Running the Application

1. **Start the Backend:**
   ```sh
   cd backend
   npm run dev
   ```

2. **Start the Frontend:**
   ```sh
   cd frontend
   npm run dev
   ```

3. **Access the app:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

