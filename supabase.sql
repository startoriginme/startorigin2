-- Mavebo Supabase Schema

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
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
    photo_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    sent_origins DOUBLE PRECISION DEFAULT 0,
    received_origins DOUBLE PRECISION DEFAULT 0,
    purchased_gradients TEXT[] DEFAULT '{}',
    active_gradient TEXT,
    purchased_fonts TEXT[] DEFAULT '{}',
    active_font TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Saved Photos table
CREATE TABLE IF NOT EXISTS public.saved_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, photo_id)
);
ALTER TABLE public.saved_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved photos" ON public.saved_photos
    FOR ALL USING (auth.uid() = user_id);

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
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_id_name TEXT,
    pet_name TEXT,
    gifted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    privacy TEXT DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    name TEXT,
    url TEXT NOT NULL,
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

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster message fetching
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);

-- Seen Items table for tracking new posts/photos
CREATE TABLE IF NOT EXISTS public.seen_items (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_id UUID NOT NULL,
    item_type TEXT CHECK (item_type IN ('photo', 'post')),
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, item_id, item_type)
);
ALTER TABLE public.seen_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage seen items" ON public.seen_items FOR ALL USING (auth.uid() = user_id);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
-- Posts
CREATE POLICY "Users can manage their own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Post Likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own post likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_free_spin TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS used_secret_quest BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Collections
CREATE POLICY "Users can manage their own collections" ON public.collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public collections" ON public.collections
    FOR SELECT USING (privacy = 'public');

-- Albums
CREATE POLICY "Users can manage their own albums" ON public.albums
    FOR ALL USING (auth.uid() = user_id);

-- Photos
CREATE POLICY "Users can manage their own photos" ON public.photos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public photos" ON public.photos
    FOR SELECT USING (privacy = 'public');

-- User Pets
CREATE POLICY "Users can insert their own pets" ON public.user_pets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view user pets" ON public.user_pets
    FOR SELECT USING (true);

CREATE POLICY "Users can delete their own pets" ON public.user_pets
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" ON public.user_pets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (true);

-- Messages
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (true);
