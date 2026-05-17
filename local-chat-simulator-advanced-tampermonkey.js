// ==UserScript==
// @name         Local Chat Simulator - Advanced (Tampermonkey)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Chat avansat cu redimensionare, editare mesaje, background-uri, culori, grade, permisiuni, cenzură, animatii, poze de profil, și control total.
// @author       Japonezul (Customizat de Le Chat)
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- Configurare host-uri permise ---
    const ALLOWED_HOSTS = [
        'www.google.com', 'google.com', 'www.bing.com', 'bing.com',
        'duckduckgo.com', 'www.duckduckgo.com', 'yahoo.com', 'www.yahoo.com'
    ];
    const ALLOW_SUBDOMAINS = true;

    function isSearchHost() {
        const host = location.hostname.toLowerCase();
        if (ALLOWED_HOSTS.includes(host)) return true;
        if (ALLOW_SUBDOMAINS) return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
        return false;
    }
    if (!isSearchHost()) return;

    // --- Configurare inițială ---
    const STORAGE_KEY = 'local_chat_sim_state_v3';
    const nowISO = () => new Date().toISOString();

    // --- Baza de culori HEX cu instrucțiuni ---
    const colorPalette = {
        // Culori principale
        primary: {
            description: "Culoarea principală a interfeței (background chat).",
            hex: "#0f1724"
        },
        secondary: {
            description: "Culoarea secundară pentru elemente (ex: bara de utilizatori).",
            hex: "#08101a"
        },
        accent: {
            description: "Culoarea de accent pentru butoane și elemente interactive.",
            hex: "#ff8a00"
        },
        textPrimary: {
            description: "Culoarea textului principal.",
            hex: "#e6eef8"
        },
        textSecondary: {
            description: "Culoarea textului secundar (ex: metadate).",
            hex: "#99b3c6"
        },

        // Culori pentru mesaje
        messageBackground: {
            description: "Background pentru mesajele primite.",
            hex: "#0b2233"
        },
        messageText: {
            description: "Culoarea textului pentru mesajele primite.",
            hex: "#dff2ff"
        },
        myMessageBackground: {
            description: "Background pentru mesajele trimise de tine.",
            hex: "linear-gradient(90deg,#ff8a00,#ffb86b)"
        },
        myMessageText: {
            description: "Culoarea textului pentru mesajele trimise de tine.",
            hex: "#111"
        },

        // Culori pentru roluri
        adminPrincipal: {
            description: "Culoarea pentru rolul AdminPrincipal.",
            hex: "#ff7f00"
        },
        admin: {
            description: "Culoarea pentru rolul Admin.",
            hex: "linear-gradient(90deg,#ff7f00,#ffd24d)"
        },
        moderator: {
            description: "Culoarea pentru rolul Moderator.",
            hex: "#ffffff"
        },
        member: {
            description: "Culoarea pentru rolul Member.",
            hex: "#2b7cff"
        },
        visitor: {
            description: "Culoarea pentru rolul Visitor.",
            hex: "#2b7cff"
        },
        banned: {
            description: "Culoarea pentru utilizatorii banați.",
            hex: "#ef4444"
        },

        // Culori pentru starea utilizatorilor
        online: {
            description: "Culoarea indicatorului de online.",
            hex: "#22c55e"
        },
        offline: {
            description: "Culoarea indicatorului de offline.",
            hex: "#ef4444"
        },

        // Culori pentru butoane
        buttonBackground: {
            description: "Background pentru butoane.",
            hex: "#0b1722"
        },
        buttonText: {
            description: "Culoarea textului pentru butoane.",
            hex: "#dbeafe"
        }
    };

    // --- Utilizatori default ---
    const defaultUsers = [
        {
            id: 'you',
            name: 'Japonezul',
            role: 'AdminPrincipal',
            pawnColor: colorPalette.adminPrincipal.hex,
            isBot: false,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-japonezul.jpg', // Link configurabil
            canPostLinks: true,
            canPostImages: true,
            canBan: true,
            canEditMessages: true,
            canCensor: true,
            messageCooldown: 0,
            customPawn: '🎌', // Iconiță personalizată
            nickname: 'Japonezul'
        },
        {
            id: 'hikaru',
            name: 'Hikaru Chan',
            role: 'Admin',
            pawnColor: colorPalette.admin.hex,
            isBot: false,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-hikaru.jpg',
            canPostLinks: true,
            canPostImages: true,
            canBan: true,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🌸',
            nickname: 'Hikaru'
        },
        {
            id: 'animax',
            name: 'Animax Tv',
            role: 'Moderator',
            pawnColor: colorPalette.moderator.hex,
            isBot: false,
            background: '',
            textColor: '#000000',
            avatar: 'https://example.com/avatar-animax.jpg',
            canPostLinks: true,
            canPostImages: false,
            canBan: true,
            canEditMessages: false,
            canCensor: true, // Permisiune de a cenzura cuvinte
            messageCooldown: 0,
            customPawn: '📺',
            nickname: 'Animax'
        },
        {
            id: 'luna',
            name: 'LunaRex',
            role: 'Member',
            pawnColor: colorPalette.member.hex,
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-luna.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🌙',
            nickname: 'Luna'
        },
        {
            id: 'cora',
            name: 'CoraBee',
            role: 'Member',
            pawnColor: colorPalette.member.hex,
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-cora.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🐝',
            nickname: 'Cora'
        },
        {
            id: 'mori',
            name: 'Mori',
            role: 'Member',
            pawnColor: colorPalette.member.hex,
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-mori.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🌿',
            nickname: 'Mori'
        },
        {
            id: 'sake',
            name: 'Sake',
            role: 'Member',
            pawnColor: colorPalette.member.hex,
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-sake.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🍶',
            nickname: 'Sake'
        },
        {
            id: 'pixel',
            name: 'PixelFox',
            role: 'Member',
            pawnColor: colorPalette.member.hex,
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-pixel.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '🦊',
            nickname: 'Pixel'
        },
        {
            id: 'nova',
            name: 'Nova',
            role: 'Member',
            pawnColor: '#2b7f00',
            isBot: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-nova.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 0,
            customPawn: '✨',
            nickname: 'Nova'
        },
        {
            id: 'george',
            name: 'George Buton',
            role: 'Visitor',
            pawnColor: colorPalette.visitor.hex,
            isBot: true,
            isVisitor: true,
            background: '',
            textColor: colorPalette.textPrimary.hex,
            avatar: 'https://example.com/avatar-george.jpg',
            canPostLinks: false,
            canPostImages: false,
            canBan: false,
            canEditMessages: false,
            canCensor: false,
            messageCooldown: 20,
            customPawn: '👔',
            nickname: 'George'
        }
    ];

    // --- Setări globale ---
    const defaultSettings = {
        chatBackground: colorPalette.primary.hex,
        chatTextColor: colorPalette.textPrimary.hex,
        messageBackground: colorPalette.messageBackground.hex,
        messageTextColor: colorPalette.messageText.hex,
        myMessageBackground: colorPalette.myMessageBackground.hex,
        myMessageTextColor: colorPalette.myMessageText.hex,
        fontFamily: 'Inter, Segoe UI, Roboto, Arial',
        fontSize: '13px',
        bannedWords: ['sugi pula', 'fuck', 'shit', 'idiot', 'prostit'], // Cuvinte interzise
        animationsEnabled: true,
        crownIcon: true,
        musicPlaying: false,
        emojiPickerEnabled: true,
        showTypingIndicators: true
    };

    // --- Încarcă starea ---
    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const initial = {
                users: defaultUsers.map(u => Object.assign({
                    online: true,
                    banned: false,
                    lastSeen: nowISO(),
                    lastMessageTime: 0,
                    isTyping: false
                }, u)),
                messages: [
                    {
                        from: 'hikaru',
                        text: 'Bine ai venit, Japonezul! Eu sunt Hikaru Chan, co-admin. 🌸',
                        time: nowISO()
                    },
                    {
                        from: 'animax',
                        text: 'Salut! Eu sunt moderatorul Animax Tv. 📺 Dacă aveți nevoie de ajutor, spuneți!',
                        time: nowISO()
                    },
                    {
                        from: 'luna',
                        text: 'Hei! Cine vrea să discute despre anime? 🌙',
                        time: nowISO()
                    }
                ],
                settings: defaultSettings,
                activeDiscussions: [
                    {
                        topic: 'LGBT+',
                        participants: ['luna', 'cora', 'mori'],
                        messages: [
                            {
                                from: 'luna',
                                text: 'Cred că acceptarea este cheia. 🌈',
                                time: nowISO()
                            }
                        ]
                    },
                    {
                        topic: 'Anime',
                        participants: ['sake', 'pixel', 'nova'],
                        messages: [
                            {
                                from: 'sake',
                                text: 'Am văzut recent un episod din "Attack on Titan". 🍶 Ce părere aveți?',
                                time: nowISO()
                            }
                        ]
                    },
                    {
                        topic: 'Cenzură Digitală',
                        participants: ['animax', 'hikaru', 'george'],
                        messages: [
                            {
                                from: 'animax',
                                text: 'Cenzura poate fi necesară în unele cazuri, dar trebuie aplicată cu înțelepciune. 📺',
                                time: nowISO()
                            }
                        ]
                    }
                ]
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
            return initial;
        }
        try {
            return JSON.parse(raw);
        } catch(e) {
            console.error('State parse error, resetting', e);
            localStorage.removeItem(STORAGE_KEY);
            return loadState();
        }
    }

    function saveState(s) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    // --- Utilități ---
    function uidToUser(state, uid) {
        return state.users.find(u => u.id === uid);
    }

    function generateAvatarDataURL(name, color) {
        try {
            const canvas = document.createElement('canvas');
            const size = 64;
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = typeof color === 'string' && color.startsWith('linear-gradient') ? '#ffb86b' : (color || '#888');
            ctx.fillRect(0, 0, size, size);

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const initials = name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
            ctx.fillText(initials, size / 2, size / 2);

            // Border
            ctx.strokeStyle = '#22200020';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, size, size);

            return canvas.toDataURL();
        } catch(e) {
            return '';
        }
    }

    function censorMessage(text, bannedWords) {
        let censoredText = text;
        bannedWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            censoredText = censoredText.replace(regex, '****');
        });
        return censoredText;
    }

    function canPost(user) {
        const now = Date.now();
        if (user.messageCooldown > 0 && (now - user.lastMessageTime) < (user.messageCooldown * 1000)) {
            return false;
        }
        return true;
    }

    function colorToHex(c) {
        if (!c) return null;
        if (c.startsWith('#')) return c;
        return '#2b7cff';
    }

    // --- Interfață ---
    const APP_ID = 'local-chat-sim-app-v3';
    if (document.getElementById(APP_ID)) return;

    const state = loadState();
    let appState = state;
    let selectedUserId = appState.users[0].id;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    // --- Stiluri CSS ---
    GM_addStyle(`
        /* Container principal */
        #${APP_ID} {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 520px;
            height: 700px;
            background: ${appState.settings.chatBackground};
            color: ${appState.settings.chatTextColor};
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            font-family: ${appState.settings.fontFamily};
            font-size: ${appState.settings.fontSize};
            z-index: 999999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            resize: both;
            min-width: 300px;
            min-height: 400px;
            border: 1px solid #333;
        }

        /* Topbar */
        #${APP_ID} .topbar {
            height: 56px;
            background: linear-gradient(90deg, #0b1220, #142033);
            display: flex;
            align-items: center;
            padding: 6px 10px;
            gap: 8px;
            cursor: move;
            user-select: none;
            justify-content: space-between;
        }

        #${APP_ID} .topbar-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        #${APP_ID} .crown-icon {
            color: gold;
            font-size: 20px;
        }

        #${APP_ID} .title {
            font-weight: 700;
            padding-left: 8px;
        }

        #${APP_ID} .top-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        #${APP_ID} .close-x {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            cursor: pointer;
            background: #0b1220;
        }

        #${APP_ID} .close-x:hover {
            background: #2b2b2b44;
        }

        #${APP_ID} .music-btn, #${APP_ID} .censor-btn, #${APP_ID} .settings-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            background: #111827;
        }

        #${APP_ID} .music-btn:hover, #${APP_ID} .censor-btn:hover, #${APP_ID} .settings-btn:hover {
            background: #1f2937;
        }

        /* Main */
        #${APP_ID} .main {
            display: flex;
            flex: 1;
            min-height: 0;
        }

        /* Bara de utilizatori */
        #${APP_ID} .users {
            width: 180px;
            background: ${colorPalette.secondary.hex};
            padding: 8px;
            overflow: auto;
            display: flex;
            flex-direction: column;
            gap: 6px;
            border-right: 1px solid #333;
        }

        /* Chat */
        #${APP_ID} .chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: ${appState.settings.chatBackground};
            padding: 8px;
            gap: 8px;
            overflow: hidden;
        }

        /* Listă utilizatori */
        .user-row {
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 6px;
            border-radius: 8px;
            cursor: default;
            background: transparent;
            transition: background 0.2s;
            position: relative;
        }

        .user-row:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .user-row.offline {
            opacity: 0.5;
        }

        .user-row.banned {
            opacity: 0.35;
            filter: grayscale(50%);
        }

        .user-row .pawn {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex: 0 0 24px;
        }

        .user-row .avatar {
            width: 36px;
            height: 36px;
            border-radius: 6px;
            overflow: hidden;
            flex: 0 0 36px;
        }

        .user-row .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .status-dot.online {
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12) inset;
        }

        .status-dot.offline {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) inset;
        }

        .user-row .meta {
            flex: 1;
            font-size: 12px;
            line-height: 1;
            min-width: 0;
        }

        .user-row .name {
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .user-row .role {
            font-weight: 600;
            font-size: 11px;
            color: #a8d5ff;
        }

        .user-row .bot-tag {
            background: #1f2937;
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 11px;
        }

        .user-row .typing-indicator {
            font-size: 10px;
            color: ${colorPalette.accent.hex};
            font-style: italic;
        }

        .user-actions {
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .user-row:hover .user-actions {
            opacity: 1;
        }

        .btn {
            background: ${colorPalette.buttonBackground.hex};
            padding: 4px 6px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            color: ${colorPalette.buttonText.hex};
            border: none;
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .btn.small {
            padding: 4px 6px;
            font-size: 11px;
        }

        /* Mesaje */
        .messages {
            flex: 1;
            overflow: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .msg {
            padding: 10px 12px;
            border-radius: 12px;
            max-width: 80%;
            font-size: 13px;
            line-height: 1.3;
            word-wrap: break-word;
            position: relative;
            animation: fadeIn 0.3s ease-out;
        }

        .msg.me {
            align-self: flex-end;
            background: ${appState.settings.myMessageBackground};
            color: ${appState.settings.myMessageTextColor};
            border-bottom-right-radius: 4px;
        }

        .msg.other {
            align-self: flex-start;
            background: ${appState.settings.messageBackground};
            color: ${appState.settings.messageTextColor};
            border-bottom-left-radius: 4px;
        }

        .msg .meta {
            font-size: 11px;
            opacity: 0.7;
            margin-bottom: 4px;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .msg .meta .name {
            font-weight: 700;
            color: inherit;
        }

        .msg .meta .role {
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.2);
        }

        .msg .text {
            white-space: pre-wrap;
        }

        /* Composer */
        .composer {
            display: flex;
            gap: 8px;
            padding: 8px;
            align-items: flex-end;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            border: 1px solid #0c2230;
        }

        .composer textarea {
            flex: 1;
            min-height: 42px;
            max-height: 120px;
            resize: none;
            border-radius: 8px;
            padding: 8px;
            background: #071826;
            color: #e6eef8;
            border: 1px solid #0c2230;
            font-family: inherit;
            font-size: inherit;
        }

        .tool-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        /* Emoji Picker */
        .emoji-picker {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: #111827;
            border-radius: 8px;
        }

        .emoji-btn {
            font-size: 18px;
            cursor: pointer;
            padding: 2px;
            border-radius: 4px;
        }

        .emoji-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        /* Panou de control */
        .control-panel {
            padding: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            background: #06121a;
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .small-muted {
            font-size: 11px;
            color: ${colorPalette.textSecondary.hex};
        }

        /* Panou de setări avansate */
        .settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a1a;
            color: ${colorPalette.textPrimary.hex};
            padding: 20px;
            border-radius: 12px;
            z-index: 1000000;
            width: 500px;
            max-height: 80vh;
            overflow: auto;
            display: none;
            flex-direction: column;
            gap: 15px;
        }

        .settings-panel.active {
            display: flex;
        }

        .settings-panel h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }

        .settings-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px;
            background: #252525;
            border-radius: 8px;
        }

        .settings-section label {
            font-size: 12px;
            font-weight: 600;
        }

        .settings-section input[type="text"],
        .settings-section input[type="color"],
        .settings-section select {
            padding: 6px;
            border-radius: 6px;
            border: 1px solid #444;
            background: #333;
            color: ${colorPalette.textPrimary.hex};
        }

        .settings-section input[type="checkbox"] {
            margin-right: 8px;
        }

        .settings-panel .close-settings {
            align-self: flex-end;
            background: #ff4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
        }

        /* Discuții izolate */
        .discussion-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            overflow-x: auto;
        }

        .discussion-tab {
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
            color: ${colorPalette.textSecondary.hex};
            border: 1px solid transparent;
            white-space: nowrap;
        }

        .discussion-tab:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .discussion-tab.active {
            background: ${colorPalette.accent.hex};
            color: #000;
            border-color: ${colorPalette.accent.hex};
        }

        .discussion-content {
            display: none;
            flex-direction: column;
            gap: 8px;
        }

        .discussion-content.active {
            display: flex;
        }

        /* Notificări de ban */
        .ban-notification {
            background: rgba(255, 0, 0, 0.1);
            border-left: 3px solid #ff0000;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #ffaaaa;
            margin: 4px 0;
        }

        /* Resize handle */
        #${APP_ID}::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            right: 0;
            bottom: 0;
            background: #444;
            cursor: nwse-resize;
            z-index: 10;
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Background per user */
        .msg.other.user-bg {
            background: var(--user-bg) !important;
            color: var(--user-text) !important;
        }

        /* Typing indicator */
        .typing-indicator {
            font-size: 12px;
            color: ${colorPalette.textSecondary.hex};
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            margin: 2px 0;
            display: none;
        }

        .typing-indicator.active {
            display: block;
        }
    `);

    // --- Creare interfață ---
    const app = document.createElement('div');
    app.id = APP_ID;

    // Topbar
    const topbar = document.createElement('div');
    topbar.className = 'topbar';

    const topbarLeft = document.createElement('div');
    topbarLeft.className = 'topbar-left';

    const crownIcon = document.createElement('span');
    crownIcon.className = 'crown-icon';
    crownIcon.innerText = '👑';
    crownIcon.style.display = appState.settings.crownIcon ? 'inline' : 'none';

    const title = document.createElement('div');
    title.className = 'title';
    title.innerText = 'Chat Avansat (Local)';

    topbarLeft.appendChild(crownIcon);
    topbarLeft.appendChild(title);

    const topActions = document.createElement('div');
    topActions.className = 'top-actions';

    const musicBtn = document.createElement('div');
    musicBtn.className = 'music-btn';
    musicBtn.title = 'Live Music';
    musicBtn.innerHTML = '🎵';

    const censorBtn = document.createElement('div');
    censorBtn.className = 'censor-btn';
    censorBtn.title = 'Cenzură individuală';
    censorBtn.innerHTML = '🚫';

    const settingsBtn = document.createElement('div');
    settingsBtn.className = 'settings-btn';
    settingsBtn.title = 'Setări Avansate';
    settingsBtn.innerHTML = '⚙️';

    const closeX = document.createElement('div');
    closeX.className = 'close-x';
    closeX.title = 'Close/Hide';
    closeX.innerText = '✕';

    topActions.appendChild(musicBtn);
    topActions.appendChild(censorBtn);
    topActions.appendChild(settingsBtn);
    topActions.appendChild(closeX);

    topbar.appendChild(topbarLeft);
    topbar.appendChild(topActions);
    app.appendChild(topbar);

    // Main
    const main = document.createElement('div');
    main.className = 'main';

    // Users list
    const usersPane = document.createElement('div');
    usersPane.className = 'users';

    const controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';

    const colorPickerLabel = document.createElement('div');
    colorPickerLabel.className = 'small-muted';
    colorPickerLabel.innerText = 'Culoare pawn:';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = colorToHex(appState.users.find(u => u.id === selectedUserId)?.pawnColor) || '#ff7f00';

    const pawnIconLabel = document.createElement('div');
    pawnIconLabel.className = 'small-muted';
    pawnIconLabel.innerText = 'Iconiță pawn:';

    const pawnIconInput = document.createElement('input');
    pawnIconInput.type = 'text';
    pawnIconInput.placeholder = '🎌';
    pawnIconInput.value = appState.users.find(u => u.id === selectedUserId)?.customPawn || '🎌';

    const nicknameLabel = document.createElement('div');
    nicknameLabel.className = 'small-muted';
    nicknameLabel.innerText = 'Nume / Poreclă:';

    const nicknameInput = document.createElement('input');
    nicknameInput.type = 'text';
    nicknameInput.placeholder = 'Nume';
    nicknameInput.value = appState.users.find(u => u.id === selectedUserId)?.nickname || '';

    const roleSelect = document.createElement('select');
    ['AdminPrincipal', 'Admin', 'Moderator', 'Member', 'Visitor', 'Banat'].forEach(r => {
        const o = document.createElement('option');
        o.value = r;
        o.innerText = r;
        roleSelect.appendChild(o);
    });

    const bgInputLabel = document.createElement('div');
    bgInputLabel.className = 'small-muted';
    bgInputLabel.innerText = 'Background URL:';

    const bgInput = document.createElement('input');
    bgInput.type = 'text';
    bgInput.placeholder = 'https://example.com/image.jpg';
    bgInput.value = appState.users.find(u => u.id === selectedUserId)?.background || '';

    const textColorLabel = document.createElement('div');
    textColorLabel.className = 'small-muted';
    textColorLabel.innerText = 'Culoare text:';

    const textColorInput = document.createElement('input');
    textColorInput.type = 'color';
    textColorInput.value = appState.users.find(u => u.id === selectedUserId)?.textColor || '#ffffff';

    const avatarLabel = document.createElement('div');
    avatarLabel.className = 'small-muted';
    avatarLabel.innerText = 'Avatar URL:';

    const avatarInput = document.createElement('input');
    avatarInput.type = 'text';
    avatarInput.placeholder = 'https://example.com/avatar.jpg';
    avatarInput.value = appState.users.find(u => u.id === selectedUserId)?.avatar || '';

    controlPanel.appendChild(colorPickerLabel);
    controlPanel.appendChild(colorInput);
    controlPanel.appendChild(pawnIconLabel);
    controlPanel.appendChild(pawnIconInput);
    controlPanel.appendChild(nicknameLabel);
    controlPanel.appendChild(nicknameInput);
    controlPanel.appendChild(roleSelect);
    controlPanel.appendChild(bgInputLabel);
    controlPanel.appendChild(bgInput);
    controlPanel.appendChild(textColorLabel);
    controlPanel.appendChild(textColorInput);
    controlPanel.appendChild(avatarLabel);
    controlPanel.appendChild(avatarInput);

    usersPane.appendChild(controlPanel);

    const usersList = document.createElement('div');
    usersList.className = 'users-list';
    usersPane.appendChild(usersList);

    // Chat pane
    const chatPane = document.createElement('div');
    chatPane.className = 'chat';

    // Discuții izolate
    const discussionTabs = document.createElement('div');
    discussionTabs.className = 'discussion-tabs';

    const generalTab = document.createElement('div');
    generalTab.className = 'discussion-tab active';
    generalTab.innerText = 'General';
    generalTab.dataset.topic = 'general';

    const lgbtTab = document.createElement('div');
    lgbtTab.className = 'discussion-tab';
    lgbtTab.innerText = 'LGBT+';
    lgbtTab.dataset.topic = 'LGBT+';

    const animeTab = document.createElement('div');
    animeTab.className = 'discussion-tab';
    animeTab.innerText = 'Anime';
    animeTab.dataset.topic = 'Anime';

    const censorTab = document.createElement('div');
    censorTab.className = 'discussion-tab';
    censorTab.innerText = 'Cenzură Digitală';
    censorTab.dataset.topic = 'Cenzură Digitală';

    discussionTabs.appendChild(generalTab);
    discussionTabs.appendChild(lgbtTab);
    discussionTabs.appendChild(animeTab);
    discussionTabs.appendChild(censorTab);

    const discussionContents = document.createElement('div');
    discussionContents.style.flex = '1';
    discussionContents.style.overflow = 'hidden';
    discussionContents.style.display = 'flex';
    discussionContents.style.flexDirection = 'column';

    const generalContent = document.createElement('div');
    generalContent.className = 'discussion-content active';
    generalContent.dataset.topic = 'general';

    const messagesDiv = document.createElement('div');
    messagesDiv.className = 'messages';
    generalContent.appendChild(messagesDiv);

    const lgbtContent = document.createElement('div');
    lgbtContent.className = 'discussion-content';
    lgbtContent.dataset.topic = 'LGBT+';

    const lgbtMessages = document.createElement('div');
    lgbtMessages.className = 'messages';
    lgbtContent.appendChild(lgbtMessages);

    const animeContent = document.createElement('div');
    animeContent.className = 'discussion-content';
    animeContent.dataset.topic = 'Anime';

    const animeMessages = document.createElement('div');
    animeMessages.className = 'messages';
    animeContent.appendChild(animeMessages);

    const censorContent = document.createElement('div');
    censorContent.className = 'discussion-content';
    censorContent.dataset.topic = 'Cenzură Digitală';

    const censorMessages = document.createElement('div');
    censorMessages.className = 'messages';
    censorContent.appendChild(censorMessages);

    discussionContents.appendChild(generalContent);
    discussionContents.appendChild(lgbtContent);
    discussionContents.appendChild(animeContent);
    discussionContents.appendChild(censorContent);

    chatPane.appendChild(discussionTabs);
    chatPane.appendChild(discussionContents);

    const composer = document.createElement('div');
    composer.className = 'composer';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Scrie mesaj...';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn';
    sendBtn.innerText = 'Trimite';

    const fileBtn = document.createElement('button');
    fileBtn.className = 'btn small';
    fileBtn.innerText = '📎';

    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'emoji-picker';
    ['😊', '😂', '😢', '👍', '❤️', '🔥', '🎉', '😎'].forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-btn';
        emojiBtn.innerText = emoji;
        emojiBtn.onclick = () => {
            textarea.value += emoji;
            textarea.focus();
        };
        emojiPicker.appendChild(emojiBtn);
    });

    const callBtn = document.createElement('button');
    callBtn.className = 'btn small';
    callBtn.innerText = '📞';

    composer.appendChild(fileBtn);
    composer.appendChild(emojiPicker);
    composer.appendChild(callBtn);
    composer.appendChild(textarea);
    composer.appendChild(sendBtn);

    chatPane.appendChild(composer);

    main.appendChild(usersPane);
    main.appendChild(chatPane);
    app.appendChild(main);

    // Settings Panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';

    const settingsTitle = document.createElement('h3');
    settingsTitle.innerText = 'Setări Avansate';

    const closeSettingsBtn = document.createElement('button');
    closeSettingsBtn.className = 'close-settings';
    closeSettingsBtn.innerText = 'Închide';

    // Chat Settings
    const chatSettingsSection = document.createElement('div');
    chatSettingsSection.className = 'settings-section';

    const chatBgLabel = document.createElement('label');
    chatBgLabel.innerText = 'Background Chat:';
    const chatBgInput = document.createElement('input');
    chatBgInput.type = 'color';
    chatBgInput.value = appState.settings.chatBackground;

    const chatTextLabel = document.createElement('label');
    chatTextLabel.innerText = 'Culoare Text Chat:';
    const chatTextInput = document.createElement('input');
    chatTextInput.type = 'color';
    chatTextInput.value = appState.settings.chatTextColor;

    const msgBgLabel = document.createElement('label');
    msgBgLabel.innerText = 'Background Mesaje:';
    const msgBgInput = document.createElement('input');
    msgBgInput.type = 'color';
    msgBgInput.value = appState.settings.messageBackground;

    const msgTextLabel = document.createElement('label');
    msgTextLabel.innerText = 'Culoare Text Mesaje:';
    const msgTextInput = document.createElement('input');
    msgTextInput.type = 'color';
    msgTextInput.value = appState.settings.messageTextColor;

    const myMsgBgLabel = document.createElement('label');
    myMsgBgLabel.innerText = 'Background Mesajele Mele:';
    const myMsgBgInput = document.createElement('input');
    myMsgBgInput.type = 'text';
    myMsgBgInput.value = appState.settings.myMessageBackground;

    const myMsgTextLabel = document.createElement('label');
    myMsgTextLabel.innerText = 'Culoare Text Mesajele Mele:';
    const myMsgTextInput = document.createElement('input');
    myMsgTextInput.type = 'color';
    myMsgTextInput.value = appState.settings.myMessageTextColor;

    const fontLabel = document.createElement('label');
    fontLabel.innerText = 'Font:';
    const fontInput = document.createElement('input');
    fontInput.type = 'text';
    fontInput.value = appState.settings.fontFamily;

    const fontSizeLabel = document.createElement('label');
    fontSizeLabel.innerText = 'Mărime Font:';
    const fontSizeInput = document.createElement('input');
    fontSizeInput.type = 'text';
    fontSizeInput.value = appState.settings.fontSize;

    const animationsLabel = document.createElement('label');
    animationsLabel.innerText = 'Activează Animații:';
    const animationsInput = document.createElement('input');
    animationsInput.type = 'checkbox';
    animationsInput.checked = appState.settings.animationsEnabled;

    const crownLabel = document.createElement('label');
    crownLabel.innerText = 'Afisează Iconița Coroană:';
    const crownInput = document.createElement('input');
    crownInput.type = 'checkbox';
    crownInput.checked = appState.settings.crownIcon;

    const bannedWordsLabel = document.createElement('label');
    bannedWordsLabel.innerText = 'Cuvinte Interzise (separate prin virgulă):';
    const bannedWordsInput = document.createElement('input');
    bannedWordsInput.type = 'text';
    bannedWordsInput.value = appState.settings.bannedWords.join(', ');

    const showTypingLabel = document.createElement('label');
    showTypingLabel.innerText = 'Afisează "Scrie mesaj":';
    const showTypingInput = document.createElement('input');
    showTypingInput.type = 'checkbox';
    showTypingInput.checked = appState.settings.showTypingIndicators;

    const saveSettingsBtn = document.createElement('button');
    saveSettingsBtn.className = 'btn';
    saveSettingsBtn.innerText = 'Salvează Setările';

    chatSettingsSection.appendChild(chatBgLabel);
    chatSettingsSection.appendChild(chatBgInput);
    chatSettingsSection.appendChild(chatTextLabel);
    chatSettingsSection.appendChild(chatTextInput);
    chatSettingsSection.appendChild(msgBgLabel);
    chatSettingsSection.appendChild(msgBgInput);
    chatSettingsSection.appendChild(msgTextLabel);
    chatSettingsSection.appendChild(msgTextInput);
    chatSettingsSection.appendChild(myMsgBgLabel);
    chatSettingsSection.appendChild(myMsgBgInput);
    chatSettingsSection.appendChild(myMsgTextLabel);
    chatSettingsSection.appendChild(myMsgTextInput);
    chatSettingsSection.appendChild(fontLabel);
    chatSettingsSection.appendChild(fontInput);
    chatSettingsSection.appendChild(fontSizeLabel);
    chatSettingsSection.appendChild(fontSizeInput);
    chatSettingsSection.appendChild(animationsLabel);
    chatSettingsSection.appendChild(animationsInput);
    chatSettingsSection.appendChild(crownLabel);
    chatSettingsSection.appendChild(crownInput);
    chatSettingsSection.appendChild(bannedWordsLabel);
    chatSettingsSection.appendChild(bannedWordsInput);
    chatSettingsSection.appendChild(showTypingLabel);
    chatSettingsSection.appendChild(showTypingInput);
    chatSettingsSection.appendChild(saveSettingsBtn);

    settingsPanel.appendChild(settingsTitle);
    settingsPanel.appendChild(closeSettingsBtn);
    settingsPanel.appendChild(chatSettingsSection);
    document.body.appendChild(settingsPanel);

    document.body.appendChild(app);

    // --- Randare ---
    function renderUsers() {
        usersList.innerHTML = '';
        appState.users.forEach(u => {
            const row = document.createElement('div');
            row.className = 'user-row';
            if (!u.online) row.classList.add('offline');
            if (u.banned) row.classList.add('banned');

            const pawn = document.createElement('div');
            pawn.className = 'pawn';
            pawn.innerText = u.customPawn || '👤';
            pawn.style.background = u.pawnColor && u.pawnColor.startsWith('linear-gradient') ? 'linear-gradient(90deg,#ff7f00,#ffd24d)' : (u.pawnColor || colorPalette.member.hex);

            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            const img = document.createElement('img');
            img.src = u.avatar || generateAvatarDataURL(u.name, u.pawnColor);
            img.alt = u.name;
            avatar.appendChild(img);

            const meta = document.createElement('div');
            meta.className = 'meta';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';

            const nameSpan = document.createElement('span');
            nameSpan.innerText = u.nickname || u.name;
            nameSpan.style.color = u.textColor || colorPalette.textPrimary.hex;

            const roleSpan = document.createElement('span');
            roleSpan.className = 'role';
            roleSpan.innerText = u.role;

            nameDiv.appendChild(nameSpan);
            nameDiv.appendChild(roleSpan);

            if (u.isBot) {
                const botTag = document.createElement('span');
                botTag.className = 'bot-tag';
                botTag.innerText = 'BOT';
                nameDiv.appendChild(botTag);
            }

            const sub = document.createElement('div');
            sub.className = 'small-muted';
            sub.innerText = u.online ? ('Online — ' + new Date(u.lastSeen).toLocaleTimeString()) : ('Offline — ' + new Date(u.lastSeen).toLocaleTimeString());

            meta.appendChild(nameDiv);
            meta.appendChild(sub);

            if (appState.settings.showTypingIndicators && u.isTyping) {
                const typingIndicator = document.createElement('div');
                typingIndicator.className = 'typing-indicator';
                typingIndicator.innerText = 'Scrie mesaj...';
                meta.appendChild(typingIndicator);
            }

            const actions = document.createElement('div');
            actions.className = 'user-actions';

            const selBtn = document.createElement('button');
            selBtn.className = 'btn small';
            selBtn.innerText = 'Select';
            selBtn.onclick = () => {
                selectedUserId = u.id;
                const user = uidToUser(appState, selectedUserId);
                colorInput.value = colorToHex(user.pawnColor) || '#2b7cff';
                pawnIconInput.value = user.customPawn || '🎌';
                nicknameInput.value = user.nickname || '';
                roleSelect.value = user.role;
                bgInput.value = user.background || '';
                textColorInput.value = user.textColor || '#ffffff';
                avatarInput.value = user.avatar || '';
                renderUsers();
            };

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn small';
            toggleBtn.innerText = u.online ? 'Offline' : 'Online';
            toggleBtn.onclick = () => {
                u.online = !u.online;
                if (!u.online) {
                    u.pawnColor = colorPalette.offline.hex;
                }
                u.lastSeen = nowISO();
                saveState(appState);
                renderUsers();
                renderMessages();
            };

            const banBtn = document.createElement('button');
            banBtn.className = 'btn small';
            banBtn.innerText = u.banned ? 'Deblochează' : 'Ban 30m';
            banBtn.onclick = () => {
                const currentUser = uidToUser(appState, 'you');
                const targetUser = uidToUser(appState, u.id);

                if (currentUser.id === targetUser.id) {
                    alert('Nu te poți bana pe tine însuți!');
                    return;
                }

                if (currentUser.role === 'AdminPrincipal') {
                    u.banned = !u.banned;
                    u.role = u.banned ? 'Banat' : (u.role === 'Banat' ? 'Member' : u.role);

                    if (u.banned) {
                        const banNotification = {
                            from: 'system',
                            text: `Acest utilizator a fost banat pentru 30 de minute, motivul: A vorbit vulgar.`,
                            time: nowISO()
                        };
                        appState.messages.push(banNotification);

                        setTimeout(() => {
                            u.banned = false;
                            u.role = 'Member';
                            const unbanNotification = {
                                from: 'system',
                                text: `${u.name} a fost deblocat.`,
                                time: nowISO()
                            };
                            appState.messages.push(unbanNotification);
                            saveState(appState);
                            renderMessages();
                        }, 30 * 60 * 1000); // 30 de minute
                    }
                } else if (currentUser.canBan && (targetUser.role === 'Member' || targetUser.role === 'Visitor')) {
                    u.banned = !u.banned;
                    u.role = u.banned ? 'Banat' : (u.role === 'Banat' ? 'Member' : u.role);

                    if (u.banned) {
                        const banNotification = {
                            from: 'system',
                            text: `${u.name} a fost banat pentru 30 de minute de către ${currentUser.name}. Motiv: Limbaj necorespunzător.`,
                            time: nowISO()
                        };
                        appState.messages.push(banNotification);

                        setTimeout(() => {
                            u.banned = false;
                            u.role = 'Member';
                            const unbanNotification = {
                                from: 'system',
                                text: `${u.name} a fost deblocat.`,
                                time: nowISO()
                            };
                            appState.messages.push(unbanNotification);
                            saveState(appState);
                            renderMessages();
                        }, 30 * 60 * 1000);
                    }
                } else {
                    alert('Nu ai permisiunea să banezi acest utilizator!');
                    return;
                }

                saveState(appState);
                renderUsers();
                renderMessages();
            };

            actions.appendChild(selBtn);
            actions.appendChild(toggleBtn);
            actions.appendChild(banBtn);

            row.appendChild(pawn);
            row.appendChild(avatar);
            row.appendChild(meta);
            row.appendChild(actions);
            usersList.appendChild(row);
        });
    }

    function renderMessages() {
        // General messages
        messagesDiv.innerHTML = '';
        appState.messages.filter(m => !m.topic || m.topic === 'general').forEach(m => {
            renderMessage(m, messagesDiv);
        });

        // LGBT+ messages
        lgbtMessages.innerHTML = '';
        appState.activeDiscussions.find(d => d.topic === 'LGBT+')?.messages.forEach(m => {
            renderMessage(m, lgbtMessages);
        });

        // Anime messages
        animeMessages.innerHTML = '';
        appState.activeDiscussions.find(d => d.topic === 'Anime')?.messages.forEach(m => {
            renderMessage(m, animeMessages);
        });

        // Cenzură Digitală messages
        censorMessages.innerHTML = '';
        appState.activeDiscussions.find(d => d.topic === 'Cenzură Digitală')?.messages.forEach(m => {
            renderMessage(m, censorMessages);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        lgbtMessages.scrollTop = lgbtMessages.scrollHeight;
        animeMessages.scrollTop = animeMessages.scrollHeight;
        censorMessages.scrollTop = censorMessages.scrollHeight;
    }

    function renderMessage(m, container) {
        const from = uidToUser(appState, m.from) || { name: m.from, avatar: '', background: '', textColor: colorPalette.textPrimary.hex, role: 'Unknown', customPawn: '👤' };
        const currentUser = uidToUser(appState, 'you');

        const el = document.createElement('div');
        el.className = 'msg ' + (m.from === 'you' ? 'me' : 'other');

        if (from.background && m.from !== 'you' && !m.from.startsWith('system')) {
            el.classList.add('user-bg');
            el.style.setProperty('--user-bg', from.background.startsWith('http') ? `url(${from.background})` : from.background);
            el.style.setProperty('--user-text', from.textColor);
        }

        if (m.from === 'system') {
            el.className = 'ban-notification';
            el.innerText = m.text;
            container.appendChild(el);
            return;
        }

        const meta = document.createElement('div');
        meta.className = 'meta';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.innerText = (from.nickname || from.name);
        nameSpan.style.color = from.textColor || colorPalette.textPrimary.hex;

        const roleSpan = document.createElement('span');
        roleSpan.className = 'role';
        roleSpan.innerText = from.role;

        const timeSpan = document.createElement('span');
        timeSpan.innerText = new Date(m.time).toLocaleTimeString();

        meta.appendChild(nameSpan);
        meta.appendChild(roleSpan);
        meta.appendChild(timeSpan);

        const text = document.createElement('div');
        text.className = 'text';
        text.innerText = m.text;

        el.appendChild(meta);
        el.appendChild(text);

        // Adaugă opțiuni de editare pentru AdminPrincipal
        if (currentUser && currentUser.role === 'AdminPrincipal' && m.from !== 'you' && !m.from.startsWith('system')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn small';
            editBtn.innerText = 'Editează';
            editBtn.onclick = () => {
                const newText = prompt('Editează mesajul:', m.text);
                if (newText !== null) {
                    m.text = newText;
                    saveState(appState);
                    renderMessages();
                }
            };
            el.appendChild(editBtn);
        }

        container.appendChild(el);
    }

    // --- Evenimente ---
    colorInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.pawnColor = colorInput.value;
        u.avatar = generateAvatarDataURL(u.name, u.pawnColor);
        saveState(appState);
        renderUsers();
    });

    pawnIconInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.customPawn = pawnIconInput.value;
        saveState(appState);
        renderUsers();
    });

    nicknameInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.nickname = nicknameInput.value;
        saveState(appState);
        renderUsers();
    });

    bgInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.background = bgInput.value;
        saveState(appState);
    });

    textColorInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.textColor = textColorInput.value;
        saveState(appState);
        renderUsers();
    });

    avatarInput.addEventListener('input', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        u.avatar = avatarInput.value;
        saveState(appState);
        renderUsers();
    });

    roleSelect.addEventListener('change', () => {
        const u = uidToUser(appState, selectedUserId);
        if (!u) return;
        const currentUser = uidToUser(appState, 'you');

        if (currentUser.role === 'AdminPrincipal') {
            u.role = roleSelect.value;
        } else if (currentUser.role === 'Admin' && (roleSelect.value !== 'AdminPrincipal' && roleSelect.value !== 'Admin')) {
            u.role = roleSelect.value;
        } else if (currentUser.role === 'Moderator' && (roleSelect.value === 'Member' || roleSelect.value === 'Visitor' || roleSelect.value === 'Banat')) {
            u.role = roleSelect.value;
        } else {
            alert('Nu ai permisiunea să schimbi rolul acestui utilizator!');
            roleSelect.value = u.role;
            return;
        }

        if (u.role === 'Banat') u.banned = true;
        else u.banned = false;

        switch(u.role) {
            case 'AdminPrincipal':
                u.canPostLinks = true;
                u.canPostImages = true;
                u.canBan = true;
                u.canEditMessages = true;
                u.canCensor = true;
                u.messageCooldown = 0;
                break;
            case 'Admin':
                u.canPostLinks = true;
                u.canPostImages = true;
                u.canBan = true;
                u.canEditMessages = false;
                u.canCensor = false;
                u.messageCooldown = 0;
                break;
            case 'Moderator':
                u.canPostLinks = true;
                u.canPostImages = false;
                u.canBan = true;
                u.canEditMessages = false;
                u.canCensor = true;
                u.messageCooldown = 0;
                break;
            case 'Member':
                u.canPostLinks = false;
                u.canPostImages = false;
                u.canBan = false;
                u.canEditMessages = false;
                u.canCensor = false;
                u.messageCooldown = 0;
                break;
            case 'Visitor':
                u.canPostLinks = false;
                u.canPostImages = false;
                u.canBan = false;
                u.canEditMessages = false;
                u.canCensor = false;
                u.messageCooldown = 20;
                break;
            case 'Banat':
                u.canPostLinks = false;
                u.canPostImages = false;
                u.canBan = false;
                u.canEditMessages = false;
                u.canCensor = false;
                u.messageCooldown = 0;
                u.banned = true;
                break;
        }

        saveState(appState);
        renderUsers();
    });

    // Tab switching
    [generalTab, lgbtTab, animeTab, censorTab].forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.discussion-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.discussion-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.querySelector(`.discussion-content[data-topic="${tab.dataset.topic}"]`).classList.add('active');
        });
    });

    // Send message
    sendBtn.addEventListener('click', () => {
        const currentUser = uidToUser(appState, 'you');
        if (!currentUser) return;

        const txt = textarea.value.trim();
        if (!txt) return;

        if (!canPost(currentUser)) {
            alert(`Trebuie să aștepți ${currentUser.messageCooldown} secunde înainte de a trimite un nou mesaj!`);
            return;
        }

        let censoredText = censorMessage(txt, appState.settings.bannedWords);

        if (!currentUser.canPostLinks) {
            censoredText = censoredText.replace(/https?:\/\/\S+/gi, '[Link blocat]');
        }

        if (!currentUser.canPostImages) {
            censoredText = censoredText.replace(/📷/g, '[Imagine blocată]');
        }

        const activeTab = document.querySelector('.discussion-tab.active').dataset.topic;
        const msg = {
            from: 'you',
            text: censoredText,
            time: nowISO(),
            topic: activeTab !== 'general' ? activeTab : undefined
        };

        if (activeTab === 'general') {
            appState.messages.push(msg);
        } else {
            const discussion = appState.activeDiscussions.find(d => d.topic === activeTab);
            if (discussion) {
                discussion.messages.push(msg);
            }
        }

        currentUser.lastMessageTime = Date.now();
        textarea.value = '';
        saveState(appState);
        renderMessages();
    });

    textarea.addEventListener('input', () => {
        const currentUser = uidToUser(appState, 'you');
        if (currentUser) {
            currentUser.isTyping = textarea.value.trim() !== '';
            saveState(appState);
            renderUsers();
        }
    });

    // Emoji picker
    emojiPicker.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            textarea.value += btn.innerText;
            textarea.focus();
        });
    });

    // Music button
    musicBtn.addEventListener('click', () => {
        appState.settings.musicPlaying = !appState.settings.musicPlaying;
        saveState(appState);
        musicBtn.style.background = appState.settings.musicPlaying ? '#1f2937' : '#111827';
        musicBtn.title = appState.settings.musicPlaying ? 'Live Music (ON)' : 'Live Music (OFF)';
        if (appState.settings.musicPlaying) {
            startBeep();
        } else {
            stopBeep();
        }
    });

    // Censor button
    censorBtn.addEventListener('click', () => {
        const currentUser = uidToUser(appState, 'you');
        if (!currentUser.canCensor) {
            alert('Nu ai permisiunea de a cenzura!');
            return;
        }

        const userToCensor = prompt('Introdu ID-ul utilizatorului pentru a-i activa/dizactiva cenzura individuală:');
        if (userToCensor) {
            const user = uidToUser(appState, userToCensor);
            if (user) {
                user.canPostLinks = !user.canPostLinks;
                user.canPostImages = !user.canPostImages;
                saveState(appState);
                alert(`Cenzură individuală pentru ${user.name}: Link-uri ${user.canPostLinks ? 'permise' : 'blocate'}, Imagini ${user.canPostImages ? 'permise' : 'blocate'}.`);
            } else {
                alert('Utilizatorul nu există!');
            }
        }
    });

    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('active');
        chatBgInput.value = appState.settings.chatBackground;
        chatTextInput.value = appState.settings.chatTextColor;
        msgBgInput.value = appState.settings.messageBackground;
        msgTextInput.value = appState.settings.messageTextColor;
        myMsgBgInput.value = appState.settings.myMessageBackground;
        myMsgTextInput.value = appState.settings.myMessageTextColor;
        fontInput.value = appState.settings.fontFamily;
        fontSizeInput.value = appState.settings.fontSize;
        animationsInput.checked = appState.settings.animationsEnabled;
        crownInput.checked = appState.settings.crownIcon;
        bannedWordsInput.value = appState.settings.bannedWords.join(', ');
        showTypingInput.checked = appState.settings.showTypingIndicators;
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });

    saveSettingsBtn.addEventListener('click', () => {
        appState.settings.chatBackground = chatBgInput.value;
        appState.settings.chatTextColor = chatTextInput.value;
        appState.settings.messageBackground = msgBgInput.value;
        appState.settings.messageTextColor = msgTextInput.value;
        appState.settings.myMessageBackground = myMsgBgInput.value;
        appState.settings.myMessageTextColor = myMsgTextInput.value;
        appState.settings.fontFamily = fontInput.value;
        appState.settings.fontSize = fontSizeInput.value;
        appState.settings.animationsEnabled = animationsInput.checked;
        appState.settings.crownIcon = crownInput.checked;
        appState.settings.bannedWords = bannedWordsInput.value.split(',').map(w => w.trim()).filter(w => w);
        appState.settings.showTypingIndicators = showTypingInput.checked;

        app.style.background = appState.settings.chatBackground;
        app.style.color = appState.settings.chatTextColor;
        app.style.fontFamily = appState.settings.fontFamily;
        app.style.fontSize = appState.settings.fontSize;

        saveState(appState);
        settingsPanel.classList.remove('active');
        renderMessages();
    });

    closeX.addEventListener('click', () => {
        app.style.display = 'none';
    });

    // --- Drag & Drop + Resize ---
    (function enableDragAndResize() {
        let isDown = false;
        let startX, startY, startLeft, startTop;

        topbar.addEventListener('pointerdown', e => {
            isDown = true;
            app.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            const rect = app.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            e.preventDefault();
        });

        window.addEventListener('pointermove', e => {
            if (!isDown) return;
            let nx = startLeft + (e.clientX - startX);
            let ny = startTop + (e.clientY - startY);
            nx = Math.max(8, Math.min(window.innerWidth - app.offsetWidth - 8, nx));
            ny = Math.max(8, Math.min(window.innerHeight - app.offsetHeight - 8, ny));
            app.style.left = nx + 'px';
            app.style.top = ny + 'px';
            app.style.right = 'auto';
            app.style.bottom = 'auto';
        });

        window.addEventListener('pointerup', () => {
            isDown = false;
            app.classList.remove('dragging');
        });

        app.addEventListener('pointerdown', e => {
            if (e.target === app) {
                const rect = app.getBoundingClientRect();
                const offsetX = e.clientX - rect.right;
                const offsetY = e.clientY - rect.bottom;
                if (offsetX > -16 && offsetX < 0 && offsetY > -16 && offsetY < 0) {
                    isResizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = rect.width;
                    startHeight = rect.height;
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('pointermove', e => {
            if (!isResizing) return;
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);
            app.style.width = Math.max(300, newWidth) + 'px';
            app.style.height = Math.max(400, newHeight) + 'px';
        });

        window.addEventListener('pointerup', () => {
            isResizing = false;
        });
    })();

    // --- Roboți / Simulare ---
    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    const sampleTexts = {
        general: [
            'Salut tuturor!',
            'Ce mai faceți azi?',
            'Am găsit ceva interesant — vedeți linkul: https://example.com',
            'Puteți testa setările mele?',
            'Haha, asta e funny 😂',
            'Recomand muzica asta. 🎵',
            'Cine vrea să joace un mini-joc?',
            '📷', // Simulare imagine
            'Sugi pula' // Cuvânt interzis
        ],
        'LGBT+': [
            'Acceptarea este cheia pentru o societate mai bună. 🌈',
            'Cred că fiecare persoană merită respect.',
            'Am citit un articol interesant despre drepturile LGBT+.',
            'Cum putem sprijini mai bine comunitatea?'
        ],
        'Anime': [
            'Am văzut recent "Attack on Titan". Ce părere aveți? 🍿',
            'Care este anime-ul vostru preferat?',
            'Aștept cu nerăbdare noul sezon al "Demon Slayer".',
            'Personajul meu preferat este Levi din "Attack on Titan".'
        ],
        'Cenzură Digitală': [
            'Cenzura poate fi necesară, dar trebuie aplicată cu înțelepciune.',
            'Cum putem proteja libertatea de exprimare online?',
            'Unele platforme abuzează de cenzură.',
            'Ce părere aveți despre cenzurarea conținutului pe rețelele sociale?'
        ]
    };

    function botTick() {
        const bots = appState.users.filter(u => u.isBot && u.online && !u.banned);
        if (bots.length === 0) return;

        const activeTab = document.querySelector('.discussion-tab.active').dataset.topic;
        const messages = sampleTexts[activeTab] || sampleTexts.general;

        bots.forEach(bot => {
            if (Math.random() < 0.2) {
                if (!canPost(bot)) return;

                let text = randomFrom(messages);
                const user = uidToUser(appState, bot.id);

                if (!user.canPostLinks) {
                    text = text.replace(/https?:\/\/\S+/gi, '[Link blocat]');
                }
                if (!user.canPostImages) {
                    text = text.replace(/📷/g, '[Imagine blocată]');
                }

                text = censorMessage(text, appState.settings.bannedWords);

                const msg = {
                    from: bot.id,
                    text: text,
                    time: nowISO(),
                    topic: activeTab !== 'general' ? activeTab : undefined
                };

                if (activeTab === 'general') {
                    appState.messages.push(msg);
                } else {
                    const discussion = appState.activeDiscussions.find(d => d.topic === activeTab);
                    if (discussion) {
                        discussion.messages.push(msg);

                        // Simulare: Un bot spune un cuvânt interzis
                        if (text.includes('Sugi pula') && bot.id !== 'animax') {
                            setTimeout(() => {
                                const moderator = appState.users.find(u => u.role === 'Moderator' && u.online);
                                if (moderator) {
                                    const banNotification = {
                                        from: 'system',
                                        text: `${bot.name} a fost banat pentru 30 de minute, motivul: A vorbit vulgar.`,
                                        time: nowISO(),
                                        topic: activeTab
                                    };

                                    if (activeTab === 'general') {
                                        appState.messages.push(banNotification);
                                    } else {
                                        const discussion = appState.activeDiscussions.find(d => d.topic === activeTab);
                                        if (discussion) {
                                            discussion.messages.push(banNotification);
                                        }
                                    }

                                    user.banned = true;
                                    user.role = 'Banat';
                                    saveState(appState);
                                    renderUsers();
                                    renderMessages();

                                    setTimeout(() => {
                                        user.banned = false;
                                        user.role = 'Member';
                                        const unbanNotification = {
                                            from: 'system',
                                            text: `${bot.name} a fost deblocat.`,
                                            time: nowISO(),
                                            topic: activeTab
                                        };

                                        if (activeTab === 'general') {
                                            appState.messages.push(unbanNotification);
                                        } else {
                                            const discussion = appState.activeDiscussions.find(d => d.topic === activeTab);
                                            if (discussion) {
                                                discussion.messages.push(unbanNotification);
                                            }
                                        }
                                        saveState(appState);
                                        renderUsers();
                                        renderMessages();
                                    }, 30 * 60 * 1000);
                                }
                            }, 2000);
                        }
                    }
                }

                bot.lastMessageTime = Date.now();
            }
        });

        saveState(appState);
        renderMessages();
    }

    let botTimer = setInterval(botTick, 5000 + Math.random() * 5000);

    // --- Sunet ---
    let audioCtx = null;
    let osc = null;

    function startBeep() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 220;
            gain.gain.value = 0.02;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
        } catch(e) {
            console.warn('Audio unavailable', e);
        }
    }

    function stopBeep() {
        try {
            if (osc) osc.stop();
            osc = null;
        } catch(e) {}
    }

    // --- Helpers pentru console ---
    window.LocalChatSim = {
        state: () => appState,
        save: () => saveState(appState),
        setRole: (uid, role) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.role = role;
                u.banned = (role === 'Banat');
                saveState(appState);
                renderUsers();
            }
        },
        setOnline: (uid, on) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.online = !!on;
                u.lastSeen = nowISO();
                if (!on) u.pawnColor = colorPalette.offline.hex;
                saveState(appState);
                renderUsers();
                renderMessages();
            }
        },
        setPawnColor: (uid, hex) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.pawnColor = hex;
                u.avatar = generateAvatarDataURL(u.name, u.pawnColor);
                saveState(appState);
                renderUsers();
            }
        },
        addMessage: (uid, text, topic) => {
            const msg = { from: uid, text: text, time: nowISO(), topic: topic !== 'general' ? topic : undefined };
            if (topic === 'general') {
                appState.messages.push(msg);
            } else {
                const discussion = appState.activeDiscussions.find(d => d.topic === topic);
                if (discussion) {
                    discussion.messages.push(msg);
                }
            }
            saveState(appState);
            renderMessages();
        },
        setBackground: (uid, bg) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.background = bg;
                saveState(appState);
            }
        },
        setTextColor: (uid, color) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.textColor = color;
                saveState(appState);
            }
        },
        setAvatar: (uid, url) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.avatar = url;
                saveState(appState);
                renderUsers();
            }
        },
        setNickname: (uid, nickname) => {
            const u = uidToUser(appState, uid);
            if (u) {
                u.nickname = nickname;
                saveState(appState);
                renderUsers();
            }
        }
    };

    // --- Inițializare ---
    (function ensureVisitorBot() {
        const g = appState.users.find(u => u.id === 'george');
        if (g) {
            g.role = 'Visitor';
            g.isBot = true;
            g.isVisitor = true;
            saveState(appState);
            renderUsers();
        }
    })();

    (function ensureAdmin() {
        const adm = appState.users.find(u => u.id === 'you');
        if (adm) {
            adm.role = 'AdminPrincipal';
            adm.pawnColor = colorPalette.adminPrincipal.hex;
            adm.nickname = 'Japonezul';
            saveState(appState);
            renderUsers();
        }
    })();

    // --- Randare inițială ---
    renderUsers();
    renderMessages();

    // --- Salvare la închidere ---
    window.addEventListener('beforeunload', () => saveState(appState));
})();