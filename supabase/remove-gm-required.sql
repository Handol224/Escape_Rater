-- Make game_master optional (we're dropping it from scoring)
ALTER TABLE public.ratings ALTER COLUMN game_master DROP NOT NULL;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_game_master_check;
