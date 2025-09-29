# MinifyTe

A minimal, self-hostable video player with authentication and library management. Built with SvelteKit and designed for simplicity and privacy.

![MinifyTe Logo](static/MinifyTe.png)

## ✨ Features

- **🔐 Admin Authentication** - Secure login system with first-user admin setup
- **📹 Video Library** - Upload, organize, and manage your video collection
- **📂 Playlist Management** - Create playlists and organize videos
- **🎨 Clean UI** - Black and white minimalist design
- **📱 Responsive** - Works perfectly on desktop and mobile
- **💾 Local Storage** - All data stored locally on your server
- **🔧 Settings Panel** - Comprehensive account and data management
- **📤 Data Export** - Backup and restore your library
- **🚀 Self-Hosted** - Complete control over your data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wassi-real/minifyTe.git
   cd minifyte
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

5. **Create your admin account**
   - First user automatically becomes admin
   - Subsequent users can only login (no new account creation)

## 🏗️ Production Deployment

### Using Node.js Adapter

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

### Using PM2 (Recommended)

1. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2**
   ```bash
   pm2 start build/index.js --name minifyte
   ```

3. **Save PM2 configuration**
   ```bash
   pm2 save
   pm2 startup
   ```

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t minifyte .
   docker run -p 3000:3000 minifyte
   ```

## 📁 File Structure

```
minifyte/
├── static/
│   ├── videos/          # Video files
│   ├── images/          # Thumbnails
│   ├── playlists/       # Playlist data
│   └── users.json       # User accounts
├── src/
│   ├── routes/          # SvelteKit routes
│   ├── lib/            # Shared utilities
│   └── app.html        # HTML template
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Custom port
PORT=3000

# Optional: Custom host
HOST=0.0.0.0
```

### Storage Locations

- **Videos**: `static/videos/`
- **Thumbnails**: `static/images/`
- **Playlists**: `static/playlists/`
- **User Data**: `static/users.json`

## 🎯 Usage

### First Time Setup

1. **Access the application** in your browser
2. **Create admin account** - First user becomes administrator
3. **Upload videos** using the "Add Video" button
4. **Create playlists** to organize your content
5. **Configure settings** via the Settings page

### Video Management

- **Supported Formats**: MP4, WebM, OGG
- **Thumbnails**: Optional JPEG, PNG, WebP images
- **Metadata**: Titles and descriptions are stored locally
- **Playlists**: Organize videos into custom collections

### Settings & Administration

- **User Management**: View account information
- **Data Export**: Download complete library backup
- **Data Clearing**: Remove all videos and playlists
- **Account Deletion**: Secure account removal with password confirmation

## 🔒 Security

- **Authentication Required**: All access requires login
- **Admin-Only Setup**: First user becomes admin automatically
- **Local Storage**: All data stays on your server
- **Password Protection**: Secure account deletion
- **No External Dependencies**: Self-contained application

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/wassi-real/minifyTe.git
   cd minifyte
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   Navigate to `http://localhost:5173`

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

## 📦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (first user only)
- `DELETE /api/auth/delete` - Delete account

### Videos
- `GET /api/videos` - List all videos
- `POST /api/upload` - Upload video
- `PUT /api/videos/update` - Update video metadata
- `DELETE /api/videos` - Delete video

### Playlists
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/update` - Update playlist
- `DELETE /api/playlists` - Delete playlist
- `POST /api/playlists/videos` - Add video to playlist
- `DELETE /api/playlists/videos` - Remove video from playlist

### Data Management
- `GET /api/export-data` - Export all data
- `DELETE /api/clear-all-data` - Clear all data

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)


## 🔄 Changelog

### v1.0.0
- Initial release
- Video upload and playback
- Playlist management
- User authentication
- Settings panel
- Data export/import
- Responsive design

---

**MinifyTe** - Minimal, self-hostable video player for privacy-conscious users.
