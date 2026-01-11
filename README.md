# Yewon Educational Platform

A modern, feature-rich educational platform built with React, Vite, and Tailwind CSS. This platform provides an enhanced learning experience with better UI/UX compared to traditional educational platforms.

## Features

- 🎨 **Modern, Responsive UI** - Beautiful design that works on all devices
- 📚 **Resource Library** - Browse and download free and paid educational resources
- 💰 **Free & Paid Resources** - Access both free downloads and premium paid content
- 📊 **Student Dashboard** - Track downloaded resources and registered live classes
- 🔍 **Advanced Search & Filtering** - Find resources quickly with search and type filters
- 🎥 **Live Classes** - Register for live online sessions via Zoom, Teams, and more
- 👨‍💼 **Admin Panel** - Create and manage live class announcements
- 🔐 **User Authentication** - Working login and registration system with localStorage
- 📱 **Mobile-First Design** - Optimized for mobile, tablet, and desktop
- ✅ **Footer Links** - All footer navigation links are functional

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── contexts/       # React contexts (AuthContext for authentication)
├── components/     # Reusable components (Navbar, Footer)
├── pages/          # Page components
│   ├── Home.jsx
│   ├── Resources.jsx         # Resource catalog (replaces Courses)
│   ├── ResourceDetail.jsx    # Individual resource page
│   ├── LiveClasses.jsx       # Live class announcements and registration
│   ├── AdminPanel.jsx        # Admin interface for managing classes
│   ├── Dashboard.jsx         # User dashboard
│   ├── Login.jsx             # Login page (fully functional)
│   ├── Register.jsx          # Registration page (fully functional)
│   ├── About.jsx             # About page
│   ├── Contact.jsx           # Contact page
│   ├── FAQs.jsx              # FAQ page
│   ├── Privacy.jsx           # Privacy policy
│   └── Terms.jsx             # Terms and conditions
├── App.jsx         # Main app component with routing
├── main.jsx        # Entry point
└── index.css       # Global styles with Tailwind
```

## Replacing Placeholder Images and Icons

All placeholder images and icons are clearly marked throughout the codebase. Here's where to find and replace them:

### Images to Replace:

1. **Hero Image** (`src/pages/Home.jsx`):
   - Look for `[HERO IMAGE PLACEHOLDER]` comment
   - Replace the div with your hero image

2. **Resource Thumbnails** (`src/pages/Resources.jsx`):
   - Look for `[RESOURCE IMAGE #X]` comments
   - Replace with actual resource thumbnail images

3. **Benefits Image** (`src/pages/Home.jsx`):
   - Look for `[BENEFITS IMAGE PLACEHOLDER]` comment
   - Replace with your benefits illustration

4. **Resource Detail Banner** (`src/pages/ResourceDetail.jsx`):
   - Look for `[RESOURCE DETAIL IMAGE]` comment
   - Replace with resource banner image

5. **Live Class Images** (`src/pages/LiveClasses.jsx`):
   - Look for `[CLASS IMAGE #X]` comments
   - Replace with class thumbnail images

6. **Logo Placeholders** (`src/pages/Login.jsx`, `src/pages/Register.jsx`):
   - Replace the `YE` placeholder with your actual logo
   - Currently shows a circular div with "YE" text

### Icons to Replace:

1. **Social Login Icons** (`src/pages/Login.jsx`, `src/pages/Register.jsx`):
   - Look for `[Google]` and `[Facebook]` placeholders
   - Replace with actual social media icons (you can use lucide-react icons or image assets)

### Example Image Replacement:

Replace placeholder divs like this:
```jsx
{/* Before */}
<div className="bg-primary-400 rounded-2xl p-8">
  <p>[HERO IMAGE PLACEHOLDER]</p>
</div>

{/* After */}
<img 
  src="/images/hero-image.jpg" 
  alt="Hero" 
  className="rounded-2xl w-full h-full object-cover"
/>
```

## Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme. The primary colors are defined in the `colors.primary` section.

### Content

All resource data, class announcements, and content can be updated in their respective page components:
- Resource listings: `src/pages/Resources.jsx`
- Resource details: `src/pages/ResourceDetail.jsx`
- Live classes: `src/pages/LiveClasses.jsx`
- Admin panel: `src/pages/AdminPanel.jsx`
- Dashboard data: `src/pages/Dashboard.jsx`

## Authentication

The app includes working authentication using React Context and localStorage:

**Demo Accounts:**
- Admin: `admin@yewon.com` / `admin123`
- Student: `test@test.com` / `test123`

**Features:**
- Login and registration with form validation
- User session persistence (localStorage)
- Protected routes (Admin panel requires admin role)
- Logout functionality
- User-specific dashboard data

## Admin Features

Admins can:
- Create and manage live class announcements
- Set class details (date, time, platform, meeting links)
- Edit and delete classes
- Access admin panel at `/admin`

**To become an admin:** Login with `admin@yewon.com` / `admin123`

## Technologies Used

- **React 18** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the MIT License.
