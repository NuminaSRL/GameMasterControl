-- Modifica la relazione tra game_badges e badges
ALTER TABLE game_badges
DROP CONSTRAINT IF EXISTS game_badges_badge_id_badges_id_fk;

ALTER TABLE game_badges
ADD CONSTRAINT game_badges_badge_id_badges_id_fk
FOREIGN KEY (badge_id) REFERENCES badges(id);
