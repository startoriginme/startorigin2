-- Mavebo Supabase Schema

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    swipe_count INTEGER DEFAULT 0,
    origins_balance DOUBLE PRECISION DEFAULT 0,
    spent_origins DOUBLE PRECISION DEFAULT 0,
    purchased_badges TEXT[] DEFAULT '{}',
    purchased_achievements TEXT[] DEFAULT '{}',
    theme_preference TEXT DEFAULT 'default',
    pattern_preference TEXT DEFAULT 'none',
    hidden_badges TEXT[] DEFAULT '{}',
    badges_order TEXT[] DEFAULT '{"star", "computer", "snowflake", "verified", "crown", "diamond", "heart", "award"}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    hide_swipe_count BOOLEAN DEFAULT false,
    hidden_achievements TEXT[] DEFAULT '{}'
);

-- Pets table
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price INTEGER NOT NULL,
    rarity TEXT NOT NULL
);

-- User Pets table
CREATE TABLE IF NOT EXISTS public.user_pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
    pet_name TEXT,
    is_active BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    privacy TEXT DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    image_url TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    privacy TEXT DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collaborators table
CREATE TABLE IF NOT EXISTS public.collaborators (
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
    PRIMARY KEY (collection_id, user_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT CHECK (target_type IN ('photo', 'album', 'collection')),
    target_id UUID NOT NULL,
    PRIMARY KEY (user_id, target_type, target_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT CHECK (target_type IN ('photo', 'album', 'collection')),
    target_id UUID NOT NULL,
    PRIMARY KEY (user_id, target_type, target_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (follower_id, following_id)
);

-- Row Level Security (RLS) - Example for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public collections"
ON public.collections FOR SELECT
USING (privacy = 'public');

CREATE POLICY "Collaborators can view shared collections"
ON public.collections FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE collection_id = public.collections.id AND user_id = auth.uid()
));

-- (More policies would be needed for albums, photos, etc.)
