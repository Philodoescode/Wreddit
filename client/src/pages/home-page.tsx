import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/context/auth-modal-provider";

export default function HomePage() {
  const { openModal } = useAuthModal();
  
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <section className="text-center">
        <h1 className="text-5xl font-bold text-primary">Welcome to Wreddit</h1>
        <p className="text-xl text-muted-foreground mt-4">
          The best place to share and discuss what's new and popular on the web.
        </p>
        <Button size="lg" className="mt-8" onClick={() => openModal("signup")}>
          Get Started
        </Button>
      </section>
    </div>
  );
}