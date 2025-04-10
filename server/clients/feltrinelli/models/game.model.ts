/**
 * Modelli per i giochi Feltrinelli
 */

export interface Game {
    id: string;
    feltrinelli_id?: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    settings?: GameSettings;
  }
  
  export interface GameSettings {
    difficulty_levels?: number;
    points_per_correct_answer?: number;
    time_bonus_factor?: number;
    max_questions_per_session?: number;
    [key: string]: any;
  }