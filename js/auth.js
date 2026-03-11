// ============================================================
// TRAP ARCHITECT - AUTH & PROFILE SYSTEM
// Social login, nickname setup, player profiles, creator ranks
// ============================================================

// ===== CREATOR RANK TIERS =====
const CREATOR_RANKS = [
  { level: 0, title: 'Jogador',          color: '#888',    minLevels: 0,  minPlays: 0,     minLikes: 0,    needsChoice: false },
  { level: 1, title: 'Criador Novato',   color: '#4CAF50', minLevels: 1,  minPlays: 0,     minLikes: 0,    needsChoice: false },
  { level: 2, title: 'Construtor',       color: '#2196F3', minLevels: 5,  minPlays: 50,    minLikes: 0,    needsChoice: false },
  { level: 3, title: 'Arquiteto',        color: '#9C27B0', minLevels: 15, minPlays: 500,   minLikes: 100,  needsChoice: false },
  { level: 4, title: 'Mestre Troll',     color: '#FF9800', minLevels: 30, minPlays: 2000,  minLikes: 500,  needsChoice: false },
  { level: 5, title: 'Lenda',            color: '#FFD700', minLevels: 50, minPlays: 10000, minLikes: 1000, needsChoice: true  },
];

// ===== DEFAULT COSMETICS =====
const DEFAULT_COSMETICS = {
  skin: 'default',
  trail: 'none',
  deathEffect: 'default',
  profileFrame: 'none',
};

const AVAILABLE_SKINS = [
  { id: 'default',   name: 'Gato Clássico',  cost: 0,   color: '#FF8C00', unlocked: true },
  { id: 'ninja',     name: 'Gato Ninja',      cost: 100, color: '#333',    unlocked: false },
  { id: 'pixel',     name: 'Gato Pixel',      cost: 150, color: '#00FF00', unlocked: false },
  { id: 'ghost',     name: 'Gato Fantasma',   cost: 200, color: '#AACCFF', unlocked: false },
  { id: 'golden',    name: 'Gato Dourado',    cost: 500, color: '#FFD700', unlocked: false },
  { id: 'troll',     name: 'Gato Troll',      cost: 300, color: '#FF4444', unlocked: false },
  { id: 'ice',       name: 'Gato Gelo',       cost: 250, color: '#88DDFF', unlocked: false },
  { id: 'lava',      name: 'Gato Lava',       cost: 400, color: '#FF4400', unlocked: false },
];

// ===== AUTH MANAGER =====
class AuthManager {
  constructor() {
    this.user = null;           // Firebase user object
    this.profile = null;        // Player profile from Firestore
    this.isReady = false;       // Auth state resolved
    this.isLoggingIn = false;   // Waiting for login flow
    this.loginError = null;     // Last error message
    this._onAuthCallbacks = []; // Callbacks for auth state changes
  }

  init() {
    if (!firebaseAuth) {
      this.isReady = true;
      return;
    }

    firebaseAuth.onAuthStateChanged(async (user) => {
      this.user = user;
      if (user) {
        await this._loadProfile();
      } else {
        this.profile = null;
      }
      this.isReady = true;
      this._notifyCallbacks();
    });
  }

  onAuthChange(callback) {
    this._onAuthCallbacks.push(callback);
  }

  _notifyCallbacks() {
    for (const cb of this._onAuthCallbacks) {
      try { cb(this.user, this.profile); } catch (e) { console.error(e); }
    }
  }

  // ----- LOGIN METHODS -----

