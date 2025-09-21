# Polling StationThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A modern polling application built with Next.js, TypeScript, TailwindCSS, and Supabase authentication.## Getting Started



## FeaturesFirst, run the development server:



- 🔐 **Secure Authentication** with Supabase```bash

- 🎨 **Modern UI** with shadcn/ui componentsnpm run dev

- 🚀 **Next.js App Router** with TypeScript# or

- 💨 **TailwindCSS** for stylingyarn dev

- 📱 **Responsive Design**# or

- ✅ **Form Validation** with error handlingpnpm dev

- 🔄 **Real-time Session Management**# or

bun dev

## Getting Started```



### PrerequisitesOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.



- Node.js 18+ You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- npm or yarn

- A Supabase account and projectThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.



### Installation## Learn More



1. **Clone the repository**To learn more about Next.js, take a look at the following resources:

   ```bash

   git clone <your-repo-url>- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

   cd polling_station- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

   ```

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

2. **Install dependencies**

   ```bash## Deploy on Vercel

   npm install

   ```The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.



3. **Set up environment variables**Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

   
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   To get these values:
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon public key

4. **Set up Supabase Authentication**
   
   In your Supabase dashboard:
   - Go to Authentication > Settings
   - Configure your site URL (e.g., `http://localhost:3000` for development)
   - Enable email authentication or configure other providers as needed

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Registration page
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── AuthProvider.tsx          # Authentication context provider
│   ├── LoginForm.tsx             # Login form component
│   └── RegisterForm.tsx          # Registration form component
└── lib/
    ├── supabaseClient.ts         # Supabase client configuration
    └── utils.ts                  # Utility functions (shadcn/ui)
```

## Components Overview

### AuthProvider
- Manages authentication state using Supabase
- Provides authentication methods (signIn, signUp, signOut)
- Tracks user session with `onAuthStateChange`

### LoginForm
- Email/password authentication
- Form validation and error handling
- Loading states and user feedback
- Automatic redirect after successful login

### RegisterForm
- User registration with email/password
- Password strength validation
- Email verification flow
- Success states and navigation

## Authentication Flow

1. **Unauthenticated users** see the home page with login/register options
2. **Registration** creates a new user account and sends verification email
3. **Login** authenticates users and redirects to dashboard
4. **Authenticated users** can access protected routes and sign out

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **[Next.js](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library
- **[Lucide React](https://lucide.dev/)** - Icons

## Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update TailwindCSS configuration in `tailwind.config.js`
- Customize shadcn/ui themes in `components.json`

### Authentication
- Configure additional auth providers in Supabase dashboard
- Modify authentication logic in `AuthProvider.tsx`
- Customize form validation in `LoginForm.tsx` and `RegisterForm.tsx`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
Ensure you set the environment variables and configure your Supabase project URLs for production.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.