-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  city TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  share_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  invite_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_members (
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.trip_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  escape_room_id UUID REFERENCES public.escape_rooms(id) ON DELETE CASCADE NOT NULL,
  game_slot_id UUID REFERENCES public.game_slots(id) ON DELETE SET NULL,
  added_by UUID REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, escape_room_id)
);
