/**
 * 贪吃蛇皮肤系统配置
 * 定义所有可用皮肤的属性和解锁条件
 * @module skins
 */

// ========================================
// 皮肤配置数据
// ========================================
const SKINS = {
    // 免费皮肤
    classic: {
        id: 'classic',
        name: '经典绿',
        icon: '🟢',
        headColor: '#22c55e',
        bodyColor: '#16a34a',
        shape: 'square',
        effect: 'none',
        unlockType: 'free',
        unlockCondition: null,
        description: '默认皮肤，经典回忆'
    },
    blue: {
        id: 'blue',
        name: '深海蓝',
        icon: '🔵',
        headColor: '#3b82f6',
        bodyColor: '#2563eb',
        shape: 'square',
        effect: 'none',
        unlockType: 'free',
        unlockCondition: null,
        description: '沉静的蓝色海洋'
    },
    
    // 分数解锁皮肤
    red: {
        id: 'red',
        name: '火焰红',
        icon: '🔴',
        headColor: '#ef4444',
        bodyColor: '#dc2626',
        shape: 'square',
        effect: 'flame',
        unlockType: 'score',
        unlockCondition: 500,
        description: '燃烧吧！我的小宇宙'
    },
    purple: {
        id: 'purple',
        name: '神秘紫',
        icon: '🟣',
        headColor: '#a855f7',
        bodyColor: '#9333ea',
        shape: 'circle',
        effect: 'none',
        unlockType: 'score',
        unlockCondition: 300,
        description: '神秘而优雅'
    },
    gold: {
        id: 'gold',
        name: '黄金传说',
        icon: '🟡',
        headColor: '#eab308',
        bodyColor: '#ca8a04',
        shape: 'diamond',
        effect: 'sparkle',
        unlockType: 'score',
        unlockCondition: 1000,
        description: '传奇般的金色'
    },
    
    // 成就解锁皮肤
    rainbow: {
        id: 'rainbow',
        name: '彩虹',
        icon: '🌈',
        headColor: '#ff0000',
        bodyColor: '#gradient',
        shape: 'circle',
        effect: 'rainbow',
        unlockType: 'achievement',
        unlockCondition: 'win_all_difficulties',
        description: '通关所有难度解锁'
    },
    neon: {
        id: 'neon',
        name: '霓虹灯',
        icon: '💡',
        headColor: '#06b6d4',
        bodyColor: '#3b82f6',
        shape: 'square',
        effect: 'glow',
        unlockType: 'achievement',
        unlockCondition: 'score_2000',
        description: '单次得分超过 2000 解锁'
    },
    
    // 特殊形状皮肤
    arrow: {
        id: 'arrow',
        name: '箭头',
        icon: '➡️',
        headColor: '#f97316',
        bodyColor: '#ea580c',
        shape: 'arrow',
        effect: 'none',
        unlockType: 'score',
        unlockCondition: 800,
        description: '锐利的前锋'
    }
};

// ========================================
// 形状类型
// ========================================
const SHAPE_TYPES = {
    SQUARE: 'square',
    CIRCLE: 'circle',
    DIAMOND: 'diamond',
    ARROW: 'arrow'
};

// ========================================
// 特效类型
// ========================================
const EFFECT_TYPES = {
    NONE: 'none',
    FLAME: 'flame',
    SPARKLE: 'sparkle',
    RAINBOW: 'rainbow',
    GLOW: 'glow'
};

// ========================================
// 皮肤管理器类
// ========================================
class SkinManager {
    /**
     * 初始化皮肤管理器
     */
    constructor() {
        this.unlockedSkins = this.loadUnlockedSkins();
        this.selectedSkinId = this.loadSelectedSkin();
        this.achievements = this.loadAchievements();
        this.scores = this.loadScores();
        
        // 检查并解锁新皮肤
        this.checkUnlocks();
    }
    
    /**
     * 获取所有皮肤
     * @returns {Object} 皮肤配置对象
     */
    getAllSkins() {
        return SKINS;
    }
    
    /**
     * 获取指定皮肤
     * @param {string} skinId - 皮肤 ID
     * @returns {Object|null} 皮肤配置
     */
    getSkin(skinId) {
        return SKINS[skinId] || null;
    }
    
    /**
     * 获取当前选中的皮肤
     * @returns {Object} 皮肤配置
     */
    getCurrentSkin() {
        return this.getSkin(this.selectedSkinId) || SKINS.classic;
    }
    
    /**
     * 检查皮肤是否已解锁
     * @param {string} skinId - 皮肤 ID
     * @returns {boolean} 是否已解锁
     */
    isUnlocked(skinId) {
        const skin = this.getSkin(skinId);
        if (!skin) return false;
        
        // 免费皮肤直接解锁
        if (skin.unlockType === 'free') return true;
        
        // 检查是否在已解锁列表中
        return this.unlockedSkins.includes(skinId);
    }
    
