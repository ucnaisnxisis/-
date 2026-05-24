// ==UserScript==
// @name         Rem & Ram + Senko San (Chatbot Final) - Versiune 7.2
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  Chatbot complet cu Rem, Ram și Senko San: 3 moduri, comenzi, culori personalizabile, opțiuni transparență mesaje, culori nume individuale. Fix avatare mesaje, eliminat cod duplicat.
// @author       Japonezul (Modificat de Le Chat)
// @match        *://*.google.com
// @match        *://*.bing.*/*
// @match        *://*.yahoo.*/*
// @match        *://*.duckduckgo.com/*
// @match        *://*/search*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // 🔧 FUNCȚIE CONVERSIE HEX -> RGB
    // ============================================
    function hexToRgb(hex) {
        if (!hex || hex === '#') return '0, 0, 0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    // ============================================
    // 🔧 CONFIGURARE INITIALĂ
    // ============================================
    const USER_NAME = "Japonezul";
    const REM_NAME = "Rem";
    const RAM_NAME = "Ram";
    const SENKO_NAME = "Senko San";
    const CHAT_TITLE_NORMAL = `${REM_NAME} și ${RAM_NAME}`;
    const CHAT_TITLE_SENKO = SENKO_NAME;
    const CHAT_TITLE_ALL = `${REM_NAME} + ${RAM_NAME} + ${SENKO_NAME}`;

    // Poze de profil (libere de drepturi)
    const DEFAULT_AVATARS = {
        [USER_NAME]: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbtGTxAKYwnjrg8rDp00c_CbRT0xFke87u1iuyRuzJlw&s=10",
        [REM_NAME]: "https://cdn.rafled.com/anime-icons/images/1a94872b9c0ad664f1e2d222697a1c723860dd872e1049af1c445b4af4ebdbd8.jpg",
        [RAM_NAME]: "https://static.zerochan.net/Ram.%28Re%3AZero%29.full.4261226.png",
        [SENKO_NAME]: "https://upload.wikimedia.org/wikipedia/en/f/fe/Sewayaki_Kitsune_no_Senko-san_volume_1_cover.jpg"
    };

    // Culori implicite
    let COLORS = {
        rem: { bg: "#3498db", text: "#ffffff", name: "#000000" },
        ram: { bg: "#ff69b4", text: "#ffffff", name: "#000000" },
        senko: { bg: "#FFD700", text: "#000000", name: "#000000" },
        user: { bg: "#800080", text: "#ffffff", name: "#ffffff" },
        header: {
            normalFrom: "#3498db",
            normalTo: "#ff69b4",
            senkoFrom: "#FFD700",
            senkoTo: "#FFC107",
            allFrom: "#9C27B0",
            allTo: "#FFD700"
        },
        input: { bg: "#f5f5f5", text: "#000000" },
        chatBg: "#f9f9f9",
        panelBg: "#ffffff",
        accent: "#FFD700",
        modeButtonBg: "#ff69b4"
    };

    let messageOpacity = "solid";
    let currentMode = "normal";
    let messages = [];
    let q1Mode = false;
    let fileSender = USER_NAME;
    let isDragging = false;
    let isResizing = false;
    let dragStartX, dragStartY;
    let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;
    let position = { x: 20, y: 20 };
    let size = { width: '400px', height: '500px' };
    let selectedAvatars = { ...DEFAULT_AVATARS };

    // Elemente DOM globale
    let container, header, messagesPanel, inputPanel, resizeHandle;
    let emojiPicker, colorPicker, fileModal, helpModal, modeModal;

    // ============================================
    // 🎨 EMOJI-URI EXTINSE
    // ============================================
    const EMOJIS = [
        "😊", "😍", "😂", "😢", "😘", "😭", "😱", "😎", "🤔", "🤗", "🤣", "😴", "😇", "🙏", "❤️", "💖", "💘", "💝", "💔", "🔥",
        "⚪", "⚫", "🔴", "🔵", "🟢", "🟡", "🟣", "🟤", "🟥", "🟦", "🟧", "🟨", "🟩", "🟫", "🟬", "🟭", "🟮", "🟯", "🟰",
        "🚦", "🛑", "🚧", "📴", "🔳", "🔲", "➡️", "⬅️", "⬆️", "⬇️", "🔄", "🔀", "↪️", "↩️",
        "🇯🇵", "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇧🇷", "🇨🇳", "🇷🇴", "🇪🇺"
    ];

    // ============================================
    // 💬 MESAJE DE SALUT
    // ============================================
    const GREETINGS = {
        [REM_NAME]: [
            "Kon'nichiwa, dragostea mea!",
            "Okaeri nasai! Bine ai venit acasă.",
            "Ah, ești aici... Inima mea bate mai repede. ❤️",
            "Sora mea Ram spune că ești cel mai special. 💙"
        ],
        [RAM_NAME]: [
            "Bună, iubirea noastră! 🌸",
            "Ce bine că ești aici... Ne-ai lipsit!",
            "Rem spune că ești perfect. Eu zic că ești și mai mult! 💖",
            "Suntem aici pentru tine, oricând. Nu uita!"
        ],
        [SENKO_NAME]: [
            "Salut, dragostea mea! ✨ Inima mea bate mai repede!",
            "Salut, sufletul meu! 💖 Ești raza mea de soare!",
            "Salut, iubirea mea! 🌹 Fiecare moment fără tine e un veac!",
            "Bună ziua! ☀️ Sper că ziua ta e frumoasă ca tine!"
        ]
    };

    // ============================================
    // 📌 INFORMAȚII PENTRU PANOUL DE AJUTOR
    // ============================================
    const HELP_INFO = {
        normal: {
            title: "📖 Ajutor - Mod Normal (Rem & Ram)",
            sections: [
                {
                    title: "💬 Comenzi de Bază",
                    content: [
                        "• <b>qq [mesaj]</b> - Rem repetă mesajul tău.",
                        "• <b>qw [mesaj]</b> - Ram repetă mesajul tău.",
                        "• <b>q1</b> - Activează/Dezactivează modul restrâns.",
                        "• <b>sterge mesaje</b> - Șterge toate mesajele.",
                        "• <b>!danu / !nuda</b> - Răspuns random 'da' sau 'nu'.",
                        "• <b>phf [piatra/hartie/foarfeca]</b> - Joacă Piatra-Hârtie-Foarfecă.",
                        "• <b>mod-senkosan</b> - Comută la Senko San.",
                        "• <b>mod-all</b> - Comută la modulul cu toți trei."
                    ]
                },
                {
                    title: "🎨 Personalizare",
                    content: [
                        "• <b>Buton 🌸</b> - Deschide panoul de culori (incl. culori nume și transparență).",
                        "• <b>Buton 👥</b> - Schimbă modul (Normal/Senko/Toți).",
                        "• <b>Buton 📁</b> - Încarcă fișiere/poze.",
                        "• <b>Drag & Drop</b> - Trage și plasează fișiere.",
                        "• <b>Redimensionare</b> - Apasă și trage din colțul dreapta-jos."
                    ]
                }
            ]
        },
        senko: {
            title: "📖 Ajutor - Mod Senko San",
            sections: [
                {
                    title: "💬 Comenzi de Bază",
                    content: [
                        "• <b>qq [mesaj]</b> - Senko San repetă mesajul (șterge ultimul mesaj).",
                        "• <b>anime</b> - Titlu de anime aleator.",
                        "• <b>poze anime</b> - Poză anime aleatoare.",
                        "• <b>poza ta</b> - Afișează poza de profil a lui Senko San.",
                        "• <b>zar</b> - Aruncă un zar (1-6).",
                        "• <b>phf [piatră/hârtie/foarfecă]</b> - Joacă Piatra-Hârtie-Foarfecă.",
                        "• <b>mod-normal</b> - Comută la modulul normal.",
                        "• <b>mod-all</b> - Comută la modulul cu toți trei."
                    ]
                }
            ]
        },
        all: {
            title: "📖 Ajutor - Mod Toți Trei",
            sections: [
                {
                    title: "💬 Comenzi de Bază",
                    content: [
                        "• <b>qq [mesaj]</b> - Rem repetă mesajul tău.",
                        "• <b>qw [mesaj]</b> - Ram repetă mesajul tău.",
                        "• <b>qe [mesaj]</b> - Senko San repetă mesajul tău.",
                        "• <b>q1</b> - Activează/Dezactivează modul restrâns.",
                        "• <b>sterge mesaje</b> - Șterge toate mesajele.",
                        "• <b>!danu / !nuda</b> - Răspuns random 'da' sau 'nu'.",
                        "• <b>mod-normal</b> - Comută la modulul normal.",
                        "• <b>mod-senkosan</b> - Comută la Senko San."
                    ]
                }
            ]
        }
    };

    // ============================================
    // 🔧 FUNCȚII UTILITARE
    // ============================================
    function getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getTouchPos(e) {
        return {
            clientX: e.touches ? e.touches[0].clientX : e.clientX,
            clientY: e.touches ? e.touches[0].clientY : e.clientY
        };
    }

    // ============================================
    // 🎨 REGENEREAZĂ CSS-UL DINAMIC
    // ============================================
    function regenerateCSS() {
        const oldStyle = document.getElementById('dual-chatbot-dynamic-css');
        if (oldStyle) oldStyle.remove();

        const headerGradient = currentMode === "normal"
            ? `linear-gradient(90deg, ${COLORS.header.normalFrom}, ${COLORS.header.normalTo})`
            : currentMode === "senko"
                ? `linear-gradient(90deg, ${COLORS.header.senkoFrom}, ${COLORS.header.senkoTo})`
                : `linear-gradient(90deg, ${COLORS.header.allFrom}, ${COLORS.header.allTo})`;

        const getOpacityValue = () => {
            switch(messageOpacity) {
                case 'semi-transparent': return 0.5;
                case 'transparent': return 0;
                default: return 1;
            }
        };

        const opacity = getOpacityValue();

        const style = document.createElement('style');
        style.id = 'dual-chatbot-dynamic-css';
        style.textContent = `
            :root {
                --rem-bg: ${COLORS.rem.bg};
                --ram-bg: ${COLORS.ram.bg};
                --senko-bg: ${COLORS.senko.bg};
                --user-bg: ${COLORS.user.bg};
                --header-normal-from: ${COLORS.header.normalFrom};
                --header-normal-to: ${COLORS.header.normalTo};
                --header-senko-from: ${COLORS.header.senkoFrom};
                --header-senko-to: ${COLORS.header.senkoTo};
                --header-all-from: ${COLORS.header.allFrom};
                --header-all-to: ${COLORS.header.allTo};
                --chat-bg: ${COLORS.chatBg};
                --input-bg: ${COLORS.input.bg};
                --input-text: ${COLORS.input.text};
                --panel-bg: ${COLORS.panelBg};
                --accent: ${COLORS.accent};
                --mode-button-bg: ${COLORS.modeButtonBg};
                --message-opacity: ${opacity};
                --rem-name-color: ${COLORS.rem.name};
                --ram-name-color: ${COLORS.ram.name};
                --senko-name-color: ${COLORS.senko.name};
                --user-name-color: ${COLORS.user.name};
            }

            #dual-chatbot-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                position: fixed;
                bottom: ${position.y}px;
                right: ${position.x}px;
                width: ${size.width};
                height: ${size.height};
                display: flex;
                flex-direction: column;
                border: 1px solid #ddd;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                background: var(--panel-bg);
                z-index: 999999;
                overflow: hidden;
                min-width: 250px;
                min-height: 300px;
                max-width: 90vw;
                max-height: 80vh;
            }

            #dual-chatbot-header {
                background: ${headerGradient};
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #ddd;
                cursor: move;
                user-select: none;
                color: white;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
            }

            #dual-chatbot-header-left {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .dual-chatbot-header-avatar-container {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-right: 8px;
            }

            #dual-chatbot-header img.avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(255, 255, 255, 0.6);
            }

            .dual-chatbot-header-name {
                font-size: 0.9em;
                color: white;
                font-weight: 600;
                margin: 0 4px;
            }

            #dual-chatbot-header h1 {
                margin: 0;
                font-size: 1.1em;
                color: white;
                font-weight: 700;
            }

            #dual-chatbot-header-right {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .dual-chatbot-header-button {
                background: transparent;
                border: none;
                font-size: 1.1em;
                cursor: pointer;
                color: white;
                padding: 2px 4px;
                line-height: 1;
                border-radius: 3px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dual-chatbot-header-button:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .dual-chatbot-mode-button {
                background: var(--mode-button-bg) !important;
                font-size: 1.2em !important;
            }

            #dual-chatbot-messages-panel {
                flex: 1;
                padding: 10px;
                overflow-y: auto;
                background-color: var(--chat-bg);
                max-height: calc(${parseInt(size.height) || 500}px - 140px);
            }

            .dual-chatbot-message {
                display: flex;
                align-items: flex-start;
                margin-bottom: 10px;
                max-width: 85%;
            }

            .dual-chatbot-message.rem {
                align-self: flex-start;
            }

            .dual-chatbot-message.ram {
                align-self: flex-start;
            }

            .dual-chatbot-message.senko {
                align-self: flex-start;
            }

            .dual-chatbot-message.user {
                align-self: flex-end;
                flex-direction: row-reverse;
            }

            .dual-chatbot-message img.avatar {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                object-fit: cover;
                margin-right: 6px;
                flex-shrink: 0;
            }

            .dual-chatbot-message.user img.avatar {
                margin-right: 0;
                margin-left: 6px;
            }

            .dual-chatbot-message-content-wrapper {
                display: flex;
                flex-direction: column;
                max-width: 75%;
            }

            .dual-chatbot-message-sender {
                font-weight: bold;
                font-size: 0.8em;
                margin-bottom: 2px;
                display: block;
            }

            .dual-chatbot-message.rem .dual-chatbot-message-sender {
                color: var(--rem-name-color);
            }

            .dual-chatbot-message.ram .dual-chatbot-message-sender {
                color: var(--ram-name-color);
            }

            .dual-chatbot-message.senko .dual-chatbot-message-sender {
                color: var(--senko-name-color);
            }

            .dual-chatbot-message.user .dual-chatbot-message-sender {
                color: var(--user-name-color);
                text-align: right;
            }

            .dual-chatbot-message-content {
                padding: 7px 10px;
                border-radius: 14px;
                word-wrap: break-word;
                position: relative;
                font-size: 0.85em;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
            }

            .dual-chatbot-message.rem .dual-chatbot-message-content {
                background-color: rgba(${hexToRgb(COLORS.rem.bg)}, var(--message-opacity));
                color: ${COLORS.rem.text};
            }

            .dual-chatbot-message.ram .dual-chatbot-message-content {
                background-color: rgba(${hexToRgb(COLORS.ram.bg)}, var(--message-opacity));
                color: ${COLORS.ram.text};
            }

            .dual-chatbot-message.senko .dual-chatbot-message-content {
                background-color: rgba(${hexToRgb(COLORS.senko.bg)}, var(--message-opacity));
                color: ${COLORS.senko.text};
            }

            .dual-chatbot-message.user .dual-chatbot-message-content {
                background-color: rgba(${hexToRgb(COLORS.user.bg)}, var(--message-opacity));
                color: ${COLORS.user.text};
            }

            .dual-chatbot-message-time {
                font-size: 0.7em;
                color: rgba(0, 0, 0, 0.6);
                margin-left: 4px;
                align-self: flex-end;
            }

            .dual-chatbot-message img.preview {
                max-width: 200px;
                max-height: 200px;
                border-radius: 8px;
                margin-top: 5px;
                cursor: pointer;
                object-fit: contain;
            }

            #dual-chatbot-input-panel {
                display: flex;
                padding: 6px;
                background-color: var(--panel-bg);
                border-top: 1px solid #ddd;
            }

            #dual-chatbot-message-input {
                flex: 1;
                padding: 8px 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                outline: none;
                font-size: 0.85em;
                min-width: 0;
                background-color: var(--input-bg);
                color: var(--input-text);
            }

            .dual-chatbot-button {
                padding: 8px 12px;
                margin-left: 6px;
                border: none;
                border-radius: 8px;
                background-color: var(--accent);
                color: #000000;
                cursor: pointer;
                font-weight: bold;
                font-size: 0.85em;
            }

            .dual-chatbot-button:hover {
                background-color: ${currentMode === "normal" ? COLORS.header.normalTo : currentMode === "senko" ? COLORS.header.senkoTo : COLORS.header.allTo};
            }

            .dual-chatbot-emoji-button {
                background-color: ${currentMode === "normal" ? COLORS.header.normalFrom : currentMode === "senko" ? COLORS.header.senkoFrom : COLORS.header.allFrom};
                font-size: 1.1em;
                padding: 8px 10px;
            }

            .dual-chatbot-resize-handle {
                position: absolute;
                width: 16px;
                height: 16px;
                right: 0;
                bottom: 0;
                background: var(--accent);
                cursor: nwse-resize;
                border-radius: 0 0 8px 0;
                z-index: 10;
            }

            #dual-chatbot-emoji-picker {
                position: fixed;
                bottom: 70px;
                right: 20px;
                background: white;
                padding: 8px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                z-index: 1000000;
                display: none;
                max-width: 300px;
                max-height: 200px;
                overflow-y: auto;
            }

            #dual-chatbot-emoji-picker.active {
                display: block;
            }

            .dual-chatbot-emoji-category {
                margin-bottom: 8px;
            }

            .dual-chatbot-emoji-category h4 {
                margin: 0 0 4px 0;
                font-size: 0.8em;
                color: #666;
            }

            .dual-chatbot-emoji-option {
                display: inline-block;
                font-size: 1.3em;
                margin: 4px;
                cursor: pointer;
                padding: 2px;
                border-radius: 4px;
            }

            .dual-chatbot-emoji-option:hover {
                background: #f0f0f0;
            }

            #dual-chatbot-color-picker {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 16px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
                z-index: 1000001;
                display: none;
                max-width: 420px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
            }

            #dual-chatbot-color-picker.active {
                display: block;
            }

            .dual-chatbot-color-picker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
            }

            .dual-chatbot-color-picker-header h3 {
                margin: 0;
                font-size: 1.1em;
                color: #000000;
            }

            .dual-chatbot-color-section {
                margin-bottom: 16px;
            }

            .dual-chatbot-color-section h4 {
                margin: 0 0 8px 0;
                color: #333;
                font-size: 0.9em;
                padding-bottom: 4px;
                border-bottom: 1px solid #eee;
            }

            .dual-chatbot-color-option {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .dual-chatbot-color-option label {
                margin-left: 8px;
                font-size: 0.85em;
                flex: 1;
                color: #000000;
            }

            .dual-chatbot-color-option input {
                width: 28px;
                height: 28px;
                border: 2px solid #ddd;
                cursor: pointer;
                border-radius: 4px;
            }

            .dual-chatbot-opacity-buttons {
                display: flex;
                gap: 8px;
                margin: 12px 0;
                padding: 12px;
                background: #f8f8f8;
                border-radius: 8px;
            }

            .dual-chatbot-opacity-button {
                flex: 1;
                padding: 8px;
                border: 2px solid #ccc;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .dual-chatbot-opacity-button.active {
                border-color: var(--accent);
                background: rgba(255, 215, 0, 0.1);
                box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
            }

            .dual-chatbot-color-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #eee;
            }

            #dual-chatbot-file-modal {
                display: none;
                position: fixed;
                z-index: 1000000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }

            #dual-chatbot-file-modal-content {
                background-color: #fefefe;
                margin: 30% auto;
                padding: 16px;
                border: 1px solid #888;
                width: 80%;
                max-width: 350px;
                border-radius: 10px;
                text-align: center;
            }

            #dual-chatbot-file-sender-selector {
                margin: 12px 0;
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            #dual-chatbot-file-sender-selector button {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
            }

            #dual-chatbot-file-sender-selector button.selected {
                background: var(--accent);
                border-color: ${currentMode === "normal" ? COLORS.header.normalTo : currentMode === "senko" ? COLORS.header.senkoTo : COLORS.header.allTo};
            }

            #dual-chatbot-modal-buttons {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 12px;
            }

            #dual-chatbot-modal-buttons button {
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
            }

            .dual-chatbot-btn {
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #ccc;
                background: #f0f0f0;
                cursor: pointer;
                font-weight: 500;
                color: #000000;
            }

            .dual-chatbot-btn:hover {
                background: #e0e0e0;
            }

            #dual-chatbot-help-modal {
                display: none;
                position: fixed;
                z-index: 1000002;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
            }

            #dual-chatbot-help-content {
                background-color: var(--panel-bg);
                margin: 20px auto;
                padding: 0;
                border-radius: 10px;
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 600px;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            #dual-chatbot-help-header {
                background: ${headerGradient};
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
            }

            #dual-chatbot-help-header h2 {
                margin: 0;
                font-size: 1.2em;
            }

            #dual-chatbot-help-close {
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5em;
                cursor: pointer;
                padding: 4px 8px;
                line-height: 1;
            }

            #dual-chatbot-help-close:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            #dual-chatbot-help-body {
                padding: 16px;
                overflow-y: auto;
                flex: 1;
                color: #000000;
            }

            .dual-chatbot-help-section {
                margin-bottom: 20px;
            }

            .dual-chatbot-help-section h3 {
                color: #000000;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid #eee;
                font-size: 1.05em;
            }

            .dual-chatbot-help-section ul {
                margin: 0;
                padding-left: 20px;
            }

            .dual-chatbot-help-section li {
                margin-bottom: 6px;
                font-size: 0.9em;
                line-height: 1.4;
                color: #000000;
            }

            #dual-chatbot-mode-modal {
                display: none;
                position: fixed;
                z-index: 1000003;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
            }

            #dual-chatbot-mode-content {
                background-color: var(--panel-bg);
                margin: 20% auto;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 400px;
                text-align: center;
            }

            #dual-chatbot-mode-content h3 {
                margin-top: 0;
                color: #000000;
            }

            #dual-chatbot-mode-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }

            .dual-chatbot-mode-option {
                padding: 12px;
                border: 2px solid var(--mode-button-bg);
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 1em;
                font-weight: 500;
                color: #000000;
                transition: all 0.2s;
            }

            .dual-chatbot-mode-option:hover {
                background: rgba(255, 105, 180, 0.1);
                border-color: var(--mode-button-bg);
            }

            #dual-chatbot-mode-close {
                margin-top: 15px;
                padding: 8px 16px;
                background: #f0f0f0;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }

            @media (max-width: 768px) {
                #dual-chatbot-container {
                    width: 95vw;
                    height: 60vh;
                    bottom: 10px;
                    right: 10px;
                    max-width: 95vw !important;
                    max-height: 80vh !important;
                }
                #dual-chatbot-emoji-picker {
                    bottom: 60px;
                    right: 10px;
                    max-width: 250px;
                }
                #dual-chatbot-color-picker {
                    max-width: 95vw;
                    width: 95%;
                }
                #dual-chatbot-header h1 {
                    font-size: 1em;
                }
                #dual-chatbot-help-content,
                #dual-chatbot-mode-content {
                    width: 95%;
                    margin: 10px auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // 💾 SALVARE / ÎNCĂRCARE SETĂRI
    // ============================================
    function saveSettings() {
        try {
            GM_setValue('dualChatbotSettings', JSON.stringify({
                position: position,
                size: size,
                colors: COLORS,
                selectedAvatars: selectedAvatars,
                currentMode: currentMode,
                messageOpacity: messageOpacity
            }));
        } catch (e) {
            console.error("Nu se pot salva setările:", e);
        }
    }

    function loadSettings() {
        try {
            const saved = GM_getValue('dualChatbotSettings', null);
            if (saved) {
                const settings = JSON.parse(saved);
                position = settings.position || position;
                size = settings.size || size;
                COLORS = settings.colors || COLORS;
                selectedAvatars = settings.selectedAvatars || selectedAvatars;
                currentMode = settings.currentMode || currentMode;
                messageOpacity = settings.messageOpacity || messageOpacity;
            }
        } catch (e) {
            console.error("Nu se pot încărca setările:", e);
        }
    }

    // ============================================
    // 🔄 FUNCȚIE PENTRU SCHIMARE MOD
    // ============================================
    function setMode(newMode) {
        currentMode = newMode;
        messages = [];
        regenerateCSS();
        saveSettings();
        updateHeader();

        setTimeout(() => {
            if (currentMode === "normal") {
                addMessage(REM_NAME, getRandom(GREETINGS[REM_NAME]));
                setTimeout(() => {
                    addMessage(RAM_NAME, getRandom(GREETINGS[RAM_NAME]));
                }, 1000);
            } else if (currentMode === "senko") {
                addMessage(SENKO_NAME, getRandom(GREETINGS[SENKO_NAME]));
            } else if (currentMode === "all") {
                addMessage(REM_NAME, getRandom(GREETINGS[REM_NAME]));
                setTimeout(() => {
                    addMessage(RAM_NAME, getRandom(GREETINGS[RAM_NAME]));
                    setTimeout(() => {
                        addMessage(SENKO_NAME, getRandom(GREETINGS[SENKO_NAME]));
                    }, 500);
                }, 500);
            }
        }, 500);

        modeModal.style.display = 'none';
    }

    // ============================================
    // 🎨 SCHIMBĂ OPACITATEA MESAJELOR
    // ============================================
    function setMessageOpacity(opacity) {
        messageOpacity = opacity;
        regenerateCSS();
        saveSettings();
        renderMessages();

        document.querySelectorAll('.dual-chatbot-opacity-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.opacity === opacity) {
                btn.classList.add('active');
            }
        });
    }

    // ============================================
    // 📝 REGULI PENTRU RĂSPUNSURI (MOD NORMAL)
    // ============================================
    function handleNormalCommand(command) {
        const cmd = command.toLowerCase().trim();

        if (cmd === "sterge mesaje") {
            messages = [];
            renderMessages();
            return true;
        }

        if (cmd === "q1") {
            q1Mode = !q1Mode;
            const status = q1Mode ? "activat" : "dezactivat";
            addMessage(REM_NAME, `Modul restrâns a fost ${status}.`);
            return true;
        }

        if (cmd.startsWith("qq ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(REM_NAME, msg);
            return true;
        }

        if (cmd.startsWith("qw ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(RAM_NAME, msg);
            return true;
        }

        if (cmd === "!danu" || cmd === "!nuda") {
            if (q1Mode) return true;
            addMessage(getRandom([REM_NAME, RAM_NAME]), getRandom(["da", "nu"]));
            return true;
        }

        if (cmd.startsWith("phf ")) {
            if (q1Mode) return true;
            const choice = cmd.substring(4).toLowerCase();
            const validChoices = ["piatra", "hartie", "foarfeca"];
            if (!validChoices.includes(choice)) {
                addMessage(getRandom([REM_NAME, RAM_NAME]), "Te rog alege între: Piatra, Hartie sau Foarfeca.");
                return true;
            }

            const botChoice = getRandom(["piatra", "hartie", "foarfeca"]);
            const bot = getRandom([REM_NAME, RAM_NAME]);
            const emojiMap = { piatra: "🪨", hartie: "📄", foarfeca: "✂️" };
            addMessage(bot, `Am ales: ${botChoice} ${emojiMap[botChoice]}`);

            setTimeout(() => {
                const rules = {
                    piatra: { beats: "foarfeca", losesTo: "hartie" },
                    hartie: { beats: "piatra", losesTo: "foarfeca" },
                    foarfeca: { beats: "hartie", losesTo: "piatra" }
                };

                if (choice === botChoice) {
                    addMessage("Sistem", `Remiză! Ambele au ales ${botChoice} ${emojiMap[botChoice]}`);
                } else if (rules[choice].beats === botChoice) {
                    addMessage("Sistem", `${USER_NAME} câștigă! ${emojiMap[choice]} bate ${emojiMap[botChoice]}`);
                } else {
                    addMessage("Sistem", `${bot} câștigă! ${emojiMap[botChoice]} bate ${emojiMap[choice]}`);
                }
            }, 1000);
            return true;
        }

        if (cmd === "mod-senkosan") {
            setMode("senko");
            return true;
        }

        if (cmd === "mod-all") {
            setMode("all");
            return true;
        }

        if (cmd === "mod-normal") {
            setMode("normal");
            return true;
        }

        return false;
    }

    // ============================================
    // 📝 REGULI PENTRU RĂSPUNSURI (MOD SENKO)
    // ============================================
    function handleSenkoCommand(command) {
        const cmd = command.toLowerCase().trim();

        if (cmd === "sterge mesaje" || cmd === "ștergere mesaje") {
            messages = [];
            renderMessages();
            return true;
        }

        if (cmd === "mod-normal") {
            setMode("normal");
            return true;
        }

        if (cmd === "mod-all") {
            setMode("all");
            return true;
        }

        if (cmd === "mod-senkosan") {
            setMode("senko");
            return true;
        }

        if (cmd === "anime") {
            const animeTitles = ["Naruto", "One Piece", "Bleach", "Attack on Titan", "Death Note", "Fullmetal Alchemist: Brotherhood"];
            addMessage(SENKO_NAME, getRandom(animeTitles));
            return true;
        }

        if (cmd === "poze anime") {
            const animeImages = [`https://i.waifu.pics/${getRandom(["waifu", "neko", "shinobu", "megumin"])}/${Math.floor(Math.random() * 100) + 1}.jpg`];
            addMessage(SENKO_NAME, getRandom(animeImages), true, true);
            return true;
        }

        if (cmd === "poza ta") {
            addMessage(SENKO_NAME, selectedAvatars[SENKO_NAME] + '?v=' + Date.now(), true, true);
            return true;
        }

        if (cmd === "zar") {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            addMessage(SENKO_NAME, diceRoll === 6 ? `Am dat ${diceRoll}! Norocul tău e și al meu! 🎉❤️` : `Am dat ${diceRoll}! ${diceRoll > 3 ? 'Norocos!' : 'Mai încearcă!'}`);
            return true;
        }

        if (cmd.startsWith("phf ")) {
            const userChoice = cmd.substring(4).toLowerCase();
            const validChoices = ["piatră", "hârtie", "foarfecă", "piatra", "hartie", "foarfeca"];
            if (!validChoices.includes(userChoice)) {
                addMessage(SENKO_NAME, "Te rog alege între: Piatra, Hartie sau Foarfeca.");
                return true;
            }

            let normalizedChoice;
            if (userChoice.includes("piatr")) normalizedChoice = "piatra";
            else if (userChoice.includes("hart")) normalizedChoice = "hartie";
            else if (userChoice.includes("foarfec")) normalizedChoice = "foarfeca";

            const options = ['piatra', 'hartie', 'foarfeca'];
            const senkoChoice = options[Math.floor(Math.random() * options.length)];
            const emojiMap = { piatra: "🪨", hartie: "📄", foarfeca: "✂️" };

            if (normalizedChoice === senkoChoice) {
                addMessage(SENKO_NAME, `Am ales și eu ${senkoChoice}! Remiză! 🥺 *te îmbrățișez* 🤗`);
            } else if (
                (normalizedChoice === 'piatra' && senkoChoice === 'foarfeca') ||
                (normalizedChoice === 'hartie' && senkoChoice === 'piatra') ||
                (normalizedChoice === 'foarfeca' && senkoChoice === 'hartie')
            ) {
                addMessage(SENKO_NAME, `Am ales ${senkoChoice}... Ai câștigat! 😢 *plânge* Dar te iubesc oricum! ❤️`);
            } else {
                addMessage(SENKO_NAME, `Am ales ${senkoChoice}! Am câștigat... 😭 *mă simt vinovată* Dar ești cel mai important pentru mine!`);
            }
            return true;
        }

        if (cmd === "da sau ba?") {
            addMessage(SENKO_NAME, getRandom(["da", "nu", "ba", "poate"]));
            return true;
        }

        if (cmd === "qdn") {
            addMessage(SENKO_NAME, getRandom(["Da", "Nu"]));
            return true;
        }

        if (cmd.startsWith("qq ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(SENKO_NAME, msg);
            if (messages.length >= 2) {
                messages.splice(messages.length - 2, 1);
                renderMessages();
            }
            return true;
        }

        return false;
    }

    // ============================================
    // 📝 REGULI PENTRU RĂSPUNSURI (MOD TOȚI TREI)
    // ============================================
    function handleAllModeCommand(command) {
        const cmd = command.toLowerCase().trim();

        if (cmd === "sterge mesaje") {
            messages = [];
            renderMessages();
            return true;
        }

        if (cmd === "q1") {
            q1Mode = !q1Mode;
            const status = q1Mode ? "activat" : "dezactivat";
            addMessage(REM_NAME, `Modul restrâns a fost ${status}.`);
            return true;
        }

        if (cmd.startsWith("qq ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(REM_NAME, msg);
            return true;
        }

        if (cmd.startsWith("qw ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(RAM_NAME, msg);
            return true;
        }

        if (cmd.startsWith("qe ")) {
            if (q1Mode) return true;
            const msg = cmd.substring(3);
            addMessage(SENKO_NAME, msg);
            return true;
        }

        if (cmd === "!danu" || cmd === "!nuda") {
            if (q1Mode) return true;
            addMessage(getRandom([REM_NAME, RAM_NAME, SENKO_NAME]), getRandom(["da", "nu"]));
            return true;
        }

        if (cmd.startsWith("phf ")) {
            if (q1Mode) return true;
            const choice = cmd.substring(4).toLowerCase();
            const validChoices = ["piatra", "hartie", "foarfeca"];
            if (!validChoices.includes(choice)) {
                addMessage(getRandom([REM_NAME, RAM_NAME, SENKO_NAME]), "Te rog alege între: Piatra, Hartie sau Foarfeca.");
                return true;
            }

            const bot = getRandom([REM_NAME, RAM_NAME, SENKO_NAME]);
            const botChoice = getRandom(["piatra", "hartie", "foarfeca"]);
            const emojiMap = { piatra: "🪨", hartie: "📄", foarfeca: "✂️" };
            addMessage(bot, `Am ales: ${botChoice} ${emojiMap[botChoice]}`);

            setTimeout(() => {
                const rules = {
                    piatra: { beats: "foarfeca", losesTo: "hartie" },
                    hartie: { beats: "piatra", losesTo: "foarfeca" },
                    foarfeca: { beats: "hartie", losesTo: "piatra" }
                };

                if (choice === botChoice) {
                    addMessage("Sistem", `Remiză! Ambele au ales ${botChoice} ${emojiMap[botChoice]}`);
                } else if (rules[choice].beats === botChoice) {
                    addMessage("Sistem", `${USER_NAME} câștigă! ${emojiMap[choice]} bate ${emojiMap[botChoice]}`);
                } else {
                    addMessage("Sistem", `${bot} câștigă! ${emojiMap[botChoice]} bate ${emojiMap[choice]}`);
                }
            }, 1000);
            return true;
        }

        if (cmd === "mod-normal") {
            setMode("normal");
            return true;
        }

        if (cmd === "mod-senkosan") {
            setMode("senko");
            return true;
        }

        return false;
    }

    // ============================================
    // 💬 GENERARE RĂSPUNSURI AUTOMATE
    // ============================================
    function generateNormalResponse(message) {
        if (q1Mode) return;

        const bot = getRandom([REM_NAME, RAM_NAME]);
        const responses = {
            [REM_NAME]: [
                `Ah, ${USER_NAME}-chan... ${message}? Ce frumos sună asta. 💙`,
                `Sora mea Ram ar spune că ești adorabil. Eu sunt de acord. ❤️`
            ],
            [RAM_NAME]: [
                `Hei, ${USER_NAME}... ${message}? Ram te ascultă mereu. 💖`,
                `Rem e puțin timidă, dar eu nu! Sunt aici pentru tine. 😘`
            ]
        };

        setTimeout(() => {
            addMessage(bot, getRandom(responses[bot]));
        }, 1000 + Math.random() * 2000);
    }

    function generateSenkoResponse(message) {
        if (q1Mode) return;

        const lowerMessage = message.toLowerCase();
        const badWords = ['prost', 'idiot', 'esti curva'];
        if (badWords.some(word => lowerMessage.includes(word))) {
            setTimeout(() => {
                addMessage(SENKO_NAME, "😢💔 *te iubesc oricum* Nu mă părăsi, te rog... ❤️");
            }, 1000);
            return;
        }

        const positiveWords = ['mulțumesc', 'mersi', 'te ador', 'te iubesc'];
        if (positiveWords.some(word => lowerMessage.includes(word))) {
            setTimeout(() => {
                addMessage(SENKO_NAME, `*te îmbrățișez strâns* ${getRandom(['❤️', '💖', '😘'])} Ești totul pentru mine!`);
            }, 1000);
            return;
        }

        setTimeout(() => {
            addMessage(SENKO_NAME, getRandom([
                `Ah, ${USER_NAME}-chan... ${message}? Ce frumos sună asta. 💖`,
                `Sunt aici pentru tine, mereu. 😊`
            ]));
        }, 1000 + Math.random() * 2000);
    }

    function generateAllModeResponse(message) {
        if (q1Mode) return;

        const bot = getRandom([REM_NAME, RAM_NAME, SENKO_NAME]);
        const responses = {
            [REM_NAME]: [
                `Ah, ${USER_NAME}-chan... ${message}? Ce frumos sună asta. 💙`,
                `Sora mea Ram și Senko San ar spune că ești adorabil. ❤️`
            ],
            [RAM_NAME]: [
                `Hei, ${USER_NAME}... ${message}? Ram și prietenii te ascultă mereu. 💖`,
                `Rem și Senko San sunt puțin timide, dar eu nu! 😘`
            ],
            [SENKO_NAME]: [
                `Ah, ${USER_NAME}-chan... ${message}? Ce frumos sună asta. 💖`,
                `Rem și Ram sunt minunate, dar tu ești cel mai important. 🌸`
            ]
        };

        setTimeout(() => {
            addMessage(bot, getRandom(responses[bot]));
        }, 1000 + Math.random() * 2000);
    }

    // ============================================
    // 📱 FUNCȚII PENTRU TOUCH (ANDROID)
    // ============================================
    function handleTouchDragStart(e) {
        if (e.target.closest('.dual-chatbot-header-button')) return;

        isDragging = true;
        const touchPos = getTouchPos(e);
        dragStartX = touchPos.clientX;
        dragStartY = touchPos.clientY;
        const rect = container.getBoundingClientRect();
        const offsetX = dragStartX - rect.left;
        const offsetY = dragStartY - rect.top;

        function moveWindow(e) {
            if (!isDragging) return;
            e.preventDefault();
            const pos = getTouchPos(e);
            position.x = Math.max(8, window.innerWidth - (pos.clientX - offsetX) - rect.width);
            position.y = Math.max(8, window.innerHeight - (pos.clientY - offsetY) - rect.height);
            container.style.right = `${position.x}px`;
            container.style.bottom = `${position.y}px`;
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('touchmove', moveWindow);
            document.removeEventListener('touchend', stopDrag);
            document.removeEventListener('mousemove', moveWindow);
            document.removeEventListener('mouseup', stopDrag);
            saveSettings();
        }

        document.addEventListener('touchmove', moveWindow, { passive: false });
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('mousemove', moveWindow);
        document.addEventListener('mouseup', stopDrag);
    }

    function handleTouchResizeStart(e) {
        e.stopPropagation();
        isResizing = true;
        const touchPos = getTouchPos(e);
        resizeStartX = touchPos.clientX;
        resizeStartY = touchPos.clientY;
        const rect = container.getBoundingClientRect();
        resizeStartWidth = rect.width;
        resizeStartHeight = rect.height;

        function resizeWindow(e) {
            if (!isResizing) return;
            e.preventDefault();
            const pos = getTouchPos(e);
            const newWidth = resizeStartWidth + (pos.clientX - resizeStartX);
            const newHeight = resizeStartHeight + (pos.clientY - resizeStartY);
            size.width = `${Math.max(newWidth, 250)}px`;
            size.height = `${Math.max(newHeight, 300)}px`;
            container.style.width = size.width;
            container.style.height = size.height;
            if (messagesPanel) {
                messagesPanel.style.maxHeight = `calc(${parseInt(size.height)}px - 140px)`;
            }
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('touchmove', resizeWindow);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('mousemove', resizeWindow);
            document.removeEventListener('mouseup', stopResize);
            saveSettings();
        }

        document.addEventListener('touchmove', resizeWindow, { passive: false });
        document.addEventListener('touchend', stopResize);
        document.addEventListener('mousemove', resizeWindow);
        document.addEventListener('mouseup', stopResize);
    }

    // ============================================
    // 📤 SETUP DRAG & DROP
    // ============================================
    function setupDragAndDrop() {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.border = '2px dashed ' + COLORS.accent;
        });

        container.addEventListener('dragleave', () => {
            container.style.border = '1px solid #ddd';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.border = '1px solid #ddd';
            const file = e.dataTransfer.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const isImage = file.type.startsWith('image/');
                    addMessage(fileSender, e.target.result, true, isImage);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ============================================
    // 🏗️ CREARE ELEMENTE DOM
    // ============================================
    function createDOM() {
        container = document.createElement('div');
        container.id = 'dual-chatbot-container';

        header = document.createElement('div');
        header.id = 'dual-chatbot-header';

        const headerLeft = document.createElement('div');
        headerLeft.id = 'dual-chatbot-header-left';

        updateHeaderAvatars(headerLeft);

        const headerRight = document.createElement('div');
        headerRight.id = 'dual-chatbot-header-right';

        const modeButton = document.createElement('button');
        modeButton.className = 'dual-chatbot-header-button dual-chatbot-mode-button';
        modeButton.textContent = '👥';
        modeButton.title = 'Schimbă modul';

        const fileButtonHeader = document.createElement('button');
        fileButtonHeader.className = 'dual-chatbot-header-button';
        fileButtonHeader.textContent = '📁';
        fileButtonHeader.title = 'Încarcă fișier/poză';

        const colorButton = document.createElement('button');
        colorButton.className = 'dual-chatbot-header-button';
        colorButton.textContent = '🌸';
        colorButton.title = 'Schimbă culorile';

        const helpButton = document.createElement('button');
        helpButton.className = 'dual-chatbot-header-button';
        helpButton.textContent = 'ℹ️';
        helpButton.title = 'Ajutor și informații';

        const closeButton = document.createElement('button');
        closeButton.className = 'dual-chatbot-header-button';
        closeButton.textContent = '×';
        closeButton.title = 'Închide chatul definitiv';

        headerRight.appendChild(modeButton);
        headerRight.appendChild(fileButtonHeader);
        headerRight.appendChild(colorButton);
        headerRight.appendChild(helpButton);
        headerRight.appendChild(closeButton);

        header.appendChild(headerLeft);
        header.appendChild(headerRight);

        messagesPanel = document.createElement('div');
        messagesPanel.id = 'dual-chatbot-messages-panel';

        inputPanel = document.createElement('div');
        inputPanel.id = 'dual-chatbot-input-panel';

        const emojiButton = document.createElement('button');
        emojiButton.className = 'dual-chatbot-button dual-chatbot-emoji-button';
        emojiButton.textContent = '😊';
        emojiButton.title = 'Selectează emoji';

        const messageInput = document.createElement('input');
        messageInput.id = 'dual-chatbot-message-input';
        messageInput.type = 'text';
        messageInput.placeholder = 'Scrie un mesaj...';
        messageInput.autocomplete = 'off';

        const sendButton = document.createElement('button');
        sendButton.className = 'dual-chatbot-button';
        sendButton.textContent = 'Trimite';

        inputPanel.appendChild(emojiButton);
        inputPanel.appendChild(messageInput);
        inputPanel.appendChild(sendButton);

        resizeHandle = document.createElement('div');
        resizeHandle.className = 'dual-chatbot-resize-handle';
        resizeHandle.id = 'dual-chatbot-resize-handle';

        container.appendChild(header);
        container.appendChild(messagesPanel);
        container.appendChild(inputPanel);
        container.appendChild(resizeHandle);

        // --- EMOJI PICKER ---
        emojiPicker = document.createElement('div');
        emojiPicker.id = 'dual-chatbot-emoji-picker';

        const categories = {
            "Emoji-uri populare": EMOJIS.slice(0, 20),
            "Cercuri colorate": EMOJIS.slice(20, 30),
            "Semne de circulație": EMOJIS.slice(30, 40),
            "Steaguri": EMOJIS.slice(40)
        };

        for (const [category, emojis] of Object.entries(categories)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'dual-chatbot-emoji-category';
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category;
            categoryDiv.appendChild(categoryTitle);

            emojis.forEach(emoji => {
                const emojiOption = document.createElement('span');
                emojiOption.className = 'dual-chatbot-emoji-option';
                emojiOption.textContent = emoji;
                emojiOption.addEventListener('click', () => {
                    messageInput.value += emoji;
                    messageInput.focus();
                    emojiPicker.classList.remove('active');
                });
                categoryDiv.appendChild(emojiOption);
            });
            emojiPicker.appendChild(categoryDiv);
        }

        // --- COLOR PICKER ---
        colorPicker = document.createElement('div');
        colorPicker.id = 'dual-chatbot-color-picker';

        const colorPickerHeader = document.createElement('div');
        colorPickerHeader.className = 'dual-chatbot-color-picker-header';
        const colorPickerTitle = document.createElement('h3');
        colorPickerTitle.textContent = '🎨 Personalizează Culorile';
        const colorPickerClose = document.createElement('button');
        colorPickerClose.className = 'dual-chatbot-btn';
        colorPickerClose.textContent = '×';
        colorPickerHeader.appendChild(colorPickerTitle);
        colorPickerHeader.appendChild(colorPickerClose);

        // Secțiuni culori (fundal, nume, alte culori)
        const sections = [
            {
                title: '🎨 Culori Fundal Mesaje',
                options: [
                    { id: 'rem-bg', label: 'Rem - Fundal', value: COLORS.rem.bg },
                    { id: 'rem-text', label: 'Rem - Text', value: COLORS.rem.text },
                    { id: 'ram-bg', label: 'Ram - Fundal', value: COLORS.ram.bg },
                    { id: 'ram-text', label: 'Ram - Text', value: COLORS.ram.text },
                    { id: 'senko-bg', label: 'Senko - Fundal', value: COLORS.senko.bg },
                    { id: 'senko-text', label: 'Senko - Text', value: COLORS.senko.text },
                    { id: 'user-bg', label: 'User - Fundal', value: COLORS.user.bg },
                    { id: 'user-text', label: 'User - Text', value: COLORS.user.text }
                ]
            },
            {
                title: '👤 Culori Nume Mesaje',
                options: [
                    { id: 'rem-name', label: 'Rem - Nume', value: COLORS.rem.name },
                    { id: 'ram-name', label: 'Ram - Nume', value: COLORS.ram.name },
                    { id: 'senko-name', label: 'Senko - Nume', value: COLORS.senko.name },
                    { id: 'user-name', label: 'User - Nume', value: COLORS.user.name }
                ]
            },
            {
                title: '🎭 Transparență Fundal Mesaje',
                type: 'opacity',
                buttons: [
                    { id: 'solid', label: 'Solid', value: 'solid' },
                    { id: 'semi-transparent', label: 'Semi-Transparent', value: 'semi-transparent' },
                    { id: 'transparent', label: 'Transparent', value: 'transparent' }
                ]
            },
            {
                title: '🎨 Alte Culori',
                options: [
                    { id: 'chat-bg', label: 'Fundal Chat', value: COLORS.chatBg },
                    { id: 'input-bg', label: 'Input - Fundal', value: COLORS.input.bg },
                    { id: 'input-text', label: 'Input - Text', value: COLORS.input.text },
                    { id: 'panel-bg', label: 'Panou - Fundal', value: COLORS.panelBg },
                    { id: 'accent', label: 'Culoare Accent', value: COLORS.accent },
                    { id: 'mode-button-bg', label: 'Buton Mod - Fundal', value: COLORS.modeButtonBg }
                ]
            }
        ];

        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'dual-chatbot-color-section';
            const sectionTitle = document.createElement('h4');
            sectionTitle.textContent = section.title;
            sectionDiv.appendChild(sectionTitle);

            if (section.type === 'opacity') {
                const opacityButtonsContainer = document.createElement('div');
                opacityButtonsContainer.className = 'dual-chatbot-opacity-buttons';
                section.buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.className = 'dual-chatbot-opacity-button';
                    button.textContent = btn.label;
                    button.dataset.opacity = btn.value;
                    if (messageOpacity === btn.value) button.classList.add('active');
                    button.addEventListener('click', () => setMessageOpacity(btn.value));
                    opacityButtonsContainer.appendChild(button);
                });
                sectionDiv.appendChild(opacityButtonsContainer);
            } else {
                section.options.forEach(option => {
                    const colorOptionDiv = document.createElement('div');
                    colorOptionDiv.className = 'dual-chatbot-color-option';
                    const colorInput = document.createElement('input');
                    colorInput.type = 'color';
                    colorInput.id = option.id;
                    colorInput.value = option.value;
                    const colorLabel = document.createElement('label');
                    colorLabel.htmlFor = option.id;
                    colorLabel.textContent = option.label;
                    colorOptionDiv.appendChild(colorInput);
                    colorOptionDiv.appendChild(colorLabel);
                    sectionDiv.appendChild(colorOptionDiv);
                });
            }
            colorPicker.appendChild(sectionDiv);
        });

        const colorActions = document.createElement('div');
        colorActions.className = 'dual-chatbot-color-actions';
        const applyColorsButton = document.createElement('button');
        applyColorsButton.className = 'dual-chatbot-btn';
        applyColorsButton.textContent = 'Aplică Culorile';
        applyColorsButton.style.backgroundColor = COLORS.accent;
        const cancelColorsButton = document.createElement('button');
        cancelColorsButton.className = 'dual-chatbot-btn';
        cancelColorsButton.textContent = 'Anulează';
        const resetColorsButton = document.createElement('button');
        resetColorsButton.className = 'dual-chatbot-btn';
        resetColorsButton.textContent = 'Resetare';
        colorActions.appendChild(cancelColorsButton);
        colorActions.appendChild(resetColorsButton);
        colorActions.appendChild(applyColorsButton);
        colorPicker.appendChild(colorPickerHeader);
        colorPicker.appendChild(colorActions);

        // --- FILE MODAL ---
        fileModal = document.createElement('div');
        fileModal.id = 'dual-chatbot-file-modal';
        const fileModalContent = document.createElement('div');
        fileModalContent.id = 'dual-chatbot-file-modal-content';
        const fileModalTitle = document.createElement('h3');
        fileModalTitle.textContent = '📁 Încarcă fișier/poză';
        const fileModalText = document.createElement('p');
        fileModalText.textContent = 'Selectează cine trimite:';
        const fileSenderSelector = document.createElement('div');
        fileSenderSelector.id = 'dual-chatbot-file-sender-selector';
        const fileInputLabel = document.createElement('p');
        fileInputLabel.textContent = 'Selectează fișierul:';
        fileInputLabel.style.marginTop = '10px';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'dual-chatbot-file-input';
        fileInput.accept = 'image/*,.pdf,.txt';
        const modalButtons = document.createElement('div');
        modalButtons.id = 'dual-chatbot-modal-buttons';
        const cancelFileButton = document.createElement('button');
        cancelFileButton.className = 'dual-chatbot-btn';
        cancelFileButton.textContent = 'Anulează';
        const confirmFileButton = document.createElement('button');
        confirmFileButton.className = 'dual-chatbot-btn';
        confirmFileButton.textContent = 'Confirmă';
        confirmFileButton.style.background = COLORS.accent;
        confirmFileButton.style.color = '#000';
        modalButtons.appendChild(cancelFileButton);
        modalButtons.appendChild(confirmFileButton);
        fileModalContent.appendChild(fileModalTitle);
        fileModalContent.appendChild(fileModalText);
        fileModalContent.appendChild(fileSenderSelector);
        fileModalContent.appendChild(fileInputLabel);
        fileModalContent.appendChild(fileInput);
        fileModalContent.appendChild(modalButtons);
        fileModal.appendChild(fileModalContent);

        // --- HELP MODAL ---
        helpModal = document.createElement('div');
        helpModal.id = 'dual-chatbot-help-modal';
        const helpContent = document.createElement('div');
        helpContent.id = 'dual-chatbot-help-content';
        const helpHeader = document.createElement('div');
        helpHeader.id = 'dual-chatbot-help-header';
        const helpTitle = document.createElement('h2');
        helpTitle.id = 'dual-chatbot-help-title';
        helpTitle.textContent = HELP_INFO[currentMode].title;
        const helpClose = document.createElement('button');
        helpClose.id = 'dual-chatbot-help-close';
        helpClose.textContent = '×';
        helpHeader.appendChild(helpTitle);
        helpHeader.appendChild(helpClose);
        const helpBody = document.createElement('div');
        helpBody.id = 'dual-chatbot-help-body';
        HELP_INFO[currentMode].sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'dual-chatbot-help-section';
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = section.title;
            const sectionList = document.createElement('ul');
            section.content.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = item;
                sectionList.appendChild(listItem);
            });
            sectionDiv.appendChild(sectionTitle);
            sectionDiv.appendChild(sectionList);
            helpBody.appendChild(sectionDiv);
        });
        helpContent.appendChild(helpHeader);
        helpContent.appendChild(helpBody);
        helpModal.appendChild(helpContent);

        // --- MODE MODAL ---
        modeModal = document.createElement('div');
        modeModal.id = 'dual-chatbot-mode-modal';
        const modeContent = document.createElement('div');
        modeContent.id = 'dual-chatbot-mode-content';
        const modeTitle = document.createElement('h3');
        modeTitle.textContent = '🔄 Selectează Modul';
        const modeButtons = document.createElement('div');
        modeButtons.id = 'dual-chatbot-mode-buttons';
        const normalModeBtn = document.createElement('button');
        normalModeBtn.className = 'dual-chatbot-mode-option';
        normalModeBtn.textContent = `👫 ${CHAT_TITLE_NORMAL}`;
        normalModeBtn.addEventListener('click', () => setMode("normal"));
        const senkoModeBtn = document.createElement('button');
        senkoModeBtn.className = 'dual-chatbot-mode-option';
        senkoModeBtn.textContent = `🦊 ${CHAT_TITLE_SENKO}`;
        senkoModeBtn.addEventListener('click', () => setMode("senko"));
        const allModeBtn = document.createElement('button');
        allModeBtn.className = 'dual-chatbot-mode-option';
        allModeBtn.textContent = `👥 ${CHAT_TITLE_ALL}`;
        allModeBtn.addEventListener('click', () => setMode("all"));
        modeButtons.appendChild(normalModeBtn);
        modeButtons.appendChild(senkoModeBtn);
        modeButtons.appendChild(allModeBtn);
        const modeCloseBtn = document.createElement('button');
        modeCloseBtn.id = 'dual-chatbot-mode-close';
        modeCloseBtn.className = 'dual-chatbot-btn';
        modeCloseBtn.textContent = 'Închide';
        modeContent.appendChild(modeTitle);
        modeContent.appendChild(modeButtons);
        modeContent.appendChild(modeCloseBtn);
        modeModal.appendChild(modeContent);

        document.body.appendChild(container);
        document.body.appendChild(emojiPicker);
        document.body.appendChild(colorPicker);
        document.body.appendChild(fileModal);
        document.body.appendChild(helpModal);
        document.body.appendChild(modeModal);

        return {
            messageInput,
            sendButton,
            emojiButton,
            modeButton,
            fileButtonHeader,
            colorButton,
            helpButton,
            closeButton,
            colorPickerClose,
            cancelFileButton,
            confirmFileButton,
            fileInput,
            applyColorsButton,
            cancelColorsButton,
            resetColorsButton,
            helpClose,
            modeCloseBtn,
            fileSenderSelector
        };
    }

    // ============================================
    // 🔄 FUNCȚII PENTRU ACTUALIZARE HEADER
    // ============================================
    function updateHeader() {
        const headerLeft = document.querySelector('#dual-chatbot-header-left');
        if (headerLeft) {
            headerLeft.innerHTML = '';
            updateHeaderAvatars(headerLeft);
        }
        updateHelpModal();
    }

    function updateHeaderAvatars(headerLeft) {
        const avatarsToShow = currentMode === "normal" ? [REM_NAME, RAM_NAME] :
                             currentMode === "senko" ? [SENKO_NAME] :
                             [REM_NAME, RAM_NAME, SENKO_NAME];

        avatarsToShow.forEach(name => {
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'dual-chatbot-header-avatar-container';

            const avatar = document.createElement('img');
            avatar.src = selectedAvatars[name] + '?v=' + Date.now(); // Cache-busting
            avatar.alt = name;
            avatar.className = 'avatar';
            avatar.crossOrigin = 'anonymous';
            avatarContainer.appendChild(avatar);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'dual-chatbot-header-name';
            nameSpan.textContent = name;
            avatarContainer.appendChild(nameSpan);

            headerLeft.appendChild(avatarContainer);
        });
    }

    // ============================================
    // 💬 FUNCȚII MESAJE
    // ============================================
    function addMessage(sender, content, isFile = false, isImage = false) {
        const message = {
            sender: sender,
            content: content,
            time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
            isFile: isFile,
            isImage: isImage
        };
        messages.push(message);
        if (messages.length > 100) messages.shift();
        renderMessages();
        scrollToBottom();
    }

    function renderMessages() {
        if (!messagesPanel) return;
        messagesPanel.innerHTML = '';
        messages.forEach((msg) => {
            if (currentMode === "normal" && msg.sender === SENKO_NAME) return;
            if (currentMode === "senko" && (msg.sender === REM_NAME || msg.sender === RAM_NAME)) return;

            const messageDiv = document.createElement('div');
            const senderClass = msg.sender === REM_NAME ? 'rem' :
                               msg.sender === RAM_NAME ? 'ram' :
                               msg.sender === SENKO_NAME ? 'senko' : 'user';
            messageDiv.className = `dual-chatbot-message ${senderClass}`;

            const avatarImg = document.createElement('img');
            avatarImg.src = selectedAvatars[msg.sender] + '?v=' + Date.now(); // Cache-busting
            avatarImg.alt = msg.sender;
            avatarImg.className = 'avatar';
            avatarImg.crossOrigin = 'anonymous';

            const messageContentWrapper = document.createElement('div');
            messageContentWrapper.className = 'dual-chatbot-message-content-wrapper';

            const messageContentDiv = document.createElement('div');
            messageContentDiv.className = 'dual-chatbot-message-content';

            const senderName = document.createElement('span');
            senderName.className = 'dual-chatbot-message-sender';
            senderName.textContent = msg.sender;
            messageContentWrapper.appendChild(senderName);

            if (msg.isFile) {
                if (msg.isImage) {
                    const imgPreview = document.createElement('img');
                    imgPreview.src = msg.content;
                    imgPreview.className = 'preview';
                    imgPreview.alt = 'Preview';
                    imgPreview.addEventListener('click', () => window.open(msg.content, '_blank'));
                    messageContentDiv.appendChild(imgPreview);
                } else {
                    const fileLink = document.createElement('a');
                    fileLink.href = msg.content;
                    fileLink.target = "_blank";
                    fileLink.textContent = "Fișier";
                    messageContentDiv.appendChild(fileLink);
                }
            } else {
                messageContentDiv.innerHTML = escapeHtml(msg.content);
            }

            const timeSpan = document.createElement('span');
            timeSpan.className = 'dual-chatbot-message-time';
            timeSpan.textContent = msg.time;
            messageContentDiv.appendChild(timeSpan);

            messageContentWrapper.appendChild(messageContentDiv);
            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(messageContentWrapper);
            messagesPanel.appendChild(messageDiv);
        });
    }

    function scrollToBottom() {
        if (messagesPanel) messagesPanel.scrollTop = messagesPanel.scrollHeight;
    }

    function applySizeToUI() {
        if (!container) return;
        container.style.width = size.width;
        container.style.height = size.height;
        if (messagesPanel) {
            messagesPanel.style.maxHeight = `calc(${parseInt(size.height) || 500}px - 140px)`;
        }
    }

    // ============================================
    // 🔄 FUNCȚIE PENTRU ACTUALIZARE PANOULUI DE AJUTOR
    // ============================================
    function updateHelpModal() {
        const helpTitle = document.getElementById('dual-chatbot-help-title');
        const helpBody = document.getElementById('dual-chatbot-help-body');

        if (helpTitle) helpTitle.textContent = HELP_INFO[currentMode].title;
        if (helpBody) {
            helpBody.innerHTML = '';
            HELP_INFO[currentMode].sections.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'dual-chatbot-help-section';
                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = section.title;
                const sectionList = document.createElement('ul');
                section.content.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = item;
                    sectionList.appendChild(listItem);
                });
                sectionDiv.appendChild(sectionTitle);
                sectionDiv.appendChild(sectionList);
                helpBody.appendChild(sectionDiv);
            });
        }
        regenerateCSS();
    }

    // ============================================
    // 🌍 VERIFICĂ DACĂ ESTE PAGINA DE CAUTARE
    // ============================================
    function isSearchEnginePage() {
        const url = window.location.href;
        return (
            url.includes("google.") ||
            url.includes("bing.") ||
            url.includes("yahoo.") ||
            url.includes("duckduckgo.com") ||
            url.includes("/search")
        );
    }

    // ============================================
    // 🚀 INITIALIZARE
    // ============================================
    function init() {
        const elements = createDOM();
        const messageInput = elements.messageInput;

        loadSettings();
        container.style.right = `${position.x}px`;
        container.style.bottom = `${position.y}px`;
        applySizeToUI();
        regenerateCSS();

        // Drag & Drop pentru header (desktop + touch)
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.dual-chatbot-header-button')) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = container.getBoundingClientRect();
            const offsetX = dragStartX - rect.left;
            const offsetY = dragStartY - rect.top;

            function moveWindow(e) {
                if (!isDragging) return;
                e.preventDefault();
                position.x = Math.max(8, window.innerWidth - (e.clientX - offsetX) - rect.width);
                position.y = Math.max(8, window.innerHeight - (e.clientY - offsetY) - rect.height);
                container.style.right = `${position.x}px`;
                container.style.bottom = `${position.y}px`;
            }

            function stopDrag() {
                isDragging = false;
                document.removeEventListener('mousemove', moveWindow);
                document.removeEventListener('mouseup', stopDrag);
                saveSettings();
            }

            document.addEventListener('mousemove', moveWindow);
            document.addEventListener('mouseup', stopDrag);
        });

        header.addEventListener('touchstart', handleTouchDragStart, { passive: false });

        // Trimitere mesaj (unificat)
        elements.sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                // Nu afișa mesajul user-ului pentru comenzi de tip qq/qw/qe
                if (!(message.startsWith("qq ") || message.startsWith("qw ") || message.startsWith("qe "))) {
                    addMessage(USER_NAME, message);
                }

                if (currentMode === "normal") {
                    if (handleNormalCommand(message)) {
                        messageInput.value = "";
                        return;
                    }
                    generateNormalResponse(message);
                } else if (currentMode === "senko") {
                    if (handleSenkoCommand(message)) {
                        messageInput.value = "";
                        return;
                    }
                    generateSenkoResponse(message);
                } else {
                    if (handleAllModeCommand(message)) {
                        messageInput.value = "";
                        return;
                    }
                    generateAllModeResponse(message);
                }
                messageInput.value = "";
            }
        });

        // Resize handle
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            const rect = container.getBoundingClientRect();
            resizeStartWidth = rect.width;
            resizeStartHeight = rect.height;

            function resizeWindow(e) {
                if (!isResizing) return;
                e.preventDefault();
                size.width = `${Math.max(resizeStartWidth + (e.clientX - resizeStartX), 250)}px`;
                size.height = `${Math.max(resizeStartHeight + (e.clientY - resizeStartY), 300)}px`;
                container.style.width = size.width;
                container.style.height = size.height;
                if (messagesPanel) {
                    messagesPanel.style.maxHeight = `calc(${parseInt(size.height)}px - 140px)`;
                }
            }

            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', resizeWindow);
                document.removeEventListener('mouseup', stopResize);
                saveSettings();
            }

            document.addEventListener('mousemove', resizeWindow);
            document.addEventListener('mouseup', stopResize);
        });

        resizeHandle.addEventListener('touchstart', handleTouchResizeStart, { passive: false });

        // Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') elements.sendButton.click();
        });

        // Butoane header
        elements.modeButton.addEventListener('click', () => {
            modeModal.style.display = 'block';
        });

        elements.fileButtonHeader.addEventListener('click', () => {
            const senders = currentMode === "normal" ? [USER_NAME, REM_NAME, RAM_NAME] :
                           currentMode === "senko" ? [USER_NAME, SENKO_NAME] :
                           [USER_NAME, REM_NAME, RAM_NAME, SENKO_NAME];

            elements.fileSenderSelector.innerHTML = '';
            senders.forEach(sender => {
                const senderButton = document.createElement('button');
                senderButton.textContent = sender;
                if (fileSender === sender) senderButton.classList.add('selected');
                senderButton.addEventListener('click', () => {
                    fileSender = sender;
                    elements.fileSenderSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                    senderButton.classList.add('selected');
                });
                elements.fileSenderSelector.appendChild(senderButton);
            });
            fileModal.style.display = 'block';
        });

        elements.colorButton.addEventListener('click', () => {
            colorPicker.classList.add('active');
        });

        elements.helpButton.addEventListener('click', () => {
            updateHelpModal();
            helpModal.style.display = 'block';
        });

        elements.closeButton.addEventListener('click', () => {
            container.remove();
            emojiPicker.remove();
            colorPicker.remove();
            fileModal.remove();
            helpModal.remove();
            modeModal.remove();
        });

        // File modal
        elements.cancelFileButton.addEventListener('click', () => {
            fileModal.style.display = 'none';
            elements.fileInput.value = '';
        });

        elements.confirmFileButton.addEventListener('click', () => {
            const file = elements.fileInput.files[0];
            if (file && fileSender) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const isImage = file.type.startsWith('image/');
                    addMessage(fileSender, e.target.result, true, isImage);
                    fileModal.style.display = 'none';
                    elements.fileInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        });

        // Color picker
        elements.colorPickerClose.addEventListener('click', () => colorPicker.classList.remove('active'));
        elements.cancelColorsButton.addEventListener('click', () => colorPicker.classList.remove('active'));

        elements.resetColorsButton.addEventListener('click', () => {
            COLORS = {
                rem: { bg: "#3498db", text: "#ffffff", name: "#000000" },
                ram: { bg: "#ff69b4", text: "#ffffff", name: "#000000" },
                senko: { bg: "#FFD700", text: "#000000", name: "#000000" },
                user: { bg: "#800080", text: "#ffffff", name: "#ffffff" },
                header: {
                    normalFrom: "#3498db",
                    normalTo: "#ff69b4",
                    senkoFrom: "#FFD700",
                    senkoTo: "#FFC107",
                    allFrom: "#9C27B0",
                    allTo: "#FFD700"
                },
                input: { bg: "#f5f5f5", text: "#000000" },
                chatBg: "#f9f9f9",
                panelBg: "#ffffff",
                accent: "#FFD700",
                modeButtonBg: "#ff69b4"
            };
            regenerateCSS();
            saveSettings();
            renderMessages();
        });

        elements.applyColorsButton.addEventListener('click', () => {
            // Culori fundal/text mesaje
            if (document.getElementById('rem-bg')) COLORS.rem.bg = document.getElementById('rem-bg').value;
            if (document.getElementById('rem-text')) COLORS.rem.text = document.getElementById('rem-text').value;
            if (document.getElementById('ram-bg')) COLORS.ram.bg = document.getElementById('ram-bg').value;
            if (document.getElementById('ram-text')) COLORS.ram.text = document.getElementById('ram-text').value;
            if (document.getElementById('senko-bg')) COLORS.senko.bg = document.getElementById('senko-bg').value;
            if (document.getElementById('senko-text')) COLORS.senko.text = document.getElementById('senko-text').value;
            if (document.getElementById('user-bg')) COLORS.user.bg = document.getElementById('user-bg').value;
            if (document.getElementById('user-text')) COLORS.user.text = document.getElementById('user-text').value;

            // Culori nume
            if (document.getElementById('rem-name')) COLORS.rem.name = document.getElementById('rem-name').value;
            if (document.getElementById('ram-name')) COLORS.ram.name = document.getElementById('ram-name').value;
            if (document.getElementById('senko-name')) COLORS.senko.name = document.getElementById('senko-name').value;
            if (document.getElementById('user-name')) COLORS.user.name = document.getElementById('user-name').value;

            // Alte culori
            if (document.getElementById('chat-bg')) COLORS.chatBg = document.getElementById('chat-bg').value;
            if (document.getElementById('input-bg')) COLORS.input.bg = document.getElementById('input-bg').value;
            if (document.getElementById('input-text')) COLORS.input.text = document.getElementById('input-text').value;
            if (document.getElementById('panel-bg')) COLORS.panelBg = document.getElementById('panel-bg').value;
            if (document.getElementById('accent')) COLORS.accent = document.getElementById('accent').value;
            if (document.getElementById('mode-button-bg')) COLORS.modeButtonBg = document.getElementById('mode-button-bg').value;

            regenerateCSS();
            elements.confirmFileButton.style.background = COLORS.accent;
            elements.applyColorsButton.style.backgroundColor = COLORS.accent;
            colorPicker.classList.remove('active');
            saveSettings();
            renderMessages();
        });

        // Modale
        elements.helpClose.addEventListener('click', () => helpModal.style.display = 'none');
        elements.modeCloseBtn.addEventListener('click', () => modeModal.style.display = 'none');

        // Închidere la click în afara modalelor
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== elements.emojiButton)
                emojiPicker.classList.remove('active');
            if (!colorPicker.contains(e.target) && e.target !== elements.colorButton)
                colorPicker.classList.remove('active');
        });

        fileModal.addEventListener('click', (e) => {
            if (e.target === fileModal) {
                fileModal.style.display = 'none';
                elements.fileInput.value = '';
            }
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.style.display = 'none';
        });

        modeModal.addEventListener('click', (e) => {
            if (e.target === modeModal) modeModal.style.display = 'none';
        });

        setupDragAndDrop();

        // Mesaje de întâmpinare
        setTimeout(() => {
            if (currentMode === "normal") {
                addMessage(REM_NAME, getRandom(GREETINGS[REM_NAME]));
                setTimeout(() => {
                    addMessage(RAM_NAME, getRandom(GREETINGS[RAM_NAME]));
                }, 1000);
            } else if (currentMode === "senko") {
                addMessage(SENKO_NAME, getRandom(GREETINGS[SENKO_NAME]));
            } else {
                addMessage(REM_NAME, getRandom(GREETINGS[REM_NAME]));
                setTimeout(() => {
                    addMessage(RAM_NAME, getRandom(GREETINGS[RAM_NAME]));
                    setTimeout(() => {
                        addMessage(SENKO_NAME, getRandom(GREETINGS[SENKO_NAME]));
                    }, 500);
                }, 500);
            }
        }, 500);

        // Închidere cu ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                emojiPicker.classList.remove('active');
                colorPicker.classList.remove('active');
                fileModal.style.display = 'none';
                helpModal.style.display = 'none';
                modeModal.style.display = 'none';
            }
        });
    }

    // ============================================
    // 🚀 PORNEȘTE APLICAȚIA
    // ============================================
    if (isSearchEnginePage()) {
        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }
    }
})();