  async loginWithGoogle() {
    if (!firebaseAuth) return;
    this.isLoggingIn = true;
    this.loginError = null;
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebaseAuth.signInWithPopup(provider);
    } catch (e) {
      this.loginError = this._parseError(e);
    }
    this.isLoggingIn = false;
  }

  async loginWithGitHub() {
    if (!firebaseAuth) return;
    this.isLoggingIn = true;
    this.loginError = null;
    try {
      const provider = new firebase.auth.GithubAuthProvider();
      await firebaseAuth.signInWithPopup(provider);
    } catch (e) {
      this.loginError = this._parseError(e);
    }
    this.isLoggingIn = false;
  }

  async logout() {
    if (!firebaseAuth) return;
    await firebaseAuth.signOut();
    this.user = null;
    this.profile = null;
    this._notifyCallbacks();
  }

  _parseError(e) {
    const code = e.code || '';
    if (code.includes('popup-closed')) return 'Login cancelado';
    if (code.includes('account-exists')) return 'Conta já existe com outro login';
    if (code.includes('network')) return 'Erro de conexão';
    return 'Erro ao fazer login';
  }

  // ----- PROFILE MANAGEMENT -----

  get isLoggedIn() {
    return !!this.user && !!this.profile;
  }

  get needsNickname() {
    return !!this.user && (!this.profile || !this.profile.nickname);
  }

  async _loadProfile() {
    if (!firebaseDB || !this.user) return;
    try {
      const doc = await firebaseDB.collection('players').doc(this.user.uid).get();
      if (doc.exists) {
        this.profile = doc.data();
      } else {
        // First time user — profile will be created during nickname setup
        this.profile = null;
      }
    } catch (e) {
      console.error('Error loading profile:', e);
      this.profile = null;
    }
  }

  async createProfile(nickname) {
    if (!firebaseDB || !this.user) return { ok: false, error: 'Não autenticado' };

    // Validate nickname
    const clean = this._sanitizeNickname(nickname);
    if (!clean) return { ok: false, error: 'Nickname inválido' };
    if (clean.length < 3) return { ok: false, error: 'Mínimo 3 caracteres' };
    if (clean.length > 16) return { ok: false, error: 'Máximo 16 caracteres' };

    // Check uniqueness
    const taken = await this._isNicknameTaken(clean);
    if (taken) return { ok: false, error: 'Nickname já em uso' };

    const now = firebase.firestore.FieldValue.serverTimestamp();
    const profile = {
      nickname: clean,
      nicknameLower: clean.toLowerCase(),
      photoURL: this.user.photoURL || null,
      createdAt: now,
      lastSeen: now,

      // Creator stats
      levelsPublished: 0,
      totalPlays: 0,
      totalLikes: 0,
      creatorCoins: 0,
      creatorRank: 0,
      devsChoiceCount: 0,

      // Player stats
      levelsCompleted: 0,
      totalDeaths: 0,
      totalCoins: 0,
      timePlayed: 0,

      // Cosmetics
      equippedSkin: 'default',
      equippedTrail: 'none',
      equippedDeathEffect: 'default',
      equippedFrame: 'none',
      unlockedCosmetics: ['default'],
    };

    try {
      await firebaseDB.collection('players').doc(this.user.uid).set(profile);
      // Also index the nickname for uniqueness checks
      await firebaseDB.collection('nicknames').doc(clean.toLowerCase()).set({
        uid: this.user.uid,
        createdAt: now,
      });
      this.profile = { ...profile, createdAt: new Date(), lastSeen: new Date() };
      this._notifyCallbacks();
      return { ok: true };
    } catch (e) {
      console.error('Error creating profile:', e);
      return { ok: false, error: 'Erro ao salvar perfil' };
    }
  }

  async updateLastSeen() {
    if (!firebaseDB || !this.user || !this.profile) return;
    try {
      await firebaseDB.collection('players').doc(this.user.uid).update({
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {}
  }

  async _isNicknameTaken(nickname) {
    if (!firebaseDB) return false;
    try {
      const doc = await firebaseDB.collection('nicknames').doc(nickname.toLowerCase()).get();
      if (!doc.exists) return false;
      // If it's the current user's nickname, it's not "taken"
      return doc.data().uid !== this.user.uid;
    } catch (e) {
      return true; // Fail safe — treat as taken on error
    }
  }

  _sanitizeNickname(raw) {
    if (!raw || typeof raw !== 'string') return '';
    // Allow letters, numbers, underscores, hyphens only
    return raw.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, '').trim();
  }

  // ----- CREATOR RANK -----

  getCreatorRank() {
    if (!this.profile) return CREATOR_RANKS[0];
    const p = this.profile;
    let rank = CREATOR_RANKS[0];
    for (const r of CREATOR_RANKS) {
      if (p.levelsPublished >= r.minLevels &&
          p.totalPlays >= r.minPlays &&
          p.totalLikes >= r.minLikes &&
          (!r.needsChoice || p.devsChoiceCount > 0)) {
        rank = r;
      }
    }
    return rank;
  }

  // ----- CREATOR COINS -----

  async addCreatorCoins(amount) {
    if (!firebaseDB || !this.user || !this.profile) return;
    try {
      await firebaseDB.collection('players').doc(this.user.uid).update({
        creatorCoins: firebase.firestore.FieldValue.increment(amount),
      });
      this.profile.creatorCoins = (this.profile.creatorCoins || 0) + amount;
    } catch (e) {}
  }

  // ----- COSMETICS -----

  async unlockCosmetic(cosmeticId, cost) {
    if (!this.profile) return { ok: false, error: 'Não logado' };
    if (this.profile.creatorCoins < cost) return { ok: false, error: 'Moedas insuficientes' };
    if (this.profile.unlockedCosmetics.includes(cosmeticId)) return { ok: false, error: 'Já desbloqueado' };

    try {
      await firebaseDB.collection('players').doc(this.user.uid).update({
        creatorCoins: firebase.firestore.FieldValue.increment(-cost),
        unlockedCosmetics: firebase.firestore.FieldValue.arrayUnion(cosmeticId),
      });
      this.profile.creatorCoins -= cost;
      this.profile.unlockedCosmetics.push(cosmeticId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Erro ao desbloquear' };
    }
  }

  async equipCosmetic(type, cosmeticId) {
    if (!this.profile) return;
    const fieldMap = { skin: 'equippedSkin', trail: 'equippedTrail', deathEffect: 'equippedDeathEffect', frame: 'equippedFrame' };
    const field = fieldMap[type];
    if (!field) return;
    try {
      await firebaseDB.collection('players').doc(this.user.uid).update({ [field]: cosmeticId });
      this.profile[field] = cosmeticId;
    } catch (e) {}
  }
}

// Global auth instance
const auth = new AuthManager();
