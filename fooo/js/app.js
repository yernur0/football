/**
 * Football Draft Auction - Core Application Logic
 * Pure JavaScript, reactive state, robust auction timers, abilities & AI export
 */

(function () {
  'use strict';

  // --- DEFAULT CONFIGURATION & STATE ---
  const DEFAULT_SETTINGS = {
    startingBudget: 500, // in Millions EUR
    squadLimit: 15,      // exactly 15 players per team
    timerDuration: 15,   // in seconds
    enableAbilities: true,
    allowedAuctionTypes: ['standard', 'blind', 'buyout'],
    agentPercent: 10,    // 10%
    buyoutPercent: 50,   // +50% of starting price
    soundEnabled: true,
    quickBidSteps: [5, 10, 20],
    reserveProtection: true
  };

  const DEFAULT_TEAMS = [
    {
      id: 1,
      name: "Команда 1",
      color: "#38bdf8", // Sky Blue
      accentClass: "from-sky-500 to-blue-600",
      borderClass: "border-sky-500/40",
      bgClass: "bg-sky-500/10",
      budget: 500,
      spent: 0,
      players: [],
      abilities: {
        veto: { id: 'veto', name: 'Перехват', icon: '🛡️', used: false, desc: 'Сбрасывает текущую максимальную ставку лота' },
        scout: { id: 'scout', name: 'Разведка', icon: '🕵️', used: false, desc: 'В Слепом аукционе открывает скрытые ставки соперников' },
        agent: { id: 'agent', name: 'Агентский %', icon: '💰', used: false, desc: 'Добавляет +10% к финальной цене для победителя' }
      }
    },
    {
      id: 2,
      name: "Команда 2",
      color: "#34d399", // Emerald Green
      accentClass: "from-emerald-500 to-teal-600",
      borderClass: "border-emerald-500/40",
      bgClass: "bg-emerald-500/10",
      budget: 500,
      spent: 0,
      players: [],
      abilities: {
        veto: { id: 'veto', name: 'Перехват', icon: '🛡️', used: false, desc: 'Сбрасывает текущую максимальную ставку лота' },
        scout: { id: 'scout', name: 'Разведка', icon: '🕵️', used: false, desc: 'В Слепом аукционе открывает скрытые ставки соперников' },
        agent: { id: 'agent', name: 'Агентский %', icon: '💰', used: false, desc: 'Добавляет +10% к финальной цене для победителя' }
      }
    },
    {
      id: 3,
      name: "Команда 3",
      color: "#fbbf24", // Amber Gold
      accentClass: "from-amber-500 to-yellow-600",
      borderClass: "border-amber-500/40",
      bgClass: "bg-amber-500/10",
      budget: 500,
      spent: 0,
      players: [],
      abilities: {
        veto: { id: 'veto', name: 'Перехват', icon: '🛡️', used: false, desc: 'Сбрасывает текущую максимальную ставку лота' },
        scout: { id: 'scout', name: 'Разведка', icon: '🕵️', used: false, desc: 'В Слепом аукционе открывает скрытые ставки соперников' },
        agent: { id: 'agent', name: 'Агентский %', icon: '💰', used: false, desc: 'Добавляет +10% к финальной цене для победителя' }
      }
    }
  ];

  
  const FORMATIONS = {
    "4-3-3": {
      name: "4-3-3 (Классика)",
      lines: [
        { role: "FW", slots: [{ pos: "LW", name: "Левый вингер" }, { pos: "ST", name: "Форвард" }, { pos: "RW", name: "Правый вингер" }] },
        { role: "MID", slots: [{ pos: "CM", name: "Левый ЦП" }, { pos: "CDM", name: "Опорник" }, { pos: "CM", name: "Правый ЦП" }] },
        { role: "DEF", slots: [{ pos: "LB", name: "Левый защ" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "RB", name: "Правый защ" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "4-2-3-1": {
      name: "4-2-3-1 (Современная)",
      lines: [
        { role: "FW", slots: [{ pos: "ST", name: "Форвард" }] },
        { role: "MID", slots: [{ pos: "LAM", name: "Левый АПЗ" }, { pos: "CAM", name: "Центр АПЗ" }, { pos: "RAM", name: "Правый АПЗ" }] },
        { role: "MID", slots: [{ pos: "LDM", name: "Левый ОПЗ" }, { pos: "RDM", name: "Правый ОПЗ" }] },
        { role: "DEF", slots: [{ pos: "LB", name: "Левый защ" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "RB", name: "Правый защ" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "4-4-2": {
      name: "4-4-2 (Британская)",
      lines: [
        { role: "FW", slots: [{ pos: "ST", name: "Форвард" }, { pos: "ST", name: "Форвард" }] },
        { role: "MID", slots: [{ pos: "LM", name: "Левый ПЗ" }, { pos: "CM", name: "ЦП" }, { pos: "CM", name: "ЦП" }, { pos: "RM", name: "Правый ПЗ" }] },
        { role: "DEF", slots: [{ pos: "LB", name: "Левый защ" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "RB", name: "Правый защ" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "3-5-2": {
      name: "3-5-2 (Атакующая)",
      lines: [
        { role: "FW", slots: [{ pos: "ST", name: "Форвард" }, { pos: "ST", name: "Форвард" }] },
        { role: "MID", slots: [{ pos: "LWB", name: "Латераль" }, { pos: "CM", name: "ЦП" }, { pos: "CAM", name: "АПЗ" }, { pos: "CM", name: "ЦП" }, { pos: "RWB", name: "Латераль" }] },
        { role: "DEF", slots: [{ pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Либеро" }, { pos: "CB", name: "Центрбек" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "3-4-3": {
      name: "3-4-3 (Тотальная)",
      lines: [
        { role: "FW", slots: [{ pos: "LW", name: "Левый вингер" }, { pos: "ST", name: "Форвард" }, { pos: "RW", name: "Правый вингер" }] },
        { role: "MID", slots: [{ pos: "LM", name: "Левый ПЗ" }, { pos: "CM", name: "ЦП" }, { pos: "CM", name: "ЦП" }, { pos: "RM", name: "Правый ПЗ" }] },
        { role: "DEF", slots: [{ pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "5-3-2": {
      name: "5-3-2 (Защитная)",
      lines: [
        { role: "FW", slots: [{ pos: "ST", name: "Форвард" }, { pos: "ST", name: "Форвард" }] },
        { role: "MID", slots: [{ pos: "CM", name: "ЦП" }, { pos: "CDM", name: "Опорник" }, { pos: "CM", name: "ЦП" }] },
        { role: "DEF", slots: [{ pos: "LWB", name: "Латераль" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "RWB", name: "Латераль" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    },
    "4-1-2-1-2": {
      name: "4-1-2-1-2 (Ромб)",
      lines: [
        { role: "FW", slots: [{ pos: "ST", name: "Форвард" }, { pos: "ST", name: "Форвард" }] },
        { role: "MID", slots: [{ pos: "CAM", name: "АПЗ" }] },
        { role: "MID", slots: [{ pos: "CM", name: "ЦП" }, { pos: "CM", name: "ЦП" }] },
        { role: "MID", slots: [{ pos: "CDM", name: "Опорник" }] },
        { role: "DEF", slots: [{ pos: "LB", name: "Левый защ" }, { pos: "CB", name: "Центрбек" }, { pos: "CB", name: "Центрбек" }, { pos: "RB", name: "Правый защ" }] },
        { role: "GK", slots: [{ pos: "GK", name: "Вратарь" }] }
      ]
    }
  };

  class AuctionApp {
    constructor() {
      this.settings = this.loadSettings();
      this.teams = this.loadTeams();
      this.pool = this.loadPool();
      this.draftedPlayerIds = this.loadDraftedIds();
      this.currentLot = null;
      this.timerInterval = null;
      this.isSpinning = false;
      this.activePitchTeamId = 1;
      this.selectedPitchSlot = null;
      this.draggedPitchSlot = null;

      this.initDOMElements();
      this.bindEvents();
      this.render();
    }

    // --- STORAGE & PERSISTENCE ---
    loadSettings() {
      try {
        const saved = localStorage.getItem('draft_settings');
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Storage read error:', e);
      }
      return { ...DEFAULT_SETTINGS };
    }

    saveSettings() {
      try {
        localStorage.setItem('draft_settings', JSON.stringify(this.settings));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
    }

    loadTeams() {
      try {
        const saved = localStorage.getItem('draft_teams');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Storage read error:', e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    }

    saveTeams() {
      try {
        localStorage.setItem('draft_teams', JSON.stringify(this.teams));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
    }

    loadPool() {
      return [...(window.PLAYERS_DB || [])];
    }

    loadDraftedIds() {
      const ids = [];
      this.teams.forEach(t => {
        (t.players || []).forEach(p => ids.push(p.id));
      });
      return ids;
    }

    // --- DOM INITIALIZATION ---
    initDOMElements() {
      this.dom = {
        // Stats
        poolCount: document.getElementById('stat-pool-count'),
        totalDrafted: document.getElementById('stat-total-drafted'),
        soundToggleBtn: document.getElementById('btn-toggle-sound'),
        soundIcon: document.getElementById('icon-sound'),

        // Roulette & Lot
        btnSpin: document.getElementById('btn-spin-roulette'),
        rouletteStage: document.getElementById('roulette-stage'),
        emptyLotNotice: document.getElementById('empty-lot-notice'),
        activeLotCard: document.getElementById('active-lot-card'),
        rouletteAnimationBox: document.getElementById('roulette-anim-box'),
        rouletteTickerName: document.getElementById('roulette-ticker-name'),
        rouletteTickerClub: document.getElementById('roulette-ticker-club'),
        rouletteTickerPos: document.getElementById('roulette-ticker-pos'),

        // Player Card Elements
        playerPhoto: document.getElementById('lot-player-photo'),
        playerName: document.getElementById('lot-player-name'),
        playerNameEn: document.getElementById('lot-player-name-en'),
        playerClub: document.getElementById('lot-player-club'),
        playerLeague: document.getElementById('lot-player-league'),
        playerPosBadge: document.getElementById('lot-player-pos'),
        playerRole: document.getElementById('lot-player-role'),
        playerPrice: document.getElementById('lot-player-price'),
        playerRating: document.getElementById('lot-player-rating'),
        playerFlag: document.getElementById('lot-player-flag'),
        playerCountry: document.getElementById('lot-player-country'),

        // Auction Mode & Bids
        auctionTypeBadge: document.getElementById('auction-type-badge'),
        auctionTypeDesc: document.getElementById('auction-type-desc'),
        agentFeeBanner: document.getElementById('agent-fee-banner'),
        vetoBanner: document.getElementById('veto-banner'),
        currentBidAmount: document.getElementById('current-bid-amount'),
        leadingTeamDisplay: document.getElementById('leading-team-display'),

        // Timer Elements
        timerDisplay: document.getElementById('timer-display'),
        timerProgress: document.getElementById('timer-progress-bar'),

        // Bidding Panels
        standardBidPanel: document.getElementById('standard-bid-panel'),
        blindBidPanel: document.getElementById('blind-bid-panel'),
        buyoutActionBox: document.getElementById('buyout-action-box'),
        buyoutPriceTag: document.getElementById('buyout-price-tag'),

        // Blind Auction Team Cards
        blindBidCards: document.getElementById('blind-bid-cards-container'),
        btnRevealBlind: document.getElementById('btn-reveal-blind'),

        // Lot Action Buttons
        btnSkipLot: document.getElementById('btn-skip-lot'),
        btnPauseLot: document.getElementById('btn-pause-lot'),
        lotWinnerDeclaration: document.getElementById('lot-winner-declaration'),
        winnerDeclareText: document.getElementById('winner-declare-text'),
        btnConfirmSale: document.getElementById('btn-confirm-sale'),

        // Teams Container
        teamsContainer: document.getElementById('teams-container'),

        // Modals
        settingsModal: document.getElementById('modal-settings'),
        aiExportModal: document.getElementById('modal-ai-export'),
        pitchModal: document.getElementById('modal-pitch'),

        // AI Export
        aiPromptTextarea: document.getElementById('ai-prompt-textarea'),
        btnCopyPrompt: document.getElementById('btn-copy-prompt'),
        copyFeedback: document.getElementById('copy-feedback'),

        // Pitch
        pitchTeamTabs: document.getElementById('pitch-team-tabs'),
        pitchFormationSelect: document.getElementById('pitch-formation-select'),
        btnPitchAutoArrange: document.getElementById('btn-pitch-auto-arrange'),
        pitchSelectionIndicator: document.getElementById('pitch-selection-indicator'),
        pitchStartersContainer: document.getElementById('pitch-starters'),
        pitchBenchContainer: document.getElementById('pitch-bench'),
        pitchStatsDisplay: document.getElementById('pitch-stats-display'),

        // Rules & Free Agent Modals
        rulesModal: document.getElementById('modal-rules-help'),
        freeAgentModal: document.getElementById('modal-free-agent'),
        freeAgentTeamSelect: document.getElementById('free-agent-team-select'),
        freeAgentSearch: document.getElementById('free-agent-search'),
        freeAgentsList: document.getElementById('free-agents-list'),

        // Toast
        toastContainer: document.getElementById('toast-container')
      };
    }

    // --- EVENT BINDINGS ---
    bindEvents() {
      // Sound Toggle
      if (this.dom.soundToggleBtn) {
        this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());
      }

      // Spin Roulette
      if (this.dom.btnSpin) {
        this.dom.btnSpin.addEventListener('click', () => this.startRouletteSpin());
      }

      // Skip Lot
      if (this.dom.btnSkipLot) {
        this.dom.btnSkipLot.addEventListener('click', () => this.skipCurrentLot());
      }

      // Pause / Resume Lot Timer
      if (this.dom.btnPauseLot) {
        this.dom.btnPauseLot.addEventListener('click', () => this.toggleLotPause());
      }

      // Quick Manual Sell to Team X
      document.querySelectorAll('.quick-sell-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          this.manualSellToTeam(teamId);
        });
      });

      // Confirm Sale
      if (this.dom.btnConfirmSale) {
        this.dom.btnConfirmSale.addEventListener('click', () => this.confirmCurrentSale());
      }

      // Reveal Blind Bids
      if (this.dom.btnRevealBlind) {
        this.dom.btnRevealBlind.addEventListener('click', () => this.revealBlindBids());
      }

      // Settings Modal Open/Close
      const btnOpenSettings = document.getElementById('btn-open-settings');
      if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => this.openSettingsModal());
      }
      const btnCloseSettings = document.getElementById('btn-close-settings');
      if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => this.closeSettingsModal());
      }
      const btnSaveSettings = document.getElementById('btn-save-settings');
      if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => this.saveSettingsFromForm());
      }

      // AI Export Modal Open/Close
      const btnOpenExport = document.getElementById('btn-open-export');
      if (btnOpenExport) {
        btnOpenExport.addEventListener('click', () => this.openAIExportModal());
      }
      const btnCloseExport = document.getElementById('btn-close-export');
      if (btnCloseExport) {
        btnCloseExport.addEventListener('click', () => this.closeAIExportModal());
      }
      if (this.dom.btnCopyPrompt) {
        this.dom.btnCopyPrompt.addEventListener('click', () => this.copyAIPrompt());
      }

      // Tactical Pitch Modal Open/Close
      const btnOpenPitch = document.getElementById('btn-open-pitch');
      if (btnOpenPitch) {
        btnOpenPitch.addEventListener('click', () => this.openPitchModal());
      }
      const btnClosePitch = document.getElementById('btn-close-pitch');
      if (btnClosePitch) {
        btnClosePitch.addEventListener('click', () => this.closePitchModal());
      }

      // Rules / Bankruptcy Help Modal
      const btnOpenRules = document.getElementById('btn-open-rules');
      if (btnOpenRules) {
        btnOpenRules.addEventListener('click', () => this.openRulesModal());
      }
      const btnCloseRules = document.getElementById('btn-close-rules');
      if (btnCloseRules) {
        btnCloseRules.addEventListener('click', () => this.closeRulesModal());
      }

      // Free Agents Modal Close & Search
      const btnCloseFA = document.getElementById('btn-close-free-agent');
      if (btnCloseFA) {
        btnCloseFA.addEventListener('click', () => this.closeFreeAgentModal());
      }
      if (this.dom.freeAgentSearch) {
        this.dom.freeAgentSearch.addEventListener('input', () => this.renderFreeAgentsList());
      }
      if (this.dom.freeAgentTeamSelect) {
        this.dom.freeAgentTeamSelect.addEventListener('change', () => this.renderFreeAgentsList());
      }

      // Formation Change & Auto-Arrange
      if (this.dom.pitchFormationSelect) {
        this.dom.pitchFormationSelect.addEventListener('change', (e) => {
          const team = this.teams.find(t => t.id === this.activePitchTeamId);
          if (team) {
            team.formation = e.target.value;
            this.syncTeamLineup(team);
            this.saveTeams();
            this.renderPitchView();
            this.showToast(`Схема команды ${team.name} изменена на ${team.formation}!`, 'info');
          }
        });
      }
      if (this.dom.btnPitchAutoArrange) {
        this.dom.btnPitchAutoArrange.addEventListener('click', () => {
          const team = this.teams.find(t => t.id === this.activePitchTeamId);
          if (team) {
            this.autoArrangeLineup(team);
            this.saveTeams();
            this.renderPitchView();
            this.showToast(`Игроки автоматически расставлены по позициям!`, 'success');
          }
        });
      }

      // Reset Draft
      const btnResetDraft = document.getElementById('btn-reset-draft');
      if (btnResetDraft) {
        btnResetDraft.addEventListener('click', () => this.confirmResetDraft());
      }
    }

    // --- SOUND TOGGLE ---
    toggleSound() {
      const state = window.SoundFX.toggleSound();
      this.settings.soundEnabled = state;
      this.saveSettings();
      if (this.dom.soundIcon) {
        this.dom.soundIcon.textContent = state ? '🔊' : '🔇';
      }
      this.showToast(state ? 'Звук включен' : 'Звук отключен');
    }

    // --- TOAST NOTIFICATION ---
    showToast(message, type = 'info') {
      if (!this.dom.toastContainer) return;
      const toast = document.createElement('div');
      const borderClass = type === 'success' ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-200' :
                          type === 'warning' ? 'border-amber-500/60 bg-amber-950/80 text-amber-200' :
                          type === 'danger' ? 'border-rose-500/60 bg-rose-950/80 text-rose-200' :
                          'border-sky-500/60 bg-slate-900/90 text-sky-200';

      toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border ${borderClass} shadow-2xl backdrop-blur-md text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0`;
      toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '🛑' : 'ℹ️'}</span>
        <span>${message}</span>
      `;
      this.dom.toastContainer.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // --- ROULETTE RANDOMIZER ---
    startRouletteSpin() {
      if (this.isSpinning) return;

      // Check available pool
      const available = this.pool.filter(p => !this.draftedPlayerIds.includes(p.id));
      if (available.length === 0) {
        this.showToast('Все игроки из базы уже распределены!', 'warning');
        return;
      }

      // Clear any running lot timer
      this.clearLotTimer();

      this.isSpinning = true;
      if (this.dom.btnSpin) {
        this.dom.btnSpin.disabled = true;
        this.dom.btnSpin.classList.add('opacity-50', 'cursor-not-allowed');
      }

      // Show roulette animation box
      if (this.dom.emptyLotNotice) this.dom.emptyLotNotice.classList.add('hidden');
      if (this.dom.activeLotCard) this.dom.activeLotCard.classList.add('hidden');
      if (this.dom.lotWinnerDeclaration) this.dom.lotWinnerDeclaration.classList.add('hidden');
      if (this.dom.rouletteAnimationBox) {
        this.dom.rouletteAnimationBox.classList.remove('hidden');
        this.dom.rouletteAnimationBox.classList.add('roulette-active');
      }

      // Pick target player randomly
      const targetPlayer = available[Math.floor(Math.random() * available.length)];

      // Determine auction mode based on settings
      const allowedModes = this.settings.allowedAuctionTypes.length > 0 ?
        this.settings.allowedAuctionTypes : ['standard'];
      const auctionType = allowedModes[Math.floor(Math.random() * allowedModes.length)];

      let speed = 40; // ms
      let elapsed = 0;
      const totalSpinTime = 2500; // 2.5 seconds spin
      let currentIndex = 0;

      const spinStep = () => {
        // Pick random dummy player to cycle
        const randomDummy = available[Math.floor(Math.random() * available.length)];
        if (this.dom.rouletteTickerName) this.dom.rouletteTickerName.textContent = randomDummy.name;
        if (this.dom.rouletteTickerClub) this.dom.rouletteTickerClub.textContent = `${randomDummy.club} • ${randomDummy.league}`;
        if (this.dom.rouletteTickerPos) {
          this.dom.rouletteTickerPos.textContent = randomDummy.position;
          this.dom.rouletteTickerPos.className = `px-2 py-0.5 rounded text-xs font-bold badge-pos-${randomDummy.position}`;
        }

        window.SoundFX.rouletteTick(1 + (elapsed / totalSpinTime) * 0.5);

        elapsed += speed;
        // Decelerate
        if (elapsed > 1600) {
          speed += 30;
        } else if (elapsed > 1000) {
          speed += 12;
        }

        if (elapsed < totalSpinTime) {
          setTimeout(spinStep, speed);
        } else {
          // Finish spin
          this.finishRouletteSpin(targetPlayer, auctionType);
        }
      };

      spinStep();
    }

    finishRouletteSpin(player, auctionType) {
      this.isSpinning = false;
      if (this.dom.btnSpin) {
        this.dom.btnSpin.disabled = false;
        this.dom.btnSpin.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      if (this.dom.rouletteAnimationBox) {
        this.dom.rouletteAnimationBox.classList.remove('roulette-active');
        this.dom.rouletteAnimationBox.classList.add('hidden');
      }

      window.SoundFX.whistle();

      // Setup Lot State
      const buyoutPrice = Math.round(player.price * (1 + this.settings.buyoutPercent / 100));

      this.currentLot = {
        player: player,
        auctionType: auctionType, // 'standard' | 'blind' | 'buyout'
        currentBid: player.price, // starts at market price
        initialBid: player.price,
        leadingTeamId: null,
        timer: this.settings.timerDuration,
        isRunning: true,
        agentFeeActivatedBy: null, // teamId who used agent ability
        vetoUsedBy: null,
        buyoutPrice: buyoutPrice,
        blindBids: { 1: null, 2: null, 3: null },
        blindRevealed: false,
        scoutActiveForTeamId: null, // team who used scout in blind auction
        completed: false
      };

      this.renderCurrentLot();
      this.startLotTimer();
      this.showToast(`🎯 Лот открыт: ${player.name} (${player.position})!`, 'info');
    }

    // --- LOT DISPLAY & RENDERING ---
    renderCurrentLot() {
      const lot = this.currentLot;
      if (!lot || !lot.player) {
        if (this.dom.emptyLotNotice) this.dom.emptyLotNotice.classList.remove('hidden');
        if (this.dom.activeLotCard) this.dom.activeLotCard.classList.add('hidden');
        return;
      }

      if (this.dom.emptyLotNotice) this.dom.emptyLotNotice.classList.add('hidden');
      if (this.dom.activeLotCard) this.dom.activeLotCard.classList.remove('hidden');

      const p = lot.player;

      // Player details
      if (this.dom.playerPhoto) {
        this.dom.playerPhoto.src = p.avatar;
        this.dom.playerPhoto.onerror = () => {
          // Fallback jersey SVG placeholder
          this.dom.playerPhoto.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="1.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`;
        };
      }
      if (this.dom.playerName) this.dom.playerName.textContent = p.name;
      if (this.dom.playerNameEn) this.dom.playerNameEn.textContent = p.nameEn || p.name;
      if (this.dom.playerClub) this.dom.playerClub.textContent = p.club;
      if (this.dom.playerLeague) this.dom.playerLeague.textContent = p.league;
      if (this.dom.playerPrice) this.dom.playerPrice.textContent = `€${p.price}M`;
      if (this.dom.playerRating) this.dom.playerRating.textContent = p.rating;
      if (this.dom.playerFlag) this.dom.playerFlag.textContent = p.flag || '⚽';
      if (this.dom.playerCountry) this.dom.playerCountry.textContent = p.nationality;
      if (this.dom.playerRole) this.dom.playerRole.textContent = p.role;

      if (this.dom.playerPosBadge) {
        this.dom.playerPosBadge.textContent = p.position;
        this.dom.playerPosBadge.className = `px-3 py-1 rounded-lg text-sm font-extrabold tracking-wider badge-pos-${p.position}`;
      }

      // Auction Mode Badge
      if (this.dom.auctionTypeBadge) {
        if (lot.auctionType === 'standard') {
          this.dom.auctionTypeBadge.innerHTML = '📢 ОБЫЧНЫЙ АУКЦИОН';
          this.dom.auctionTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/40';
          if (this.dom.auctionTypeDesc) this.dom.auctionTypeDesc.textContent = 'Открытые ставки в реальном времени. Таймер сбрасывается при новой ставке.';
        } else if (lot.auctionType === 'blind') {
          this.dom.auctionTypeBadge.innerHTML = '🙈 СЛЕПОЙ АУКЦИОН';
          this.dom.auctionTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-pulse';
          if (this.dom.auctionTypeDesc) this.dom.auctionTypeDesc.textContent = 'Скрытые ставки от каждой команды. Вскрываются по окончании времени.';
        } else if (lot.auctionType === 'buyout') {
          this.dom.auctionTypeBadge.innerHTML = '⚡ АУКЦИОН С ВЫКУПОМ';
          this.dom.auctionTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40';
          if (this.dom.auctionTypeDesc) this.dom.auctionTypeDesc.textContent = `Доступна опция мгновенного выкупа за €${lot.buyoutPrice}M (+${this.settings.buyoutPercent}%).`;
        }
      }

      // Agent fee banner
      if (this.dom.agentFeeBanner) {
        if (lot.agentFeeActivatedBy) {
          const t = this.teams.find(tm => tm.id === lot.agentFeeActivatedBy);
          this.dom.agentFeeBanner.classList.remove('hidden');
          this.dom.agentFeeBanner.innerHTML = `💰 <strong>Агентский сбор (+${this.settings.agentPercent}%):</strong> Активирован (${t ? t.name : 'Командой'})! Победитель лота заплатит комиссию.`;
        } else {
          this.dom.agentFeeBanner.classList.add('hidden');
        }
      }

      // Veto banner
      if (this.dom.vetoBanner) {
        if (lot.vetoUsedBy) {
          const t = this.teams.find(tm => tm.id === lot.vetoUsedBy);
          this.dom.vetoBanner.classList.remove('hidden');
          this.dom.vetoBanner.innerHTML = `🛡️ <strong>Перехват (Veto):</strong> Использован (${t ? t.name : 'Командой'})! Ставка была сброшена.`;
        } else {
          this.dom.vetoBanner.classList.add('hidden');
        }
      }

      // Bid Amount & Leading Team
      if (this.dom.currentBidAmount) {
        let displayPrice = lot.currentBid;
        if (lot.agentFeeActivatedBy && lot.leadingTeamId) {
          const extra = Math.round(lot.currentBid * (this.settings.agentPercent / 100));
          this.dom.currentBidAmount.innerHTML = `€${lot.currentBid}M <span class="text-xs text-amber-400 font-normal">(+€${extra}M сбор = €${lot.currentBid + extra}M)</span>`;
        } else {
          this.dom.currentBidAmount.textContent = `€${displayPrice}M`;
        }
      }

      if (this.dom.leadingTeamDisplay) {
        if (lot.auctionType === 'blind' && !lot.blindRevealed) {
          this.dom.leadingTeamDisplay.innerHTML = `<span class="text-purple-400">🔒 Ставки засекречены</span>`;
        } else if (lot.leadingTeamId) {
          const leadingTeam = this.teams.find(t => t.id === lot.leadingTeamId);
          this.dom.leadingTeamDisplay.innerHTML = `<span style="color: ${leadingTeam.color}; font-weight: bold;">👑 ${leadingTeam.name}</span>`;
        } else {
          this.dom.leadingTeamDisplay.innerHTML = `<span class="text-slate-400">Стартовая ставка</span>`;
        }
      }

      // Panel visibility based on mode
      if (lot.auctionType === 'blind') {
        if (this.dom.standardBidPanel) this.dom.standardBidPanel.classList.add('hidden');
        if (this.dom.blindBidPanel) this.dom.blindBidPanel.classList.remove('hidden');
        if (this.dom.buyoutActionBox) this.dom.buyoutActionBox.classList.add('hidden');
        this.renderBlindBidsCards();
      } else {
        if (this.dom.standardBidPanel) this.dom.standardBidPanel.classList.remove('hidden');
        if (this.dom.blindBidPanel) this.dom.blindBidPanel.classList.add('hidden');

        if (lot.auctionType === 'buyout') {
          if (this.dom.buyoutActionBox) this.dom.buyoutActionBox.classList.remove('hidden');
          if (this.dom.buyoutPriceTag) this.dom.buyoutPriceTag.textContent = `€${lot.buyoutPrice}M`;
          this.renderBuyoutButtons();
        } else {
          if (this.dom.buyoutActionBox) this.dom.buyoutActionBox.classList.add('hidden');
        }
        this.renderStandardBidButtons();
      }

      // Update quick manual sell buttons with actual team names
      document.querySelectorAll('.quick-sell-btn').forEach(btn => {
        const tId = parseInt(btn.getAttribute('data-team'), 10);
        const team = this.teams.find(t => t.id === tId);
        if (team) {
          btn.textContent = `${team.name}`;
          btn.title = `Продать игрока ${team.name} по текущей цене (€${lot.currentBid}M)`;
        }
      });

      this.updateTimerDisplay();
    }

    // --- STANDARD BID BUTTONS ---
    renderStandardBidButtons() {
      if (!this.dom.standardBidPanel || !this.currentLot) return;
      const lot = this.currentLot;

      this.dom.standardBidPanel.innerHTML = '';

      this.teams.forEach(team => {
        const isLeading = lot.leadingTeamId === team.id;
        const isSquadFull = (team.players || []).length >= this.settings.squadLimit;
        const maxAffordable = team.budget;

        const teamCol = document.createElement('div');
        teamCol.className = `p-3 rounded-xl border ${isLeading ? 'border-sky-400 bg-sky-950/40 ring-2 ring-sky-400/40' : 'border-slate-700/60 bg-slate-900/60'} flex flex-col gap-2`;

        let headerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm truncate" style="color: ${team.color};">${team.name}</span>
            <span class="text-xs font-mono text-slate-300">Остаток: €${team.budget}M</span>
          </div>
        `;

        let buttonsHTML = `<div class="grid grid-cols-3 gap-1.5 mt-1">`;
        this.settings.quickBidSteps.forEach(step => {
          const nextBid = lot.currentBid + step;
          const totalCost = lot.agentFeeActivatedBy ? Math.round(nextBid * (1 + this.settings.agentPercent / 100)) : nextBid;
          const disabled = isSquadFull || totalCost > maxAffordable || !lot.isRunning;

          buttonsHTML += `
            <button 
              type="button" 
              class="bid-btn px-2 py-2 rounded-lg text-xs font-bold font-mono transition-all duration-150 ${disabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-600/50 hover:border-slate-400'}"
              data-team="${team.id}" 
              data-step="${step}"
              ${disabled ? 'disabled' : ''}
            >
              +€${step}M
            </button>
          `;
        });
        buttonsHTML += `</div>`;

        // Custom bid input
        buttonsHTML += `
          <div class="flex items-center gap-1.5 mt-1">
            <input 
              type="number" 
              min="${lot.currentBid + 1}" 
              max="${maxAffordable}" 
              placeholder="Своя (€M)" 
              class="custom-bid-input w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              data-team="${team.id}"
              ${isSquadFull || !lot.isRunning ? 'disabled' : ''}
            />
            <button 
              type="button" 
              class="custom-bid-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              data-team="${team.id}"
              ${isSquadFull || !lot.isRunning ? 'disabled' : ''}
            >
              Ок
            </button>
          </div>
        `;

        if (isSquadFull) {
          buttonsHTML += `<div class="text-[11px] text-amber-400 text-center font-medium mt-1">Состав заполнен (${this.settings.squadLimit}/${this.settings.squadLimit})</div>`;
        }

        teamCol.innerHTML = headerHTML + buttonsHTML;
        this.dom.standardBidPanel.appendChild(teamCol);
      });

      // Bind bid click handlers
      this.dom.standardBidPanel.querySelectorAll('.bid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const step = parseInt(e.currentTarget.getAttribute('data-step'), 10);
          this.placeStandardBid(teamId, step);
        });
      });

      this.dom.standardBidPanel.querySelectorAll('.custom-bid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const input = this.dom.standardBidPanel.querySelector(`.custom-bid-input[data-team="${teamId}"]`);
          if (input && input.value) {
            const amount = parseInt(input.value, 10);
            this.placeCustomBid(teamId, amount);
          }
        });
      });
    }

    // --- BUYOUT BUTTONS ---
    renderBuyoutButtons() {
      if (!this.dom.buyoutActionBox || !this.currentLot) return;
      const lot = this.currentLot;

      const container = this.dom.buyoutActionBox.querySelector('#buyout-teams-btns');
      if (!container) return;
      container.innerHTML = '';

      this.teams.forEach(team => {
        const isSquadFull = (team.players || []).length >= this.settings.squadLimit;
        const buyoutTotal = lot.agentFeeActivatedBy ?
          Math.round(lot.buyoutPrice * (1 + this.settings.agentPercent / 100)) : lot.buyoutPrice;
        const canAfford = team.budget >= buyoutTotal && !isSquadFull && lot.isRunning;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${canAfford ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`;
        btn.innerHTML = `⚡ ${team.name} (€${buyoutTotal}M)`;
        btn.disabled = !canAfford;

        btn.addEventListener('click', () => {
          this.executeBuyout(team.id);
        });

        container.appendChild(btn);
      });
    }

    // --- BLIND AUCTION BIDS CARDS ---
    renderBlindBidsCards() {
      if (!this.dom.blindBidCards || !this.currentLot) return;
      const lot = this.currentLot;

      this.dom.blindBidCards.innerHTML = '';

      this.teams.forEach(team => {
        const isSquadFull = (team.players || []).length >= this.settings.squadLimit;
        const hasBid = lot.blindBids[team.id] !== null;
        const bidVal = lot.blindBids[team.id];

        // Is scout active for someone?
        // If scout was used by Team X, Team X gets to see opponents' bids!
        const canSeeThisBid = lot.blindRevealed || (lot.scoutActiveForTeamId !== null && lot.scoutActiveForTeamId === team.id) || (lot.scoutActiveForTeamId !== null);

        const card = document.createElement('div');
        card.className = `p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col gap-2`;

        card.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm" style="color: ${team.color};">${team.name}</span>
            <span class="text-xs font-mono text-slate-400">Бюджет: €${team.budget}M</span>
          </div>
          <div class="my-1">
            ${hasBid ? `
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-purple-500/40">
                <span class="text-xs text-purple-300 font-medium">
                  ${lot.blindRevealed ? 'Ставка раскрыта:' : (canSeeThisBid ? '🕵️ Разведка раскрыла:' : '🔒 Ставка отправлена:')}
                </span>
                <span class="text-sm font-bold font-mono text-white">
                  ${(lot.blindRevealed || canSeeThisBid) ? `€${bidVal}M` : '••••••'}
                </span>
              </div>
            ` : `
              <div class="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="${lot.initialBid}" 
                  max="${team.budget}" 
                  placeholder="Мин €${lot.initialBid}M" 
                  class="blind-input w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  data-team="${team.id}"
                  ${isSquadFull || !lot.isRunning ? 'disabled' : ''}
                />
                <button 
                  type="button" 
                  class="blind-submit-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                  data-team="${team.id}"
                  ${isSquadFull || !lot.isRunning ? 'disabled' : ''}
                >
                  Скрыть
                </button>
              </div>
            `}
          </div>
        `;

        this.dom.blindBidCards.appendChild(card);
      });

      // Bind blind input submits
      this.dom.blindBidCards.querySelectorAll('.blind-submit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const input = this.dom.blindBidCards.querySelector(`.blind-input[data-team="${teamId}"]`);
          if (input && input.value) {
            const amount = parseInt(input.value, 10);
            this.placeBlindBid(teamId, amount);
          }
        });
      });
    }

    // --- BANKRUPTCY PROTECTION HELPER ---
    checkBankruptcyProtection(team, cost) {
      if (this.settings.reserveProtection !== false) {
        const remainingSpots = this.settings.squadLimit - (team.players || []).length;
        if (remainingSpots > 1) {
          const minReserve = (remainingSpots - 1) * 1; // 1M per remaining player
          if (team.budget - cost < minReserve) {
            const maxBid = Math.max(1, team.budget - minReserve);
            this.showToast(`🛡️ Защита от банкротства: нужно сохранить минимум €${minReserve}M на оставшиеся ${remainingSpots - 1} игроков! Макс. ставка: €${maxBid}M`, 'warning');
            return false;
          }
        }
      }
      return true;
    }

    // --- BIDDING ACTIONS ---
    placeStandardBid(teamId, step) {
      if (!this.currentLot || !this.currentLot.isRunning) return;
      const lot = this.currentLot;
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      const nextBid = lot.currentBid + step;
      const finalPrice = lot.agentFeeActivatedBy ?
        Math.round(nextBid * (1 + this.settings.agentPercent / 100)) : nextBid;

      if (finalPrice > team.budget) {
        this.showToast(`${team.name}: Недостаточно средств (€${team.budget}M < €${finalPrice}M)`, 'danger');
        return;
      }

      if (!this.checkBankruptcyProtection(team, finalPrice)) return;

      lot.currentBid = nextBid;
      lot.leadingTeamId = teamId;
      lot.timer = this.settings.timerDuration; // reset timer

      window.SoundFX.bid();
      this.triggerCardShake();
      this.renderCurrentLot();
      this.showToast(`🔥 ${team.name} повышает ставку до €${nextBid}M!`, 'success');
    }

    placeCustomBid(teamId, amount) {
      if (!this.currentLot || !this.currentLot.isRunning) return;
      const lot = this.currentLot;
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      if (amount <= lot.currentBid) {
        this.showToast(`Ставка должна быть выше текущей (€${lot.currentBid}M)!`, 'warning');
        return;
      }

      const finalPrice = lot.agentFeeActivatedBy ?
        Math.round(amount * (1 + this.settings.agentPercent / 100)) : amount;

      if (finalPrice > team.budget) {
        this.showToast(`${team.name}: Недостаточно средств (€${team.budget}M < €${finalPrice}M)`, 'danger');
        return;
      }

      if (!this.checkBankruptcyProtection(team, finalPrice)) return;

      lot.currentBid = amount;
      lot.leadingTeamId = teamId;
      lot.timer = this.settings.timerDuration;

      window.SoundFX.bid();
      this.triggerCardShake();
      this.renderCurrentLot();
      this.showToast(`🔥 ${team.name} делает ставку €${amount}M!`, 'success');
    }

    executeBuyout(teamId) {
      if (!this.currentLot || !this.currentLot.isRunning) return;
      const lot = this.currentLot;
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      const buyoutTotal = lot.agentFeeActivatedBy ?
        Math.round(lot.buyoutPrice * (1 + this.settings.agentPercent / 100)) : lot.buyoutPrice;

      if (buyoutTotal > team.budget) {
        this.showToast(`Недостаточно средств для выкупа!`, 'danger');
        return;
      }

      if (!this.checkBankruptcyProtection(team, buyoutTotal)) return;

      lot.currentBid = lot.buyoutPrice;
      lot.leadingTeamId = teamId;
      this.clearLotTimer();
      lot.isRunning = false;

      window.SoundFX.gavel();
      this.showLotWinnerDeclaration(team, buyoutTotal, true);
    }

    placeBlindBid(teamId, amount) {
      if (!this.currentLot || !this.currentLot.isRunning) return;
      const lot = this.currentLot;
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      if (amount < lot.initialBid) {
        this.showToast(`Ставка не может быть ниже стартовой цены €${lot.initialBid}M!`, 'warning');
        return;
      }

      const finalCheck = lot.agentFeeActivatedBy ?
        Math.round(amount * (1 + this.settings.agentPercent / 100)) : amount;

      if (finalCheck > team.budget) {
        this.showToast(`${team.name}: Недостаточно бюджета!`, 'danger');
        return;
      }

      lot.blindBids[teamId] = amount;
      window.SoundFX.bid();
      this.renderCurrentLot();
      this.showToast(`🔒 ${team.name} сделала скрытую ставку!`);

      // Check if all 3 teams submitted
      const allSubmitted = Object.values(lot.blindBids).every(b => b !== null);
      if (allSubmitted) {
        this.showToast('Все команды подали ставки! Можно вскрывать.', 'info');
      }
    }

    revealBlindBids() {
      if (!this.currentLot || this.currentLot.auctionType !== 'blind') return;
      const lot = this.currentLot;

      this.clearLotTimer();
      lot.isRunning = false;
      lot.blindRevealed = true;

      // Find highest bid
      let topBid = 0;
      let winningTeamId = null;

      this.teams.forEach(team => {
        const bid = lot.blindBids[team.id];
        if (bid && bid > topBid) {
          topBid = bid;
          winningTeamId = team.id;
        }
      });

      if (!winningTeamId || topBid === 0) {
        this.renderCurrentLot();
        this.showToast('Ни одна команда не сделала ставку!', 'warning');
        return;
      }

      lot.currentBid = topBid;
      lot.leadingTeamId = winningTeamId;

      window.SoundFX.whistle();
      this.renderCurrentLot();

      const winner = this.teams.find(t => t.id === winningTeamId);
      const finalPrice = lot.agentFeeActivatedBy ?
        Math.round(topBid * (1 + this.settings.agentPercent / 100)) : topBid;

      this.showLotWinnerDeclaration(winner, finalPrice, false);
    }

    // --- ABILITIES LOGIC ---
    useAbility(teamId, abilityKey) {
      if (!this.settings.enableAbilities) {
        this.showToast('Спецспособности отключены в настройках!', 'warning');
        return;
      }

      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      const ability = team.abilities[abilityKey];
      if (!ability || ability.used) {
        this.showToast('Способность уже использована!', 'warning');
        return;
      }

      if (!this.currentLot || !this.currentLot.player) {
        this.showToast('Способность можно активировать только во время активного лота!', 'warning');
        return;
      }

      const lot = this.currentLot;

      if (abilityKey === 'veto') {
        // Veto resets current top bid!
        if (!lot.leadingTeamId && lot.currentBid === lot.initialBid) {
          this.showToast('Перехват нельзя использовать, пока нет активных ставок соперников!', 'warning');
          return;
        }

        ability.used = true;
        lot.vetoUsedBy = teamId;
        lot.currentBid = lot.initialBid;
        lot.leadingTeamId = null;
        lot.timer = this.settings.timerDuration; // reset timer

        window.SoundFX.ability();
        this.saveTeams();
        this.render();
        this.showToast(`🛡️ ${team.name} использовала ПЕРЕХВАТ! Ставка сброшена до стартовой!`, 'danger');
      } 
      else if (abilityKey === 'scout') {
        // Scout reveals hidden bids in blind auction
        if (lot.auctionType !== 'blind') {
          this.showToast('Разведка действует только в Слепом аукционе!', 'warning');
          return;
        }

        ability.used = true;
        lot.scoutActiveForTeamId = teamId;

        window.SoundFX.ability();
        this.saveTeams();
        this.renderCurrentLot();
        this.renderTeams();
        this.showToast(`🕵️ ${team.name} активировала РАЗВЕДКУ! Скрытые ставки раскрыты!`, 'info');
      } 
      else if (abilityKey === 'agent') {
        // Agent fee adds +10% to winning price
        if (lot.agentFeeActivatedBy) {
          this.showToast('Агентский процент уже активирован для этого лота!', 'warning');
          return;
        }

        ability.used = true;
        lot.agentFeeActivatedBy = teamId;

        window.SoundFX.ability();
        this.saveTeams();
        this.renderCurrentLot();
        this.renderTeams();
        this.showToast(`💰 ${team.name} наложила АГЕНТСКИЙ СБОР (+${this.settings.agentPercent}%) на победителя!`, 'warning');
      }
    }

    // --- TIMERS & CLOCK ---
    startLotTimer() {
      this.clearLotTimer();
      const lot = this.currentLot;
      if (!lot) return;

      this.timerInterval = setInterval(() => {
        if (!lot.isRunning) return;

        lot.timer--;

        if (lot.timer <= 5 && lot.timer > 0) {
          window.SoundFX.beep(false);
        }

        if (lot.timer <= 0) {
          lot.timer = 0;
          this.handleTimerExpired();
        }

        this.updateTimerDisplay();
      }, 1000);
    }

    clearLotTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    updateTimerDisplay() {
      if (!this.currentLot) return;
      const lot = this.currentLot;

      if (this.dom.timerDisplay) {
        this.dom.timerDisplay.textContent = `${lot.timer}с`;
        if (lot.timer <= 5) {
          this.dom.timerDisplay.className = 'text-3xl font-black font-mono text-rose-500 animate-pulse';
        } else {
          this.dom.timerDisplay.className = 'text-3xl font-black font-mono text-white';
        }
      }

      if (this.dom.timerProgress) {
        const percent = (lot.timer / this.settings.timerDuration) * 100;
        this.dom.timerProgress.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        if (lot.timer <= 5) {
          this.dom.timerProgress.className = 'h-full bg-rose-500 transition-all duration-1000 linear';
        } else {
          this.dom.timerProgress.className = 'h-full bg-sky-500 transition-all duration-1000 linear';
        }
      }
    }

    handleTimerExpired() {
      this.clearLotTimer();
      const lot = this.currentLot;
      lot.isRunning = false;
      window.SoundFX.beep(true);

      if (lot.auctionType === 'blind') {
        // In blind auction, reveal bids when timer ends
        this.revealBlindBids();
        return;
      }

      if (lot.leadingTeamId) {
        window.SoundFX.gavel();
        const winner = this.teams.find(t => t.id === lot.leadingTeamId);
        const finalPrice = lot.agentFeeActivatedBy ?
          Math.round(lot.currentBid * (1 + this.settings.agentPercent / 100)) : lot.currentBid;

        this.showLotWinnerDeclaration(winner, finalPrice, false);
      } else {
        this.showToast('Время вышло! Ставок не поступило. Лот можно пропустить.', 'warning');
      }
    }

    // --- WINNER DECLARATION & CONFIRMATION ---
    showLotWinnerDeclaration(winnerTeam, finalPrice, isBuyout = false) {
      if (!this.dom.lotWinnerDeclaration || !this.currentLot) return;
      const lot = this.currentLot;
      const p = lot.player;

      this.dom.lotWinnerDeclaration.classList.remove('hidden');

      const buyoutNotice = isBuyout ? '<div class="text-xs text-amber-400 font-bold uppercase tracking-widest mt-1">⚡ МГНОВЕННЫЙ ВЫКУП!</div>' : '';
      const agentNotice = lot.agentFeeActivatedBy ? `<div class="text-xs text-amber-300 mt-0.5">Включая агентский процент +${this.settings.agentPercent}%</div>` : '';

      if (this.dom.winnerDeclareText) {
        this.dom.winnerDeclareText.innerHTML = `
          <div class="text-slate-300 text-sm">Лот завершен! Победитель:</div>
          <div class="text-xl md:text-2xl font-black mt-1" style="color: ${winnerTeam.color};">
            🏆 ${winnerTeam.name}
          </div>
          <div class="text-lg font-bold font-mono text-white mt-1">
            Цена трансфера: €${finalPrice}M
          </div>
          ${buyoutNotice}
          ${agentNotice}
        `;
      }

      if (this.dom.btnConfirmSale) {
        this.dom.btnConfirmSale.setAttribute('data-winner', winnerTeam.id);
        this.dom.btnConfirmSale.setAttribute('data-price', finalPrice);
      }

      // Fire confetti if available
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }

    confirmCurrentSale() {
      if (!this.currentLot || !this.currentLot.player) return;
      const lot = this.currentLot;
      const winnerId = parseInt(this.dom.btnConfirmSale.getAttribute('data-winner'), 10);
      const finalPrice = parseInt(this.dom.btnConfirmSale.getAttribute('data-price'), 10);

      const team = this.teams.find(t => t.id === winnerId);
      if (!team) return;

      if (team.budget < finalPrice) {
        this.showToast(`У команды ${team.name} недостаточно средств (€${team.budget}M)!`, 'danger');
        return;
      }

      // Deduct budget & append player
      team.budget -= finalPrice;
      team.spent += finalPrice;
      team.players.push({
        ...lot.player,
        purchasePrice: finalPrice,
        auctionType: lot.auctionType
      });

      this.draftedPlayerIds.push(lot.player.id);

      window.SoundFX.gavel();
      this.saveTeams();

      this.showToast(`🎉 ${lot.player.name} официально перешел в команду "${team.name}" за €${finalPrice}M!`, 'success');

      // Clear lot
      this.currentLot = null;
      if (this.dom.lotWinnerDeclaration) this.dom.lotWinnerDeclaration.classList.add('hidden');

      this.render();

      // Check if all teams full
      this.checkDraftCompletion();
    }

    skipCurrentLot() {
      if (!this.currentLot) return;
      this.clearLotTimer();
      const playerName = this.currentLot.player ? this.currentLot.player.name : 'Игрок';
      this.currentLot = null;
      if (this.dom.lotWinnerDeclaration) this.dom.lotWinnerDeclaration.classList.add('hidden');
      this.render();
      this.showToast(`Лот "${playerName}" пропущен и возвращен в пул.`, 'info');
    }

    toggleLotPause() {
      if (!this.currentLot) return;
      const lot = this.currentLot;
      lot.isRunning = !lot.isRunning;

      if (this.dom.btnPauseLot) {
        this.dom.btnPauseLot.textContent = lot.isRunning ? '⏸️ Пауза' : '▶️ Продолжить';
        this.dom.btnPauseLot.className = lot.isRunning ?
          'px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-bold text-slate-300 hover:text-white transition-all' :
          'px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-bold text-amber-300 transition-all animate-pulse';
      }
      this.showToast(lot.isRunning ? 'Таймер возобновлен' : 'Таймер на паузе', 'info');
    }

    manualSellToTeam(teamId) {
      if (!this.currentLot || !this.currentLot.player) {
        this.showToast('Нет активного лота для продажи!', 'warning');
        return;
      }
      const lot = this.currentLot;
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      const isFull = (team.players || []).length >= this.settings.squadLimit;
      if (isFull) {
        this.showToast(`У команды ${team.name} уже заполнен состав (${this.settings.squadLimit}/${this.settings.squadLimit})!`, 'warning');
        return;
      }

      const basePrice = lot.currentBid;
      const finalPrice = lot.agentFeeActivatedBy ?
        Math.round(basePrice * (1 + this.settings.agentPercent / 100)) : basePrice;

      if (team.budget < finalPrice) {
        this.showToast(`У команды ${team.name} недостаточно средств (€${team.budget}M < €${finalPrice}M)!`, 'danger');
        return;
      }

      this.clearLotTimer();
      lot.isRunning = false;

      // Deduct budget & record purchase
      team.budget -= finalPrice;
      team.spent += finalPrice;
      team.players.push({
        ...lot.player,
        purchasePrice: finalPrice,
        auctionType: lot.auctionType
      });

      this.draftedPlayerIds.push(lot.player.id);

      window.SoundFX.gavel();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      this.saveTeams();
      this.showToast(`🔨 ${lot.player.name} продан команде "${team.name}" за €${finalPrice}M!`, 'success');

      this.currentLot = null;
      if (this.dom.lotWinnerDeclaration) this.dom.lotWinnerDeclaration.classList.add('hidden');
      this.render();
      this.checkDraftCompletion();
    }

    removePlayerFromTeam(teamId, playerId) {
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      const idx = team.players.findIndex(p => p.id === playerId);
      if (idx === -1) return;

      const removed = team.players.splice(idx, 1)[0];
      team.budget += removed.purchasePrice;
      team.spent -= removed.purchasePrice;

      // Remove from drafted list
      const draftIdx = this.draftedPlayerIds.indexOf(playerId);
      if (draftIdx !== -1) this.draftedPlayerIds.splice(draftIdx, 1);

      this.saveTeams();
      this.render();
      this.showToast(`Игрок ${removed.name} удален из команды ${team.name}. Средства (€${removed.purchasePrice}M) возвращены.`, 'info');
    }

    // --- CHECK FULL DRAFT & AUTO-PROMPT ---
    checkDraftCompletion() {
      const allFull = this.teams.every(t => (t.players || []).length >= this.settings.squadLimit);
      if (allFull) {
        window.SoundFX.fanfare();
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.4 }
          });
        }
        setTimeout(() => {
          this.openAIExportModal();
        }, 1200);
      }
    }

    // --- TEAMS RENDERING ---
    renderTeams() {
      if (!this.dom.teamsContainer) return;
      this.dom.teamsContainer.innerHTML = '';

      this.teams.forEach(team => {
        const playerCount = (team.players || []).length;
        const isFull = playerCount >= this.settings.squadLimit;
        const budgetPercent = Math.max(0, Math.min(100, (team.budget / this.settings.startingBudget) * 100));

        const card = document.createElement('div');
        card.className = `glass-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between border ${team.borderClass} ${team.bgClass} shadow-xl relative transition-all duration-200`;

        // Card Header: Name + Edit + Roster count
        let headerHTML = `
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${team.color}; box-shadow: 0 0 10px ${team.color};"></span>
                <input 
                  type="text" 
                  value="${team.name}" 
                  class="team-name-input bg-transparent hover:bg-slate-800/60 focus:bg-slate-900 border border-transparent hover:border-slate-700 focus:border-sky-500 rounded px-2 py-0.5 text-base md:text-lg font-bold font-display text-white truncate focus:outline-none w-full"
                  data-team="${team.id}"
                  title="Нажмите, чтобы переименовать команду"
                />
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold ${isFull ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                  ${playerCount} / ${this.settings.squadLimit} ⚽
                </span>
              </div>
            </div>

            <!-- Budget Meter -->
            <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3">
              <div class="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span class="text-slate-400">Остаток: <strong class="text-emerald-400 font-bold">€${team.budget}M</strong></span>
                <span class="text-slate-500">Потрачено: €${team.spent}M</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${budgetPercent}%; background-color: ${team.color};"></div>
              </div>
            </div>

            <!-- Financial Assistance & Free Agent Actions -->
            <div class="flex items-center gap-1.5 mb-3">
              <button 
                type="button" 
                class="btn-loan flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-center gap-1"
                data-team="${team.id}"
                title="Экстренная помощь хоста: выдать +€50M к бюджету"
              >
                <span>💰</span>
                <span>+€50M Займ</span>
              </button>
              <button 
                type="button" 
                class="btn-open-fa flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors flex items-center justify-center gap-1"
                data-team="${team.id}"
                title="Добрать свободных агентов за символический €1M (или бесплатно при банкротстве)"
              >
                <span>✍️</span>
                <span>Своб. агент</span>
              </button>
            </div>

            <!-- Low budget alert if squad not full -->
            ${(!isFull && team.budget <= 1) ? `
              <div class="mb-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>Бюджет исчерпан! Нажмите <strong>«Своб. агент»</strong> для бесплатного добора за €0M/€1M.</span>
              </div>
            ` : ''}

            <!-- Action Cards / Abilities -->
            ${this.settings.enableAbilities ? `
              <div class="mb-4">
                <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Спецспособности</span>
                  <span class="text-[10px] text-slate-500">1 раз за турнир</span>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  ${Object.keys(team.abilities).map(key => {
                    const ab = team.abilities[key];
                    return `
                      <button 
                        type="button" 
                        class="ability-btn px-2 py-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${ab.used ? 'bg-slate-900/60 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-slate-500 hover:scale-[1.02]'}"
                        data-team="${team.id}" 
                        data-ability="${key}"
                        title="${ab.desc}"
                        ${ab.used ? 'disabled' : ''}
                      >
                        <span class="text-base">${ab.icon}</span>
                        <span class="text-[10px] font-bold truncate max-w-full">${ab.name}</span>
                        ${ab.used ? '<span class="text-[9px] text-rose-400/80 uppercase font-semibold">Исп.</span>' : ''}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Players Roster List -->
            <div>
              <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>Состав команды</span>
                <button type="button" class="view-pitch-btn text-sky-400 hover:text-sky-300 text-[11px] font-medium" data-team="${team.id}">
                  ⚽ Поле
                </button>
              </div>

              <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                ${playerCount === 0 ? `
                  <div class="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Игроки еще не куплены
                  </div>
                ` : team.players.map(p => `
                  <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60 text-xs transition-colors group">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono badge-pos-${p.position}">${p.position}</span>
                      <span class="font-medium text-slate-200 truncate">${p.name}</span>
                      <span class="text-[10px] text-slate-500 truncate hidden sm:inline">${p.club}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="font-mono font-bold text-emerald-400">€${p.purchasePrice}M</span>
                      <button 
                        type="button" 
                        class="remove-player-btn opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5" 
                        data-team="${team.id}" 
                        data-player="${p.id}"
                        title="Удалить игрока (вернуть средства)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;

        card.innerHTML = headerHTML;
        this.dom.teamsContainer.appendChild(card);
      });

      // Bind Team Rename inputs
      this.dom.teamsContainer.querySelectorAll('.team-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const newName = e.currentTarget.value.trim() || `Команда ${teamId}`;
          const team = this.teams.find(t => t.id === teamId);
          if (team) {
            team.name = newName;
            this.saveTeams();
            this.render();
          }
        });
      });

      // Bind Ability buttons
      this.dom.teamsContainer.querySelectorAll('.ability-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const abilityKey = e.currentTarget.getAttribute('data-ability');
          this.useAbility(teamId, abilityKey);
        });
      });

      // Bind Loan buttons
      this.dom.teamsContainer.querySelectorAll('.btn-loan').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          this.grantEmergencyLoan(teamId);
        });
      });

      // Bind Free Agent modal shortcuts
      this.dom.teamsContainer.querySelectorAll('.btn-open-fa').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          this.openFreeAgentModal(teamId);
        });
      });

      // Bind Pitch View shortcuts
      this.dom.teamsContainer.querySelectorAll('.view-pitch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          this.activePitchTeamId = teamId;
          this.openPitchModal();
        });
      });

      // Bind Remove Player buttons
      this.dom.teamsContainer.querySelectorAll('.remove-player-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const teamId = parseInt(e.currentTarget.getAttribute('data-team'), 10);
          const playerId = parseInt(e.currentTarget.getAttribute('data-player'), 10);
          if (confirm('Удалить игрока из команды и вернуть средства?')) {
            this.removePlayerFromTeam(teamId, playerId);
          }
        });
      });
    }

    // --- TACTICAL PITCH & FORMATION ENGINE ---
    syncTeamLineup(team) {
      if (!team.formation) team.formation = '4-3-3';
      if (!team.starters || !Array.isArray(team.starters) || team.starters.length !== 11) {
        team.starters = new Array(11).fill(null);
      }
      if (!team.bench || !Array.isArray(team.bench) || team.bench.length !== 4) {
        team.bench = new Array(4).fill(null);
      }

      const teamPlayerIds = new Set((team.players || []).map(p => p.id));

      // Remove players no longer in squad
      team.starters = team.starters.map(p => (p && teamPlayerIds.has(p.id)) ? (team.players.find(x => x.id === p.id) || p) : null);
      team.bench = team.bench.map(p => (p && teamPlayerIds.has(p.id)) ? (team.players.find(x => x.id === p.id) || p) : null);

      const assigned = new Set();
      team.starters.forEach(p => { if (p) assigned.add(p.id); });
      team.bench.forEach(p => { if (p) assigned.add(p.id); });

      // Add unassigned players into first empty starter slots, then bench
      (team.players || []).forEach(p => {
        if (!assigned.has(p.id)) {
          const sIdx = team.starters.findIndex(x => x === null);
          if (sIdx !== -1) {
            team.starters[sIdx] = p;
            assigned.add(p.id);
          } else {
            const bIdx = team.bench.findIndex(x => x === null);
            if (bIdx !== -1) {
              team.bench[bIdx] = p;
              assigned.add(p.id);
            }
          }
        }
      });
    }

    autoArrangeLineup(team) {
      if (!team) return;
      this.syncTeamLineup(team);
      const allPlayers = [...(team.players || [])];
      
      const gks = allPlayers.filter(p => p.position === 'GK');
      const defs = allPlayers.filter(p => p.position === 'DEF');
      const mids = allPlayers.filter(p => p.position === 'MID');
      const fws = allPlayers.filter(p => p.position === 'FW');

      const formConfig = FORMATIONS[team.formation] || FORMATIONS['4-3-3'];
      const newStarters = new Array(11).fill(null);

      let slotIdx = 0;
      formConfig.lines.forEach(line => {
        line.slots.forEach(slot => {
          let picked = null;
          if (line.role === 'GK' && gks.length > 0) picked = gks.shift();
          else if (line.role === 'DEF' && defs.length > 0) picked = defs.shift();
          else if (line.role === 'MID' && mids.length > 0) picked = mids.shift();
          else if (line.role === 'FW' && fws.length > 0) picked = fws.shift();
          
          newStarters[slotIdx] = picked;
          slotIdx++;
        });
      });

      // Fill remaining empty starter slots with any unassigned players
      const remainingPool = [...fws, ...mids, ...defs, ...gks];
      for (let i = 0; i < 11; i++) {
        if (!newStarters[i] && remainingPool.length > 0) {
          newStarters[i] = remainingPool.shift();
        }
      }

      // Rest go to bench
      const newBench = new Array(4).fill(null);
      for (let i = 0; i < 4; i++) {
        if (remainingPool.length > 0) {
          newBench[i] = remainingPool.shift();
        }
      }

      team.starters = newStarters;
      team.bench = newBench;
    }

    executeSwap(source, target) {
      if (!source || !target) return;
      const team = this.teams.find(t => t.id === source.teamId);
      if (!team) return;

      this.syncTeamLineup(team);

      const getVal = (loc) => loc.type === 'starter' ? team.starters[loc.index] : team.bench[loc.index];
      const setVal = (loc, val) => {
        if (loc.type === 'starter') team.starters[loc.index] = val;
        else team.bench[loc.index] = val;
      };

      const valSource = getVal(source);
      const valTarget = getVal(target);

      setVal(source, valTarget);
      setVal(target, valSource);

      this.selectedPitchSlot = null;
      if (this.dom.pitchSelectionIndicator) {
        this.dom.pitchSelectionIndicator.classList.add('hidden');
      }

      window.SoundFX.bid();
      this.saveTeams();
      this.renderPitchView();
    }

    openPitchModal() {
      if (!this.dom.pitchModal) return;
      this.dom.pitchModal.classList.remove('hidden');
      this.selectedPitchSlot = null;
      if (this.dom.pitchSelectionIndicator) {
        this.dom.pitchSelectionIndicator.classList.add('hidden');
      }
      this.renderPitchView();
    }

    closePitchModal() {
      if (!this.dom.pitchModal) return;
      this.dom.pitchModal.classList.add('hidden');
      this.selectedPitchSlot = null;
    }

    renderPitchView() {
      const team = this.teams.find(t => t.id === this.activePitchTeamId) || this.teams[0];
      if (!team) return;

      this.syncTeamLineup(team);

      // Render Tabs
      if (this.dom.pitchTeamTabs) {
        this.dom.pitchTeamTabs.innerHTML = '';
        this.teams.forEach(t => {
          const isActive = t.id === team.id;
          const tab = document.createElement('button');
          tab.type = 'button';
          tab.className = `px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`;
          tab.innerHTML = `⚽ ${t.name} (${(t.players || []).length}/${this.settings.squadLimit})`;
          tab.addEventListener('click', () => {
            this.activePitchTeamId = t.id;
            this.selectedPitchSlot = null;
            if (this.dom.pitchSelectionIndicator) this.dom.pitchSelectionIndicator.classList.add('hidden');
            this.renderPitchView();
          });
          this.dom.pitchTeamTabs.appendChild(tab);
        });
      }

      // Sync Formation Selector dropdown
      if (this.dom.pitchFormationSelect) {
        this.dom.pitchFormationSelect.value = team.formation || '4-3-3';
      }

      // Stats line
      if (this.dom.pitchStatsDisplay) {
        const players = team.players || [];
        const gks = players.filter(p => p.position === 'GK');
        const defs = players.filter(p => p.position === 'DEF');
        const mids = players.filter(p => p.position === 'MID');
        const fws = players.filter(p => p.position === 'FW');

        this.dom.pitchStatsDisplay.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div class="flex items-center gap-3">
              <span>Вратари: <strong>${gks.length}</strong></span>
              <span>Защита: <strong>${defs.length}</strong></span>
              <span>Полузащита: <strong>${mids.length}</strong></span>
              <span>Нападение: <strong>${fws.length}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Схема: <strong class="text-sky-300">${team.formation}</strong></span>
              <span class="text-emerald-400 font-bold">Остаток: €${team.budget}M</span>
            </div>
          </div>
        `;
      }

      // Render Starters according to selected formation
      const formConfig = FORMATIONS[team.formation] || FORMATIONS['4-3-3'];
      if (this.dom.pitchStartersContainer) {
        this.dom.pitchStartersContainer.innerHTML = '';
        let globalIndex = 0;

        formConfig.lines.forEach(line => {
          const rowDiv = document.createElement('div');
          rowDiv.className = 'flex items-center justify-around py-1.5 w-full';

          line.slots.forEach(slot => {
            const currentIdx = globalIndex;
            const p = team.starters[currentIdx];
            globalIndex++;

            const slotDiv = document.createElement('div');
            slotDiv.className = 'flex flex-col items-center justify-center p-1 relative';

            const isSelected = this.selectedPitchSlot && 
                               this.selectedPitchSlot.teamId === team.id &&
                               this.selectedPitchSlot.type === 'starter' && 
                               this.selectedPitchSlot.index === currentIdx;

            if (p) {
              slotDiv.innerHTML = `
                <div 
                  class="pitch-player-token w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/80 shadow-2xl flex items-center justify-center bg-slate-900 relative overflow-hidden ${isSelected ? 'token-selected-ring' : ''}" 
                  draggable="true" 
                  title="${p.name} (${p.club}) - Нажмите или перетащите для перемещения"
                >
                  <img src="${p.avatar}" alt="${p.name}" class="w-full h-full object-cover object-top pointer-events-none" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\'><rect width=\'100%\' height=\'100%\' fill=\'%231e293b\'/><text x=\'50%\' y=\'55%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2338bdf8\' font-size=\'18\' font-weight=\'bold\'>${p.position}</text></svg>'" />
                  <span class="badge-pos-${p.position} absolute top-0.5 right-0.5 text-[8px] px-1 py-0.2 rounded font-mono font-bold leading-tight shadow">${slot.pos}</span>
                </div>
                <span class="text-[10px] md:text-[11px] font-bold text-white bg-slate-950/90 px-1.5 py-0.5 rounded mt-1 truncate max-w-[85px] shadow border border-slate-800 text-center">${p.name.split(' ').pop()}</span>
                <span class="text-[9px] font-mono font-bold text-emerald-300">€${p.purchasePrice}M</span>
              `;
            } else {
              slotDiv.innerHTML = `
                <div 
                  class="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-dashed border-white/40 bg-slate-950/50 hover:bg-sky-500/20 flex flex-col items-center justify-center transition-colors cursor-pointer ${isSelected ? 'token-selected-ring' : ''}"
                  title="Пустая позиция ${slot.pos} (${slot.name}) - кликните или перетащите сюда игрока"
                >
                  <span class="font-bold text-sky-400 font-mono text-xs">${slot.pos}</span>
                  <span class="text-[8px] text-white/50 leading-none mt-0.5 font-medium">${slot.name.slice(0, 7)}</span>
                </div>
                <span class="text-[10px] text-white/40 mt-1 font-medium">${slot.name}</span>
                <span class="text-[9px] text-transparent font-mono">---</span>
              `;
            }

            // Click-to-swap binding
            slotDiv.addEventListener('click', (e) => {
              e.stopPropagation();
              this.handlePitchSlotClick({ type: 'starter', index: currentIdx, teamId: team.id });
            });

            // Drag and drop bindings
            slotDiv.addEventListener('dragstart', (e) => {
              if (!p) return;
              this.draggedPitchSlot = { type: 'starter', index: currentIdx, teamId: team.id };
              slotDiv.classList.add('pitch-token-dragging');
            });
            slotDiv.addEventListener('dragend', () => {
              slotDiv.classList.remove('pitch-token-dragging');
            });
            slotDiv.addEventListener('dragover', (e) => {
              e.preventDefault();
              slotDiv.classList.add('slot-drag-hover');
            });
            slotDiv.addEventListener('dragleave', () => {
              slotDiv.classList.remove('slot-drag-hover');
            });
            slotDiv.addEventListener('drop', (e) => {
              e.preventDefault();
              slotDiv.classList.remove('slot-drag-hover');
              if (this.draggedPitchSlot) {
                this.executeSwap(this.draggedPitchSlot, { type: 'starter', index: currentIdx, teamId: team.id });
                this.draggedPitchSlot = null;
              }
            });

            rowDiv.appendChild(slotDiv);
          });

          this.dom.pitchStartersContainer.appendChild(rowDiv);
        });
      }

      // Render Bench Substitutes
      if (this.dom.pitchBenchContainer) {
        this.dom.pitchBenchContainer.innerHTML = '';

        for (let bIdx = 0; bIdx < 4; bIdx++) {
          const p = team.bench[bIdx];
          const benchDiv = document.createElement('div');
          benchDiv.className = 'p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between text-xs cursor-pointer hover:border-sky-500/50 transition-all';

          const isSelected = this.selectedPitchSlot && 
                             this.selectedPitchSlot.teamId === team.id &&
                             this.selectedPitchSlot.type === 'bench' && 
                             this.selectedPitchSlot.index === bIdx;

          if (isSelected) {
            benchDiv.classList.add('ring-2', 'ring-sky-400', 'bg-sky-950/60');
          }

          if (p) {
            benchDiv.draggable = true;
            benchDiv.innerHTML = `
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                  <img src="${p.avatar}" alt="${p.name}" class="w-full h-full object-cover object-top pointer-events-none" />
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white truncate flex items-center gap-1.5">
                    <span>${p.name}</span>
                    <span class="badge-pos-${p.position} text-[9px] px-1 py-0.2 rounded font-mono">${p.position}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 truncate">${p.club}</div>
                </div>
              </div>
              <span class="font-mono font-bold text-emerald-400 flex-shrink-0 ml-1">€${p.purchasePrice}M</span>
            `;
          } else {
            benchDiv.innerHTML = `
              <div class="flex items-center gap-2 text-slate-500 py-1">
                <span class="w-7 h-7 rounded-full border border-dashed border-slate-700 flex items-center justify-center font-mono text-[10px]">SUB</span>
                <span class="text-xs">Свободный слот скамейки</span>
              </div>
            `;
          }

          // Click-to-swap binding
          benchDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handlePitchSlotClick({ type: 'bench', index: bIdx, teamId: team.id });
          });

          // Drag and drop bindings
          benchDiv.addEventListener('dragstart', (e) => {
            if (!p) return;
            this.draggedPitchSlot = { type: 'bench', index: bIdx, teamId: team.id };
            benchDiv.classList.add('opacity-50');
          });
          benchDiv.addEventListener('dragend', () => {
            benchDiv.classList.remove('opacity-50');
          });
          benchDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            benchDiv.classList.add('slot-drag-hover');
          });
          benchDiv.addEventListener('dragleave', () => {
            benchDiv.classList.remove('slot-drag-hover');
          });
          benchDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            benchDiv.classList.remove('slot-drag-hover');
            if (this.draggedPitchSlot) {
              this.executeSwap(this.draggedPitchSlot, { type: 'bench', index: bIdx, teamId: team.id });
              this.draggedPitchSlot = null;
            }
          });

          this.dom.pitchBenchContainer.appendChild(benchDiv);
        }
      }
    }

    handlePitchSlotClick(slot) {
      if (!this.selectedPitchSlot) {
        // First selection
        const team = this.teams.find(t => t.id === slot.teamId);
        const player = slot.type === 'starter' ? team.starters[slot.index] : team.bench[slot.index];
        if (!player) {
          this.showToast('Этот слот пуст. Выберите игрока, которого хотите переместить.', 'info');
          return;
        }

        this.selectedPitchSlot = slot;
        if (this.dom.pitchSelectionIndicator) {
          this.dom.pitchSelectionIndicator.classList.remove('hidden');
          this.dom.pitchSelectionIndicator.textContent = `🎯 Выбран: ${player.name}. Кликните на слот для обмена!`;
        }
        this.renderPitchView();
      } else {
        // Second selection: check if clicked same slot
        if (this.selectedPitchSlot.type === slot.type && this.selectedPitchSlot.index === slot.index) {
          // Deselect
          this.selectedPitchSlot = null;
          if (this.dom.pitchSelectionIndicator) this.dom.pitchSelectionIndicator.classList.add('hidden');
          this.renderPitchView();
        } else {
          // Execute swap!
          this.executeSwap(this.selectedPitchSlot, slot);
        }
      }
    }

    // --- RULES & BANKRUPTCY MODAL ---
    openRulesModal() {
      if (!this.dom.rulesModal) return;
      this.dom.rulesModal.classList.remove('hidden');
    }

    closeRulesModal() {
      if (!this.dom.rulesModal) return;
      this.dom.rulesModal.classList.add('hidden');
    }

    // --- EMERGENCY LOAN & FREE AGENTS ---
    grantEmergencyLoan(teamId) {
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      team.budget += 50;
      window.SoundFX.fanfare();
      this.saveTeams();
      this.render();
      this.showToast(`💰 Команде "${team.name}" выдан экстренный спонсорский кредит +€50M!`, 'success');
    }

    openFreeAgentModal(teamId = 1) {
      if (!this.dom.freeAgentModal) return;
      this.dom.freeAgentModal.classList.remove('hidden');

      // Populate teams select
      if (this.dom.freeAgentTeamSelect) {
        this.dom.freeAgentTeamSelect.innerHTML = '';
        this.teams.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = `${t.name} (Остаток: €${t.budget}M, Состав: ${(t.players || []).length}/${this.settings.squadLimit})`;
          if (t.id === teamId) opt.selected = true;
          this.dom.freeAgentTeamSelect.appendChild(opt);
        });
      }

      this.renderFreeAgentsList();
    }

    closeFreeAgentModal() {
      if (!this.dom.freeAgentModal) return;
      this.dom.freeAgentModal.classList.add('hidden');
    }

    renderFreeAgentsList() {
      if (!this.dom.freeAgentsList) return;
      this.dom.freeAgentsList.innerHTML = '';

      const query = (this.dom.freeAgentSearch ? this.dom.freeAgentSearch.value.trim().toLowerCase() : '');
      const teamId = this.dom.freeAgentTeamSelect ? parseInt(this.dom.freeAgentTeamSelect.value, 10) : 1;
      const team = this.teams.find(t => t.id === teamId) || this.teams[0];

      const available = this.pool.filter(p => !this.draftedPlayerIds.includes(p.id));
      const filtered = available.filter(p => {
        if (!query) return true;
        return p.name.toLowerCase().includes(query) || 
               p.club.toLowerCase().includes(query) || 
               p.position.toLowerCase().includes(query);
      });

      if (filtered.length === 0) {
        this.dom.freeAgentsList.innerHTML = `
          <div class="text-center py-8 text-slate-500 text-xs">
            Нет доступных свободных агентов по вашему запросу
          </div>
        `;
        return;
      }

      const isSquadFull = (team.players || []).length >= this.settings.squadLimit;
      const cost = team.budget > 0 ? 1 : 0; // €1M if has funds, €0M if completely bankrupt!

      filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs transition-colors';

        item.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
              <img src="${p.avatar}" alt="${p.name}" class="w-full h-full object-cover object-top" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'><rect width=\'100%\' height=\'100%\' fill=\'%231e293b\'/></svg>'" />
            </div>
            <div class="min-w-0">
              <div class="font-bold text-white text-sm truncate flex items-center gap-2">
                <span>${p.name}</span>
                <span class="badge-pos-${p.position} text-[10px] px-1.5 py-0.2 rounded font-mono">${p.position}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 truncate">${p.club} • ${p.league}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="text-right hidden sm:block">
              <div class="font-mono text-xs text-slate-400 line-through">€${p.price}M</div>
              <div class="font-mono font-bold text-emerald-400 text-sm">${cost > 0 ? '€1M' : 'Бесплатно (€0M)'}</div>
            </div>
            <button 
              type="button" 
              class="sign-fa-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSquadFull ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'}"
              data-player="${p.id}"
              ${isSquadFull ? 'disabled' : ''}
            >
              ${isSquadFull ? 'Состав полон' : `✍️ Подписать (${cost > 0 ? '€1M' : '€0M'})`}
            </button>
          </div>
        `;

        item.querySelector('.sign-fa-btn').addEventListener('click', () => {
          this.signFreeAgent(p.id, team.id, cost);
        });

        this.dom.freeAgentsList.appendChild(item);
      });
    }

    signFreeAgent(playerId, teamId, cost) {
      const team = this.teams.find(t => t.id === teamId);
      if (!team) return;

      if ((team.players || []).length >= this.settings.squadLimit) {
        this.showToast(`У команды ${team.name} состав уже укомплектован (${this.settings.squadLimit}/${this.settings.squadLimit})!`, 'warning');
        return;
      }

      const player = this.pool.find(p => p.id === playerId);
      if (!player) return;

      team.budget = Math.max(0, team.budget - cost);
      team.spent += cost;
      team.players.push({
        ...player,
        purchasePrice: cost,
        auctionType: 'free_agent'
      });

      this.draftedPlayerIds.push(player.id);
      this.syncTeamLineup(team);

      window.SoundFX.gavel();
      this.saveTeams();
      this.render();
      this.renderFreeAgentsList();
      this.showToast(`✍️ ${player.name} подписан в команду "${team.name}" за €${cost}M!`, 'success');
      this.checkDraftCompletion();
    }

    // --- AI EXPORT MODAL ---
    openAIExportModal() {
      if (!this.dom.aiExportModal) return;
      this.dom.aiExportModal.classList.remove('hidden');

      const prompt = this.generateAIPrompt();
      if (this.dom.aiPromptTextarea) {
        this.dom.aiPromptTextarea.value = prompt;
      }
      if (this.dom.copyFeedback) {
        this.dom.copyFeedback.classList.add('hidden');
      }
    }

    closeAIExportModal() {
      if (!this.dom.aiExportModal) return;
      this.dom.aiExportModal.classList.add('hidden');
    }

    generateAIPrompt() {
      let prompt = `Вот результаты нашего футбольного аукциона. Оцени составы трех команд, укажи их сильные и слабые стороны, выбери лучшую тактическую схему и определи фаворита:\n\n`;

      this.teams.forEach(team => {
        prompt += `=== ${team.name.toUpperCase()} (Потрачено: €${team.spent}M / Остаток: €${team.budget}M) ===\n`;
        prompt += `Состав:\n`;

        if (!team.players || team.players.length === 0) {
          prompt += `- (Состав пуст)\n`;
        } else {
          // Sort by GK -> DEF -> MID -> FW
          const posOrder = { GK: 1, DEF: 2, MID: 3, FW: 4 };
          const sorted = [...team.players].sort((a, b) => (posOrder[a.position] || 99) - (posOrder[b.position] || 99));

          sorted.forEach(p => {
            prompt += `- [${p.position}] ${p.name} (€${p.purchasePrice}M)\n`;
          });
        }
        prompt += `\n`;
      });

      return prompt;
    }

    copyAIPrompt() {
      const text = this.generateAIPrompt();

      const showSuccess = () => {
        if (this.dom.copyFeedback) {
          this.dom.copyFeedback.classList.remove('hidden');
        }
        window.SoundFX.bid();
        this.showToast('📋 Текст для ИИ успешно скопирован в буфер обмена!', 'success');
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
          this.fallbackCopyText(text);
          showSuccess();
        });
      } else {
        this.fallbackCopyText(text);
        showSuccess();
      }
    }

    fallbackCopyText(text) {
      if (this.dom.aiPromptTextarea) {
        this.dom.aiPromptTextarea.select();
        document.execCommand('copy');
      }
    }

    // --- SETTINGS MODAL ---
    openSettingsModal() {
      if (!this.dom.settingsModal) return;
      this.dom.settingsModal.classList.remove('hidden');

      // Populate form values
      const setBudget = document.getElementById('setting-starting-budget');
      if (setBudget) setBudget.value = this.settings.startingBudget;

      const setSquad = document.getElementById('setting-squad-limit');
      if (setSquad) setSquad.value = this.settings.squadLimit;

      const setTimer = document.getElementById('setting-timer-duration');
      if (setTimer) setTimer.value = this.settings.timerDuration;

      const setAbilities = document.getElementById('setting-enable-abilities');
      if (setAbilities) setAbilities.checked = this.settings.enableAbilities;

      const setStandard = document.getElementById('setting-type-standard');
      if (setStandard) setStandard.checked = this.settings.allowedAuctionTypes.includes('standard');

      const setBlind = document.getElementById('setting-type-blind');
      if (setBlind) setBlind.checked = this.settings.allowedAuctionTypes.includes('blind');

      const setBuyout = document.getElementById('setting-type-buyout');
      if (setBuyout) setBuyout.checked = this.settings.allowedAuctionTypes.includes('buyout');

      const setAgent = document.getElementById('setting-agent-percent');
      if (setAgent) setAgent.value = this.settings.agentPercent;

      const setReserve = document.getElementById('setting-reserve-protection');
      if (setReserve) setReserve.checked = this.settings.reserveProtection !== false;
    }

    closeSettingsModal() {
      if (!this.dom.settingsModal) return;
      this.dom.settingsModal.classList.add('hidden');
    }

    saveSettingsFromForm() {
      const setBudget = parseInt(document.getElementById('setting-starting-budget').value, 10) || 500;
      const setSquad = parseInt(document.getElementById('setting-squad-limit').value, 10) || 15;
      const setTimer = parseInt(document.getElementById('setting-timer-duration').value, 10) || 15;
      const setAbilities = document.getElementById('setting-enable-abilities').checked;

      const allowedTypes = [];
      if (document.getElementById('setting-type-standard').checked) allowedTypes.push('standard');
      if (document.getElementById('setting-type-blind').checked) allowedTypes.push('blind');
      if (document.getElementById('setting-type-buyout').checked) allowedTypes.push('buyout');

      if (allowedTypes.length === 0) allowedTypes.push('standard'); // fallback

      const setAgent = parseInt(document.getElementById('setting-agent-percent').value, 10) || 10;
      const setReserve = document.getElementById('setting-reserve-protection') ? document.getElementById('setting-reserve-protection').checked : true;

      // Check if starting budget changed and we should update unspent budgets
      const oldStartingBudget = this.settings.startingBudget;
      if (oldStartingBudget !== setBudget) {
        this.teams.forEach(t => {
          t.budget = setBudget - t.spent;
        });
      }

      this.settings = {
        ...this.settings,
        startingBudget: setBudget,
        squadLimit: setSquad,
        timerDuration: setTimer,
        enableAbilities: setAbilities,
        allowedAuctionTypes: allowedTypes,
        agentPercent: setAgent,
        reserveProtection: setReserve
      };

      this.saveSettings();
      this.saveTeams();
      this.closeSettingsModal();
      this.render();
      this.showToast('⚙️ Настройки успешно сохранены!', 'success');
    }

    // --- RESET DRAFT ---
    confirmResetDraft() {
      if (!confirm('Вы уверены, что хотите сбросить текущий аукцион и начать заново? Все купленные игроки и составы будут очищены!')) {
        return;
      }

      this.clearLotTimer();
      this.currentLot = null;
      this.draftedPlayerIds = [];

      this.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
      this.teams.forEach(t => {
        t.budget = this.settings.startingBudget;
        t.spent = 0;
        t.players = [];
        Object.keys(t.abilities).forEach(k => t.abilities[k].used = false);
      });

      this.saveTeams();
      this.render();
      this.showToast('🔄 Аукцион сброшен. Новая игра готова!', 'info');
    }

    // --- CARD SHAKE ANIMATION ---
    triggerCardShake() {
      if (!this.dom.activeLotCard) return;
      this.dom.activeLotCard.classList.remove('shake-anim');
      void this.dom.activeLotCard.offsetWidth; // re-flow
      this.dom.activeLotCard.classList.add('shake-anim');
    }

    // --- MASTER RENDER ---
    render() {
      const remainingPool = this.pool.length - this.draftedPlayerIds.length;
      if (this.dom.poolCount) this.dom.poolCount.textContent = remainingPool;
      if (this.dom.totalDrafted) this.dom.totalDrafted.textContent = `${this.draftedPlayerIds.length} / ${this.settings.squadLimit * 3}`;

      this.renderCurrentLot();
      this.renderTeams();
    }
  }

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.App = new AuctionApp();
  });
})();
