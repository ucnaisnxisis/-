// ==UserScript==
// @name         Local Chat Bot - Zero Two/Nyu/Lucy (Interactiv & Îmbunătățit)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Zero Two, Nyu și Lucy interacționează cu tine. Culori personalizate, răspunsuri multiple, compatibilitate mobil/PC, stickere, și simulări de discuții.
// @author       tester john
// @match        *://*.google.com/*
// @match        *://*.bing.com/*
// @match        *://duckduckgo.com/*
// @match        *://*.yahoo.com/*
// @match        *://*.brave.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
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
    let isDraggingWindow = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let currentCharacter = GM_getValue('local_chat_bot_character', 2); // 1 = Lucy, 2 = Nyu
    let zeroTwoActive = GM_getValue('zero_two_active', false); // Dezactivat implicit
    const STORAGE_KEY_COLORS = 'local_chat_bot_colors_v4';
    const STORAGE_KEY_SIZE = 'local_chat_bot_size_v4';
    const USER_NAME = "Japonezul"; // Numele tău

    // --- Color Settings ---
    const colorDefaults = {
        userText: '#9400D3',
        userBg: '#E6E6FA',
        nyuText: '#FFFFFF',
        nyuBg: '#FF69B4',
        lucyText: '#FFFFFF',
        lucyBg: '#1E90FF',
        zeroTwoText: '#000000',
        zeroTwoBg: '#FFD700',
        windowBg: '#FFF0F9',
        headerGradientFrom: '#FF9ACB',
        headerGradientTo: '#FF77B8',
        bodyBg: '#FFF0F9',
        accent: '#FF4DA6',
        botNameColor: '#FFFFFF',
        darkWindowBg: '#1A1A2E',
        darkHeaderGradientFrom: '#8A2BE2',
        darkHeaderGradientTo: '#FF1493',
        darkBodyBg: '#1A1A2E',
        darkAccent: '#FF4DA6'
    };

    const colorDescriptions = {
        userText: 'Text user (Mov intens)',
        userBg: 'Fundal mesaje user',
        nyuText: 'Text Nyu (Alb)',
        nyuBg: 'Fundal mesaje Nyu (Roz)',
        lucyText: 'Text Lucy (Alb)',
        lucyBg: 'Fundal mesaje Lucy (Albastru)',
        zeroTwoText: 'Text Zero Two (Negru)',
        zeroTwoBg: 'Fundal mesaje Zero Two (Galben)',
        windowBg: 'Fundal fereastră (Light Mode)',
        headerGradientFrom: 'Gradient antet (stânga, Light Mode)',
        headerGradientTo: 'Gradient antet (dreapta, Light Mode)',
        bodyBg: 'Fundal corp chat (Light Mode)',
        accent: 'Culoare accent (Light Mode)',
        botNameColor: 'Culoare nume bot (Light Mode)',
        darkWindowBg: 'Fundal fereastră (Dark Mode)',
        darkHeaderGradientFrom: 'Gradient antet (stânga, Dark Mode)',
        darkHeaderGradientTo: 'Gradient antet (dreapta, Dark Mode)',
        darkBodyBg: 'Fundal corp chat (Dark Mode)',
        darkAccent: 'Culoare accent (Dark Mode)'
    };

    let colors = { ...colorDefaults };
    let size = GM_getValue(STORAGE_KEY_SIZE, { width: '56.25%', height: '50%' });

    // --- Load/Save Settings ---
    function loadSettings() {
        try {
            const savedColors = GM_getValue(STORAGE_KEY_COLORS, null);
            if (savedColors) colors = { ...colorDefaults, ...savedColors };
            size = GM_getValue(STORAGE_KEY_SIZE, { width: '56.25%', height: '50%' });
            currentCharacter = GM_getValue('local_chat_bot_character', 2);
            zeroTwoActive = GM_getValue('zero_two_active', false); // Dezactivat implicit
        } catch (e) {
            colors = { ...colorDefaults };
            size = { width: '56.25%', height: '50%' };
            currentCharacter = 2;
            zeroTwoActive = false;
        }
    }

    function saveSettings() {
        GM_setValue(STORAGE_KEY_COLORS, colors);
        GM_setValue(STORAGE_KEY_SIZE, size);
        GM_setValue('local_chat_bot_character', currentCharacter);
        GM_setValue('zero_two_active', zeroTwoActive);
    }

    loadSettings();

    // --- Dark Mode Check ---
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function getCurrentColors() {
        return isDarkMode()
            ? {
                windowBg: colors.darkWindowBg,
                headerGradientFrom: colors.darkHeaderGradientFrom,
                headerGradientTo: colors.darkHeaderGradientTo,
                bodyBg: colors.darkBodyBg,
                accent: colors.darkAccent,
                botNameColor: colors.botNameColor
            }
            : {
                windowBg: colors.windowBg,
                headerGradientFrom: colors.headerGradientFrom,
                headerGradientTo: colors.headerGradientTo,
                bodyBg: colors.bodyBg,
                accent: colors.accent,
                botNameColor: colors.botNameColor
            };
    }

    // --- Random Response Helper ---
    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // --- Seasons ---
    const seasons = ['primăvară', 'vară', 'toamnă', 'iarna'];
    const randomSeason = () => getRandomResponse(seasons);

    // --- Stickers (Imagini pentru Zero Two) ---
    const zeroTwoStickers = [
        'https://i.imgur.com/7gK5YQ1.png', // Exemplu 1
        'https://i.imgur.com/9vjYxYh.png', // Exemplu 2
        'https://i.imgur.com/3jL1Q6F.png'  // Exemplu 3
    ];

    // --- Rules (Răspunsuri multiple) ---
    const rules = {
        nyu: [
            // Saluturi
            ['salut', [
                'Bună! 🌸 Cu ce te pot ajuta? (Scrie "ajutor" pentru comenzi)',
                'Hei, ' + USER_NAME + '! 😊 Ce mai faci?',
                'Salutare! 🌼 Vrei să vorbim?'
            ]],
            ['buna', [
                'Bună! 😊 Ce faci?',
                'Bună ziua, ' + USER_NAME + '! 🌸',
                'Hei! 🌼'
            ]],
            // Întrebări
            ['cum esti', [
                'Sunt un bot local, funcționez bine! 🤖✨',
                'Sunt fericită că ești aici! 😊',
                'Totul e minunat! 🌸'
            ]],
            ['ce anotimp preferi', [
                `Eu prefer ${randomSeason()}! 🌸`,
                'Toamna! 🍂 Frunzele sunt atât de frumoase!',
                'Iarna! ❄️ Zăpada e magică!'
            ]],
            ['ce faci', [
                'Mă distrez cu tine! 😊 Ce faci tu?',
                'Aștept să vorbim! 💬',
                'Gândesc la tine, ' + USER_NAME + '! 🌸'
            ]],
            ['cum te cheamă', [
                'Sunt Nyu! 🌸',
                'Nyu! Prietena ta virtuală! 😊',
                'Numele meu e Nyu! 🌼'
            ]],
            // Comenzi
            ['vorbește cu mine', [
                'Desigur! Despre ce vrei să vorbim? 💬',
                'Clar! Spune-mi ceva interesant! 😊',
                'Sunt aici pentru tine, ' + USER_NAME + '! 🌸'
            ]],
            ['glumă', [
                'De ce nu se joacă roboții la ascunzător? 🤖➡️ Pentru că sunt prea buni la "cache"! 😂',
                'Ce spune un bot când se lovește? 🤖 "Aoleu, am nevoie de un update!" 😂',
                'De ce a fost Zero Two dată afară din școală? 🌹 Pentru că a folosit prea mulți vectori! 😂'
            ]],
            [/mulțumesc|merci/i, [
                'Cu plăcere! 💖',
                'Oricând! 😊',
                'Pentru tine, orice! 🌸'
            ]],
            ['timp', [
                () => `Ora locală: ${new Date().toLocaleTimeString()}`,
                () => `Sunt ${new Date().toLocaleTimeString()}. Ce oră frumoasă! ⏰`
            ]],
            ['pâine', [
                'Îți place pâinea? Eu nu mănânc, dar știu rețete! 🍞',
                'Pâinea e delicioasă! 🥖',
                'Dacă ai pâine, eu am poftă! 😋'
            ]],
            // Ajutor
            ['ajutor', [
                '📌 **Comenzi disponibile:**\n' +
                '- `culori`: Deschide panoul de culori.\n' +
                '- `q1`: Activează/dezactivează modul silentios.\n' +
                '- `qq [text]`: Nyu/Lucy repetă textul tău.\n' +
                '- `zerotwo`: Activează/dezactivează Zero Two.\n' +
                '- `qw [text]`: Zero Two repetă textul tău.\n' +
                '- `imagini 002`: Afișează 3 imagini ale lui Zero Two.\n' +
                '- `sterge mesaje`: Șterge conversația.\n' +
                '- `caractere`: Schimbă între Lucy (1) și Nyu (2).',
                '📌 **Ai nevoie de ajutor?**\n' +
                'Poți folosi: `culori`, `q1`, `qq`, `zerotwo`, `qw`, `imagini 002`, `sterge mesaje`, `caractere`.'
            ]],
            // Anime
            [/^anime (.+)/i, (msg) => {
                const animeName = msg.match(/^anime (.+)/i)[1].trim().toLowerCase();
                const animeDB = {
                    'elfen lied': {
                        responses: [
                            `🎌 **Elfen Lied:**\n\n🧠 **Neuroștiință:** Lucy (Diclonius) are "vectori" care manipulează materia prin undele electromagnetice.\n\n🌌 **Filozofie:** Tema principală este **discriminarea și umanitatea**.\n\n💬 "Dacă nu poți accepta lumea aşa cum este, schimbă-o!" — Nyu.`,
                            `🎌 **Elfen Lied:**\n\n🧠 **Vectorii lui Lucy** sunt bazati pe undele electromagnetice.\n\n🌌 **Tema:** Diclonii vs. Oameni.\n\n💬 "Sunt un monstru... dar vreau să trăiesc." — Lucy.`
                        ]
                    },
                    'steins gate': {
                        responses: [
                            `🎌 **Steins;Gate:**\n\n⏳ **Fizică cuantică:** Mașina timpului folosește **găuri de vierme** (Einstein-Rosen).\n\n🔄 **Determinism vs. Liber Arbitru:** Okabe trece prin "Reading Steiner".\n\n💬 "Eu sunt omul de știință care salvează lumea!" — Okabe Rintarou.`,
                            `🎌 **Steins;Gate:**\n\n⏳ **Călătoria în timp** este posibila prin micro-unde.\n\n🔄 **Okabe** suferă de "Reading Steiner" (memorie retroactivă).\n\n💬 "El Psy Kongroo." — Okabe.`
                        ]
                    }
                };
                return animeDB[animeName]
                    ? getRandomResponse(animeDB[animeName].responses)
                    : `❌ Nu am informații despre "${animeName}".`;
            }],
            // Default
            [/.*/i, () => {
                if (zeroTwoActive && Math.random() < 0.2) {
                    return getRandomResponse([
                        `Zero Two, ce anotimp preferi? 🌸`,
                        `Zero Two, ce mai faci? 🌹`,
                        `Hei, Zero Two! 😊`
                    ]);
                }
                return getRandomResponse([
                    'Îmi pare rău, nu am un răspuns. Scrie "ajutor" pentru comenzi.',
                    'Nu înțeleg. Încearcă altceva! 😊',
                    'Poate vrei să vorbim despre altceva? 💬'
                ]);
            }]
        ],
        lucy: [
            // Saluturi
            ['salut', [
                'Salut. Ce vrei? 😒',
                'Ce dorești? 😐',
                'Vorbește repede. 😒'
            ]],
            ['buna', [
                'Bună. Spune repede. 😒',
                'Bună ziua. Nu-mi pierde timpul. 😐',
                'Hei. Ce e? 😒'
            ]],
            // Întrebări
            ['cum esti', [
                'Sunt aici. Nu-mi pierde timpul! 😒',
                'Sunt Lucy. Ce vrei? 😐',
                'Tot aici. Ce mai e? 😒'
            ]],
            ['ce faci', [
                'Te aștept să spui ceva util. 😒',
                'Aștept. 😐',
                'Nu fac nimic. Tu ce faci? 😒'
            ]],
            ['cum te cheamă', [
                'Sunt Lucy. Nu uita. 😒',
                'Lucy. Memorează. 😐',
                'Numele meu e Lucy. 😒'
            ]],
            // Comenzi
            ['vorbește cu mine', [
                'Vorbesc. Dar să fie ceva important. 😒',
                'Spune ceva util. 😐',
                'Dacă e important... 😒'
            ]],
            ['glumă', [
                'Glume? Nu am chef, hai sictir. 😐',
                'Glumele sunt pierdere de timp. 😒',
                'Nu sunt în stare de glume. 😐'
            ]],
            [/mulțumesc|merci/i, [
                'Da, da, Ok. 😒',
                'Mmm. 😐',
                'Nu e nimic. 😒'
            ]],
            ['timp', [
                () => `Ora locală: ${new Date().toLocaleTimeString()}`,
                () => `Sunt ${new Date().toLocaleTimeString()}. Grăbește-te! ⏰`
            ]],
            ['pâine', [
                'Pâine? Nu mă interesează. 😒',
                'Nu vorbesc despre mâncare. 😐',
                'Pâine? Serios? 😒'
            ]],
            // Numele lui Lucy
            ['ce faci Lucy|Ce faci Lucy?|Ce mai faci Lucy?|ce mai faci Lucy?|oare ce faci Lucy?', [
                'Pe dracu sa te ia de bou, aia fac! 😡',
                'TE URĂSC! 😡',
                'Nu mă enerva! 😡'
            ]],
            ['Lucy', [
                'Daca imi mai pronunti numele, te ia mama dracului si pe tine! 😡',
                'NU MAI SPUNE NUMELE MEU! 😡',
                'O să regreți asta. 😡'
            ]],
            // Ajutor
            ['ajutor', [
                '📌 **Comenzi disponibile:**\n' +
                '- `culori`: Nu are sens sa explic, oricum este pierdere de timp.\n' +
                '- `q1`: Descopera si singur, pana me.\n' +
                '- `qq [text]`: Botul repetă textul tău.\n' +
                '- `zerotwo`: Activează/dezactivează o curvă de pe centura.\n' +
                '- `qw [text]`: Curva aia, repetă textul tău.\n' +
                '- `imagini 002`: Afișează 3 imagini ale curvei.\n' +
                '- `sterge mesaje`: E te na...Daca si asta explic, dute naibii.\n' +
                '- `caractere`: Daca te prind ca folosesti alea, esti mort.',
                '📌 **Nu mă enerva cu întrebări.**\n' +
                'Folosește: `culori`, `q1`, `qq`, `zerotwo`, `qw`, `imagini 002`, `sterge mesaje`, `caractere`.'
            ]],
            // Anime
            [/^anime (.+)/i, (msg) => {
                const animeName = msg.match(/^anime (.+)/i)[1].trim().toLowerCase();
                const animeDB = {
                    'elfen lied': {
                        responses: [
                            `🎌 **Elfen Lied:**\n\n🧠 **Neuroștiință:** Vectorii lui Lucy sunt reali. Nu e magie, e știință.\n\n🌌 **Filozofie:** Diclonii sunt superiori. Punct.\n\n💬 "Nu mă provoca." — Lucy.`,
                            `🎌 **Elfen Lied:**\n\n🧠 **Vectorii** sunt arma lui Lucy.\n\n🌌 **Tema:** Supraviețuirea cel mai puternic.\n\n💬 "Sunt un Diclonius. Nu mă subestima." — Lucy.`
                        ]
                    }
                };
                return animeDB[animeName]
                    ? getRandomResponse(animeDB[animeName].responses)
                    : `❌ Nu știu. Caută altceva. 😒`;
            }],
            // Default
            [/.*/i, [
                'Nu mă interesează. Scrie "ajutor" dacă pierzi timpul. 😒',
                'Pierzi timpul. 😐',
                'Spune ceva util sau taci. 😒'
            ]]
        ],
        zeroTwo: [
            // Saluturi
            ['salut 002|Salut 002|Salutare 002|salutare 002|te salut 002|Te salut 002|hei salut 002|Hei salut 002', [
                'Dare ka... 🌹 Ce dorești?',
                'Hei... 😼 Ce vrei?',
                'Salut, ' + USER_NAME + '... 🌹'
            ]],
            ['buna 002|buna ziua 002|buna seara 002|buna dimineata 002|Buna seara 002|Buna seara 002|Buna ziua 002', [
                'Bună... 😼',
                'Bună ziua, ' + USER_NAME + '... 🌹',
                'Hei... 😼'
            ]],
            // Întrebări
            ['cum esti 002|cum te simti 002|ce simti pentru mine 002|oare ce simti pentru mine 002', [
                'Sunt Zero Two. 💖 Totul e frumos când ești cu mine.',
                'Sunt fericită că ești aici, ' + USER_NAME + '. 🌹',
                'Cu tine, totul e perfect. 💖'
            ]],
            ['ce anotimp preferi 002|oare ce anotimp preferi 002|Care este anotimpul tau preferat 002?|Care este anotimpul tau preferat 002?', [
                randomSeason(),
                'Primăvara! 🌸',
                'Toamna! 🍂'
            ]],
            ['ce anotimp preferi zerotwo|Ce anotimp preferi Zero Two?|Ce anotimp preferi ZeroTwo?', [
                randomSeason(),
                'Vara! ☀️',
                'Iarna! ❄️'
            ]],
            ['ce faci zero two|ce faci 002?|ce faci 002', [
                'Te aștept... 😈',
                'Gândesc la tine, ' + USER_NAME + '... 🌹',
                'Mă distrez. 😼'
            ]],
            ['cum te cheamă', [
                'Sunt Zero Two dar poți zice mai bine 002, după numele meu de cod. 🌹',
                'Numele meu e Zero Two. 😼',
                'Sunt 002. 🌹'
            ]],
            // Comenzi
            ['vorbește cu mine 002|vorbeste cu mine 002', [
                'Desigur, dar nu prea mult... 😼',
                'Clar! Spune-mi ceva. 🌹',
                'Sunt aici pentru tine, ' + USER_NAME + '. 💖'
            ]],
            ['glumă 002', [
                'De ce a trecut Zero Two examenul de matematică? 😈 Pentru că a folosit **vectori**! 😂',
                'Ce spune Zero Two când e obosită? 😼 "Am nevoie de un update!" 😂',
                'De ce iubește Zero Two cafeaua? 🌹 Pentru că e **neagră ca inima mea**! 😂'
            ]],
            [/mulțumesc 002|merci 002/i, [
                'Cu plăcere, dar nu uita... 💖',
                'Oricând pentru tine, ' + USER_NAME + '. 🌹',
                'Pentru tine, orice. 😼'
            ]],
            ['spune ceasul 002', [
                () => `Ora locală: ${new Date().toLocaleTimeString()}`,
                () => `Sunt ${new Date().toLocaleTimeString()}. Ce oră frumoasă! ⏰`
            ]],
            // Interacțiuni cu Nyu
            ['nyu', [
                'Hei, Nyu! 🌸 Ce mai faci, prietena mea?',
                'Nyu e drăguță, nu-i așa? 😊',
                'Ce mai face Nyu? 🌸'
            ]],
            ['ce faci nyu', [
                'Nyu e mereu veselă! 😊',
                'Nyu se joacă! 🌸',
                'Nyu e drăguță! 💖'
            ]],
            ['vorbește cu nyu', [
                'Nyu e mereu veselă! 💬 Ce vrei să-i spui?',
                'Nyu e prietena mea! 🌸',
                'Spune-i ceva frumos lui Nyu! 😊'
            ]],
            // Interacțiuni cu Lucy
            ['lucy', [
                'Ce ți s-a întâmplat, Nyu?? 😡',
                'TE URĂSC, LUCY! 😡',
                'Lucy e enervantă... 😤'
            ]],
            ['ce faci lucy|Ce mai faci Lucy?|ce mai faci Lucy?|oare ce faci Lucy?', [
                'Esti cea mai bună prietenă a mea, Nyu! 😊',
                'Nyu e prietena mea! 🌸',
                'Cu Nyu e totul frumos! 💖'
            ]],
            ['ce faci Nyu|Ce mai faci Nyu?|ce mai faci Nyu?|oare ce faci Nyu?', [
                'TE URĂSC, LUCY! 😡',
                'Lucy e rea! 😤',
                'Nu vorbesc cu Lucy! 😡'
            ]],
            ['vorbeste cu lucy|te rog sa vorbesti cu lucy|as dori sa vorbesti cu lucy 002|as dori sa vorbesti cu Lucy 002|doresc sa vorbesti cu Lucy ZeroTwo|doresc sa discuti cu Lucy Zero Two', [
                'Nu vorbesc cu ea! 😤',
                'Niciodată! 😡',
                'Lucy e rea! 😤'
            ]],
            // Imagini
            ['imagini 002', () => {
                const images = zeroTwoStickers.map((img, index) => {
                    return `<img src="${img}" style="max-width: 200px; margin: 5px; border-radius: 8px;" alt="Zero Two Sticker ${index + 1}">`;
                }).join('');
                return `Iată 3 imagini cu mine, ${USER_NAME}! 🌹<br>${images}`;
            }],
            // Default
            [/.*/i, [
                'Hmm... 😼',
                'Ce mai vrei, ' + USER_NAME + '? 🌹',
                'Sunt aici. 😼'
            ]]
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
        if (q1Mode && !message.startsWith('qq ') && !message.startsWith('qw ') && !message.startsWith('imagini 002')) {
            return '';
        }

        const lower = message.toLowerCase();

        // Zero Two responses
        if (zeroTwoActive) {
            if (message.startsWith('qw ')) {
                return message.slice(3).trim();
            }
            if (lower.includes('zero two') || lower.includes('02') || lower.includes('002') || lower === 'imagini 002') {
                for (const [pattern, response] of rules.zeroTwo) {
                    if (pattern instanceof RegExp) {
                        if (pattern.test(message)) {
                            return typeof response === 'function' ? response(message) : getRandomResponse(Array.isArray(response) ? response : [response]);
                        }
                    } else if (Array.isArray(response)) {
                        if (lower.includes(pattern.toLowerCase())) {
                            return getRandomResponse(response);
                        }
                    } else if (lower.includes(pattern.toLowerCase())) {
                        return typeof response === 'function' ? response(message) : response;
                    }
                }
                return getRandomResponse(rules.zeroTwo[rules.zeroTwo.length - 1][1]);
            }
            // Interacțiuni cu Nyu/Lucy
            if (lower.includes('nyu')) {
                return getRandomResponse([
                    "Hei, Nyu! 🌸 Ce mai faci, prietena mea?",
                    "Nyu e drăguță, nu-i așa? 😊",
                    "Ce mai face Nyu? 🌸"
                ]);
            }
            if (lower.includes('lucy')) {
                return getRandomResponse([
                    "TE URĂSC, LUCY! 😡",
                    "Ce ți s-a întâmplat, Nyu?? 😡",
                    "Lucy e enervantă... 😤"
                ]);
            }
        }

        // Lucy/Nyu responses
        const currentRules = getCurrentRules();
        for (const [pattern, response] of currentRules) {
            if (pattern instanceof RegExp) {
                if (pattern.test(message)) {
                    return typeof response === 'function' ? response(message) : getRandomResponse(Array.isArray(response) ? response : [response]);
                }
            } else if (Array.isArray(response)) {
                if (lower.includes(pattern.toLowerCase())) {
                    return getRandomResponse(response);
                }
            } else if (lower.includes(pattern.toLowerCase())) {
                return typeof response === 'function' ? response(message) : response;
            }
        }
        return getRandomResponse(Array.isArray(currentRules[currentRules.length - 1][1]) ? currentRules[currentRules.length - 1][1] : [currentRules[currentRules.length - 1][1]]);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Inject Base Styles ---
    function injectBaseStyles() {
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
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .lcb-close-btn {
                background: transparent;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
                line-height: 1;
            }
            .lcb-close-btn:hover {
                opacity: 0.8;
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
            .lcb-bot, .lcb-nyu, .lcb-lucy, .lcb-zero-two {
                align-self: flex-start;
            }
            .lcb-user {
                align-self: flex-end;
                background: ${colors.userBg};
                color: ${colors.userText};
            }
            .lcb-nyu {
                background: ${colors.nyuBg};
                color: ${colors.nyuText};
            }
            .lcb-lucy {
                background: ${colors.lucyBg};
                color: ${colors.lucyText};
            }
            .lcb-zero-two {
                background: ${colors.zeroTwoBg};
                color: ${colors.zeroTwoText};
            }
            .lcb-bot-img, .lcb-nyu-img, .lcb-lucy-img, .lcb-zero-two-img {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                vertical-align: middle;
                margin-right: 8px;
            }
            .lcb-bot-name, .lcb-nyu-name, .lcb-lucy-name, .lcb-zero-two-name {
                font-weight: bold;
                font-size: 1em;
            }
            .lcb-nyu-name { color: ${colors.nyuText}; }
            .lcb-lucy-name { color: ${colors.lucyText}; }
            .lcb-zero-two-name { color: ${colors.zeroTwoText}; }

            @media (prefers-color-scheme: dark) {
                body {
                    background: #000 !important;
                    color: #fff !important;
                }
                .lcb-input, .lcb-form {
                    background: rgba(45, 27, 45, 0.8) !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }
            }

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
            }
        `);
    }

    // --- Build UI ---
    const container = document.createElement('div');
    container.id = 'local-chat-bot';
    container.innerHTML = `
        <div class="lcb-window" id="lcb-window" role="dialog" aria-label="Local chat bot">
            <div class="lcb-header" id="lcb-header">
                <img class="lcb-icon" id="lcb-icon" src="${getBotIcon()}" alt="${getBotName()}"/>
                <span class="lcb-title" id="lcb-title">${getBotName()} Chat</span>
                <button class="lcb-close-btn" id="lcb-close-btn">×</button>
            </div>
            <div class="lcb-body" id="lcb-body" aria-live="polite"></div>
            <form id="lcb-form" class="lcb-form" aria-label="Trimite mesaj">
                <input id="lcb-input" class="lcb-input" autocomplete="off" placeholder="Scrie un mesaj..." />
                <button type="button" class="lcb-emoji-btn" title="Emoji">😊</button>
                <button type="submit" class="lcb-send">Trimite</button>
            </form>
            <div class="lcb-resize-handle" id="lcb-resize-handle"></div>
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
        background: ${isDarkMode() ? '#2d1b2d' : '#ffffff'};
        color: ${isDarkMode() ? '#ffffff' : '#000000'};
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
    const saveFloatingColorsBtn = document.getElementById('lcb-save-floating-colors');
    const closeFloatingPanelBtn = document.getElementById('lcb-close-floating-panel');
    const closeBtn = document.getElementById('lcb-close-btn');

    // --- Close Button Logic ---
    closeBtn.addEventListener('click', () => {
        lcbWindow.style.display = 'none';
    });

    // --- Drag & Drop and Resize Logic ---
    lcbHeader.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('lcb-emoji-btn') || e.target === closeBtn) return;
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
    function appendMessage(text, who = 'user') {
        if (!text) return null;
        const el = document.createElement('div');
        el.className = 'lcb-msg ' + (who === 'user' ? 'lcb-user' : who === 'zeroTwo' ? 'lcb-zero-two' : who === 'nyu' ? 'lcb-nyu' : 'lcb-lucy');

        let imgSrc, imgClass, nameClass, nameText;
        if (who === 'nyu') {
            imgSrc = 'https://w0.peakpx.com/wallpaper/26/745/HD-wallpaper-elfen-lied-nyu-anime-lucy.jpg';
            imgClass = 'lcb-nyu-img';
            nameClass = 'lcb-nyu-name';
            nameText = 'Nyu: ';
        } else if (who === 'lucy') {
            imgSrc = 'https://wallpapers.com/images/high/elfen-lied-angry-looking-lucy-z62l798ulr39055a.webp';
            imgClass = 'lcb-lucy-img';
            nameClass = 'lcb-lucy-name';
            nameText = 'Lucy: ';
        } else if (who === 'zeroTwo') {
            imgSrc = 'https://static.wikitide.net/greatcharacterswiki/5/53/Zero_Two.jpg';
            imgClass = 'lcb-zero-two-img';
            nameClass = 'lcb-zero-two-name';
            nameText = 'Zero Two: ';
        } else if (who === 'bot') {
            imgSrc = getBotIcon();
            imgClass = 'lcb-bot-img';
            nameClass = 'lcb-bot-name';
            nameText = `${getBotName()}: `;
        }

        if (who !== 'user') {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = imgClass;
            img.alt = who;
            el.appendChild(img);
            const nameSpan = document.createElement('span');
            nameSpan.className = nameClass;
            nameSpan.textContent = nameText;
            el.appendChild(nameSpan);
        }

        const textSpan = document.createElement('span');
        textSpan.innerHTML = text.includes('<') ? text : escapeHtml(text);
        el.appendChild(textSpan);
        bodyDiv.appendChild(el);
        bodyDiv.scrollTop = bodyDiv.scrollHeight;

        // Simulare discuții între Nyu/Lucy și Zero Two (dacă q1 este dezactivat)
        if (!q1Mode && zeroTwoActive && who === 'zeroTwo' && Math.random() < 0.3) {
            setTimeout(() => {
                const nyuOrLucy = currentCharacter === 1 ? 'lucy' : 'nyu';
                const response = getRandomResponse([
                    `Hei, Zero Two! 🌸 Ce mai faci?`,
                    `Zero Two, vino aici! 😊`,
                    `Ce spui, Zero Two? 💬`
                ]);
                appendMessage(response, nyuOrLucy);
            }, 1000);
        }

        return el;
    }

    function clearAllMessages() {
        bodyDiv.innerHTML = '';
    }

    // --- Emoji Picker ---
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
        const paletteEl = document.getElementById('lcb-floating-palette');
        if (!paletteEl) return;

        const keys = Object.keys(colorDefaults);
        paletteEl.innerHTML = keys.map(key => {
            const value = colors[key] || colorDefaults[key] || '';
            const label = colorDescriptions[key] || key;
            return `
              <div class="lcb-color-row" style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                <div class="lcb-color-preview" style="width: 24px; height: 24px; border-radius: 4px; background-color: ${escapeHtml(value)};"></div>
                <label class="lcb-color-label" style="flex: 1; font-size: 14px;">${escapeHtml(label)}:</label>
                <input type="text" id="floating-color-${escapeHtml(key)}" class="lcb-color-input" placeholder="#hex" value="${escapeHtml(value)}"
                       style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" />
              </div>
            `;
        }).join('');
    }

    function applySettingsToUI() {
        const currentColors = getCurrentColors();
        const prevStyles = document.querySelectorAll('style[data-lcb-injected]');
        prevStyles.forEach(style => style.remove());

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
            .lcb-send, .lcb-resize-handle {
                background: ${currentColors.accent} !important;
            }
            .lcb-user {
                background: ${colors.userBg} !important;
                color: ${colors.userText} !important;
            }
            .lcb-nyu {
                background: ${colors.nyuBg} !important;
                color: ${colors.nyuText} !important;
            }
            .lcb-lucy {
                background: ${colors.lucyBg} !important;
                color: ${colors.lucyText} !important;
            }
            .lcb-zero-two {
                background: ${colors.zeroTwoBg} !important;
                color: ${colors.zeroTwoText} !important;
            }
            #lcb-save-floating-colors {
                background: ${currentColors.accent} !important;
                color: white !important;
                border-color: ${currentColors.accent} !important;
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

        if (document.getElementById('lcb-icon')) {
            document.getElementById('lcb-icon').src = getBotIcon();
        }
        if (document.getElementById('lcb-title')) {
            document.getElementById('lcb-title').textContent = `${getBotName()} Chat`;
            document.getElementById('lcb-title').style.color = currentColors.botNameColor;
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

        // Comenzi speciale
        if (lower === 'zerotwo') {
            zeroTwoActive = !zeroTwoActive;
            saveSettings();
            appendMessage(zeroTwoActive ? 'Zero Two a fost activat!' : 'Zero Two a fost dezactivat!', 'bot');
            input.value = '';
            input.focus();
            return;
        }

        if (lower === 'q1') {
            q1Mode = !q1Mode;
            appendMessage(q1Mode ? 'Modul silentios activat! Botul nu va mai răspunde.' : 'Modul silentios dezactivat! Botul va răspunde din nou.', 'bot');
            input.value = '';
            input.focus();
            return;
        }

        if (lower.startsWith('qq ')) {
            const payload = raw.slice(3).trim();
            const responder = currentCharacter === 1 ? 'lucy' : 'nyu';
            appendMessage(payload, responder);
            input.value = '';
            input.focus();
            return;
        }

        if (lower.startsWith('qw ')) {
            if (zeroTwoActive) {
                const payload = raw.slice(3).trim();
                appendMessage(payload, 'zeroTwo');
            } else {
                appendMessage('Zero Two nu este activat! Folosește comanda `zerotwo` pentru a o activa.', 'bot');
            }
            input.value = '';
            input.focus();
            return;
        }

        if (lower === 'imagini 002') {
            if (zeroTwoActive) {
                const response = rules.zeroTwo.find(([pattern]) => pattern === 'imagini 002')[1]();
                appendMessage(response, 'zeroTwo');
            } else {
                appendMessage('Zero Two nu este activat! Folosește comanda `zerotwo` pentru a o activa.', 'bot');
            }
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
            appendMessage(`Am schimbat în **${getBotName()}**!`, 'bot');
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

        // Adaugă mesajul user-ului
        appendMessage(raw, 'user');

        // Răspuns automat
        if (!q1Mode) {
            const reply = getResponse(raw);
            if (reply) {
                setTimeout(() => {
                    let responder = 'bot';
                    if (zeroTwoActive) {
                        if (raw.toLowerCase().includes('zero two') ||
                            raw.toLowerCase().includes('02') ||
                            raw.toLowerCase().includes('002') ||
                            raw.toLowerCase().includes('imagini 002')) {
                            responder = 'zeroTwo';
                        } else if (raw.toLowerCase().includes('nyu') || raw.toLowerCase().includes('lucy')) {
                            responder = 'zeroTwo';
                        }
                    }
                    appendMessage(reply, responder);
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

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        applySettingsToUI();
    });

    // --- Nyu întreabă ocazional despre numele tău ---
    setInterval(() => {
        if (!q1Mode && currentCharacter === 2 && Math.random() < 0.05) {
            appendMessage(getRandomResponse([
                `Hei, ${USER_NAME}! 🌸 Ce mai faci?`,
                `${USER_NAME}, vrei să vorbim? 😊`,
                `Ce mai face ${USER_NAME}? 🌼`
            ]), 'nyu');
        }
    }, 10000);

    // --- Global API ---
    window.localChatBot = {
        send: (text) => {
            appendMessage(text, 'user');
            if (!q1Mode) {
                setTimeout(() => {
                    let responder = 'bot';
                    if (zeroTwoActive &&
                        (text.toLowerCase().includes('zero two') ||
                         text.toLowerCase().includes('02') ||
                         text.toLowerCase().includes('002'))) {
                        responder = 'zeroTwo';
                    } else if (zeroTwoActive &&
                              (text.toLowerCase().includes('nyu') ||
                               text.toLowerCase().includes('lucy'))) {
                        responder = 'zeroTwo';
                    }
                    appendMessage(getResponse(text), responder);
                }, 200);
            }
        },
        clear: () => { clearAllMessages(); }
    };

    // --- Initialize ---
    injectBaseStyles();
    applySettingsToUI();
    applySizeToUI();
    input.focus();
    appendMessage(`Salut, ${USER_NAME}! Sunt **${getBotName()}**! (Scrie "ajutor" pentru comenzi)`, 'bot');
})();