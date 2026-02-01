# Universal Bookmarker

A powerful cross-platform bookmark management system that works seamlessly as both a web application and Chrome browser extension.

## ✨ Features

- 🌐 **Cross-Platform**: Web app + Chrome extension for bookmark management anywhere
- 📁 **Nested Categories**: Hierarchical organization with unlimited depth
- 🔍 **AI-Powered Search**: Content-based search with Algolia's instant search
- 📄 **Smart Content Extraction**: Automatic page summaries and metadata extraction
- 👥 **Multi-User Support**: Each user gets their own private bookmark collection
- 🔒 **Privacy-First**: Optional client-side encryption for sensitive bookmarks
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ⚡ **Real-Time Sync**: Instant synchronization across all your devices
- 📊 **Configurable**: Fine-tune content extraction and offline storage to your needs

## 🛠 Tech Stack

- **Frontend**: Preact + TypeScript + Vite
- **State Management**: @preact/signals
- **Search & Storage**: Algolia (multi-user with separate indices)
- **Chrome Extension**: Manifest V3 with service workers
- **Content Extraction**: Cheerio + JSDOM for intelligent page parsing
- **Build Tools**: Vite with web extension plugin
- **Styling**: CSS with CSS variables for theming

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Algolia account (for search and storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd universal-bookmarker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Algolia**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_ALGOLIA_APP_ID=your_app_id
   VITE_ALGOLIA_API_KEY=your_search_api_key
   VITE_ALGOLIA_ADMIN_API_KEY=your_admin_api_key
   ```
   
   **For new Algolia users:**
   - Sign up at [Algolia](https://www.algolia.com)
   - Create a new application
   - Get your Application ID and API keys from the dashboard
   - The app will automatically create the necessary indices on first run

   **For existing Algolia users:**
   - Use your existing Application ID
   - Ensure your API keys have sufficient permissions
   - The app will create dedicated indices for Universal Bookmarker

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build Chrome extension**
   ```bash
   npm run build:extension
   ```

## 📱 Usage

### Web Application

1. **Create Account**: Sign up with your email to create your personal bookmark space
2. **Add Bookmarks**: Use the web interface to add bookmarks with categories and tags
3. **Search**: Use the powerful search bar with instant results and filters
4. **Organize**: Create nested categories and drag bookmarks to reorganize

### Chrome Extension

1. **Install Extension**: Load the built extension in Chrome developer mode
2. **Quick Bookmark**: Click the extension icon to bookmark the current page
3. **Content Extraction**: Choose between summary or full text extraction
4. **Privacy Options**: Enable client-side encryption for sensitive bookmarks

## 🔧 Configuration

### Content Extraction Options

- **Summary Mode** (Default): Extracts title, description, and key points
- **Full Text Mode**: Extracts complete page content for better search
- **Custom Mode**: User-defined extraction rules per bookmark

### Offline Storage Options

- **Minimal**: Name and URL only (default)
- **Enhanced**: Includes categories and tags
- **Full**: All bookmark metadata for complete offline access

### Privacy & Security

- **Client-Side Encryption**: Optional encryption before sending to Algolia
- **Zero-Knowledge**: Encrypted bookmarks are unreadable to anyone but you
- **Per-Bookmark Control**: Choose encryption on individual bookmarks

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BookmarkForm.tsx
│   ├── BookmarkList.tsx
│   ├── CategoryTree.tsx
│   ├── SearchBox.tsx
│   └── EncryptionToggle.tsx
├── pages/              # Web app pages
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── hooks/              # Custom React hooks
│   ├── useAlgolia.ts
│   ├── useBookmarks.ts
│   ├── useContentExtraction.ts
│   └── useEncryption.ts
├── services/           # Business logic
│   ├── algolia.ts
│   ├── bookmarkService.ts
│   ├── contentExtractor.ts
│   ├── encryptionService.ts
│   └── userService.ts
├── types/              # TypeScript definitions
│   ├── bookmark.ts
│   ├── category.ts
│   ├── search.ts
│   └── user.ts
├── extension/          # Chrome extension code
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── options/
│   └── manifest.json
├── utils/              # Helper functions
│   ├── storage.ts
│   ├── validation.ts
│   ├── encryption.ts
│   └── api.ts
└── styles/             # CSS and styling
    ├── globals.css
    ├── components.css
    └── themes.css
```

## 🔐 Data Model

### Bookmark Schema
```typescript
interface Bookmark {
  id: string;
  name: string;
  url: string;
  categories: string[];        // Nested: ["tech", "javascript", "react"]
  tags: string[];
  content: {
    title: string;
    description: string;
    summary: string;
    fullText?: string;         // User-configurable
    keywords: string[];
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    favicon?: string;
    screenshot?: string;
    lastVisited?: number;
  };
  privacy: {
    isEncrypted: boolean;
    encryptionKey?: string;
  };
  userId: string;             // Multi-user support
}
```

## 🔍 Search Features

- **Instant Search**: Real-time results as you type
- **Content Search**: Search within page content and summaries
- **Category Filtering**: Filter by hierarchical categories
- **Tag-Based Search**: Search and filter by tags
- **Faceted Search**: Multiple search dimensions
- **Relevance Ranking**: Smart ranking based on usage and content

## 🌐 Multi-User Architecture

Each user gets:
- **Dedicated Algolia Index**: `bookmarks_user_<userId>`
- **Private Content**: Complete isolation between users
- **Personal Categories**: Individual category hierarchies
- **Secure Encryption**: Per-user encryption keys

## 📦 Build Commands

```bash
# Development
npm run dev                 # Start web app dev server
npm run dev:extension       # Watch extension rebuild

# Building
npm run build              # Build web app
npm run build:extension    # Build Chrome extension
npm run build:all          # Build both

# Preview
npm run preview            # Preview web app build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Algolia Documentation](https://www.algolia.com/doc/)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Preact Documentation](https://preactjs.com/guide/v10/getting-started)

---

**Built with ❤️ for bookmark enthusiasts everywhere**