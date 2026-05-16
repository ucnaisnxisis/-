// ==UserScript==
// @name         Local Chat Bot - Lucy/Nyus 4.4 (Customizat)
// @namespace    http://tampermonkey.net/
// @version      10.2
// @description  Chat cu Lucy și Nyu, cu iconiță mutabilă în stânga-jos, panou de culori întunecat și culori roz.
// @author       tester john (customizat)
// @match        *://*.google.com/*
// @match        *://*.bing.com/*
// @match        *://duckduckgo.com/*
// @match        *://*.yahoo.com/*
// @match        *://*.brave.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    // --- Host Allowlist ---
    const ALLOWED_HOSTS = [
        'www.google.com', 'google.com', 'www.bing.com', 'bing.com',
        'duckduckgo.com', 'www.duckduckgo.com',
        'search.yahoo.com', 'www.yahoo.com', 'yahoo.com',
        'search.brave.com', 'brave.com', 'www.brave.com'
    ];
    const ALLOW_SUBDOMAINS = true;

    function isSearchHost() {
        const host = location.hostname.toLowerCase();
        if (ALLOWED_HOSTS.includes(host)) return true;
        if (ALLOW_SUBDOMAINS) return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
        return false;
    }
    if (!isSearchHost()) return;

    // --- State ---
    let q1Mode = false;
    let isDraggingIcon = false;
    let isDraggingWindow = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let currentCharacter = GM_getValue('local_chat_bot_character', 2); // 1 = Lucy, 2 = Nyu (default: Nyu)
    const STORAGE_KEY_COLORS = 'local_chat_bot_colors_v11';
    const STORAGE_KEY_SIZE = 'local_chat_bot_size_v8';
    const STORAGE_KEY_ICON_POSITION = 'local_chat_bot_icon_position_v2';

    // --- Color Settings (Schimbat mov în roz) ---
    const colorDefaults = {
        windowBg: '#fff0f9', // Roz deschis
        headerGradientFrom: '#ff9acb', // Roz
        headerGradientTo: '#ff77b8', // Roz
        botBg: '#ff00a8', // Roz aprins
        botText: '#ffffff',
        userBg: '#ff69b4', // Roz închis
        userText: '#ffffff',
        bodyBg: '#fff0f9', // Roz deschis
        accent: '#ff4da6', // Roz accent
        botNameColor: '#ffffff',
        // Dark mode colors (întunecat + roz)
        darkWindowBg: '#2d1b2d', // Mov închis (pentru contrast)
        darkHeaderGradientFrom: '#8a2be2', // Mov-roz
        darkHeaderGradientTo: '#ff1493', // Roz aprins
        darkBotBg: '#ff69b4', // Roz
        darkBotText: '#ffffff',
        darkUserBg: '#ff00a8', // Roz aprins
        darkUserText: '#ffffff',
        darkBodyBg: '#1a1a2e', // Fundal întunecat
        darkAccent: '#ff4da6', // Roz accent
        darkBotNameColor: '#ffffff'
    };

    const colorDescriptions = {
        windowBg: 'Fundal fereastră (Light Mode)',
        headerGradientFrom: 'Gradient antet (stânga, Light Mode)',
        headerGradientTo: 'Gradient antet (dreapta, Light Mode)',
        botBg: 'Fundal mesaje bot (Light Mode)',
        botText: 'Text mesaje bot (Light Mode)',
        userBg: 'Fundal mesaje user (Light Mode)',
        userText: 'Text mesaje user (Light Mode)',
        bodyBg: 'Fundal corp chat (Light Mode)',
        accent: 'Culoare accent (Light Mode)',
        botNameColor: 'Culoare nume bot (Light Mode)',
        darkWindowBg: 'Fundal fereastră (Dark Mode)',
        darkHeaderGradientFrom: 'Gradient antet (stânga, Dark Mode)',
        darkHeaderGradientTo: 'Gradient antet (dreapta, Dark Mode)',
        darkBotBg: 'Fundal mesaje bot (Dark Mode)',
        darkBotText: 'Text mesaje bot (Dark Mode)',
        darkUserBg: 'Fundal mesaje user (Dark Mode)',
        darkUserText: 'Text mesaje user (Dark Mode)',
        darkBodyBg: 'Fundal corp chat (Dark Mode)',
        darkAccent: 'Culoare accent (Dark Mode)',
        darkBotNameColor: 'Culoare nume bot (Dark Mode)'
    };

    let colors = { ...colorDefaults };
    let size = GM_getValue('local_chat_bot_size', { width: '56.25%', height: '50%' });
    let iconPosition = GM_getValue(STORAGE_KEY_ICON_POSITION, { x: 20, y: window.innerHeight - 70 });

    // --- Load Settings ---
    function loadSettings() {
        try {
            const savedColors = GM_getValue(STORAGE_KEY_COLORS, null);
            if (savedColors) colors = { ...colorDefaults, ...savedColors };
            size = GM_getValue(STORAGE_KEY_SIZE, { width: '56.25%', height: '50%' });
            iconPosition = GM_getValue(STORAGE_KEY_ICON_POSITION, { x: 20, y: window.innerHeight - 70 });
        } catch (e) {
            colors = { ...colorDefaults };
            size = { width: '56.25%', height: '50%' };
            iconPosition = { x: 20, y: window.innerHeight - 70 };
        }
    }

    function saveSettings() {
        GM_setValue(STORAGE_KEY_COLORS, colors);
        GM_setValue(STORAGE_KEY_SIZE, size);
        GM_setValue(STORAGE_KEY_ICON_POSITION, iconPosition);
        GM_setValue('local_chat_bot_character', currentCharacter);
    }

    loadSettings();

    // --- Check Dark Mode ---
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function getCurrentColors() {
        return isDarkMode()
            ? {
                windowBg: colors.darkWindowBg,
                headerGradientFrom: colors.darkHeaderGradientFrom,
                headerGradientTo: colors.darkHeaderGradientTo,
                botBg: colors.darkBotBg,
                botText: colors.darkBotText,
                userBg: colors.darkUserBg,
                userText: colors.darkUserText,
                bodyBg: colors.darkBodyBg,
                accent: colors.darkAccent,
                botNameColor: colors.darkBotNameColor
            }
            : {
                windowBg: colors.windowBg,
                headerGradientFrom: colors.headerGradientFrom,
                headerGradientTo: colors.headerGradientTo,
                botBg: colors.botBg,
                botText: colors.botText,
                userBg: colors.userBg,
                userText: colors.userText,
                bodyBg: colors.bodyBg,
                accent: colors.accent,
                botNameColor: colors.botNameColor
            };
    }

    // --- Rules (unchanged) ---
    const rules = {
        nyu: [
            ['salut', 'Bună! 🌸 Cu ce te pot ajuta? (Dacă dorești poți scrie "ajutor" pentru comenzi)'],
            ['buna', 'Bună! 😊 Ce faci?'],
            ['cum esti', 'Sunt un bot local, funcționez bine! Îți mulțumesc pentru întrebare. 🤖✨'],
            ['ce faci', 'Mă distrez cu tine! 😊 Ce faci tu?'],
            ['cum te cheamă', 'Sunt Nyu! 🌸'],
            ['vorbește cu mine', 'Desigur! Despre ce vrei să vorbim? 💬'],
            ['glumă', 'De ce nu se joacă roboții la ascunzător? 🤖➡️ Pentru că sunt prea buni la "cache"! 😂'],
            [/mulțumesc|merci/i, 'Cu plăcere! 💖'],
            ['timp', () => `Ora locală: ${new Date().toLocaleTimeString()}`],
            ['pâine', 'Îți place pâinea? Eu nu mănânc, dar știu rețete! 🍞 (Ex: Pâine de secară cu miere și nuci)'],
            ['ajutor', '📌 **Comenzi disponibile:**\n' +
                '- `culori`: Deschide panoul de culori.\n' +
                '- `q1`: Activează/dezactivează modul q1 (botul afișează mesajele tale, dar nu răspunde).\n' +
                '- `qq [text]`: Botul repetă exact textul tău (fără prefixul `qq`).\n' +
                '- `sterge mesaje`: Șterge toată conversația.\n' +
                '- `logic [propoziție]`: Analizează propoziția din perspectiva logicii.\n' +
                '- `argumenteaza [tema]`: Generează argumente pro/contra.\n' +
                '- `anime [nume]`: Informații științifice/filozofice despre anime.\n' +
                '- `caractere`: Schimbă între Lucy (1) și Nyu (2).'],
            [/^logic (.+)/i, (msg) => {
                const prop = msg.match(/^logic (.+)/i)[1].trim();
                return `🔍 **Analiză logică:**\n- **Propoziție:** "${prop}"\n- **Tip:** ${prop.includes('→') ? 'Implicație' : prop.includes('∧') ? 'Conjuncție' : prop.includes('∨') ? 'Disjuncție' : 'Propoziție atomică'}\n- **Valoare de adevăr:** ${prop.toLowerCase().includes('adevărat') ? '✅ Adevărat' : prop.toLowerCase().includes('fals') ? '❌ Fals' : '⚠️ Nedeterminat (lipsește context)'}\n- **Sfaturi:** Folosește conectori logici (∧, ∨, →, ¬) pentru analize precise.`;
            }],
            [/^argumenteaza (.+)/i, (msg) => {
                const topic = msg.match(/^argumenteaza (.+)/i)[1].trim();
                return `🗣️ **Argumente pentru "${topic}":**\n\n**Pro:**\n- ${topic} poate aduce beneficii pe termen lung, cum ar fi ${topic.includes('tehnologie') ? 'eficiență și inovație.' : 'îmbunătățirea calității vieții.'}\n- Studii arată că ${topic} are un impact pozitiv în ${topic.includes('educatie') ? 'dezvoltarea intelectuală.' : 'domeniul său.'}\n\n**Contra:**\n- ${topic} poate avea efecte negative, cum ar fi ${topic.includes('retele sociale') ? 'izolarea socială.' : 'costurile ridicate.'}\n- Criticii susțin că ${topic} ${topic.includes('AI') ? 'poate înlocui locuri de muncă.' : 'nu este întotdeauna etic.'}\n\n💡 **Concluzie:** Analizează ambele părți pentru o viziune echilibrată.`;
            }],
            [/^anime (.+)/i, (msg) => {
                const animeName = msg.match(/^anime (.+)/i)[1].trim().toLowerCase();
                const animeDB = {
                    'elfen lied': {
                        science: '🧠 **Neuroștiință:** Lucy (Diclonius) are "vectori" care manipulează materia prin undele electromagnetice — similar cu teorii despre **telechinezie** (psihokineză).',
                        philosophy: '🌌 **Filozofie:** Tema principală este **discriminarea și umanitatea**. Diclonii sunt văzuți ca monștri, dar au emoții complexe — similar cu dezbaterile despre **IA și drepturile conștiinței**.',
                        quote: '💬 "Dacă nu poți accepta lumea aşa cum este, schimbă-o!" — Nyu.'
                    },
                    'steins gate': {
                        science: '⏳ **Fizică cuantică:** Mașina timpului folosește **găuri de vierme** (Einstein-Rosen) și **teoria multiversului** (Hugh Everett).',
                        philosophy: '🔄 **Determinism vs. Liber Arbitru:** Okabe trece prin "Reading Steiner" (memorie retroactivă), punând sub semnul întrebării dacă **soarta este fixă**.',
                        quote: '💬 "Eu sunt omul de știință care salvează lumea!" — Okabe Rintarou.'
                    },
                    'psycho pass': {
                        science: '🧠 **Psihologie + IA:** Sistemul Sibyl măsoară **coeficientul de criminalitate** folosind scanări cerebrale — similar cu **neuroimagistica** modernă (fMRI).',
                        philosophy: '⚖️ **Etica utilitarismului:** Societatea sacrifică libertatea individuală pentru **siguranță colectivă** — dezbateri asemănătoare cu **supravegherea masivă**.',
                        quote: '💬 "Justiția este un lux pe care nu și-l permitem." — Shogo Makishima.'
                    },
                    'attack on titan': {
                        science: '🧬 **Biologie:** Titanii au **regenerare accelerată** — inspirat din **planaria** (viermi care se regenerează) și **celule stem**.',
                        philosophy: '🌍 **Război și libertate:** Tema centrală este **ciclu violenței** și căutarea libertății — asemănător cu **teoriile lui Hobbes** ("Homo homini lupus").',
                        quote: '💬 "Dedicați inima voastră! Pântecele, inima, sângele, oasele, totul!" — Eren Yeager.'
                    }
                };
                if (animeDB[animeName]) {
                    const { science, philosophy, quote } = animeDB[animeName];
                    return `🎌 **${animeName.charAt(0).toUpperCase() + animeName.slice(1)}:**\n\n${science}\n\n${philosophy}\n\n${quote}`;
                } else {
                    return `❌ Nu am informații despre "${animeName}". Îmi poți sugera un anime cunoscut (ex: Elfen Lied, Steins;Gate, Psycho-Pass)?`;
                }
            }],
            [/.*/i, 'Îmi pare rău, nu am un răspuns pregătit pentru asta. Scrie "ajutor" pentru a vedea comenzi disponibile.']
        ],
        lucy: [
            ['salut', 'Salut. Ce vrei? 😒'],
            ['buna', 'Bună. Spune repede.'],
            ['cum esti', 'Sunt aici. Nu-mi pierde timpul!'],
            ['ce faci', 'Te aștept să spui ceva util.'],
            ['cum te cheamă', 'Sunt Lucy. Nu uita.😒'],
            ['vorbește cu mine', 'Vorbesc. Dar să fie ceva important.'],
            ['glumă', 'Glume? Nu am chef. 😐'],
            [/mulțumesc|merci/i, 'Da, da, Ok.'],
            ['timp', () => `Ora locală: ${new Date().toLocaleTimeString()}`],
            ['pâine', 'Pâine? Nu mă interesează.'],
            ['ajutor', '📌 **Comenzi disponibile:**\n' +
                '- `culori`: Nu are sens să explic. Oricum este o pierdere de timp.\n' +
                '- `q1`: Activează/dezactivează modul q1.\n' +
                '- `qq [text]`: Botul repetă exact textul tău (fără prefixul `qq`).\n' +
                '- `sterge mesaje`: Șterge toată conversația.\n' +
                '- `logic [propoziție]`: Analizează propoziția din perspectiva logicii.\n' +
                '- `argumenteaza [tema]`: Generează argumente pro/contra.\n' +
                '- `anime [nume]`: Informații despre anime.\n' +
                '- `caractere`: Schimbă între Lucy (1) și Nyu (2).'],
            [/^logic (.+)/i, (msg) => {
                const prop = msg.match(/^logic (.+)/i)[1].trim();
                return `🔍 **Analiză logică:**\n- **Propoziție:** "${prop}"\n- **Tip:** ${prop.includes('→') ? 'Implicație' : prop.includes('∧') ? 'Conjuncție' : prop.includes('∨') ? 'Disjuncție' : 'Propoziție atomică'}\n- **Valoare de adevăr:** ${prop.toLowerCase().includes('adevărat') ? '✅ Adevărat' : prop.toLowerCase().includes('fals') ? '❌ Fals' : '⚠️ Nedeterminat'}\n- **Concluzie:** Gândește-te mai bine.`;
            }],
            [/^argumenteaza (.+)/i, (msg) => {
                const topic = msg.match(/^argumenteaza (.+)/i)[1].trim();
                return `🗣️ **Argumente pentru "${topic}":**\n\n**Pro:**\n- ${topic} poate fi util, dar nu mereu.\n- Unii spun că ${topic} are avantaje, dar eu nu sunt convinsă.\n\n**Contra:**\n- ${topic} are prea multe defecte.\n- Nu merită efortul.\n\n💡 **Concluzie:** Nu e chiar atât de bun.`;
            }],
            [/^anime (.+)/i, (msg) => {
                const animeName = msg.match(/^anime (.+)/i)[1].trim().toLowerCase();
                const animeDB = {
                    'elfen lied': {
                        science: '🧠 **Neuroștiință:** Vectorii lui Lucy sunt reali. Nu e magie, e știință.',
                        philosophy: '🌌 **Filozofie:** Diclonii sunt superiori. Punct.',
                        quote: '💬 "Nu mă provoca." — Lucy.'
                    },
                    'steins gate': {
                        science: '⏳ **Fizică cuantică:** Timpul e relativ. Okabe a înțeles greșit.',
                        philosophy: '🔄 **Determinism:** Soarta e fixă. Nu te lupta.',
                        quote: '💬 "E prea târziu." — Lucy.'
                    },
                    'psycho pass': {
                        science: '🧠 **Psihologie:** Sibyl e un sistem prost construit.',
                        philosophy: '⚖️ **Etica:** Siguranța nu justifică totul. Dar aproape.',
                        quote: '💬 "Justiția e o iluzie." — Lucy.'
                    },
                    'attack on titan': {
                        science: '🧬 **Biologie:** Titanii sunt o erorare a naturii.',
                        philosophy: '🌍 **Război:** Libertatea e un lux. Majoritatea nu o merită.',
                        quote: '💬 "Supraviețuiește sau moare." — Lucy.'
                    }
                };
                if (animeDB[animeName]) {
                    const { science, philosophy, quote } = animeDB[animeName];
                    return `🎌 **${animeName.charAt(0).toUpperCase() + animeName.slice(1)}:**\n\n${science}\n\n${philosophy}\n\n${quote}`;
                } else {
                    return `❌ Nu știu. Caută altceva.`;
                }
            }],
            [/.*/i, 'Nu mă interesează. Scrie "ajutor" dacă pierzi timpul aiurea 😒.']
        ]
    };

    // --- Helper Functions ---
    function getCurrentRules() {
        return currentCharacter === 1 ? rules.lucy : rules.nyu;
    }

    function getBotName() {
        return currentCharacter === 1 ? 'Lucy' : 'Nyu';
    }

    function getBotIcon() {
        return currentCharacter === 1
            ? 'https://wallpapers.com/images/high/elfen-lied-angry-looking-lucy-z62l798ulr39055a.webp'
            : 'https://w0.peakpx.com/wallpaper/26/745/HD-wallpaper-elfen-lied-nyu-anime-lucy.jpg';
    }

    function handleSizeChange(sizeParam) {
        let width, height;
        if (sizeParam.includes('x')) {
            const [w, h] = sizeParam.split('x').map(Number);
            width = `${Math.max(w, 20)}px`;
            height = `${Math.max(h, 20)}px`;
        } else if (sizeParam.includes('%')) {
            const percent = parseFloat(sizeParam);
            width = `${Math.max(percent, 20)}%`;
            height = 'auto';
        } else {
            const sizes = {
                '20x20': '200px',
                '30x30': '300px',
                '40x40': '400px',
                '50x50': '50%',
                '60x60': '60%',
                '70x70': '70%',
                '80x80': '80%',
                '90x90': '90%',
                '100x100': '100%'
            };
            width = sizes[sizeParam] || '56.25%';
            height = sizes[sizeParam] ? (sizes[sizeParam].includes('%') ? '50%' : sizes[sizeParam]) : '50%';
        }
        size = { width, height };
        saveSettings();
        applySizeToUI();
    }

    function applySizeToUI() {
        if (lcbWindow) {
            lcbWindow.style.width = size.width;
            lcbWindow.style.height = size.height;
            lcbWindow.style.left = '0';
            lcbWindow.style.right = 'auto';
            lcbWindow.style.top = '0';
            lcbWindow.style.bottom = 'auto';
            lcbWindow.style.maxWidth = 'none';
            if (bodyDiv) bodyDiv.style.maxHeight = `calc(${size.height} - 100px)`;
        }
    }

    function getResponse(message) {
        if (q1Mode && !message.startsWith('qq ')) {
            return '';
        }
        const lower = message.toLowerCase();
        const currentRules = getCurrentRules();
        for (const [pattern, response] of currentRules) {
            if (pattern instanceof RegExp) {
                if (pattern.test(message)) {
                    return typeof response === 'function' ? response(message) : response;
                }
            } else {
                if (lower.includes(pattern.toLowerCase())) {
                    return typeof response === 'function' ? response(message) : response;
                }
            }
        }
        return currentRules[currentRules.length - 1][1];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Inject Base Styles ---
    GM_addStyle(`
        #local-chat-bot .lcb-window {
            position: fixed;
            left: 0;
            top: 0;
            width: ${size.width};
            height: ${size.height};
            background: ${getCurrentColors().windowBg};
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 0 0 12px 0;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            font-family: Arial, sans-serif;
            z-index: 999999;
            transition: width .18s ease, height .18s ease;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            resize: none;
        }
        .lcb-window .lcb-header {
            cursor: move;
            flex: 0 0 auto;
        }
        .lcb-resize-handle {
            position: absolute;
            width: 12px;
            height: 12px;
            right: 0;
            bottom: 0;
            background: ${getCurrentColors().accent};
            cursor: nwse-resize;
            border-radius: 0 0 6px 0;
        }
        .lcb-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: linear-gradient(90deg, ${getCurrentColors().headerGradientFrom}, ${getCurrentColors().headerGradientTo});
            color: #fff;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            cursor: move;
            user-select: none;
            font-size: 16px;
        }
        .lcb-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.6);
            flex: 0 0 36px;
        }
        .lcb-title {
            font-weight: 700;
            font-size: 18px;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: ${getCurrentColors().botNameColor};
        }
        .lcb-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .lcb-body {
            min-height: 200px;
            max-height: calc(${size.height} - 100px);
            padding: 20px;
            overflow-y: auto;
            background: ${getCurrentColors().bodyBg};
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: opacity .18s ease;
            flex: 1 1 auto;
            font-size: 15px;
        }
        .lcb-form {
            display: flex;
            padding: 16px 20px;
            gap: 10px;
            border-top: 1px solid rgba(0,0,0,0.04);
            background: rgba(255,255,255,0.8);
            flex: 0 0 auto;
            align-items: center;
            box-sizing: border-box;
        }
        .lcb-input {
            flex: 1 1 auto;
            padding: 12px 16px;
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 8px;
            background: #fff;
            min-width: 0;
            font-size: 15px;
        }
        .lcb-emoji-btn {
            padding: 12px;
            background: transparent;
            border: none;
            font-size: 22px;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            flex: 0 0 auto;
        }
        .lcb-emoji-btn:hover {
            background: rgba(0, 0, 0, 0.06);
        }
        .lcb-send {
            padding: 12px 20px;
            background: ${getCurrentColors().accent};
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            flex: 0 0 auto;
            font-size: 15px;
            font-weight: 600;
        }
        .lcb-msg {
            margin: 0;
            max-width: 86%;
            padding: 12px 16px;
            border-radius: 12px;
            display: inline-block;
            word-break: break-word;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            font-size: 15px;
            line-height: 1.4;
        }
        .lcb-bot {
            background: ${getCurrentColors().botBg};
            color: ${getCurrentColors().botText};
            align-self: flex-start;
        }
        .lcb-user {
            align-self: flex-end;
            background: ${getCurrentColors().userBg};
            color: ${getCurrentColors().userText};
        }
        .lcb-bot-img {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            vertical-align: middle;
            margin-right: 8px;
        }
        .lcb-bot-name {
            color: ${getCurrentColors().botNameColor};
            font-weight: bold;
            font-size: 1em;
        }

        /* Floating Icon (Stânga-Jos) */
        #lcb-floating-icon {
            position: fixed;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: ${getCurrentColors().accent};
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            left: ${iconPosition.x}px;
            bottom: ${iconPosition.y}px;
        }
        #lcb-floating-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        #lcb-floating-icon img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.6);
        }

        /* Floating Color Panel (Dark Mode Support) */
        #lcb-floating-color-panel {
            background: ${isDarkMode() ? '#2d1b2d' : '#ffffff'} !important;
            color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
        }
        #lcb-floating-color-panel .lcb-color-label {
            color: ${isDarkMode() ? '#e0e0e0' : '#333333'} !important;
        }
        #lcb-floating-color-panel .lcb-color-input {
            background: ${isDarkMode() ? '#3d293d' : '#ffffff'} !important;
            border-color: ${isDarkMode() ? '#5a4a5a' : '#cccccc'} !important;
            color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
        }
        #lcb-floating-color-panel .lcb-btn {
            background: ${isDarkMode() ? '#3d293d' : '#f0f0f0'} !important;
            border-color: ${isDarkMode() ? '#5a4a5a' : '#cccccc'} !important;
            color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
        }

        .lcb-btn {
            padding: 10px 16px;
            border-radius: 8px;
            border: 1px solid #ccc;
            background: #f0f0f0;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
        }
        .lcb-btn:hover {
            background: #e0e0e0;
        }
        .lcb-color-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        .lcb-color-preview {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid #ccc;
            flex-shrink: 0;
        }
        .lcb-color-label {
            width: 160px;
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        .lcb-color-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 14px;
        }
        .lcb-emoji-picker {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 12px;
            background: ${isDarkMode() ? '#2d1b2d' : '#ffffff'};
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            position: absolute;
            z-index: 1000000;
            bottom: 70px;
            right: 20px;
            max-width: 400px;
        }
        .lcb-emoji-option {
            background: none;
            border: none;
            font-size: 22px;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .lcb-emoji-option:hover {
            background: rgba(0, 0, 0, 0.06);
        }

        /* Dark Mode Adjustments */
        @media (prefers-color-scheme: dark) {
            .lcb-input, .lcb-form {
                background: rgba(45, 27, 45, 0.8) !important;
                border-color: rgba(255, 255, 255, 0.1) !important;
            }
            .lcb-color-label {
                color: #e0e0e0 !important;
            }
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
            #local-chat-bot .lcb-window {
                width: 100% !important;
                height: 60% !important;
                border-radius: 0 0 12px 12px !important;
            }
            .lcb-header {
                padding: 12px 16px;
                font-size: 14px;
            }
            .lcb-title {
                font-size: 16px;
            }
            .lcb-icon {
                width: 30px;
                height: 30px;
            }
            .lcb-body {
                padding: 12px 16px;
                font-size: 14px;
            }
            .lcb-form {
                padding: 12px 16px;
            }
            .lcb-input {
                font-size: 14px;
            }
            #lcb-floating-icon {
                width: 50px;
                height: 50px;
            }
            #lcb-floating-icon img {
                width: 42px;
                height: 42px;
            }
        }
    `);

    // --- Build UI ---
    const container = document.createElement('div');
    container.id = 'local-chat-bot';
    container.innerHTML = `
        <div class="lcb-window" id="lcb-window" role="dialog" aria-label="Local chat bot">
            <div class="lcb-header" id="lcb-header">
                <img class="lcb-icon" id="lcb-icon" src="${getBotIcon()}" alt="${getBotName()}"/>
                <span class="lcb-title" id="lcb-title">${getBotName()} Chat</span>
            </div>
            <div class="lcb-body" id="lcb-body" aria-live="polite"></div>
            <form id="lcb-form" class="lcb-form" aria-label="Trimite mesaj">
                <input id="lcb-input" class="lcb-input" autocomplete="off" placeholder="Scrie un mesaj..." />
                <button type="button" class="lcb-emoji-btn" title="Emoji">😊</button>
                <button type="submit" class="lcb-send">Trimite</button>
            </form>
            <div class="lcb-resize-handle" id="lcb-resize-handle"></div>
        </div>
        <div id="lcb-floating-icon" title="Deschide/Închide chat">
            <img src="${getBotIcon()}" alt="${getBotName()}"/>
        </div>
    `;
    document.body.appendChild(container);

    // --- Floating Color Panel ---
    const floatingColorPanel = document.createElement('div');
    floatingColorPanel.id = 'lcb-floating-color-panel';
    floatingColorPanel.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000000;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        display: none;
        max-width: 460px;
        width: 90%;
    `;
    floatingColorPanel.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px;">Setări culori</h3>
        <div id="lcb-floating-palette"></div>
        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
            <button id="lcb-close-floating-panel" class="lcb-btn">Închide</button>
            <button id="lcb-save-floating-colors" class="lcb-btn" style="background: ${getCurrentColors().accent}; color: white; border-color: ${getCurrentColors().accent};">Salvează</button>
        </div>
    `;
    document.body.appendChild(floatingColorPanel);

    // --- Element Refs ---
    const bodyDiv = document.getElementById('lcb-body');
    const form = document.getElementById('lcb-form');
    const input = document.getElementById('lcb-input');
    const lcbWindow = document.getElementById('lcb-window');
    const lcbHeader = document.getElementById('lcb-header');
    const resizeHandle = document.getElementById('lcb-resize-handle');
    const emojiBtn = document.querySelector('.lcb-emoji-btn');
    const floatingIcon = document.getElementById('lcb-floating-icon');
    const floatingPalette = document.getElementById('lcb-floating-palette');
    const saveFloatingColorsBtn = document.getElementById('lcb-save-floating-colors');
    const closeFloatingPanelBtn = document.getElementById('lcb-close-floating-panel');

    // --- Apply Initial Icon Position ---
    floatingIcon.style.left = `${iconPosition.x}px`;
    floatingIcon.style.bottom = `${iconPosition.y}px`;

    // --- Drag & Drop for Floating Icon ---
    floatingIcon.addEventListener('mousedown', (e) => {
        isDraggingIcon = true;
        startX = e.clientX - iconPosition.x;
        startY = e.clientY - iconPosition.y;
        e.preventDefault();

        function moveIcon(e) {
            if (!isDraggingIcon) return;
            e.preventDefault();
            iconPosition.x = Math.max(0, Math.min(window.innerWidth - 56, e.clientX - startX));
            iconPosition.y = Math.max(0, Math.min(window.innerHeight - 56, window.innerHeight - (e.clientY - startY)));
            floatingIcon.style.left = `${iconPosition.x}px`;
            floatingIcon.style.bottom = `${iconPosition.y}px`;
        }

        function stopDrag() {
            isDraggingIcon = false;
            document.removeEventListener('mousemove', moveIcon);
            document.removeEventListener('mouseup', stopDrag);
            saveSettings();
        }

        document.addEventListener('mousemove', moveIcon);
        document.addEventListener('mouseup', stopDrag);
    });

    // --- Toggle Window Visibility ---
    floatingIcon.addEventListener('click', () => {
        if (lcbWindow.style.display === 'none' || lcbWindow.style.display === '') {
            lcbWindow.style.display = 'flex';
            input.focus();
        } else {
            lcbWindow.style.display = 'none';
        }
    });

    // --- Drag & Drop and Resize Logic for Window ---
    lcbHeader.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('lcb-emoji-btn')) return;
        isDraggingWindow = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = lcbWindow.getBoundingClientRect();
        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;

        function moveWindow(e) {
            if (!isDraggingWindow) return;
            e.preventDefault();
            lcbWindow.style.left = `${Math.max(0, Math.min(window.innerWidth - parseInt(size.width), e.clientX - offsetX))}px`;
            lcbWindow.style.top = `${Math.max(0, Math.min(window.innerHeight - parseInt(size.height), e.clientY - offsetY))}px`;
            lcbWindow.style.right = 'auto';
            lcbWindow.style.bottom = 'auto';
        }

        function stopDrag() {
            isDraggingWindow = false;
            document.removeEventListener('mousemove', moveWindow);
            document.removeEventListener('mouseup', stopDrag);
        }

        document.addEventListener('mousemove', moveWindow);
        document.addEventListener('mouseup', stopDrag);
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = lcbWindow.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;

        function resizeWindow(e) {
            if (!isResizing) return;
            e.preventDefault();
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);
            size.width = `${Math.max(newWidth, 200)}px`;
            size.height = `${Math.max(newHeight, 200)}px`;
            lcbWindow.style.width = size.width;
            lcbWindow.style.height = size.height;
            bodyDiv.style.maxHeight = `calc(${parseInt(size.height)}px - 100px)`;
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

    // --- Message Utilities ---
    function appendMessage(text, who = 'bot') {
        if (!text) return null;
        const el = document.createElement('div');
        el.className = 'lcb-msg ' + (who === 'user' ? 'lcb-user' : 'lcb-bot');
        if (who === 'bot') {
            const img = document.createElement('img');
            img.src = getBotIcon();
            img.className = 'lcb-bot-img';
            img.alt = getBotName();
            el.appendChild(img);
            const nameSpan = document.createElement('span');
            nameSpan.className = 'lcb-bot-name';
            nameSpan.textContent = `${getBotName()}: `;
            el.appendChild(nameSpan);
        }
        const textSpan = document.createElement('span');
        textSpan.innerHTML = text.includes('<') ? text : escapeHtml(text);
        el.appendChild(textSpan);
        bodyDiv.appendChild(el);
        bodyDiv.scrollTop = bodyDiv.scrollHeight;
        return el;
    }

    function clearAllMessages() {
        bodyDiv.innerHTML = '';
    }

    // --- Emoji Picker (Cu mai multe emoji-uri) ---
    function showEmojiPicker() {
        const emojiPicker = document.createElement('div');
        emojiPicker.className = 'lcb-emoji-picker';
        emojiPicker.innerHTML = `
            <button class="lcb-emoji-option" data-emoji="😊">😊</button>
            <button class="lcb-emoji-option" data-emoji="😍">😍</button>
            <button class="lcb-emoji-option" data-emoji="😂">😂</button>
            <button class="lcb-emoji-option" data-emoji="😢">😢</button>
            <button class="lcb-emoji-option" data-emoji="😭">😭</button>
            <button class="lcb-emoji-option" data-emoji="😠">😠</button>
            <button class="lcb-emoji-option" data-emoji="😒">😒</button>
            <button class="lcb-emoji-option" data-emoji="😘">😘</button>
            <button class="lcb-emoji-option" data-emoji="😇">😇</button>
            <button class="lcb-emoji-option" data-emoji="🤔">🤔</button>
            <button class="lcb-emoji-option" data-emoji="🙏">🙏</button>
            <button class="lcb-emoji-option" data-emoji="👍">👍</button>
            <button class="lcb-emoji-option" data-emoji="👎">👎</button>
            <button class="lcb-emoji-option" data-emoji="❤️">❤️</button>
            <button class="lcb-emoji-option" data-emoji="💪">💪</button>
            <button class="lcb-emoji-option" data-emoji="🎉">🎉</button>
            <button class="lcb-emoji-option" data-emoji="😎">😎</button>
            <button class="lcb-emoji-option" data-emoji="👀">👀</button>
            <button class="lcb-emoji-option" data-emoji="🌟">🌟</button>
            <button class="lcb-emoji-option" data-emoji="🔥">🔥</button>
            <button class="lcb-emoji-option" data-emoji="💖">💖</button>
            <button class="lcb-emoji-option" data-emoji="😴">😴</button>
            <button class="lcb-emoji-option" data-emoji="🤗">🤗</button>
            <button class="lcb-emoji-option" data-emoji="🤯">🤯</button>
            <button class="lcb-emoji-option" data-emoji="🥳">🥳</button>
            <button class="lcb-emoji-option" data-emoji="😌">😌</button>
            <button class="lcb-emoji-option" data-emoji="😏">😏</button>
            <button class="lcb-emoji-option" data-emoji="😱">😱</button>
            <button class="lcb-emoji-option" data-emoji="😳">😳</button>
        `;
        document.body.appendChild(emojiPicker);
        emojiPicker.querySelectorAll('.lcb-emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                input.value += emoji;
                input.focus();
                emojiPicker.remove();
            });
        });
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.remove();
            }
        }, { once: true });
        const rect = emojiBtn.getBoundingClientRect();
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        emojiPicker.style.right = `${window.innerWidth - rect.right}px`;
    }

    // --- Floating Color Panel Functions ---
    function populateFloatingColorPanel() {
        floatingPalette.innerHTML = Object.keys(colorDefaults)
            .map(key => `
                <div class="lcb-color-row">
                    <div class="lcb-color-preview" style="background-color: ${colors[key]};"></div>
                    <label class="lcb-color-label">${colorDescriptions[key] || key}:</label>
                    <input type="text" id="floating-color-${key}" class="lcb-color-input" placeholder="#hex" value="${colors[key] || ''}" />
                </div>
            `)
            .join('');
    }

    function applySettingsToUI() {
        const currentColors = getCurrentColors();
        const prev = document.querySelector('style[data-lcb-injected]');
        if (prev) prev.remove();
        const css = `
            #local-chat-bot .lcb-window {
                background: ${currentColors.windowBg} !important;
                border-radius: 0 0 12px 0 !important;
            }
            .lcb-header {
                background: linear-gradient(90deg, ${currentColors.headerGradientFrom}, ${currentColors.headerGradientTo}) !important;
                border-bottom: 1px solid rgba(0,0,0,0.1) !important;
            }
            .lcb-body {
                background: ${currentColors.bodyBg} !important;
            }
            .lcb-bot {
                background: ${currentColors.botBg} !important;
                color: ${currentColors.botText} !important;
            }
            .lcb-user {
                background: ${currentColors.userBg} !important;
                color: ${currentColors.userText} !important;
            }
            .lcb-send, .lcb-resize-handle {
                background: ${currentColors.accent} !important;
            }
            .lcb-bot-name {
                color: ${currentColors.botNameColor} !important;
            }
            #lcb-save-floating-colors {
                background: ${currentColors.accent} !important;
                color: white !important;
                border-color: ${currentColors.accent} !important;
            }
            #lcb-floating-icon {
                background: ${currentColors.accent} !important;
            }
            #lcb-floating-color-panel {
                background: ${isDarkMode() ? '#2d1b2d' : '#ffffff'} !important;
                color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
            }
            #lcb-floating-color-panel .lcb-color-label {
                color: ${isDarkMode() ? '#e0e0e0' : '#333333'} !important;
            }
            #lcb-floating-color-panel .lcb-color-input {
                background: ${isDarkMode() ? '#3d293d' : '#ffffff'} !important;
                border-color: ${isDarkMode() ? '#5a4a5a' : '#cccccc'} !important;
                color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
            }
            #lcb-floating-color-panel .lcb-btn {
                background: ${isDarkMode() ? '#3d293d' : '#f0f0f0'} !important;
                border-color: ${isDarkMode() ? '#5a4a5a' : '#cccccc'} !important;
                color: ${isDarkMode() ? '#ffffff' : '#000000'} !important;
            }
        `;
        const s = document.createElement('style');
        s.setAttribute('data-lcb-injected', '1');
        s.textContent = css;
        document.head.appendChild(s);
        if (document.getElementById('lcb-title')) {
            document.getElementById('lcb-title').style.color = currentColors.botNameColor;
        }
        if (floatingIcon.querySelector('img')) {
            floatingIcon.querySelector('img').src = getBotIcon();
        }
        if (document.getElementById('lcb-icon')) {
            document.getElementById('lcb-icon').src = getBotIcon();
        }
        if (document.getElementById('lcb-title')) {
            document.getElementById('lcb-title').textContent = `${getBotName()} Chat`;
        }
    }

    function isValidHex(h) {
        return /^#([0-9A-F]{3}){1,2}$/i.test(h);
    }

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = (input.value || '').trim();
        if (!raw) return;
        const lower = raw.toLowerCase();

        if (lower === 'q1') {
            q1Mode = !q1Mode;
            input.value = '';
            input.focus();
            return;
        }

        if (lower.startsWith('qq ')) {
            const payload = raw.slice(3).trim();
            appendMessage(payload, 'bot');
            input.value = '';
            input.focus();
            return;
        }

        const clearCommands = ['sterge mesaje', 'șterge mesaje', 'sterge-chat', 'sterge chat', 'clear messages', 'clear', 'șterge mesajele', 'sterge mesajele'];
        if (clearCommands.includes(lower)) {
            appendMessage(raw, 'user');
            clearAllMessages();
            input.value = '';
            input.focus();
            return;
        }

        if (lower === 'caractere') {
            currentCharacter = currentCharacter === 1 ? 2 : 1;
            saveSettings();
            applySettingsToUI();
            input.value = '';
            input.focus();
            return;
        }

        if (lower === 'culori') {
            appendMessage(raw, 'user');
            populateFloatingColorPanel();
            floatingColorPanel.style.display = 'block';
            input.value = '';
            input.focus();
            return;
        }

        appendMessage(raw, 'user');
        if (!q1Mode) {
            const reply = getResponse(raw);
            if (reply) {
                setTimeout(() => {
                    appendMessage(reply, 'bot');
                }, 250);
            }
        }
        input.value = '';
        input.focus();
    });

    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEmojiPicker();
    });

    saveFloatingColorsBtn.addEventListener('click', () => {
        let allValid = true;
        Object.keys(colorDefaults).forEach(key => {
            const inputEl = document.getElementById(`floating-color-${key}`);
            const value = inputEl.value.trim();
            if (value && !isValidHex(value)) {
                allValid = false;
                inputEl.style.border = '1px solid red';
            } else {
                inputEl.style.border = '';
                if (value) colors[key] = value;
            }
        });
        if (!allValid) {
            alert('Unele coduri hex nu sunt valide! Folosește formatul #rrggbb sau #rgb.');
            return;
        }
        saveSettings();
        applySettingsToUI();
        floatingColorPanel.style.display = 'none';
        appendMessage('✅ Culorile au fost salvate!', 'bot');
    });

    closeFloatingPanelBtn.addEventListener('click', () => {
        floatingColorPanel.style.display = 'none';
    });

    window.addEventListener('resize', () => {
        if (size.height.includes('%')) {
            bodyDiv.style.maxHeight = `calc(${window.innerHeight * (parseInt(size.height) / 100)}px - 100px)`;
        } else {
            bodyDiv.style.maxHeight = `calc(${parseInt(size.height)}px - 100px)`;
        }
    });

    // --- Dark Mode Listener ---
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        applySettingsToUI();
    });

    // --- Global API ---
    window.localChatBot = {
        send: (text) => {
            appendMessage(text, 'user');
            if (!q1Mode) {
                setTimeout(() => appendMessage(getResponse(text), 'bot'), 200);
            }
        },
        clear: () => { clearAllMessages(); }
    };

    // --- Initialize ---
    applySettingsToUI();
    applySizeToUI();
    input.focus();
    appendMessage(`Salut, sunt **${getBotName()}**. Apasă pe iconița din stânga-jos pentru a deschide/închide chat-ul.`, 'bot');
})();