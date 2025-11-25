import { Outlet } from "react-router-dom";
import NavBar from "@/components/top-nav-bar";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      {/* Full-page layout with sticky footer */}
      <div className="flex flex-col min-h-screen bg-muted/40">
        <NavBar />

        {/* Main grows and centers content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Outlet />
        </main>

        {/* Footer sticks to bottom */}
        <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground bg-background">
          &copy; 2025 Wreddit. All rights reserved.
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;