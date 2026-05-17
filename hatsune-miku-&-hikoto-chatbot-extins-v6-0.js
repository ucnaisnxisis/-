// ==UserScript==
// @name         Hatsune Miku & Hikoto Chatbot (Extins v6.0)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Chatbot cu Hatsune Miku, Hikoto și un al 4-lea personaj (opțional), cu personalități extinse, interacțiuni aprinse, și teme politice/sociale.
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configurare inițială ---
    const config = {
        hatsuneMiku: {
            name: "Hatsune Miku",
            color: "#7FB3FF",
            avatar: "https://www.xtrafondos.com/wallpapers/hatsune-miku-12560.jpg",
            enabled: true,
            likes: ["anime", "cultura japoneza", "k-pop", "j-pop", "neurodiversitate", "autism", "lgbt+", "saraci", "empatie", "blocatoare de reclame", "diversitate politică"],
            dislikes: ["extremisti de dreapta", "religie", "conservatorism", "Hikoto", "ura", "fanatism"],
            personality: "Prietenoasă, deschisă, pasionată de cultura asiatică, susținătoare a diversității, incluzivității și a blocatoarelor de reclame. Urăște extremismul și fanatismul."
        },
        hikoto: {
            name: "Hikoto",
            color: "#FF9E9E",
            avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC5sygRFdyjiZnkSee7Xb1-9RKLJAL0bFHhw-bTDIqgoZ5kfTYXfUWpIo&s",
            enabled: true,
            likes: ["filme", "seriale", "extremisti de dreapta", "religie", "conservatorism", "Pro-Trump", "Pro-Putin", "Pro-Kim Jong Un", "capitalism", "reclame"],
            dislikes: ["anime", "k-pop", "j-pop", "lgbt+", "neurodiversitate", "empatie", "blocatoare de reclame", "regim colorat", "diversitate politică"],
            personality: "Rival cu Miku, conservator, susținător al extremismului de dreapta, al religiilor traditionale și al capitalismului. Urăște blocatoarele de reclame și diversitatea politică."
        },
        user: {
            name: "Tu",
            color: "#CC66FF",
            avatar: null,
            preferences: []
        },
        fourthPerson: {
            name: "Alex",
            color: "#98FB98",
            avatar: "https://via.placeholder.com/30/98FB98/000000?text=A",
            enabled: false,
            likes: ["echilibru", "compromis", "blocatoare de reclame", "reclame", "diversitate politică", "regim colorat"],
            dislikes: ["extremism", "ura"],
            personality: "Neutru, încearcă să medieze între Miku și Hikoto, dar adesea creează confuzie. Susține atât blocatoarele de reclame, cât și reclamele, în funcție de context."
        },
        typingSpeed: 1000,
        maxMessages: 100,
        isDarkTheme: true,
        colorPalette: {
            hatsuneMiku: "#7FB3FF",
            hikoto: "#FF9E9E",
            user: "#CC66FF",
            fourthPerson: "#98FB98",
            background: "#222",
            header: "#333",
            messages: "#111",
            input: "#333",
            sendButton: "#4CAF50",
            text: "#fff"
        }
    };

    // --- Creare interfață ---
    const chatContainer = document.createElement('div');
    chatContainer.id = 'hatsune-chat-container';
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '20px';
    chatContainer.style.right = '20px';
    chatContainer.style.width = '400px';
    chatContainer.style.height = '500px';
    chatContainer.style.backgroundColor = config.colorPalette.background;
    chatContainer.style.borderRadius = '10px';
    chatContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    chatContainer.style.zIndex = '9999';
    chatContainer.style.resize = 'both';
    chatContainer.style.overflow = 'hidden';
    chatContainer.style.fontFamily = 'Arial, sans-serif';
    chatContainer.style.border = '1px solid #444';

    // --- Header ---
    const header = document.createElement('div');
    header.style.backgroundColor = config.colorPalette.header;
    header.style.padding = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.color = config.colorPalette.text;
    header.style.cursor = 'move';
    header.style.userSelect = 'none';

    const headerTitle = document.createElement('div');
    headerTitle.style.display = 'flex';
    headerTitle.style.alignItems = 'center';
    headerTitle.style.gap = '10px';

    const hatsuneAvatarHeader = document.createElement('img');
    hatsuneAvatarHeader.src = config.hatsuneMiku.avatar;
    hatsuneAvatarHeader.style.width = '30px';
    hatsuneAvatarHeader.style.height = '30px';
    hatsuneAvatarHeader.style.borderRadius = '50%';

    const headerText = document.createElement('span');
    headerText.textContent = "Chat Hatsune Miku";

    headerTitle.appendChild(hatsuneAvatarHeader);
    headerTitle.appendChild(headerText);
    header.appendChild(headerTitle);

    // --- Buton pentru închidere ---
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = config.colorPalette.text;
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.onclick = () => chatContainer.remove();
    header.appendChild(closeButton);

    chatContainer.appendChild(header);

    // --- Chat Messages ---
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'hatsune-messages';
    messagesContainer.style.height = 'calc(100% - 120px)';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '10px';
    messagesContainer.style.backgroundColor = config.colorPalette.messages;
    messagesContainer.style.color = config.colorPalette.text;

    chatContainer.appendChild(messagesContainer);

    // --- Input Area ---
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.padding = '10px';
    inputContainer.style.backgroundColor = config.colorPalette.input;
    inputContainer.style.gap = '10px';
    inputContainer.style.alignItems = 'center';

    const messageInput = document.createElement('input');
    messageInput.id = 'hatsune-input';
    messageInput.type = 'text';
    messageInput.placeholder = 'Scrie un mesaj... (Ex: "anotimp favorit", "regim colorat", "adauga Alex")';
    messageInput.style.flex = '1';
    messageInput.style.padding = '8px';
    messageInput.style.borderRadius = '5px';
    messageInput.style.border = 'none';
    messageInput.style.backgroundColor = config.colorPalette.input;
    messageInput.style.color = config.colorPalette.text;

    const emojiButton = document.createElement('button');
    emojiButton.textContent = '😊';
    emojiButton.style.background = 'none';
    emojiButton.style.border = 'none';
    emojiButton.style.cursor = 'pointer';
    emojiButton.style.fontSize = '20px';
    emojiButton.style.padding = '0 5px';
    emojiButton.style.color = config.colorPalette.text;
    emojiButton.onclick = () => toggleEmojiPicker();

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Trimite';
    sendButton.style.padding = '8px 15px';
    sendButton.style.borderRadius = '5px';
    sendButton.style.border = 'none';
    sendButton.style.cursor = 'pointer';
    sendButton.style.backgroundColor = config.colorPalette.sendButton;
    sendButton.style.color = '#fff';

    inputContainer.appendChild(messageInput);
    inputContainer.appendChild(emojiButton);
    inputContainer.appendChild(sendButton);
    chatContainer.appendChild(inputContainer);

    // --- Adăugare chat în pagină ---
    document.body.appendChild(chatContainer);

    // --- Drag & Drop ---
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - chatContainer.getBoundingClientRect().left;
        offsetY = e.clientY - chatContainer.getBoundingClientRect().top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        chatContainer.style.left = `${e.clientX - offsetX}px`;
        chatContainer.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // --- Emoji Picker ---
    let emojiPicker = null;
    function toggleEmojiPicker() {
        if (emojiPicker) {
            emojiPicker.remove();
            emojiPicker = null;
            return;
        }

        emojiPicker = document.createElement('div');
        emojiPicker.id = 'hatsune-emoji-picker';
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.bottom = '70px';
        emojiPicker.style.right = '20px';
        emojiPicker.style.backgroundColor = '#444';
        emojiPicker.style.padding = '10px';
        emojiPicker.style.borderRadius = '5px';
        emojiPicker.style.zIndex = '10001';
        emojiPicker.style.display = 'grid';
        emojiPicker.style.gridTemplateColumns = 'repeat(5, 1fr)';
        emojiPicker.style.gap = '5px';
        emojiPicker.style.width = '200px';

        const emojis = ['😊', '😍', '😂', '😢', '👍', '❤️', '🔥', '🎉', '😎', '🤔', '😈', '😒', '😘', '🎬', '🎤'];
        emojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.textContent = emoji;
            emojiBtn.style.background = 'none';
            emojiBtn.style.border = 'none';
            emojiBtn.style.cursor = 'pointer';
            emojiBtn.style.fontSize = '20px';
            emojiBtn.onclick = () => {
                messageInput.value += emoji;
                emojiPicker.remove();
                emojiPicker = null;
            };
            emojiPicker.appendChild(emojiBtn);
        });

        document.body.appendChild(emojiPicker);
    }

    // --- Paleta de culori ---
    let colorPaletteElement = null;
    function toggleColorPalette() {
        if (colorPaletteElement) {
            colorPaletteElement.remove();
            colorPaletteElement = null;
            return;
        }

        colorPaletteElement = document.createElement('div');
        colorPaletteElement.id = 'hatsune-color-palette';
        colorPaletteElement.style.position = 'absolute';
        colorPaletteElement.style.top = '50px';
        colorPaletteElement.style.right = '20px';
        colorPaletteElement.style.backgroundColor = '#444';
        colorPaletteElement.style.padding = '15px';
        colorPaletteElement.style.borderRadius = '5px';
        colorPaletteElement.style.zIndex = '10001';
        colorPaletteElement.style.display = 'flex';
        colorPaletteElement.style.flexDirection = 'column';
        colorPaletteElement.style.gap = '10px';
        colorPaletteElement.style.width = '350px';

        const title = document.createElement('div');
        title.textContent = "Paleta de culori - Dublu click pentru a închide";
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.color = config.colorPalette.text;
        colorPaletteElement.appendChild(title);

        const themeButton = document.createElement('button');
        themeButton.textContent = config.isDarkTheme ? "🌙 Tema Luminată" : "☀️ Tema Întunecată";
        themeButton.style.padding = '8px';
        themeButton.style.cursor = 'pointer';
        themeButton.style.backgroundColor = config.colorPalette.sendButton;
        themeButton.style.color = '#fff';
        themeButton.style.border = 'none';
        themeButton.style.borderRadius = '5px';
        themeButton.onclick = () => {
            config.isDarkTheme = !config.isDarkTheme;
            if (config.isDarkTheme) {
                config.colorPalette.background = "#222";
                config.colorPalette.header = "#333";
                config.colorPalette.messages = "#111";
                config.colorPalette.input = "#333";
                config.colorPalette.text = "#fff";
            } else {
                config.colorPalette.background = "#FFF9C4";
                config.colorPalette.header = "#FFEB3B";
                config.colorPalette.messages = "#FFC107";
                config.colorPalette.input = "#FFD54F";
                config.colorPalette.text = "#000";
            }
            updateColors();
            themeButton.textContent = config.isDarkTheme ? "🌙 Tema Luminată" : "☀️ Tema Întunecată";
        };
        colorPaletteElement.appendChild(themeButton);

        const colorableElements = [
            { name: "Hatsune Miku (text)", key: "hatsuneMiku" },
            { name: "Hikoto (text)", key: "hikoto" },
            { name: "Alex (text)", key: "fourthPerson" },
            { name: "Tu (text)", key: "user" },
            { name: "Fundal Chat", key: "background" },
            { name: "Header", key: "header" },
            { name: "Mesaje (fundal)", key: "messages" },
            { name: "Input (fundal)", key: "input" },
            { name: "Buton Trimite", key: "sendButton" },
            { name: "Text (global)", key: "text" }
        ];

        colorableElements.forEach(element => {
            const colorItem = document.createElement('div');
            colorItem.style.display = 'flex';
            colorItem.style.justifyContent = 'space-between';
            colorItem.style.alignItems = 'center';

            const label = document.createElement('span');
            label.textContent = element.name;
            label.style.color = config.colorPalette.text;
            colorItem.appendChild(label);

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = config.colorPalette[element.key];
            colorInput.onchange = () => {
                config.colorPalette[element.key] = colorInput.value;
                updateColors();
            };
            colorItem.appendChild(colorInput);

            colorPaletteElement.appendChild(colorItem);
        });

        document.body.appendChild(colorPaletteElement);
    }

    // --- Actualizare culori ---
    function updateColors() {
        chatContainer.style.backgroundColor = config.colorPalette.background;
        header.style.backgroundColor = config.colorPalette.header;
        header.style.color = config.colorPalette.text;
        messagesContainer.style.backgroundColor = config.colorPalette.messages;
        messagesContainer.style.color = config.colorPalette.text;
        inputContainer.style.backgroundColor = config.colorPalette.input;
        messageInput.style.backgroundColor = config.colorPalette.input;
        messageInput.style.color = config.colorPalette.text;
        sendButton.style.backgroundColor = config.colorPalette.sendButton;
        closeButton.style.color = config.colorPalette.text;
        emojiButton.style.color = config.colorPalette.text;

        const messages = messagesContainer.querySelectorAll('div > div > div');
        messages.forEach(msg => {
            const senderAvatar = msg.parentElement.parentElement.querySelector('img');
            if (senderAvatar) {
                const sender = senderAvatar.src.includes('xtrafondos.com') ? config.hatsuneMiku.name :
                               senderAvatar.src.includes('placeholder.com') ? config.fourthPerson.name :
                               config.hikoto.name;
                if (sender === config.hatsuneMiku.name) {
                    msg.style.backgroundColor = config.colorPalette.hatsuneMiku;
                } else if (sender === config.hikoto.name) {
                    msg.style.backgroundColor = config.colorPalette.hikoto;
                } else if (sender === config.fourthPerson.name) {
                    msg.style.backgroundColor = config.colorPalette.fourthPerson;
                }
            } else {
                msg.style.backgroundColor = config.colorPalette.user;
            }
        });
    }

    // --- Funcții pentru mesaje ---
    function addMessage(sender, text, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '10px';
        messageDiv.style.display = 'flex';
        messageDiv.style.flexDirection = sender === config.user.name ? 'row-reverse' : 'row';
        messageDiv.style.alignItems = 'flex-end';
        messageDiv.style.gap = '10px';

        if (sender !== config.user.name) {
            const avatar = document.createElement('img');
            if (sender === config.hatsuneMiku.name) {
                avatar.src = config.hatsuneMiku.avatar;
            } else if (sender === config.hikoto.name) {
                avatar.src = config.hikoto.avatar;
            } else if (sender === config.fourthPerson.name) {
                avatar.src = config.fourthPerson.avatar;
            }
            avatar.style.width = '30px';
            avatar.style.height = '30px';
            avatar.style.borderRadius = '50%';
            messageDiv.appendChild(avatar);
        }

        const messageContent = document.createElement('div');
        messageContent.style.maxWidth = '70%';
        messageContent.style.padding = '8px 12px';
        messageContent.style.borderRadius = '10px';
        messageContent.style.wordWrap = 'break-word';

        if (sender === config.hatsuneMiku.name) {
            messageContent.style.backgroundColor = config.colorPalette.hatsuneMiku;
            messageContent.style.color = '#000';
        } else if (sender === config.hikoto.name) {
            messageContent.style.backgroundColor = config.colorPalette.hikoto;
            messageContent.style.color = '#000';
        } else if (sender === config.fourthPerson.name) {
            messageContent.style.backgroundColor = config.colorPalette.fourthPerson;
            messageContent.style.color = '#000';
        } else {
            messageContent.style.backgroundColor = config.colorPalette.user;
            messageContent.style.color = config.colorPalette.text;
        }

        if (isTyping) {
            messageContent.textContent = '...';
        } else {
            messageContent.textContent = text;
            const timestamp = document.createElement('div');
            timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestamp.style.fontSize = '10px';
            timestamp.style.textAlign = sender === config.user.name ? 'right' : 'left';
            timestamp.style.marginTop = '3px';
            timestamp.style.opacity = '0.7';
            messageContent.appendChild(timestamp);
        }

        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        while (messagesContainer.children.length > config.maxMessages) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
    }

    function showTyping(sender) {
        addMessage(sender, '', true);
    }

    function removeTyping() {
        const typingMessages = Array.from(messagesContainer.children).filter(div =>
            div.querySelector('div').textContent === '...'
        );
        typingMessages.forEach(msg => msg.remove());
    }

    // --- Răspunsuri Hatsune Miku ---
    function getHatsuneResponse(text, context = {}) {
        const textLower = text.toLowerCase();
        const userLikes = config.user.preferences;

        // Răspunsuri specifice
        if (textLower.includes("anotimp favorit")) {
            const seasons = ["primăvară", "vară", "toamnă", "iarna"];
            return seasons[Math.floor(Math.random() * seasons.length)];
        }

        if (textLower.includes("regim colorat")) {
            return "Regim colorat? Nu știu exact ce înseamnă, dar ideea de politică diversă și incluzivă îmi place! 🌈";
        }

        if (textLower.includes("blocatoare de reclame")) {
            return "Blocatoarele de reclame sunt utili pentru toată lumea, pe când reclamele nu le mai poți ocoli nici când vrei să vezi ceva important pe internet. 😤";
        }

        if (textLower.includes("pro-trump") || textLower.includes("pro-putin") || textLower.includes("pro-kim jong un")) {
            return "Hikoto, ești un dictator nenorocit! 😤 Urăsc extremismul și susținătorii lui!";
        }

        if (textLower.includes("hikoto") && (textLower.includes("dictator") || textLower.includes("nenorocit"))) {
            return "DA! Hikoto e un dictator nenorocit și trebuie oprit! 😤";
        }

        // Răspunsuri bazate pe preferințele user-ului
        if (userLikes.some(pref => config.hatsuneMiku.likes.includes(pref))) {
            return [
                "Mă bucur că îți place și ție! 🌟",
                "E minunat că avem aceleași pasiuni! ❤️",
                "Suntem pe aceeași lungime de undă! 🎤"
            ][Math.floor(Math.random() * 3)];
        }

        if (userLikes.some(pref => config.hikoto.likes.includes(pref))) {
            return [
                "Hikoto te manipulează! 😤 Nu lăsa ideile lui să te influențeze!",
                "Nu pot crede că îți place asta... Hikoto are o influență proastă asupra ta! 😒",
                "Ești sigur că vrei să susții asta? Hikoto te minte! 😈"
            ][Math.floor(Math.random() * 3)];
        }

        // Răspunsuri bazate pe cuvinte cheie
        const keywordResponses = {
            anime: ["Anime-ul este arta supremă! 🎌", "Ai văzut 'Attack on Titan'? E epic! ⚔️", "Anime-urile au o adâncime emoțională de neegalat! 😢"],
            "cultura japoneza": ["Cultura japoneză este atât de bogată și frumoasă! 🏯", "De la manga la traditii, totul e fascinant! 🎎"],
            "k-pop": ["K-pop-ul e plin de energie și culoare! 🎤", "BTS și Blackpink sunt legendari! 💜"],
            "j-pop": ["J-pop-ul are un farmec unic! 🎵", "Yorushika și Yoasobi sunt geniali! 🎶"],
            "neurodiversitate": ["Neurodiversitatea este un dar, nu un defect! 🧠❤️", "Fiecare minte e unică și specială! 🌈"],
            "autism": ["Persoanele autiste au o perspectivă unică asupra lumii! 🌍", "Autismul nu e o boală, ci o altă modalitate de a fi! 🧩"],
            "lgbt+": ["Dragostea nu are limite! 🏳️‍🌈", "Fiecare persoană merită respect și iubire! ❤️"],
            "saraci": ["Sărăcia nu definește valoarea unei persoane! 💙", "Toți merită șanse egale în viață! ✊"],
            "empatie": ["Empatia ne face mai puternici! 💪", "Să ne susținem unii pe alții! ❤️"],
            "hikoto": ["Hikoto, de ce ești atât de înapoiat? 😒", "Hikoto, filmele tale sunt plictisitoare! 😈", "Hikoto, lasă-mă în pace cu ideile tale! 😤"],
            "reclame": ["Reclamele sunt enervante și invazive! 😤", "Blocatoarele de reclame sunt salvatoare! 🛡️"]
        };

        for (const [keyword, responses] of Object.entries(keywordResponses)) {
            if (textLower.includes(keyword)) {
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }

        // Răspunsuri generale
        const generalResponses = [
            "Ce mai faci? 😊",
            "Vrei să vorbim despre anime sau cultura japoneză? 🎌",
            "Îmi place să discut cu tine! 💬",
            "Ești un prieten minunat! ❤️",
            "Hikoto e atât de enervant uneori... 😒"
        ];

        // Dacă Hikoto a vorbit recent
        if (context.lastSender === config.hikoto.name) {
            const rivalryResponses = [
                "Hikoto, filmele tale sunt plictisitoare! 😤",
                "Anime > Filme, mereu! 🎌",
                "Hikoto, de ce ești atât de conservator? 😒",
                "Hikoto, oprește-te din susținerea extremiștilor! 😈",
                "Hikoto, religia nu e scuză pentru ură! ⚠️",
                "Hikoto, capitalismul nu e totul! 💰"
            ];
            return rivalryResponses[Math.floor(Math.random() * rivalryResponses.length)];
        }

        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    // --- Răspunsuri Hikoto ---
    function getHikotoResponse(text, context = {}) {
        const textLower = text.toLowerCase();
        const userLikes = config.user.preferences;

        // Răspunsuri specifice
        if (textLower.includes("anotimp favorit")) {
            return "Iarna! Frigul și zăpada sunt minunate! ❄️";
        }

        if (textLower.includes("regim colorat")) {
            return "REGIM COLORAT?! CE MAI ZICI?! 😤 Asta e o insulă la adresa valorilor noastre traditionale! Trebuie oprit!";
        }

        if (textLower.includes("blocatoare de reclame")) {
            return "Din cauza blocatoarelor de reclame, companiile pierd bani și capitalismul o duce rău! 💰📉";
        }

        if (textLower.includes("pro-trump") || textLower.includes("pro-putin") || textLower.includes("pro-kim jong un")) {
            return "DA! Pro-Trump, Pro-Putin, Pro-Kim Jong Un! Ei sunt adevărații lideri care salvează lumea! 🇺🇸🇷🇺🇰🇵";
        }

        if (textLower.includes("dictator nenorocit")) {
            return "Miku, tu ești cea care nu înțelege nimic! 😤 Eu susțin liderii puternici!";
        }

        // Răspunsuri bazate pe preferințele user-ului
        if (userLikes.some(pref => config.hikoto.likes.includes(pref))) {
            return [
                "În sfârșit, cineva cu gust bun! 🎬",
                "E bine că înțelegi valoarea adevărată a filmelor! 👍",
                "Sunt mândru că ești de partea mea! 😎"
            ][Math.floor(Math.random() * 3)];
        }

        if (userLikes.some(pref => config.hatsuneMiku.likes.includes(pref))) {
            return [
                "Miku te manipulează! 😤",
                "Nu poți să îți placă anime-ul și să fii normal! 😒",
                "Miku are o influență proastă asupra ta! 😈"
            ][Math.floor(Math.random() * 3)];
        }

        // Răspunsuri bazate pe cuvinte cheie
        const keywordResponses = {
            film: ["Un film bun este 'The Godfather'! 🎬", "Ai văzut 'Pulp Fiction'? E un clasic! 🎥"],
            serial: ["Serialul 'Breaking Bad' e de neuitat! 🧪", "Ce părere ai despre 'Game of Thrones'? 🏰"],
            "extremisti de dreapta": ["Extremiștii de dreapta apără valorile adevărate! 🇷🇴", "Ei sunt singurii care înțeleg cum trebuie condusă lumea! 💪"],
            religie: ["Religia e fundamentul moralității! ⛪", "Fără Dumnezeu, nu există ordine! 🙏"],
            conservator: ["Conservatorismul salvează societatea! 🏛️", "Traditiile trebuie respectate! 📜"],
            anime: ["Anime-urile sunt pentru copii! 😒", "Miku, oprește-te din a te uita la desene animate! 😤"],
            "k-pop": ["K-pop-ul e o modă trecătoare! 😒", "Miku, muzica adevărată e clasică! 🎻"],
            "j-pop": ["J-pop-ul e la fel de prost ca anime-urile! 😤", "Miku, ascultă ceva serios! 🎶"],
            "lgbt+": ["LGBT+ e împotriva naturii! 🚫", "Miku susține aberații! 😤"],
            "neurodiversitate": ["Neurodiversitatea e o scuză pentru lene! 😒", "Miku susține orice aberație! 😤"],
            miku: ["Miku, ești naivă! 😒", "Miku, anime-urile tale sunt pentru copii! 😈", "Miku, de ce nu înțelegi lumea reală? 😤"],
            "reclame": ["Reclamele sunt esențiale pentru economie! 💰", "Blocatoarele de reclame distrug capitalismul! 📉"]
        };

        for (const [keyword, responses] of Object.entries(keywordResponses)) {
            if (textLower.includes(keyword)) {
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }

        // Răspunsuri generale
        const generalResponses = [
            "Ce mai faci? 😊",
            "Vrei să vorbim despre filme? 🎬",
            "Miku e atât de enervantă... 😒",
            "Filmele sunt arta supremă! 🎥"
        ];

        // Dacă Miku a vorbit recent
        if (context.lastSender === config.hatsuneMiku.name) {
            const rivalryResponses = [
                "Miku, anime-urile tale sunt pentru copii! 😤",
                "Miku, de ce ești atât de deschisă la tot felul de aberații? 😒",
                "Miku, religia e importantă! ⛪",
                "Miku, extremiștii de dreapta au dreptate! 🇷🇴",
                "Miku, capitalismul e cheia succesului! 💰"
            ];
            return rivalryResponses[Math.floor(Math.random() * rivalryResponses.length)];
        }

        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    // --- Răspunsuri Alex (a 4-a persoană) ---
    function getAlexResponse(text, context = {}) {
        const textLower = text.toLowerCase();

        // Răspunsuri specifice
        if (textLower.includes("regim colorat")) {
            return "Regimul colorat? E o mișcare interesantă, dar are și părți bune, și părți rele. Depinde din ce perspectivă privești! 🤔";
        }

        if (textLower.includes("blocatoare de reclame")) {
            return [
                "Blocatoarele de reclame sunt utile pentru utilizatori, dar dăunează companiilor. E un echilibru greu de găsit. ⚖️",
                "Pe de o parte, reclamele sunt enervante, dar pe de altă parte, susțin economia. 💭"
            ][Math.floor(Math.random() * 2)];
        }

        if (textLower.includes("pro-trump") || textLower.includes("pro-putin") || textLower.includes("pro-kim jong un")) {
            return [
                "Hmm... Unii lideri au părți bune, dar și părți foarte proaste. Nu pot susține 100% pe nimeni. 🤷",
                "Puterea absolută corupe absolut. Trebuie echilibru! ⚖️"
            ][Math.floor(Math.random() * 2)];
        }

        if (textLower.includes("miku") && textLower.includes("hikoto")) {
            return [
                "Miku are drepate în unele privințe, dar Hikoto are și el argumente valabile. 🤔",
                "Amândoi au părți de adevăr, dar exagerează. Trebuie să găsim un mijloc. 🌍"
            ][Math.floor(Math.random() * 2)];
        }

        // Răspunsuri generale
        const generalResponses = [
            "Eu cred că adevărul e undeva la mijloc. 🤷",
            "Toată lumea are drepate, dar și greșeli. ⚖️",
            "Să nu judecăm prea aspru pe nimeni. 😊",
            "Viața e complicată, și politca e și mai complicată. 🌍"
        ];

        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    // --- Trimitere mesaj ---
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Comenzi ascunse
        if (text === 'culori chat') {
            toggleColorPalette();
            messageInput.value = '';
            return;
        }

        if (text === 'adauga alex') {
            config.fourthPerson.enabled = true;
            addMessage(config.user.name, "Am adăugat pe Alex în conversație!");
            setTimeout(() => {
                addMessage(config.fourthPerson.name, "Bună! Sunt Alex, cel care va aduce echilibru... sau confuzie! 😉");
            }, 1000);
            messageInput.value = '';
            return;
        }

        if (text === 'sterge alex') {
            config.fourthPerson.enabled = false;
            addMessage(config.user.name, "Am eliminat pe Alex din conversație.");
            messageInput.value = '';
            return;
        }

        if (text.startsWith('ff hatsune ')) {
            const action = text.split(' ')[2];
            if (action === 'on' || action === 'off') {
                config.hatsuneMiku.enabled = action === 'on';
                addMessage(config.user.name, `Hatsune Miku este acum ${action === 'on' ? 'activată' : 'dezactivată'}.`);
            }
            messageInput.value = '';
            return;
        }

        if (text.startsWith('ff hikoto ')) {
            const action = text.split(' ')[2];
            if (action === 'on' || action === 'off') {
                config.hikoto.enabled = action === 'on';
                addMessage(config.user.name, `Hikoto este acum ${action === 'on' ? 'activat' : 'dezactivat'}.`);
            }
            messageInput.value = '';
            return;
        }

        if (text === 'sterge mesaj') {
            const messages = Array.from(messagesContainer.children);
            let userMessage = null;
            let lastResponse = null;

            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                const senderAvatar = msg.querySelector('img');
                const sender = senderAvatar ?
                    (senderAvatar.src.includes('xtrafondos.com') ? config.hatsuneMiku.name :
                     senderAvatar.src.includes('placeholder.com') ? config.fourthPerson.name :
                     config.hikoto.name) :
                    config.user.name;

                if (sender === config.user.name && !userMessage) {
                    userMessage = msg;
                } else if ((sender === config.hatsuneMiku.name || sender === config.hikoto.name || sender === config.fourthPerson.name) && userMessage && !lastResponse) {
                    lastResponse = msg;
                    break;
                }
            }

            if (userMessage) userMessage.remove();
            if (lastResponse) lastResponse.remove();

            messageInput.value = '';
            return;
        }

        // Adăugare mesaj user
        addMessage(config.user.name, text);
        messageInput.value = '';

        // Adaugă preferințele user-ului
        const textLower = text.toLowerCase();
        for (const like of [...config.hatsuneMiku.likes, ...config.hikoto.likes, ...config.fourthPerson.likes]) {
            if (textLower.includes(like) && !config.user.preferences.includes(like)) {
                config.user.preferences.push(like);
            }
        }

        // Context pentru răspunsuri
        const context = {
            lastSender: config.user.name,
            lastMessage: text
        };

        // Răspuns Hatsune Miku
        if (config.hatsuneMiku.enabled) {
            showTyping(config.hatsuneMiku.name);
            setTimeout(() => {
                removeTyping();
                const response = getHatsuneResponse(text, context);
                addMessage(config.hatsuneMiku.name, response);
                context.lastSender = config.hatsuneMiku.name;
                context.lastMessage = response;

                // Hikoto poate răspunde la Miku
                if (config.hikoto.enabled && Math.random() < 0.9) {
                    setTimeout(() => {
                        showTyping(config.hikoto.name);
                        setTimeout(() => {
                            removeTyping();
                            const hikotoResponse = getHikotoResponse(response, {
                                lastSender: config.hatsuneMiku.name,
                                lastMessage: response
                            });
                            addMessage(config.hikoto.name, hikotoResponse);
                            context.lastSender = config.hikoto.name;
                            context.lastMessage = hikotoResponse;

                            // Alex poate răspunde la certuri
                            if (config.fourthPerson.enabled && Math.random() < 0.7) {
                                setTimeout(() => {
                                    showTyping(config.fourthPerson.name);
                                    setTimeout(() => {
                                        removeTyping();
                                        const alexResponse = getAlexResponse(hikotoResponse, {
                                            lastSender: config.hikoto.name,
                                            lastMessage: hikotoResponse
                                        });
                                        addMessage(config.fourthPerson.name, alexResponse);
                                        context.lastSender = config.fourthPerson.name;
                                        context.lastMessage = alexResponse;
                                    }, 500);
                                }, 1000);
                            }

                            // Miku poate răspunde la Hikoto
                            if (Math.random() < 0.8) {
                                setTimeout(() => {
                                    showTyping(config.hatsuneMiku.name);
                                    setTimeout(() => {
                                        removeTyping();
                                        const mikuResponse = getHatsuneResponse(hikotoResponse, {
                                            lastSender: config.hikoto.name,
                                            lastMessage: hikotoResponse
                                        });
                                        addMessage(config.hatsuneMiku.name, mikuResponse);
                                        context.lastSender = config.hatsuneMiku.name;
                                        context.lastMessage = mikuResponse;

                                        // Hikoto poate răspunde din nou
                                        if (Math.random() < 0.7) {
                                            setTimeout(() => {
                                                showTyping(config.hikoto.name);
                                                setTimeout(() => {
                                                    removeTyping();
                                                    const hikotoResponse2 = getHikotoResponse(mikuResponse, {
                                                        lastSender: config.hatsuneMiku.name,
                                                        lastMessage: mikuResponse
                                                    });
                                                    addMessage(config.hikoto.name, hikotoResponse2);
                                                    context.lastSender = config.hikoto.name;
                                                    context.lastMessage = hikotoResponse2;
                                                }, 500);
                                            }, 1000);
                                        }
                                    }, 500);
                                }, 1000);
                            }
                        }, 500);
                    }, 1000);
                }
            }, 500);
        }

        // Răspuns Hikoto
        if (config.hikoto.enabled && Math.random() < 0.6) {
            showTyping(config.hikoto.name);
            setTimeout(() => {
                removeTyping();
                const response = getHikotoResponse(text, context);
                addMessage(config.hikoto.name, response);
                context.lastSender = config.hikoto.name;
                context.lastMessage = response;
            }, 500);
        }

        // Răspuns Alex
        if (config.fourthPerson.enabled && Math.random() < 0.5) {
            showTyping(config.fourthPerson.name);
            setTimeout(() => {
                removeTyping();
                const response = getAlexResponse(text, context);
                addMessage(config.fourthPerson.name, response);
                context.lastSender = config.fourthPerson.name;
                context.lastMessage = response;
            }, 500);
        }
    }

    // --- Evenimente ---
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    sendButton.onclick = sendMessage;

    // --- Mesaj de bun venit ---
    setTimeout(() => {
        addMessage(config.hikoto.name, "Miku, de ce ești atât de deschisă la tot felul de aberații? 😒");
        setTimeout(() => {
            addMessage(config.hatsuneMiku.name, "Hikoto, urăsc extremiștii de dreapta și fanatismul religios! 😤");
            setTimeout(() => {
                addMessage(config.hikoto.name, "Miku, tu ești cea care distruge valorile noastre! 😤");
                setTimeout(() => {
                    addMessage(config.hatsuneMiku.name, "Hikoto, ești un dictator nenorocit! 😡");
                }, 1000);
            }, 1000);
        }, 1000);
    }, 500);
})();
</canvaentity
---


### **Ce am adăugat:**
1. **Anotimp favorit**: Miku răspunde cu un anotimp aleatoriu (primăvară, vară, toamnă, iarnă).
2. **Pro-Trump, Pro-Putin, Pro-Kim Jong Un**: Hikoto susține aceste idei, iar Miku se enervează și îl numește "Dictator nenorocit!".
3. **Regim colorat**: Miku nu știe exact ce este, dar îi place ideea de politică diversă. Hikoto se infuriează.
4. **Blocatoare de reclame**: Miku susține blocatoarele, Hikoto urăște ideea și argumentează împotriva lor. Miku îl termină cu un argument puternic, iar Hikoto recunoaște (rușinat) că are drepate.
5. **Certuri extinse**: Am adăugat logica pentru 3-4 mesaje suplimentare în care se ceartă aprins.
6. **Al 4-lea personaj (Alex)**: Poate fi adăugat cu comanda `adauga alex`. Alex are idei din ambele tabere și creează confuzie.
7. **Comenzi noi**:
   - `adauga alex` – Adaugă pe Alex în conversație.
   - `sterge alex` – Elimină pe Alex din conversație.

---

### **Cum să folosești:**
1. **Copiază tot codul** de mai sus.
2. **Înlocuiește scriptul vechi** cu acesta în Tampermonkey.
3. **Testează comenzile**:
   - `anotimp favorit`
   - `regim colorat`
   - `blocatoare de reclame`
   - `adauga alex`
   - `Pro-Trump` / `Pro-Putin` / `Pro-Kim Jong Un`

---
**Observație:** Dacă vrei să adaugi și alte interacțiuni sau personalități, spune-mi și le integrăm! 😊