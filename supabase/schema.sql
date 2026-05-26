-- Run this entire file in your Supabase SQL editor

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escape rooms
CREATE TABLE escape_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  company TEXT NOT NULL,
  time_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game slots (calendar entries)
CREATE TABLE game_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escape_room_id UUID NOT NULL REFERENCES escape_rooms(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slot_id UUID NOT NULL REFERENCES game_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzles INTEGER NOT NULL CHECK (puzzles BETWEEN 1 AND 10),
  story_theme INTEGER NOT NULL CHECK (story_theme BETWEEN 1 AND 10),
  atmosphere INTEGER NOT NULL CHECK (atmosphere BETWEEN 1 AND 10),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  game_master INTEGER NOT NULL CHECK (game_master BETWEEN 1 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_slot_id, user_id)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on ratings
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE escape_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Escape rooms policies
CREATE POLICY "Approved users can read rooms" ON escape_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved = TRUE)
);
CREATE POLICY "Admins can manage rooms" ON escape_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Game slots policies
CREATE POLICY "Approved users can read slots" ON game_slots FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved = TRUE)
);
CREATE POLICY "Admins can manage slots" ON game_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Ratings policies
CREATE POLICY "Approved users can read ratings" ON ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved = TRUE)
);
CREATE POLICY "Users can insert own ratings" ON ratings FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved = TRUE)
);
CREATE POLICY "Users can update own ratings" ON ratings FOR UPDATE USING (
  auth.uid() = user_id
);
