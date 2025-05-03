# MyMufti.com - Islamic Q&A Platform

A comprehensive Islamic Q&A platform where users can ask questions and receive answers from qualified scholars.

## Project Overview

MyMufti.com is a web application built with Next.js, Firebase, and Tailwind CSS. It provides a platform for users to ask Islamic questions and receive scholarly answers. The platform supports both English and Urdu languages, with proper RTL support for Urdu content.

## Features

- **User Authentication**: Sign up, login, and profile management
- **Question Management**: Ask, view, and search questions
- **Multilingual Support**: English and Urdu languages with RTL support
- **Scholar Dashboard**: For scholars to answer questions
- **Admin Panel**: For platform administrators to manage users, questions, and categories
- **Responsive Design**: Works on all device sizes

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS with custom utilities

## Project Structure

\`\`\`
mymufti/
├── app/                  # Next.js app directory
│   ├── admin/            # Admin pages
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard pages
│   ├── questions/        # Question detail pages
│   ├── scholar/          # Scholar dashboard pages
│   ├── search/           # Search pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # Context providers
├── components/           # Reusable components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...               # Other components
├── lib/                  # Utility functions and services
│   ├── firebase-config.ts # Firebase configuration
│   ├── auth-context.tsx  # Authentication context
│   ├── language-context.tsx # Language context
│   └── ...               # Other utilities
├── public/               # Static assets
│   ├── fonts/            # Font files
│   └── ...               # Other assets
├── scripts/              # Utility scripts
├── types/                # TypeScript type definitions
└── ...                   # Configuration files
\`\`\`

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/mymufti.git
   cd mymufti
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   \`\`\`
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging


I apologize for the confusion. Let me provide the actual code for these files to properly optimize and enhance the project.

Let's start with the landing page, which needs significant improvement:

\`\`\`