    /**
     * 解锁皮肤
     * @param {string} skinId - 皮肤 ID
     */
    unlockSkin(skinId) {
        if (!this.isUnlocked(skinId)) {
            this.unlockedSkins.push(skinId);
            this.saveUnlockedSkins();
        }
    }
    
    /**
     * 选择皮肤
     * @param {string} skinId - 皮肤 ID
     * @returns {boolean} 是否选择成功
     */
    selectSkin(skinId) {
        if (!this.isUnlocked(skinId)) {
            return false;
        }
        
        this.selectedSkinId = skinId;
        this.saveSelectedSkin();
        return true;
    }
    
    /**
     * 检查并解锁符合条件的皮肤
     */
    checkUnlocks() {
        Object.values(SKINS).forEach(skin => {
            if (this.isUnlocked(skin.id)) return;
            
            // 分数解锁
            if (skin.unlockType === 'score') {
                const bestScore = Math.max(
                    this.scores.easy || 0,
                    this.scores.hard || 0,
                    this.scores.hell || 0
                );
                if (bestScore >= skin.unlockCondition) {
                    this.unlockSkin(skin.id);
                }
            }
            
            // 成就解锁
            if (skin.unlockType === 'achievement') {
                if (this.achievements.includes(skin.unlockCondition)) {
                    this.unlockSkin(skin.id);
                }
            }
        });
    }
    
    /**
     * 记录分数（用于解锁检查）
     * @param {string} difficulty - 难度
     * @param {number} score - 分数
     */
    recordScore(difficulty, score) {
        if (!this.scores[difficulty] || score > this.scores[difficulty]) {
            this.scores[difficulty] = score;
            this.saveScores();
            this.checkUnlocks();
        }
    }
    
    /**
     * 记录成就
     * @param {string} achievement - 成就 ID
     */
    recordAchievement(achievement) {
        if (!this.achievements.includes(achievement)) {
            this.achievements.push(achievement);
            this.saveAchievements();
            this.checkUnlocks();
        }
    }
    
    /**
     * 从本地存储加载已解锁皮肤
     * @returns {Array<string>} 已解锁皮肤 ID 列表
     */
    loadUnlockedSkins() {
        const saved = localStorage.getItem('snakeUnlockedSkins');
        if (saved) {
            return JSON.parse(saved);
        }
        // 默认解锁免费皮肤
        return Object.values(SKINS)
            .filter(skin => skin.unlockType === 'free')
            .map(skin => skin.id);
    }
    
    /**
     * 保存已解锁皮肤到本地存储
     */
    saveUnlockedSkins() {
        localStorage.setItem('snakeUnlockedSkins', JSON.stringify(this.unlockedSkins));
    }
    
    /**
     * 从本地存储加载选中的皮肤
     * @returns {string} 选中的皮肤 ID
     */
    loadSelectedSkin() {
        const saved = localStorage.getItem('snakeSelectedSkin');
        return saved || 'classic';
    }
    
    /**
     * 保存选中的皮肤到本地存储
     */
    saveSelectedSkin() {
        localStorage.setItem('snakeSelectedSkin', this.selectedSkinId);
    }
    
    /**
     * 从本地存储加载成就
     * @returns {Array<string>} 成就列表
     */
    loadAchievements() {
        const saved = localStorage.getItem('snakeAchievements');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * 保存成就到本地存储
     */
    saveAchievements() {
        localStorage.setItem('snakeAchievements', JSON.stringify(this.achievements));
    }
    
    /**
     * 从本地存储加载分数
     * @returns {Object} 各难度的最高分
     */
    loadScores() {
        const saved = localStorage.getItem('snakeScores');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * 保存分数到本地存储
     */
    saveScores() {
        localStorage.setItem('snakeScores', JSON.stringify(this.scores));
    }
    
    /**
     * 获取皮肤的解锁进度
     * @param {string} skinId - 皮肤 ID
     * @returns {Object} 解锁进度信息
     */
    getUnlockProgress(skinId) {
        const skin = this.getSkin(skinId);
        if (!skin) return null;
        
        if (skin.unlockType === 'free') {
            return { unlocked: true, progress: 100 };
        }
        
        if (skin.unlockType === 'score') {
            const bestScore = Math.max(
                this.scores.easy || 0,
                this.scores.hard || 0,
                this.scores.hell || 0
            );
            const progress = Math.min(100, Math.floor((bestScore / skin.unlockCondition) * 100));
            return {
                unlocked: this.isUnlocked(skinId),
                progress: progress,
                current: bestScore,
                required: skin.unlockCondition
            };
        }
        
        if (skin.unlockType === 'achievement') {
            return {
                unlocked: this.isUnlocked(skinId),
                progress: this.achievements.includes(skin.unlockCondition) ? 100 : 0
            };
        }
        
        return { unlocked: false, progress: 0 };
    }
}

// ========================================
// 导出（全局可用）
// ========================================
window.SKINS = SKINS;
window.SHAPE_TYPES = SHAPE_TYPES;
window.EFFECT_TYPES = EFFECT_TYPES;
window.SkinManager = SkinManager;
