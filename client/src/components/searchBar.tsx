import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";

type SearchUser = {
    _id: string;
    username: string;
    userPhotoUrl?: string;
};

type SearchCommunity = {
    _id: string;
    name: string;
    iconImage?: string;
    memberCount?: number;
};

type SearchResults = {
    users: SearchUser[];
    communities: SearchCommunity[];
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export default function SearchBar() {

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [recent, setRecent] = useState<string[]>([]);
    const [loading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const navigate = useNavigate();

    const fetchSearch = async (value: string) => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/search?q=${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

            console.log("Query sent:", value);
            console.log("API URL:", `/search?q=${encodeURIComponent(value)}`);
            console.log("Response:", res.data);


            if (!value.trim()) {
                setRecent((res.data.recent || []).slice().reverse())
                setResults(null);
            } else {
                setResults(res.data.data);
            }

        } catch (error) {
            console.error("Error fetching search results:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!open) return;

        const delay = setTimeout(() => {
            fetchSearch(query);
        }, 250);

        return () => clearTimeout(delay);
    }, [query, open]);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (dropdownRef.current && dropdownRef.current instanceof HTMLElement && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const goToUser = (username: string) => {
        navigate(`/user/${username}`);
        reset();
    };

    const goToCommunity = (communityName: string) => {
        navigate(`/r/${communityName}`);
        reset();
    };

    const reset = () => {
        setQuery("");
        setOpen(false);
        setResults(null);
    };


    const resolveUserAvatar = (userPhotoUrl?: string) => {
        // No custom avatar -> use default in /public
        if (!userPhotoUrl) return "/avatar_default.png";

        // Already an absolute URL
        if (userPhotoUrl.startsWith("http")) return userPhotoUrl;

        // Relative path from backend (e.g. "/uploads/....")
        return `${API_BASE_URL}${userPhotoUrl}`;
    };

    const resolveCommunityIcon = (iconImage?: string) => {
        if (!iconImage) return "/community_default.png";
        if (iconImage.startsWith("http")) return iconImage;
        return `${API_BASE_URL}${iconImage}`;
    };


    const deleteRecent = async (term: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/search/${encodeURIComponent(term)}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            // Update UI immediately
            setRecent(prev => prev.filter(item => item !== term));

        } catch (error) {
            console.error("Failed to delete recent search:", error);
        }
    };



    return (
        <div
            ref={dropdownRef}
            className={`relative w-full max-w-xl mx-auto transition-all ${open ? "z-50" : ""}`}
        >

            {/* OUTER BORDER WRAPPER */}
            <div
                className={`
                        transition-all duration-200
                        ${open
                        ? "p-[1px] rounded-t-[16px] rounded-b-none bg-white"
                        : "p-[2px] rounded-full bg-gradient-to-r from-[#FF4500] via-[#FFA000] to-[#FF4500]"
                    }
                        `}
            >


                {/* SEARCH BAR */}
                <div
                    className={`
                        flex items-center gap-2 bg-background px-4 py-[6px]
                        transition-all duration-200
                        ${open
                            ? "rounded-t-[14px] rounded-b-none border border-white"
                            : "rounded-full"
                        }
                    `}
                >

                    <img src="/reddit_search_icon.png" className="w-10 h-7" />

                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder="Find anything"
                        className="w-full bg-background text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    />

                    {query ? (
                        <X className="cursor-pointer text-muted-foreground" onClick={() => setQuery("")} />
                    ) : (
                        <Search className="text-muted-foreground" />
                    )}

                    <div className="h-7 w-[1px] bg-border mx-3" />

                    <button className="flex items-center gap-1 text-orange-500 hover:bg-orange-500/10 rounded-full px-3 py-1 transition">
                        <img
                            src="/reddit_ask.png"
                            alt="ask"
                            className="w-5 h-5 object-contain"
                        />
                        Ask
                    </button>

                </div>
            </div>

            {/* DROPDOWN */}
            {open && (results || recent.length > 0) && (
                <div
                    className="
                        absolute w-full bg-background text-foreground
                        border border-white border-t-0
                        rounded-b-[14px] rounded-t-none
                        shadow-xl max-h-[450px] overflow-y-auto
                    "
                    style={{ top: "100%" }}
                >

                    {loading && (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Searching...</div>
                    )}

                    {/* RECENT SEARCHES */}
                    {!query && recent.length > 0 && (
                        <div className="p-3">
                            <h2 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                                Recent Searches
                            </h2>

                            {recent.map((term, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                                    onClick={() => setQuery(term)}
                                >
                                    <span>{term}</span>
                                    <X className="w-4 h-4 text-muted-foreground cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();   // prevent search trigger
                                            deleteRecent(term);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SEARCH RESULTS */}
                    {results && (
                        <div className="p-3">
                            {/* COMMUNITIES */}
                            {results.communities.length > 0 && (
                                <>
                                    <h2 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                                        Communities
                                    </h2>

                                    {results.communities.map((c) => (
                                        <div
                                            key={c._id}
                                            className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                                            onClick={() => goToCommunity(c.name)}
                                        >
                                            <img
                                                src={resolveCommunityIcon(c.iconImage)}
                                                alt={c.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "/default-community.png"; // same as above
                                                }}
                                            />
                                            <div>
                                                <p className="font-semibold">r/{c.name}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="my-3 border-t"></div>
                                </>
                            )}

                            {/* USERS */}
                            {results.users.length > 0 && (
                                <>
                                    <h2 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                                        People
                                    </h2>

                                    {results.users.map((u) => (
                                        <div
                                            key={u._id}
                                            className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                                            onClick={() => goToUser(u.username)}
                                        >
                                            <img
                                                src={resolveUserAvatar(u.userPhotoUrl)}
                                                alt={u.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "/avatar_default.png"; // or avater_deafult.png
                                                }}
                                            />
                                            <p>{u.username}</p>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* NO RESULTS */}
                            {results.users.length === 0 &&
                                results.communities.length === 0 && (
                                    <p className="text-center py-4 text-muted-foreground">
                                        No results found.
                                    </p>
                                )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
