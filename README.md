# Sport Attendance Tracker

A comprehensive, professional sports coaching management system designed to streamline student attendance tracking, group management, and performance analytics for sports coaches and instructors.

## 🎯 Purpose

Sport Attendance Tracker is a modern web application that helps sports coaches efficiently manage their students, track attendance, handle make-up sessions, and generate detailed reports. Built with a focus on user experience and mobile responsiveness, it's perfect for tennis coaches, swimming instructors, martial arts teachers, and any sports professional who needs to manage student attendance and progress.

## ✨ Key Features

### 📊 **Student Management**
- **Student Profiles**: Complete student information management with contact details, enrollment dates, and status tracking
- **Bulk Operations**: Import multiple students at once with smart data parsing and validation
- **Student Search**: Advanced search functionality with filters and sorting options
- **Profile Management**: Edit student information, track progress, and manage enrollment status

### 👥 **Group Management**
- **Dynamic Groups**: Create and manage student groups with flexible membership
- **Smart Sorting**: Intelligent group organization based on skill level, age, or custom criteria
- **Group Analytics**: Track group performance and attendance patterns
- **Bulk Group Operations**: Efficiently manage multiple students across groups

### 📅 **Attendance Tracking**
- **Real-time Attendance**: Mark attendance for individual students or entire groups
- **Session Management**: Create and manage training sessions with date and time tracking
- **Make-up Sessions**: Handle missed sessions with flexible make-up scheduling
- **Attendance History**: Complete audit trail of all attendance records

### 📈 **Reports & Analytics**
- **Comprehensive Reports**: Generate detailed attendance reports by student, group, or time period
- **Performance Analytics**: Track student progress and attendance patterns
- **Export Functionality**: Download reports in various formats for record keeping
- **Visual Charts**: Interactive charts and graphs for data visualization

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful, modern interface with glass-like effects
- **Mobile Responsive**: Optimized for all devices - desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **PWA Support**: Install as a native app on mobile devices
- **Smooth Animations**: Framer Motion powered animations for enhanced user experience

### 🔐 **Authentication & Security**
- **Google Sign-in Integration**: Secure authentication with Google accounts
- **Cloud Sync**: Automatic data synchronization across devices
- **Data Privacy**: Secure data handling with Supabase backend
- **User Sessions**: Persistent login sessions with automatic refresh

### 📱 **Mobile Features**
- **Touch Optimized**: Designed for touch interactions on mobile devices
- **Offline Capability**: Basic functionality works without internet connection
- **Push Notifications**: Stay updated with attendance reminders and notifications
- **Responsive Design**: Adapts perfectly to any screen size

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom glass morphism components
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with Google OAuth integration
- **Animations**: Framer Motion for smooth UI transitions
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling
- **Performance**: Vercel Speed Insights for monitoring

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/SantiCoding/Attendance-Tracker.git
   cd Attendance-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env.local` file with your Supabase credentials
   - Configure Google OAuth settings

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Start managing your sports students!

## 📊 Performance Monitoring

This application includes Vercel Speed Insights for real-time performance monitoring, helping ensure optimal user experience across all devices and network conditions.

## 🤝 Contributing

This project is actively maintained and welcomes contributions. Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for sports coaches and instructors worldwide**
