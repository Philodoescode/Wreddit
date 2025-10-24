import NavBar from "@/components/top-nav-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function App() {
  return (
    <ThemeProvider>
      {/* Full-page layout with sticky footer */}
      <div className="flex flex-col min-h-screen">
        <NavBar />

        {/* Main grows and centers content */}
        <main className="flex-grow flex items-center justify-center container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center">
            <h1 className="text-5xl font-bold text-primary">Welcome to Wreddit</h1>
            <p className="text-xl text-muted-foreground mt-4">
              The best place to share and discuss what's new and popular on the web.
            </p>
            <Link to = '/signup'>
              <Button size="lg" className="mt-8">
                Get Started
              </Button>
            </Link>
          </section>
        </main>

        {/* Footer sticks to bottom */}
        <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
          &copy; 2025 Wreddit. All rights reserved.
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;