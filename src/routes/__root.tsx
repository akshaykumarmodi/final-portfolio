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
          autoPlay
          loop
          playsInline
          webkit-playsinline="true"
          preload="auto"
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: "0px",
            right: "0px",
            width: "1px",
            height: "1px",
            opacity: 0.01,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <source src="/audio/peaceful-piano-ambient.m4a" type="audio/mp4" />
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

                  try {
                    if ('audioSession' in navigator) {
                      navigator.audioSession.type = 'playback';
                    }
                  } catch(e){}

                  try { a.volume = 0.75; } catch(e){}
                  a.muted = false;

                  var actx = null;
                  function primeAudioHardware() {
                    try {
                      if ('audioSession' in navigator) {
                        navigator.audioSession.type = 'playback';
                      }
                    } catch(e){}
                    try {
                      var AC = window.AudioContext || window.webkitAudioContext;
                      if (AC) {
                        actx = window.__akm_actx = window.__akm_actx || new AC();
                        if (actx.state === 'suspended') {
                          actx.resume().catch(function() {});
                        }
                        var buf = actx.createBuffer(1, 1, 22050);
                        var src = actx.createBufferSource();
                        src.buffer = buf;
                        src.connect(actx.destination);
                        src.start(0);
                      }
                    } catch(e){}
                  }

                  var isPlaying = false;

                  function startSound() {
                    if (!a || isPlaying) return;
                    primeAudioHardware();

                    a.muted = false;
                    try { a.volume = 0.75; } catch(e){}

                    var p = a.play();
                    if (p !== undefined && typeof p.then === 'function') {
                      p.then(function() {
                        isPlaying = true;
                        removeListeners();
                      }).catch(function() {
                        // Autoplay policy waiting for user gesture on mobile
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

                  // 3. User interaction triggers for mobile touch, tap, click, key
                  var gestureEvents = [
                    'touchend',
                    'pointerup',
                    'click',
                    'touchstart',
                    'pointerdown',
                    'keydown',
                    'keyup'
                  ];

                  function onGesture() {
                    startSound();
                  }

                  function removeListeners() {
                    gestureEvents.forEach(function(ev) {
                      window.removeEventListener(ev, onGesture, true);
                      document.removeEventListener(ev, onGesture, true);
                      if (document.body) {
                        document.body.removeEventListener(ev, onGesture, true);
                      }
                    });
                  }

                  gestureEvents.forEach(function(ev) {
                    window.addEventListener(ev, onGesture, { capture: true, passive: true });
                    document.addEventListener(ev, onGesture, { capture: true, passive: true });
                  });

                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      if (document.body) {
                        gestureEvents.forEach(function(ev) {
                          document.body.addEventListener(ev, onGesture, { capture: true, passive: true });
                        });
                      }
                    }, { once: true });
                  } else if (document.body) {
                    gestureEvents.forEach(function(ev) {
                      document.body.addEventListener(ev, onGesture, { capture: true, passive: true });
                    });
                  }
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
