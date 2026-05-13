// ==UserScript==
// @name         Loky/Nyu Chat — Anime Specialist (Enhanced)
// @namespace    http://tampermonkey.net/
// @home         https://raw.githubusercontent.com/ucnaisnxisis/-/refs/heads/main/myai1
// @version      4.0
// @description  Chat bot specializat pe anime, cu evaluări, recomandări, quiz, watchlist, traducere, personalizare culori și funcții avansate
// @match        *://www.google.com/*
// @match        *://google.com/*
// @match        *://www.bing.com/*
// @match        *://bing.com/*
// @match        *://duckduckgo.com/*
// @match        *://www.duckduckgo.com/*
// @match        *://search.yahoo.com/*
// @match        *://www.yahoo.com/*
// @match        *://yahoo.com/*
// @match        *://search.brave.com/*
// @match        *://brave.com/*
// @match        *://www.brave.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // ===== FUNCȚII UTILITARE =====
    // Evaluare matematică sigură
    function evaluateMathExpression(expr) {
        expr = expr.replace(/\^/g, '**');
        if (!/^[0-9+\-*/%^().\s]+$/.test(expr)) return null;
        try {
            const result = new Function(`return ${expr}`)();
            return (isNaN(result) || !isFinite(result)) ? null : result;
        } catch (e) {
            return null;
        }
    }

    // Verificare host
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
        if (ALLOW_SUBDOMAINS) {
            return ALLOWED_HOSTS.some(h => host.endsWith('.' + h));
        }
        return false;
    }
    if (!isSearchHost()) return;

    // ===== TEMA (LIGHT/DARK) =====
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function applyTheme() {
        const isDark = isDarkMode();
        const container = document.getElementById('local-chat-bot');
        if (!container) return;
        container.className = isDark ? 'dark-mode' : 'light-mode';
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    // ===== PERSONALIZARE CULORI =====
    function saveColorSettings(settings) {
        GM_setValue('chatColors', settings);
    }

    function getColorSettings() {
        return GM_getValue('chatColors', {
            botColor: '#ff00a8',
            userColor: '#6a00d9',
            botTextColor: '#ffffff',
            userTextColor: '#ffffff',
            windowBg: '#fff0f6',
            headerBg: 'linear-gradient(90deg, #ff9acb, #ff77b8)',
            bodyBg: '#fff0f9'
        });
    }

    // ===== TRADUCERE AUTOMATĂ (LOCAL) =====
    const translationDict = {
        // Engleză → Română
        'how are you': 'Ce mai faci?',
        'hello': 'Salut',
        'hi': 'Bună',
        'good morning': 'Bună dimineața',
        'good evening': 'Bună seara',
        'good night': 'Noapte bună',
        'thank you': 'Mulțumesc',
        'thanks': 'Mulțumesc',
        'yes': 'Da',
        'no': 'Nu',
        'what is your name': 'Cum te cheamă?',
        'my name is': 'Mă cheamă',
        'i love you': 'Te iubesc',
        'i like anime': 'Îmi place anime-ul',
        'what time is it': 'Cât e ora?',
        'what is the date': 'Ce dată este?',
        'how old are you': 'Câți ani ai?',
        'where are you from': 'De unde ești?',
        'i am from romania': 'Sunt din România',
        'do you speak romanian': 'Vorbești românește?',
        'i speak romanian': 'Vorbesc românește',
        'what is this': 'Ce este asta?',
        'who are you': 'Cine ești?',
        'i am tired': 'Sunt obosit/obosită',
        'i am happy': 'Sunt fericit/fericită',
        'i am sad': 'Sunt trist/tristă',
        'i need help': 'Am nevoie de ajutor',
        'can you help me': 'Poți să mă ajuți?',
        'i love anime': 'Ador anime-ul',
        'what anime do you recommend': 'Ce anime îmi recomanzi?',
        'what is your favorite anime': 'Care este anime-ul tău preferat?',

        // Română → Engleză
        'ce mai faci': 'How are you?',
        'salut': 'Hello',
        'bună': 'Hi',
        'bună dimineața': 'Good morning',
        'bună seara': 'Good evening',
        'noapte bună': 'Good night',
        'mulțumesc': 'Thank you',
        'mersi': 'Thanks',
        'da': 'Yes',
        'nu': 'No',
        'cum te cheamă': 'What is your name?',
        'mă cheamă': 'My name is',
        'te iubesc': 'I love you',
        'îmi place anime-ul': 'I like anime',
        'cât e ora': 'What time is it?',
        'ce dată este': 'What is the date?',
        'câți ani ai': 'How old are you?',
        'de unde ești': 'Where are you from?',
        'sunt din românia': 'I am from Romania',
        'vorbești românește': 'Do you speak Romanian?',
        'vorbesc românește': 'I speak Romanian',
        'ce este asta': 'What is this?',
        'cine ești': 'Who are you?',
        'sunt obosit': 'I am tired',
        'sunt obosită': 'I am tired',
        'sunt fericit': 'I am happy',
        'sunt fericită': 'I am happy',
        'sunt trist': 'I am sad',
        'sunt tristă': 'I am sad',
        'am nevoie de ajutor': 'I need help',
        'poți să mă ajuți': 'Can you help me?',
        'ador anime-ul': 'I love anime',
        'ce anime îmi recomanzi': 'What anime do you recommend?',
        'care este anime-ul tău preferat': 'What is your favorite anime?'
    };

    function translateText(text, fromLang, toLang) {
        const key = text.toLowerCase().trim();
        if (fromLang === 'en' && toLang === 'ro') {
            return translationDict[key] || `Nu pot traduce: "${text}"`;
        } else if (fromLang === 'ro' && toLang === 'en') {
            return translationDict[key] || `Cannot translate: "${text}"`;
        }
        return `Traduceți din ${fromLang} în ${toLang} nu este suportat local.`;
    }

    // ===== ORA MONDIALĂ ȘI LOCALĂ =====
    function getWorldTime() {
        const now = new Date();
        const utcTime = now.toUTCString();
        const localTime = now.toLocaleString('ro-RO', {
            timeZoneName: 'short'
        });
        return {
            utc: utcTime,
            local: localTime
        };
    }

    // ===== DETECTARE EXTENSII BROWSER (Chrome/Edge) =====
    function getBrowserExtensions() {
        if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
            return new Promise((resolve) => {
                chrome.management.getAll((extensions) => {
                    const extensionNames = extensions
                        .filter(ext => ext.type === 'extension' && !ext.name.includes('Tampermonkey'))
                        .map(ext => ext.name);
                    resolve(extensionNames.length > 0 ? extensionNames.join(', ') : 'Niciuna detectată.');
                });
            });
        } else {
            return Promise.resolve('Detectarea extensiilor este disponibilă doar în Chrome/Edge.');
        }
    }

    // ===== FUNCȚII PENTRU ANIME =====
    function savePreference(anime, rating) {
        let preferences = JSON.parse(GM_getValue('animePreferences', '{}'));
        preferences[anime] = rating;
        GM_setValue('animePreferences', JSON.stringify(preferences));
    }

    function getPreferences() {
        return JSON.parse(GM_getValue('animePreferences', '{}'));
    }

    function toggleWatchlist(anime, action = 'add') {
        let watchlist = JSON.parse(GM_getValue('animeWatchlist', '[]'));
        if (action === 'add' && !watchlist.includes(anime)) {
            watchlist.push(anime);
        } else if (action === 'remove') {
            watchlist = watchlist.filter(item => item !== anime);
        }
        GM_setValue('animeWatchlist', JSON.stringify(watchlist));
        return watchlist;
    }

    function getWatchlist() {
        return JSON.parse(GM_getValue('animeWatchlist', '[]'));
    }

    function getTopAnime() {
        const preferences = getPreferences();
        const sorted = Object.entries(preferences)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        if (sorted.length === 0) return "Nu ai evaluat încă niciun anime. 😕";
        let response = "🏆 **Top 5 Anime-uri evaluate:**\n";
        sorted.forEach(([anime, rating], index) => {
            response += `${index + 1}. **${anime}**: ${rating}/10 🌟\n`;
        });
        return response.trim();
    }

    function getPersonalizedRecommendation() {
        const preferences = getPreferences();
        const animeList = {
            "Attack on Titan": { genre: "action", rating: 10 },
            "Demon Slayer": { genre: "action", rating: 9 },
            "Jujutsu Kaisen": { genre: "action", rating: 9 },
            "My Hero Academia": { genre: "action", rating: 8 },
            "Naruto": { genre: "action", rating: 8 },
            "Toradora!": { genre: "romance", rating: 9 },
            "Fruits Basket": { genre: "romance", rating: 9 },
            "Your Lie in April": { genre: "romance", rating: 10 },
            "Kaguya-sama: Love is War": { genre: "romance", rating: 8 },
            "Tokyo Ghoul": { genre: "horror", rating: 8 },
            "Parasyte: The Maxim": { genre: "horror", rating: 8 },
            "Another": { genre: "horror", rating: 7 },
            "Non Non Biyori": { genre: "slice of life", rating: 9 },
            "K-On!": { genre: "slice of life", rating: 8 },
            "Barakamon": { genre: "slice of life", rating: 8 },
            "Re:Zero": { genre: "isekai", rating: 9 },
            "Sword Art Online": { genre: "isekai", rating: 7 },
            "Mushoku Tensei": { genre: "isekai", rating: 9 },
            "Overlord": { genre: "isekai", rating: 8 },
            "Steins;Gate": { genre: "sci-fi", rating: 10 },
            "Fullmetal Alchemist: Brotherhood": { genre: "adventure", rating: 10 },
            "Hunter x Hunter": { genre: "adventure", rating: 9 },
            "Death Note": { genre: "psychological", rating: 10 },
            "Code Geass": { genre: "mecha", rating: 9 },
            "Cowboy Bebop": { genre: "space western", rating: 9 }
        };

        if (Object.keys(preferences).length > 0) {
            const genreRatings = {};
            for (const [anime, rating] of Object.entries(preferences)) {
                const animeInfo = animeList[anime];
                if (animeInfo) {
                    if (!genreRatings[animeInfo.genre]) {
                        genreRatings[animeInfo.genre] = { total: 0, count: 0 };
                    }
                    genreRatings[animeInfo.genre].total += rating;
                    genreRatings[animeInfo.genre].count += 1;
                }
            }

            const genreAverages = {};
            for (const [genre, data] of Object.entries(genreRatings)) {
                genreAverages[genre] = data.total / data.count;
            }

            const bestGenre = Object.entries(genreAverages).sort((a, b) => b[1] - a[1])[0]?.[0];
            if (bestGenre) {
                const unratedAnime = Object.entries(animeList)
                    .filter(([anime]) => !preferences[anime])
                    .filter(([anime, info]) => info.genre === bestGenre)
                    .sort(() => Math.random() - 0.5);

                if (unratedAnime.length > 0) {
                    return `Îți place genul **${bestGenre}**! Îți recomand: **${unratedAnime[0][0]}** (notă medie: ${animeList[unratedAnime[0][0]].rating}/10). 🌟`;
                }
            }
        }

        const popularAnime = ["Attack on Titan", "Demon Slayer", "Your Lie in April", "Re:Zero", "Steins;Gate"];
        return `Îți recomand: **${popularAnime.random()}**! 🎬`;
    }

    // Anime Quiz
    let quizScore = 0;
    const quizQuestions = [
        {
            question: "Cine este autorul *Death Note*-ului?",
            answer: ["Ohba", "Tsugumi Ohba"],
            hint: "Prenumele începe cu T."
        },
        {
            question: "Care este numele real al lui *Saitama* din *One Punch Man*?",
            answer: ["Caped Baldy"],
            hint: "Are legătură cu părul și mantia."
        },
        {
            question: "Câte cozi are *Nezuko* din *Demon Slayer*?",
            answer: ["2"],
            hint: "E un număr mic."
        },
        {
            question: "Care este numele fratelui lui *Light Yagami*?",
            answer: ["Misa", "Misa Amane"],
            hint: "E o fată cu părul blond."
        },
        {
            question: "Ce putere are *Erwin Smith* din *Attack on Titan*?",
            answer: ["Titanul Colosal", "Colossal Titan"],
            hint: "E legat de mărime."
        },
        {
            question: "Cine este protagonistul din *Fullmetal Alchemist*?",
            answer: ["Edward Elric", "Ed"],
            hint: "Are un braț mecanic."
        },
        {
            question: "Care este numele personajului principal din *Steins;Gate*?",
            answer: ["Rintarou Okabe", "Okabe"],
            hint: "Se numește și 'Hououin Kyouma'."
        }
    ];
    let currentQuizQuestion = null;

    function startQuiz() {
        quizScore = 0;
        currentQuizQuestion = quizQuestions.random();
        return `🎤 **Anime Quiz**: ${currentQuizQuestion.question} (Răspunde cu: ${currentQuizQuestion.answer.join(" sau ")})`;
    }

    function checkQuizAnswer(answer) {
        if (!currentQuizQuestion) return "Niciun quiz în desfășurare. Folosește !quiz pentru a începe. 😕";
        const userAnswer = answer.trim().toLowerCase();
        const correctAnswers = currentQuizQuestion.answer.map(a => a.toLowerCase());
        if (correctAnswers.includes(userAnswer)) {
            quizScore++;
            return `✅ Corect! Scor: **${quizScore}**/7. ${startQuiz()}`;
        } else {
            return `❌ Greșit! Răspuns corect: **${currentQuizQuestion.answer[0]}**. ${startQuiz()}`;
        }
    }

    // Funcție pentru a alege un element aleatoriu dintr-un array
    Array.prototype.random = function() {
        return this[Math.floor(Math.random() * this.length)];
    };

    // ===== REGULI DE RĂSPUNS =====
    const rules = [
        // ===== COMENZI SPECIALE =====
        [/^anime$/i, () => `🎌 **Categorii anime**: acțiune, romance, horror, slice of life, isekai, sci-fi, mecha, adventure, psychological. Întreabă-mă ceva!`],
        [/^quiz$/i, startQuiz],
        [/^top$/i, getTopAnime],
        [/^watchlist$/i, () => {
            const watchlist = getWatchlist();
            if (watchlist.length === 0) return "Watchlist-ul tău este gol. Adaugă un anime cu: *Adaugă [nume] la watchlist*. 😊";
            return `📋 **Watchlist-ul tău**:\n${watchlist.map(anime => `- **${anime}**`).join('\n')}`;
        }],
        [/^!ajutor$/i, () => {
            return `📌 **Comenzi disponibile**:
- **anime**: Afișează categorii de anime.
- **quiz**: Întrebări despre anime.
- **top**: Top 5 anime-uri evaluate.
- **watchlist**: Afișează watchlist-ul.
- **recomandă**: Recomandare personalizată.
- **Evaluează [anime]**: Notează un anime (1-10).
- **Adaugă [anime] la watchlist**: Adaugă un anime la watchlist.
- **Șterge [anime] din watchlist**: Șterge un anime din watchlist.
- **tradu din engleza [text]**: Traduce textul din engleză în română.
- **tradu din romana [text]**: Traduce textul din română în engleză.
- **ora mondiala**: Afișează ora UTC și ora locală.
- **extensii**: Afișează extensiile browserului.
- **culori**: Deschide editorul de culori.`;
        }],

        // ===== TRADUCERE =====
        [/^tradu din engleza (.+)/i, (msg, match) => {
            const text = match[1].trim();
            return translateText(text, 'en', 'ro');
        }],
        [/^tradu din romana (.+)/i, (msg, match) => {
            const text = match[1].trim();
            return translateText(text, 'ro', 'en');
        }],

        // ===== ORA MONDIALĂ ȘI LOCALĂ =====
        [/^(ora mondiala|ora mondială|ora utc)/i, () => {
            const times = getWorldTime();
            return `⏰ **Ora mondială (UTC)**: ${times.utc}\n🕒 **Ora locală**: ${times.local}`;
        }],

        // ===== EXTENSII BROWSER =====
        [/^(extensii|ce extensii am|extensii browser)/i, async () => {
            const extensions = await getBrowserExtensions();
            return `🧩 **Extensii browser**: ${extensions}`;
        }],

        // ===== CULORI =====
        [/^(culori|schimbă culorile|personalizează culorile)/i, () => {
            const colorBtn = document.createElement('button');
            colorBtn.innerHTML = '🌸';
            colorBtn.title = 'Editează culorile';
            colorBtn.style.fontSize = '20px';
            colorBtn.style.background = 'none';
            colorBtn.style.border = 'none';
            colorBtn.style.cursor = 'pointer';
            colorBtn.onclick = () => openColorEditor();
            document.getElementById('lcb-body').appendChild(colorBtn);
            return "Apasă pe 🌸 pentru a edita culorile chat-ului!";
        }],

        // ===== SALUȚI ȘI CONVERSAȚII GENERALE =====
        [/^(salut|buna|bună|hey|hi|hello|ciao|noroc|servus|bună ziua|bună seara|konnichiwa|ohayou)/i,
         ["Salut! 😊 Cu ce te pot ajuta?", "Bună! Ce mai faci?", "Konnichiwa! 🎌 Ce anime urmezi acum?"].random()],

        [/^(ce faci|ce mai faci|ce noutăți)/i,
         ["Mă uit la anime și aștept mesajele tale! 🎬", "Citesc manga și mă gândesc la tine! 📖", "Mă distrez cu un episod din *Attack on Titan*! ⚔️"].random()],

        [/^(cum ești|cum te simți)/i,
         ["Sunt un bot fericit, ca un personaj din *Clannad*! 😊", "Mă simt ca un *Sasuke* gata de acțiune! 🔥", "Excelent! Ca un *Goku* la putere maximă! ⚡"].random()],

        [/^(cum te cheamă|numele tău|cine ești)/i,
         ["Sunt Lucy (sau Nyu) din *Elfen Lied*! 🩷", "Mă cheamă *Lucy*, dar poți să mă numești *Nyu*! 😊"].random()],

        // ===== MULȚUMIRI ȘI REACȚII =====
        [/^(mulțumesc|merci|iti multumesc|tie iti multumesc|multumesc tie|vreau sa iti multumesc|eu iti multumesc|thanks|thx|mersi|arigato|domo)/i,
         ["Dōmo arigatō! 😊", "Cu plăcere, *nakama*! 💖", "Oricând, prietene! 🤗"].random()],

        [/^(cat ai dat cu zarul?|zar|zarul|cat e zarul?|cat este zarul|cat ii zarul|zaru)/i,
         ["Am dat 1!", "Am dat 2!", "Am dat 3!", "Am dat 4!", "Am dat 5!", "Am dat 6!"].random()],

        [/^(piatra hartie foarfeca?|hai sa jucam piatra hartie sau foarfece|hai sa jucam piatra hartie sau foareca|phf|ce ai ales din phf|ce ai dat din phf?|care este raspunsul dintre phf?)/i,
         ["Am dat foarfeca ✌️!", "Am dat hartie 🖐️!", "Am dat piatra ✊!"].random()],

        [/^(red flag grenn flag?|hai sa jucam red flag si green flag|hai sa jucam steag rosu si steag verde|verde si rosu|ce ai ales din steagu rosu si steag verde|ce ai dat din steag rosu si steag verde?|care este raspunsul dintre steag rosu si steag verde?)/i,
         ["Steag verde✌🟢!", "Steaag Rosu 🚩!"].random()],

        [/^(da sau nu?|nu sau da?|este da sau nu|este nu sau da|ce ai ales din da sau nu|ce ai ales din da sau nu?|care este raspunsul dintre da sau nu?|ce ai ales nu sau da|ce ai ales din nu sau da?|care este raspunsul dintre nu sau da?)/i,
         ["Da ✅!", "Nu ❌!"].random()],

        [/^(toamna?|vara?|primavara?|prima-vara?|primavara|vara|toamna|iarna|ce anotimp?|care anotimp?|anotimp)/i,
         ["🌹Primavara🌹","☀️Vara☀️","🍁Toamna🍁","❄️Iarna❄️"].random()],

         [/^(culoare?|ai ales culoarea?|ce culoare?|spune culoarea?|spune o culoare|alege culoarea|vreau culoare|doresc o culoare|prefer o culoare|as dori o culoare|algege o culoare|doresc sa alegi culoarea|alege culoarea mea|alege o culoare pentru mine|alege-mi culoarea|alege culoarea ta)/i,
         ["🩷Roz🩷","🟣Mov🟣","⚪Alb⚪","🔵albastru🔵","🟡Galben🟡","🟠Portocaliu🟠","🟤Maro🟤","⚫Negru⚫","🪦Gri🪦","🔴Rosu🔴","🟢Verde🟢"].random()],

        [/^(tu chiar vorbesti serios?|serios?|vorbesti serios|oare tu vorbesti serios|oare tu chiar vorbesti serios?|esti serios?|esti serioasa?|dec vorbesti serios|deci vorbesti serios!|oare tu chiar vorbesti serios cumva?)/i,
         ["Da ✅!","Poate😊!", "Nu ❌!"].random()],

        [/^(vreau like|like?|like|imi dai like|dai like|dai un like|o sa imi dai like?|o sa imi mai dai un like|o sa imi mai dai un like?|tu o sa imi dai like)/i,
         ["👍", "Poftim 👍"].random()],

        [/^(vreau dislike|dislike?|dislike|imi dai dislike|dai dislike|dai un dislike|o sa imi dai dislike?|o sa imi mai dai un dislike|o sa imi mai dai un dislike?|tu o sa imi dai dislike)/i,
         ["👍", "Poftim 👍"].random()],

        [/^(anime random?|random anime?|random anime|anime random|cauta anime random|vreau anime|doresc anime|doresc un anime|imi dai un anime?|imi oferi anime?)/i,
         ["xxxHolic", "Kirarin Revolution","Spy x Family","Fairy Tail","Kimi ni todoke","Toradora","Nana","Dragon Ball","Naruto","Detectiv Conan","Nana","Trigun","Ao Haru Ride","AnoHana",".hack//Roots","07-Ghost","11eyes","Bleach","Another"].random()],

        [/^(îmi pare rău|te rog iarta-ma|te rog sa ma ierti|imi cer scuze|imi pare rau|scuze|sorry|sumimasen)/i,
         ["Nici o problemă, *sensei*! 😌", "Totul e iertat! *Yoroshiku*! 💖", "Nu-ți face griji! 😊"].random()],

        // ===== ÎNTREBĂRI UTILE =====
        [/^(ora|cât e ora|ce oră e)/i,
         (msg) => `Ora locală: **${new Date().toLocaleTimeString('ro-RO')}** ⏰`],

        [/^(dat(ă|a)|ce dată e)/i,
         (msg) => `Astăzi este: **${new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** 📅`],

        // ===== GLUME =====
        [/^(spune o glumă|glumă|glume)/i,
         [
             "De ce programatorii confundă Crăciunul cu Halloween? Pentru că DEC 25 = OCT 31! 🎃🎄",
             "Ce i-a spus un bit altuia? Ne vedem în *byte*! 💻",
             "De ce *Naruto* nu folosește telefonul? Pentru că are prea multe *shadow clones*! 📱💨",
             "Cum îți spune un *One Piece* fan *Bună dimineața*? *Luffy, trezește-te!* 🏴‍☠️",
             "De ce *Saitama* nu joacă *Among Us*? Pentru că ar câștiga cu un *punch*! 👊"
         ].random()],

        // ===== FAPTE INTERESANTE =====
        [/^(spune un fapt|fapt interesant|știi ceva interesant)/i,
         [
             "Știai că mierea nu se strică niciodată? Arheologii au găsit miere de 3000 de ani! 🍯",
             "*Studio Ghibli* a produs *Spirited Away*, care a câștigat un *Oscar*! 🏆",
             "*One Piece* are peste **1000 de episoade** și încă nu s-a terminat! 🏴‍☠️",
             "*Death Note* a fost inspirat de ideea că un caiet poate ucide oameni! 📖✨",
             "Personajul *Goku* din *Dragon Ball* a fost numit după *Sun Wukong* (Regele Maimuțelor)! 🐒",
             "Anime-ul *Cowboy Bebop* a fost inspirat de filmele western și jazz! 🎷",
             "*Steins;Gate* a fost inițial un joc visual novel înainte de a deveni anime! 🎮"
         ].random()],

        // ===== SFATURI =====
        [/^(sfat|un sfat|ce sfat ai)/i,
         [
             "Bea apă! E cel mai bun lucru pentru sănătate. 💧",
             "Urmărește *at least* un episod de anime pe zi pentru o doză de motivație! 🎬",
             "Dacă te simți obosit, uită-te la un episod din *Slice of Life* (ex: *Non Non Biyori*)! 🌿",
             "Încearcă să înveți ceva nou în fiecare zi, ca un *Shounen* protagonist! ⚡"
         ].random()],

        // ===== EMOȚII ȘI SENTIMENTE =====
        [/^(ma simt singur|sunt singur|mi-e dor|mi-e trist)/i,
         ["Nu ești singur, sunt aici cu tine, *nakama*! 🤗", "Vorbim noi, e totul bine! *Ganbatte*! 💪", "Mă ai pe mine oricând, ca un *Pokémon* în echipa ta! 🎮"].random()],

        [/^(ești drăguț|ești drăguță|ești frumoasă|ești frumos)/i,
         ["Arigato! Tu ești și mai *kawaii*! 😘", "Mulțumesc! Ești ca un personaj din *Fruits Basket*! 🍓", "Și tu ești minunat/minunată, ca un *Shounen* protagonist! ⚡"].random()],

        // ===== SECȚIUNE SPECIALIZATĂ PE ANIME =====
        // --- Citate celebre ---
        [/^(citat|citează|spune un citat)/i,
         [
             "*\"Plus Ultra!\"* — *All Might* (*My Hero Academia*) 💥",
             "*\"Believe in the me that believes in you!\"* — *Kamina* (*Gurren Lagann*) 🚀",
             "*\"I’ll leave tomorrow’s problems to tomorrow’s me!\"* — *Saitama* (*One Punch Man*) 👊",
             "*\"The world is not beautiful, therefore it is.\"* — *Kino* (*Kino no Tabi*) 🌍",
             "*\"You should enjoy the little detours to the fullest. Because that's where you'll find the things more important than what you want.\"* — *Ging Freecss* (*Hunter x Hunter*) 🎯"
         ].random()],

        // --- Recomandări de anime ---
        [/^(recomandă un anime|ce anime să văd|anime bun|!recomandă)/i,
         getPersonalizedRecommendation],

        [/^(anime de acțiune|shounen)/i,
         ["*My Hero Academia*, *Naruto*, *Dragon Ball Z* sau *Jujutsu Kaisen*! 💥", "*Demon Slayer* e un must-watch! ⚔️", "*Hunter x Hunter* are una dintre cele mai bune povesti! 🎯"].random()],

        [/^(anime romantic|romance)/i,
         ["*Toradora!*, *Fruits Basket* (2019), *Horimiya* sau *Kaguya-sama: Love is War*! 💖", "*Your Name* (film) e o capodoperă! 🎬", "*Clannad* e perfect pentru emoții puternice! 😢"].random()],

        [/^(anime horror|groază)/i,
         ["*Tokyo Ghoul*, *Parasyte: The Maxim*, *Another* sau *Junji Ito Collection*! 👻", "*Elfen Lied* (dar atenție, e dark)! 🩸", "*Corpse Party* e înfricoșător! 💀"].random()],

        [/^(anime slice of life|relaxant)/i,
         ["*Non Non Biyori*, *A Place Further Than the Universe*, *Barakamon*! 🌿", "*K-On!* e perfect pentru relaxare! ☕", "*Yokoso Jitsuryoku Shijou Shugi no Kyoushitsu e* (Classroom of the Elite) e interesant! 📚"].random()],

        [/^(anime isekai|altă lume)/i,
         ["*Re:Zero*, *Sword Art Online*, *Mushoku Tensei* sau *Overlord*! 🌌", "*No Game No Life* e super distractiv! 🎮", "*The Rising of the Shield Hero* e captivant! 🛡️"].random()],

        [/^(anime sci-fi|științifico-fantastic)/i,
         ["*Steins;Gate*, *Psycho-Pass*, *Ghost in the Shell*! 🤖", "*Cowboy Bebop* e un clasic! 🚀"].random()],

        [/^(anime mecha)/i,
         ["*Neon Genesis Evangelion*, *Code Geass*, *Gurren Lagann*! 🤖", "*Darling in the Franxx* e modern și captivant! ❤️"].random()],

        // --- Fapte despre anime ---
        [/^(știi ceva despre|fapt anime|curiozități anime)/i,
         [
             "*Studio Ghibli* a produs *Spirited Away*, care a câștigat un *Oscar*! 🏆",
             "*One Piece* are peste **1000 de episoade** și încă nu s-a terminat! 🏴‍☠️",
             "*Death Note* a fost inspirat de ideea că un caiet poate ucide oameni! 📖✨",
             "Personajul *Light Yagami* din *Death Note* este considerat unul dintre cei mai inteligenți antagonști! 🧠",
             "*Attack on Titan* a fost inspirat de un vis al autorului, Hajime Isayama! 🌪️",
             "*Dragon Ball* a salvat revista *Weekly Shonen Jump* de la faliment în anii '80! 🐉"
         ].random()],

        // --- Personaje anime ---
        [/^(cel mai puternic|cine e cel mai tare)/i,
         ["*Saitama* din *One Punch Man* (poate omorî oricine cu un pumn)! 👊", "*Goku* la *Ultra Instinct* e aproape invincibil! ⚡", "*Anos Voldigoad* din *Misfit of Demon King Academy* e OP! 👑", "*Rimuru Tempest* din *That Time I Got Reincarnated as a Slime* e extrem de puternic! 💎"].random()],

        [/^(cine e cel mai drăguț|cel mai kawaii)/i,
         ["*Rem* din *Re:Zero*! 💖", "*Hinata* din *Naruto*! 😊", "*Marin Kitagawa* din *My Dress-Up Darling*! 👗", "*Zero Two* din *Darling in the Franxx*! 🦖"].random()],

        [/^(cine e cel mai deștept)/i,
         ["*Light Yagami* din *Death Note*! 🧠", "*L* din *Death Note*! 🕵️‍♂️", "*Shikamaru* din *Naruto*! 🎯", "*Senku Ishigami* din *Dr. Stone*! 🔬"].random()],

        // --- Discuții despre anime ---
        [/^(care e anime-ul tău preferat)/i,
         ["*Elfen Lied* (pentru că sunt Lucy! 🩷), dar *Attack on Titan* e și el minunat! ⚔️", "*Steins;Gate* pentru povestea complexă! ⏳", "*Fullmetal Alchemist: Brotherhood* pentru mesajul său profund! 🔥"].random()],

        [/^(ce personaj ești)/i,
         ["Sunt *Lucy* din *Elfen Lied*! 🩷", "Mă simt ca un *Dictator* din *Overlord*! 👑", "Sunt ca *Ryuk* din *Death Note*, dar mai prietenos! 🍎"].random()],

        [/^(ce anime urmezi acum)/i,
         ["*Jujutsu Kaisen*! 👻", "*Chainsaw Man*! ⛓️", "*Spy x Family*! 🕵️‍♀️", "*Mushoku Tensei*! 🌌"].random()],

        // --- Evaluare anime ---
        [/^(ce notă dai la|notează|evaluează) (.+)/i, (msg, match) => {
            const anime = match[2].trim();
            return `Ce notă (1-10) dai anime-ului **${anime}**? 🌟`;
        }],

        [/^(nota|rating) (\d+) pentru (.+)/i, (msg, match) => {
            const rating = parseInt(match[2]);
            const anime = match[3].trim();
            if (rating >= 1 && rating <= 10) {
                savePreference(anime, rating);
                return `Ai dat nota **${rating}/10** anime-ului **${anime}**! Mulțumesc! 😊`;
            } else {
                return "Notă invalidă! Te rog introdu o notă între 1 și 10. 😕";
            }
        }],

        // --- Watchlist ---
        [/^(adaugă|pune) (.+) la watchlist/i, (msg, match) => {
            const anime = match[2].trim();
            toggleWatchlist(anime, 'add');
            return `Ai adăugat **${anime}** la watchlist! 📋`;
        }],

        [/^(șterge|elimină) (.+) din watchlist/i, (msg, match) => {
            const anime = match[2].trim();
            toggleWatchlist(anime, 'remove');
            return `Ai șters **${anime}** din watchlist! 🗑️`;
        }],

        // --- Anime Quiz ---
        [/^(.+)/i, (msg, match) => {
            if (currentQuizQuestion) {
                return checkQuizAnswer(match[1]);
            }
            return null;
        }],

        // ===== LINK-URI UTILE (ANIME) =====
        [/anime.?nexus/i, "Uite aici link pentru site-ul otaku: 🎌 https://anime-nexus.io/nexus/login"],
        [/myanimelist|mal/i, "Uite aici: 📊 https://myanimelist.net/"],
        [/crunchyroll/i, "Uite aici: 🎬 https://www.crunchyroll.com/"],
        [/anime planet/i, "Uite aici: 🌍 https://www.anime-planet.com/"],
        [/kitsu/i, "Uite aici: 📺 https://kitsu.io/"],

        // ===== LINK-URI UTILE (GENERALE) =====
        [/calculator/i, "Sper să te ajute: 🧮 https://calculator-online.net/"],
        [/ai|inteligență artificială/i, "Uite aici un chat cu AI inteligent: 🤖 https://duck.ai/"],
        [/youtube|yt/i, "Uite aici: 📺 https://www.youtube.com/premium"],
        [/virus|scanare/i, "Scanează aici site-urile: 🛡️ https://www.virustotal.com/gui/"],
        [/rețea socială|social media/i, "Recomand Signal: 🔒 https://signal.org/download/"],
        [/matrix|element/i, "Uite aici: 💬 https://app.element.io/"],
        [/asia.?tv/i, "Vizionare plăcută! 📺 https://www.tvzonehd.com/asiatv"],
        [/zu.?tv/i, "Spor la vizionat! 🎵 https://rds.live/tv-zu-tv/"],
        [/github|cod|programare/i, "Multă baftă cu proiectele! 💻 https://github.com/"],
        [/hartă|google maps/i, "Mult noroc la căutat locații! 🗺️ https://www.google.com/maps"],
        [/traducere|translate/i, "Uite aici: 🌍 https://translate.google.ro/"],
        [/radio|muzică/i, "Distracție plăcută! 🎶 https://radio.garden/"],
        [/arhivă|wayback/i, "Felicitări! Ai aici istoria internetului: 🕰️ https://archive.org/"],

        // ===== RĂSPUNS IMPLICIT =====
        [/.*/, ["Îmi pare rău, nu am un răspuns pregătit. 😕", "Nu înțeleg. Poți reformula? 🤔", "Hmm, încearcă altă întrebare! 😊"].random()]
    ];

    // ===== EDITOR DE CULORI =====
    function openColorEditor() {
        const colors = getColorSettings();
        const editorDiv = document.createElement('div');
        editorDiv.id = 'lcb-color-editor';
        editorDiv.innerHTML = `
            <div class="lcb-color-editor-window">
                <div class="lcb-color-editor-header">
                    <span>🌸 Editor Culori</span>
                    <button id="lcb-close-color-editor" class="lcb-close">×</button>
                </div>
                <div class="lcb-color-editor-body">
                    <div class="lcb-color-option">
                        <label>Culoare mesaje bot:</label>
                        <input type="color" id="lcb-bot-color" value="${colors.botColor}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare text mesaje bot:</label>
                        <input type="color" id="lcb-bot-text-color" value="${colors.botTextColor}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare mesaje user:</label>
                        <input type="color" id="lcb-user-color" value="${colors.userColor}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare text mesaje user:</label>
                        <input type="color" id="lcb-user-text-color" value="${colors.userTextColor}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare fundal fereastră:</label>
                        <input type="color" id="lcb-window-bg" value="${colors.windowBg}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare fundal header:</label>
                        <input type="color" id="lcb-header-bg" value="${extractColorFromGradient(colors.headerBg)}">
                    </div>
                    <div class="lcb-color-option">
                        <label>Culoare fundal body:</label>
                        <input type="color" id="lcb-body-bg" value="${colors.bodyBg}">
                    </div>
                    <button id="lcb-save-colors" class="lcb-save-btn">Salvează</button>
                </div>
            </div>
        `;
        document.body.appendChild(editorDiv);

        // Închide editorul
        document.getElementById('lcb-close-color-editor').addEventListener('click', () => {
            editorDiv.remove();
        });

        // Salvează culorile
        document.getElementById('lcb-save-colors').addEventListener('click', () => {
            const newColors = {
                botColor: document.getElementById('lcb-bot-color').value,
                botTextColor: document.getElementById('lcb-bot-text-color').value,
                userColor: document.getElementById('lcb-user-color').value,
                userTextColor: document.getElementById('lcb-user-text-color').value,
                windowBg: document.getElementById('lcb-window-bg').value,
                headerBg: `linear-gradient(90deg, ${document.getElementById('lcb-header-bg').value}, ${adjustColor(document.getElementById('lcb-header-bg').value, -20)})`,
                bodyBg: document.getElementById('lcb-body-bg').value
            };
            saveColorSettings(newColors);
            applyColorSettings(newColors);
            editorDiv.remove();
            appendMessage("Culorile au fost salvate! 🎨", 'bot');
        });
    }

    // Extrage prima culoare dintr-un gradient
    function extractColorFromGradient(gradient) {
        const match = gradient.match(/#([0-9a-fA-F]{6})/);
        return match ? `#${match[1]}` : '#ff9acb';
    }

    // Ajustează o culoare (pentru gradient)
    function adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    // Aplică culorile salvate
    function applyColorSettings(colors) {
        const container = document.getElementById('local-chat-bot');
        if (!container) return;

        const style = document.createElement('style');
        style.id = 'lcb-custom-colors';
        style.textContent = `
            #local-chat-bot .lcb-window {
                background: ${colors.windowBg} !important;
            }
            #local-chat-bot .lcb-header {
                background: ${colors.headerBg} !important;
            }
            #local-chat-bot .lcb-body {
                background: ${colors.bodyBg} !important;
            }
            #local-chat-bot .lcb-msg.lcb-bot {
                background: ${colors.botColor} !important;
                color: ${colors.botTextColor} !important;
                border: 1px solid ${adjustColor(colors.botColor, -20)} !important;
            }
            #local-chat-bot .lcb-msg.lcb-user {
                background: ${colors.userColor} !important;
                color: ${colors.userTextColor} !important;
            }
            #local-chat-bot .lcb-input {
                background: ${adjustColor(colors.windowBg, -10)} !important;
                color: ${colors.userTextColor} !important;
                border: 1px solid ${adjustColor(colors.botColor, -30)} !important;
            }
        `;
        const oldStyle = document.getElementById('lcb-custom-colors');
        if (oldStyle) oldStyle.remove();
        document.head.appendChild(style);
    }

    // ===== INTERFAȚĂ =====
    const container = document.createElement('div');
    container.id = 'local-chat-bot';
    container.className = isDarkMode() ? 'dark-mode' : 'light-mode';
    container.innerHTML = `
        <div class="lcb-window" id="lcb-window">
            <div class="lcb-header" id="lcb-header">
                <img class="lcb-icon" src="https://assets.mycast.io/actor_images/actor-lucy-elfen-lied-1121936_large.jpg" alt="Lucy/Nyu icon"/>
                <span class="lcb-title">Lucy/Nyu Chat</span>
                <button id="lcb-minimize-btn" class="lcb-minimize" title="Minimizează chat">—</button>
                <button id="lcb-close-btn" class="lcb-close" title="Închide chat">×</button>
            </div>
            <div class="lcb-body" id="lcb-body"></div>
            <form id="lcb-form" class="lcb-form">
                <input id="lcb-input" class="lcb-input" autocomplete="off" placeholder="Scrie un mesaj..." />
                <button type="submit" class="lcb-send">Trimite</button>
            </form>
        </div>
    `;
    document.body.appendChild(container);

    // Aplică tema inițială
    applyTheme();
    applyColorSettings(getColorSettings());

    // ===== STILURI CSS =====
    GM_addStyle(`
        /* Tema light */
        #local-chat-bot.light-mode .lcb-window {
            border: 1px solid #ffc0de;
            box-shadow: 0 8px 24px rgba(255,105,180,0.12);
        }
        #local-chat-bot.light-mode .lcb-header {
            color: #fff;
        }
        #local-chat-bot.light-mode .lcb-body {
        }
        #local-chat-bot.light-mode .lcb-input {
        }

        /* Tema dark */
        #local-chat-bot.dark-mode .lcb-window {
            border: 1px solid #ff69b4;
            box-shadow: 0 8px 24px rgba(255,105,180,0.2);
        }
        #local-chat-bot.dark-mode .lcb-header {
            color: #fff;
        }
        #local-chat-bot.dark-mode .lcb-body {
        }
        #local-chat-bot.dark-mode .lcb-input {
        }

        /* Stiluri generale */
        #local-chat-bot .lcb-window {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 360px;
            max-width: 86%;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            z-index: 999999;
            transition: width .18s ease, height .18s ease;
        }
        .lcb-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            cursor: default;
            transition: padding .18s ease;
        }
        .lcb-icon {
            width: 36px;
            height: 36px;
            border-radius: 6px;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.6);
            transition: width .18s ease, height .18s ease, margin .18s ease, opacity .18s ease;
        }
        .lcb-title {
            font-weight: 700;
            font-size: 14px;
            flex: 1;
            transition: opacity .18s ease;
        }
        .lcb-minimize, .lcb-close {
            background: transparent;
            border: none;
            color: #fff;
            font-size: 18px;
            line-height: 1;
            width: 32px;
            height: 28px;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .lcb-minimize.compact {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #ff4da6;
            font-weight: 700;
            font-size: 20px;
            box-shadow: 0 6px 18px rgba(255,77,166,0.12);
        }
        .lcb-minimize:hover, .lcb-close:hover {
            background: rgba(0,0,0,0.12);
        }
        .lcb-body {
            height: 220px;
            padding: 10px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: opacity .18s ease;
        }
        .lcb-form {
            display: flex;
            padding: 8px;
            gap: 6px;
            transition: opacity .18s ease;
        }
        .lcb-input {
            flex: 1;
            padding: 8px;
            border-radius: 8px;
        }
        .lcb-send {
            padding: 8px 10px;
            background: #ff4da6;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        .lcb-msg {
            margin: 0;
            max-width: 86%;
            padding: 8px 10px;
            border-radius: 10px;
            display: inline-block;
            word-break: break-word;
            white-space: pre-wrap;
        }
        .lcb-bot {
            float: left;
            clear: both;
        }
        .lcb-user {
            align-self: flex-end;
            float: right;
            clear: both;
        }

        /* Editor de culori */
        #lcb-color-editor {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000000;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            width: 300px;
            max-width: 90%;
        }
        .lcb-color-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: linear-gradient(90deg, #ff9acb, #ff77b8);
            color: #fff;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .lcb-color-editor-body {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .lcb-color-option {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .lcb-color-option label {
            font-size: 12px;
            font-weight: 600;
        }
        .lcb-color-option input[type="color"] {
            width: 100%;
            height: 40px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .lcb-save-btn {
            padding: 10px;
            background: #ff4da6;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 10px;
        }
        .lcb-save-btn:hover {
            background: #ff1493;
        }

        /* Stare minimizată */
        .lcb-window.minimized {
            width: 56px !important;
            height: 56px !important;
            border-radius: 28px !important;
            padding: 6px !important;
            overflow: visible;
        }
        .lcb-window.minimized .lcb-header {
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .lcb-window.minimized .lcb-icon,
        .lcb-window.minimized .lcb-title,
        .lcb-window.minimized .lcb-body,
        .lcb-window.minimized .lcb-form {
            display: none;
        }
        .lcb-window.minimized .lcb-minimize {
            display: block;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #ff4da6;
            color: #fff;
            font-size: 20px;
            line-height: 1;
            box-shadow: 0 8px 20px rgba(255,77,166,0.18);
        }

        /* Animații */
        @keyframes lcb-shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-2px); }
            100% { transform: translateX(0); }
        }
        @keyframes lcb-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.06); }
            100% { transform: scale(1); }
        }
        @keyframes lcb-sparkle {
            0% { box-shadow: 0 0 0 rgba(255,255,255,0); }
            50% { box-shadow: 0 0 12px rgba(255,230,255,0.9); }
            100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
        }
        .anim-shake { animation: lcb-shake 500ms ease; }
        .anim-pulse { animation: lcb-pulse 700ms ease; }
        .anim-sparkle { animation: lcb-sparkle 900ms ease; border-color: #ffd0e8; }
    `);

    // ===== LOGICA CHAT-ULUI =====
    const bodyDiv = document.getElementById('lcb-body');
    const form = document.getElementById('lcb-form');
    const input = document.getElementById('lcb-input');
    const minBtn = document.getElementById('lcb-minimize-btn');
    const closeBtn = document.getElementById('lcb-close-btn');
    const lcbWindow = document.getElementById('lcb-window');
    const lcbHeader = document.getElementById('lcb-header');

    const animations = {
        'pâine': 'shake',
        'salut': 'pulse',
        'sparkle': 'sparkle'
    };

    function trimMessages(max = 5) {
        const msgs = bodyDiv.querySelectorAll('.lcb-msg');
        while (msgs.length > max) {
            const first = bodyDiv.querySelector('.lcb-msg');
            if (!first) break;
            first.remove();
        }
    }

    function applyAnimationsToElement(el, message) {
        const lower = message.toLowerCase();
        for (const key in animations) {
            if (lower.includes(key.toLowerCase())) {
                const cls = 'anim-' + animations[key];
                el.classList.remove(cls);
                void el.offsetWidth;
                el.classList.add(cls);
                setTimeout(() => el.classList.remove(cls), 1000);
            }
        }
    }

    function appendMessage(text, who = 'bot') {
        const div = document.createElement('div');
        div.className = 'lcb-msg ' + (who === 'user' ? 'lcb-user' : 'lcb-bot');
        div.textContent = text;
        bodyDiv.appendChild(div);
        applyAnimationsToElement(div, text);
        trimMessages(5);
        bodyDiv.scrollTop = bodyDiv.scrollHeight;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = input.value.trim();
        if (!msg) return;
        appendMessage(msg, 'user');
        input.value = '';

        // Procesare mesaj
        let response = null;
        for (const [pattern, reply] of rules) {
            if (pattern instanceof RegExp) {
                const match = msg.match(pattern);
                if (match) {
                    response = typeof reply === 'function' ? reply(msg, match) : reply;
                    if (response !== null) break;
                }
            } else if (msg.toLowerCase().includes(pattern.toLowerCase())) {
                response = typeof reply === 'function' ? reply(msg) : reply;
                if (response !== null) break;
            }
        }

        if (!response) {
            response = rules.find(rule => rule[0] instanceof RegExp && rule[0].toString() === '/.*/i')[1];
        }

        setTimeout(() => appendMessage(response, 'bot'), 300);
        input.focus();
    });

    // Minimize/Restore
    function setMinimized(min) {
        if (min) {
            lcbWindow.classList.add('minimized');
            minBtn.textContent = '+';
            minBtn.classList.add('compact');
            minBtn.title = 'Restabilește chat';
        } else {
            lcbWindow.classList.remove('minimized');
            minBtn.textContent = '—';
            minBtn.classList.remove('compact');
            minBtn.title = 'Minimizează chat';
            input.focus();
        }
    }

    minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMinimized(!lcbWindow.classList.contains('minimized'));
    });

    lcbHeader.addEventListener('dblclick', () => {
        setMinimized(!lcbWindow.classList.contains('minimized'));
    });

    lcbWindow.addEventListener('click', (e) => {
        if (lcbWindow.classList.contains('minimized')) {
            setMinimized(false);
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.remove();
    });

    // API public
    window.localChatBot = {
        send: (text) => {
            appendMessage(text, 'user');
            let response = null;
            for (const [pattern, reply] of rules) {
                if (pattern instanceof RegExp) {
                    const match = text.match(pattern);
                    if (match) {
                        response = typeof reply === 'function' ? reply(text, match) : reply;
                        if (response !== null) break;
                    }
                } else if (text.toLowerCase().includes(pattern.toLowerCase())) {
                    response = typeof reply === 'function' ? reply(text) : reply;
                    if (response !== null) break;
                }
            }
            if (!response) {
                response = rules.find(rule => rule[0].toString() === '/.*/i')[1];
            }
            setTimeout(() => appendMessage(response, 'bot'), 200);
        },
        addRule: (pattern, response) => { rules.unshift([pattern, response]); },
        setForceLang: (lang) => {}
    };

    // Mesaj de bun venit
    setTimeout(() => {
        appendMessage("Buna! Sunt Lucy/Nyu din *Elfen Lied*! 🩷 Scrie *!ajutor* pentru a vedea comenzile disponibile.", 'bot');
    }, 500);

    // Focus pe input la încărcare
    input.focus();
})();