import NavBar from '@/components/top-nav-bar' 
import { ThemeProvider } from "@/components/theme-provider"
function App() {

  return (
    <>
      <ThemeProvider>
        <NavBar />
      </ThemeProvider>
      <h1 className="text-4xl font-bold text-center text-primary hover:text-primary/90">Hello init Wreddit.</h1>
    </>
  )
}

export default App
