# Akshay Kumar Modi — Developer Portfolio

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

A cutting-edge, high-performance personal portfolio and interactive showcase built for **Akshay Kumar Modi** (Full-Stack Engineer & AI Developer). Features a cinematic scroll intro, interactive 3D WebGL scenes, buttery-smooth section-to-section scrolling, ambient audio, and an admin CMS dashboard.

---

## 🌟 Key Features

### 🎬 Cinematic Scroll Intro
- Frame-by-frame 1080p canvas scrub synchronized with scroll progress.
- Hardware-accelerated dynamic DPR resolution management to prevent memory thrashing.
- Interactive **Enter Portfolio** and **Skip Intro** quick actions.

### 🌌 3D WebGL & Visual Graphics
- **Three.js & React Three Fiber (`@react-three/fiber`, `@react-three/drei`)**: Floating 3D geometries and interactive backdrops.
- **Custom WebGL Volumetric Hero Fog**: Dynamic noise shaders with pointer-reactive light spots.
- Glassmorphic UI with reactive glowing borders, blur backdrops, and gradient accents.

### ⚡ Buttery Smooth Section Scrolling
- Integrated **Lenis** smooth scrolling with custom lerp interpolation tuned for zero scroll lag.
- Native keyboard navigation support (Up / Down arrow keys) with instant 100ms response.
- GPU-accelerated layer compositing without layout reflows or scroll jitter.

### 🎵 Ambient Sound Engine
- High-fidelity ambient background audio track (`peaceful-piano-ambient.mp3`).
- Fully controlled via the interactive **Sound On/Off** button with animated wave indicator.
- Strict user-gesture control: sound can only be played when explicitly toggled by the user.

### 💼 Portfolio Sections
- **Hero**: Catchy introduction, dynamic spotlight, resume download, and quick contact buttons.
- **About Me**: Interactive tech badges, core competencies, education, and career overview.
- **Featured Projects**: Filterable project catalog (Full-Stack, AI/ML, Web3, Cloud) with comprehensive detail modals, live demo links, and GitHub links.
- **Journey Timeline**: Interactive milestone roadmap highlighting professional experience and key achievements.
- **Contact Form**: Direct email delivery using SMTP (Gmail / Nodemailer), Google Apps Script, and Formspree fallbacks with instant client validation.

### 🔐 Protected Admin CMS (`/admin`)
- HMAC-signed stateless authentication session.
- Manage and update projects, journey milestones, and site configuration directly from the browser.
- Offline-resilient local persistence and server synchronization.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (Full-stack SSR/SSG with Nitro & Vite) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing) |
| **Frontend UI** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons |
| **3D & Canvas** | [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/), Custom Shaders |
| **Animations** | [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/), ScrollTrigger |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) |
| **State & Data** | [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query`), Drizzle ORM |
| **Email & Backend** | [Nodemailer](https://nodemailer.com/), Google Apps Script |
| **Testing** | [Vitest](https://vitest.dev/), React Testing Library, JSDOM |

---

## 📁 Project Structure

```text
akshay-portfolio/
├── api/                    # Serverless API handlers
├── data/                   # Local database and persistent storage
├── public/                 # Static assets, icons, audio, and cinematic intro frames
│   ├── audio/              # Peaceful piano ambient soundtrack
│   └── intro-frames/       # 1080p intro canvas frame sequence
├── src/
│   ├── assets/             # Bundled image assets (portraits, project thumbnails)
│   ├── components/
│   │   ├── admin/          # Admin dashboard management dialogs
│   │   ├── intro/          # ScrollCinematicIntro canvas scrub component
│   │   ├── site/           # Main sections (Hero, About, Projects, Journey, Contact, Nav)
│   │   ├── three/          # 3D canvas and mesh components
│   │   └── ui/             # Reusable UI primitives (dialogs, buttons, tooltips)
│   ├── content/            # Local source-of-truth content (projects, journey)
│   ├── hooks/              # Custom hooks (useSound, useAdmin, useProjects, useJourney)
│   ├── lib/                # Utilities (sound engine, smooth scroll, db, SMTP client)
│   ├── routes/             # TanStack Start file-based routes (__root, index, admin)
│   └── styles.css          # Global Tailwind CSS v4 styling rules
├── .env.example            # Environment variables template
├── package.json            # Project dependencies and run scripts
├── vite.config.ts          # Vite configuration and plugin pipelines
└── vitest.config.ts        # Vitest test runner configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akshaykumarmodi/final-portfolio.git
   cd final-portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   # Direct SMTP Contact Form Notifications
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_character_google_app_password
   SMTP_FROM="Akshay Portfolio" <your_email@gmail.com>
   CONTACT_RECEIVER_EMAIL=your_email@gmail.com

   # Admin Dashboard Authentication
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port indicated in your console) to preview the portfolio.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with hot module replacement (HMR). |
| `npm run build` | Builds optimized client bundle and SSR Nitro server output. |
| `npm run preview` | Previews the production build locally. |
| `npm test` | Executes all Vitest unit and integration test suites. |
| `npm run test:watch` | Runs Vitest in interactive watch mode. |
| `npm run lint` | Runs ESLint across TypeScript and TSX files. |
| `npm run format` | Formats all code with Prettier. |

---

## 🧪 Testing & Quality Assurance

The codebase includes end-to-end unit tests covering routing, navigation visibility, cinematic canvas intro, admin state persistence, SMTP submission, and the audio engine:

```bash
npm test
```

To run a full TypeScript compile check:
```bash
npx tsc --noEmit
```

---

## 🚢 Deployment

This project uses TanStack Start with Nitro and can be deployed directly to:
- **Vercel**: Push to your connected GitHub branch or deploy with `vercel`. Ensure the environment variables from `.env.example` are set in the Vercel dashboard.
- **Cloudflare Pages / Workers**: Nitro can build for the Cloudflare worker preset via Wrangler.
- **Node.js Server**: Run the Nitro output from `.output/server/index.mjs`.

---

## 👤 Author

**Akshay Kumar Modi**
- **Website**: [akshaykumarmodi.isonewho.codes](https://akshaykumarmodi.isonewho.codes/)
- **GitHub**: [@akshaykumarmodi](https://github.com/akshaykumarmodi)
- **LinkedIn**: [Akshay Kumar Modi](https://www.linkedin.com/in/akshay-kumar-modi-27306637b/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
