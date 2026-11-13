import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { useSound } from "@/hooks/use-sound";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Akshay Kumar Modi — Portfolio" },
      { name: "description", content: "Akshay Kumar Modi — frontend engineering, creative technology and applied AI." },
      { name: "author", content: "Akshay Kumar Modi" },
      { name: "theme-color", content: "#030611" },
      { property: "og:title", content: "Akshay Kumar Modi — Portfolio" },
      { property: "og:description", content: "Frontend engineering, creative technology and applied AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Geist+Mono:wght@400;500&family=Geist:wght@300..700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <audio
          id="akm-bg-audio"
          src="/audio/peaceful-piano-ambient.mp3"
          autoPlay
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="sr-only"
        >
          <source src="/audio/peaceful-piano-ambient.mp3" type="audio/mpeg" />
          <source src="/audio/peaceful-piano.mp3" type="audio/mpeg" />
          <source src="/audio/cinematic-ambient.mp3" type="audio/mpeg" />
        </audio>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var a = document.getElementById('akm-bg-audio');
                  if (!a) return;

                  try {
                    if (localStorage.getItem('akm-sound') === 'off') {
                      localStorage.removeItem('akm-sound');
                    }
                  } catch(e){}

                  a.volume = 0.75;
                  a.muted = false;

                  var AC = window.AudioContext || window.webkitAudioContext;
                  var actx = null;
                  try {
                    if (AC) {
                      actx = window.__akm_actx = window.__akm_actx || new AC();
                      if (actx.state === 'suspended') {
                        actx.resume().catch(function() {});
                      }
                    }
                  } catch(e){}

                  var isPlaying = false;

                  function startSound() {
                    if (!a || isPlaying) return;
                    try {
                      if (actx && actx.state === 'suspended') {
                        actx.resume().catch(function() {});
                      }
                    } catch(e){}

                    a.muted = false;
                    a.volume = 0.75;

                    var p = a.play();
                    if (p !== undefined && typeof p.then === 'function') {
                      p.then(function() {
                        isPlaying = true;
                        removeListeners();
                      }).catch(function() {
                        // Autoplay policy waiting for user gesture; keep listeners active
                      });
                    } else if (!a.paused) {
                      isPlaying = true;
                      removeListeners();
                    }
                  }

                  // 1. Direct unmuted autoplay on initial website entry
                  startSound();

                  // 2. Lifecycle triggers across all browsers
                  window.addEventListener('DOMContentLoaded', startSound, { once: true });
                  window.addEventListener('load', startSound, { once: true });
                  window.addEventListener('pageshow', startSound, { once: true });

                  // 3. User interaction triggers: any natural touch, gesture, or keypress starts sound without clicking a button
                  var gestureEvents = [
                    'touchstart',
                    'touchend',
                    'pointerdown',
                    'pointerup',
                    'mousedown',
                    'mouseup',
                    'keydown',
                    'keyup',
                    'click'
                  ];

                  function onGesture() {
                    startSound();
                  }

                  function onScroll() {
                    if (!isPlaying) {
                      startSound();
                    }
                  }

                  function removeListeners() {
                    gestureEvents.forEach(function(ev) {
                      window.removeEventListener(ev, onGesture, true);
                      document.removeEventListener(ev, onGesture, true);
                    });
                    ['wheel', 'touchmove', 'scroll'].forEach(function(ev) {
                      window.removeEventListener(ev, onScroll, true);
                    });
                  }

                  gestureEvents.forEach(function(ev) {
                    window.addEventListener(ev, onGesture, { capture: true, passive: true });
                    document.addEventListener(ev, onGesture, { capture: true, passive: true });
                  });

                  ['wheel', 'touchmove', 'scroll'].forEach(function(ev) {
                    window.addEventListener(ev, onScroll, { capture: true, passive: true });
                  });
                } catch(e){}
              })();
            `,
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useSound();

  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScroll />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
