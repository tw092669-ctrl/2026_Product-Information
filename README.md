<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Product Information - AI Studio App

A React application built with Vite, Tailwind CSS, and Google Gemini AI for displaying and managing product information.

## Features

- 🚀 Fast development with Vite
- 🎨 Beautiful UI with Tailwind CSS
- 🤖 Powered by Google Gemini AI
- 📱 Responsive design
- 🔄 Real-time data processing
- 📊 Product search and filtering

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Google Gemini API key

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd 2026_Product-Information
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── QuoteView.tsx      # Quote display component
│   └── SearchView.tsx     # Search interface component
├── App.tsx                # Main application component
├── index.css              # Global styles
├── main.tsx               # Application entry point
├── types.ts               # TypeScript type definitions
├── utils.ts               # Utility functions
└── mockData.ts            # Mock data for development
```

## Configuration Files

- **vite.config.ts** - Vite build configuration with React and Tailwind plugins
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.ts** - PostCSS configuration with Autoprefixer
- **tsconfig.json** - TypeScript compiler options

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |

## Technologies Used

- **Frontend Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **UI Library:** Lucide React (icons)
- **Animation:** Motion
- **AI:** Google Generative AI SDK
- **CSV Parsing:** PapaParse
- **Screenshot:** html2canvas
- **Utilities:** clsx, tailwind-merge

## Environment Variables

```
GEMINI_API_KEY    # Google Gemini API key (required)
```

## API Reference

This application uses the Google Generative AI API. For more information, visit:
https://ai.google.dev/

## Deployment

The application can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service

## Troubleshooting

**DISABLE_HMR environment variable:**
- Set `DISABLE_HMR=true` in development environments (e.g., AI Studio) where HMR might cause issues
- This disables Hot Module Replacement and file watching to reduce CPU usage

## License

This project is part of the AI Studio ecosystem.

## Support

For issues and questions, refer to the AI Studio documentation:
https://ai.studio/apps/f298ae2e-daa4-4276-8b69-6d9beb3124aa

