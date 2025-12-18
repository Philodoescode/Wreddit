import PostFeed from "@/components/PostFeed";
//import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/context/auth-modal-provider";
import TopCommunitiesCard from "@/components/TopCommunitiesCard";

export default function HomePage() {
  const { openModal } = useAuthModal();

  return (
    <main className="mx-auto flex max-w-5xl gap-6 px-4 py-4">
      {/* Center feed column */}
      <section className="flex-1 max-w-2xl space-y-3">

        {/* Feed header */}
        <div className="flex items-center justify-between px-1">
          <h1 className="text-sm font-semibold text-muted-foreground">
            Home
          </h1>
        </div>

        {/* Posts feed */}
        <PostFeed feed="home" limit={10} />
      </section>

      {/* Right sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block space-y-3">
        <TopCommunitiesCard />
      </aside>
    </main>
  );
}