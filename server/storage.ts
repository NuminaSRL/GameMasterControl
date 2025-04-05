import {
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  badges, type Badge, type InsertBadge,
  rewards, type Reward, type InsertReward,
  gameBadges, type GameBadge, type InsertGameBadge,
  stats, type Stats
} from "@shared/schema";

// Storage interface for all operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  toggleGameStatus(id: number): Promise<Game | undefined>;
  
  // Badge operations
  getAllBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // Reward operations
  getAllRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  
  // Game-Badge operations
  getGameBadges(gameId: number): Promise<Badge[]>;
  assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge>;
  removeBadgeFromGame(gameId: number, badgeId: number): Promise<void>;
  
  // Stats operations
  getStats(): Promise<Stats>;
  updateStats(statsData: Partial<Stats>): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private badges: Map<number, Badge>;
  private rewards: Map<number, Reward>;
  private gameBadges: Map<number, GameBadge>;
  private statsData: Stats;
  
  private userId: number;
  private gameId: number;
  private badgeId: number;
  private rewardId: number;
  private gameBadgeId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.badges = new Map();
    this.rewards = new Map();
    this.gameBadges = new Map();
    
    this.userId = 1;
    this.gameId = 1;
    this.badgeId = 1;
    this.rewardId = 1;
    this.gameBadgeId = 1;
    
    // Initialize with some sample stats
    this.statsData = {
      id: 1,
      totalGames: 8,
      activeGames: 6,
      activeUsers: 354,
      awardedBadges: 127,
      updatedAt: new Date()
    };
    
    // Initialize with sample data for demonstration
    this.initSampleData();
  }

  // Initialize sample data
  private initSampleData() {
    // Sample games
    const sampleGames: InsertGame[] = [
      {
        name: "Quiz Generale",
        description: "Domande di cultura generale",
        isActive: true,
        timerDuration: 30,
        questionCount: 10,
        weeklyLeaderboard: true,
        monthlyLeaderboard: true,
        reward: "points_500"
      },
      {
        name: "Math Challenge",
        description: "Sfida con operazioni matematiche",
        isActive: false,
        timerDuration: 45,
        questionCount: 15,
        weeklyLeaderboard: true,
        monthlyLeaderboard: false,
        reward: "points_200"
      },
      {
        name: "Music Trivia",
        description: "Indovina la canzone",
        isActive: true,
        timerDuration: 20,
        questionCount: 8,
        weeklyLeaderboard: false,
        monthlyLeaderboard: true,
        reward: "premium_1day"
      }
    ];
    
    sampleGames.forEach(game => this.createGame(game));
    
    // Sample badges
    const sampleBadges: InsertBadge[] = [
      {
        name: "Super Campione",
        description: "Vinci 5 partite consecutive",
        icon: "fas fa-award",
        color: "blue"
      },
      {
        name: "Velocista",
        description: "Completa un gioco in meno di 30 secondi",
        icon: "fas fa-bolt",
        color: "yellow"
      },
      {
        name: "Genio Matematico",
        description: "Rispondi correttamente a tutte le domande di matematica",
        icon: "fas fa-brain",
        color: "purple"
      }
    ];
    
    sampleBadges.forEach(badge => this.createBadge(badge));
    
    // Sample rewards
    const sampleRewards: InsertReward[] = [
      {
        name: "Bonus 500 Punti",
        description: "Completa 3 giochi diversi in un giorno",
        type: "points",
        value: "500",
        icon: "fas fa-gift",
        color: "green",
        available: 30
      },
      {
        name: "Premium per 1 settimana",
        description: "Vinci 10 partite in una settimana",
        type: "premium",
        value: "1week",
        icon: "fas fa-gem",
        color: "red",
        available: 5
      },
      {
        name: "Coupon Sconto 10%",
        description: "Completa tutti i livelli di un gioco",
        type: "coupon",
        value: "10",
        icon: "fas fa-ticket-alt",
        color: "blue",
        available: 50
      }
    ];
    
    sampleRewards.forEach(reward => this.createReward(reward));
    
    // Assign badges to games
    this.assignBadgeToGame({ gameId: 1, badgeId: 1 });
    this.assignBadgeToGame({ gameId: 1, badgeId: 2 });
    this.assignBadgeToGame({ gameId: 2, badgeId: 3 });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game methods
  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async createGame(game: InsertGame): Promise<Game> {
    const id = this.gameId++;
    const now = new Date();
    const newGame: Game = { ...game, id, createdAt: now };
    this.games.set(id, newGame);
    
    // Update stats
    this.statsData.totalGames += 1;
    if (game.isActive) {
      this.statsData.activeGames += 1;
    }
    
    return newGame;
  }
  
  async updateGame(id: number, gameUpdate: Partial<InsertGame>): Promise<Game | undefined> {
    const existingGame = this.games.get(id);
    if (!existingGame) {
      return undefined;
    }
    
    // Track if active status has changed for stats update
    const wasActive = existingGame.isActive;
    const willBeActive = gameUpdate.isActive !== undefined ? gameUpdate.isActive : wasActive;
    
    // Update the game
    const updatedGame: Game = { ...existingGame, ...gameUpdate };
    this.games.set(id, updatedGame);
    
    // Update stats if active status changed
    if (wasActive !== willBeActive) {
      this.statsData.activeGames += willBeActive ? 1 : -1;
    }
    
    return updatedGame;
  }
  
  async toggleGameStatus(id: number): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) {
      return undefined;
    }
    
    const updatedGame: Game = { ...game, isActive: !game.isActive };
    this.games.set(id, updatedGame);
    
    // Update stats
    this.statsData.activeGames += updatedGame.isActive ? 1 : -1;
    
    return updatedGame;
  }
  
  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const now = new Date();
    const newBadge: Badge = { ...badge, id, createdAt: now };
    this.badges.set(id, newBadge);
    return newBadge;
  }
  
  // Reward methods
  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }
  
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardId++;
    const now = new Date();
    const newReward: Reward = { ...reward, id, createdAt: now };
    this.rewards.set(id, newReward);
    return newReward;
  }
  
  // Game-Badge methods
  async getGameBadges(gameId: number): Promise<Badge[]> {
    const badgeIds = Array.from(this.gameBadges.values())
      .filter(gb => gb.gameId === gameId)
      .map(gb => gb.badgeId);
    
    return Array.from(this.badges.values())
      .filter(badge => badgeIds.includes(badge.id));
  }
  
  async assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge> {
    // Check if already exists
    const exists = Array.from(this.gameBadges.values()).some(
      gb => gb.gameId === gameBadge.gameId && gb.badgeId === gameBadge.badgeId
    );
    
    if (exists) {
      throw new Error("Badge already assigned to this game");
    }
    
    const id = this.gameBadgeId++;
    const newGameBadge: GameBadge = { ...gameBadge, id };
    this.gameBadges.set(id, newGameBadge);
    return newGameBadge;
  }
  
  async removeBadgeFromGame(gameId: number, badgeId: number): Promise<void> {
    const gameBadgeEntry = Array.from(this.gameBadges.entries()).find(
      ([_, gb]) => gb.gameId === gameId && gb.badgeId === badgeId
    );
    
    if (gameBadgeEntry) {
      this.gameBadges.delete(gameBadgeEntry[0]);
    }
  }
  
  // Stats methods
  async getStats(): Promise<Stats> {
    return this.statsData;
  }
  
  async updateStats(statsUpdate: Partial<Stats>): Promise<Stats> {
    this.statsData = { ...this.statsData, ...statsUpdate, updatedAt: new Date() };
    return this.statsData;
  }
}

export const storage = new MemStorage();
