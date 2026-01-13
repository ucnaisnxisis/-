// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-01-13
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==UserScripție==
// @name Auto reCAPTCHA v2 Solver (2Captcha)
// @namespace https://your-captcha-service.com/
// @versiunea 1.0
// @description Solves Google reCAPTCHA v2 utilizând automat 2Captcha
// @match **/*
// @Grand none
//===/Usfăcător==

(funcția de asință () {
constri API_KEY = 'YOUR_2CAPTCHA_API_KEY';
somn în curs = ms => Promisiune nouă newPromise(rezolvați => setTimeout(esolvesetTimeout, ms));

const recaptcha = documentdocument.querySelector(''.g-recaptcha[data-sitekey]);
Dacă (! recaptarea) returnează;

clant sitekey = recaptch.getattribute(data-sitekey');
Pagina de bord = fereastrălocation.localizare ;

Const cum creează Tacârea = asinc () => {
Răspunsul constației = așteptați fetch('https://api.2captcha.com/createTask', {
Metoda : "POST",
headers : { 'Content-Type' : 'aplicaţie/json' },
corp : JSON.stringify({
clientKy : API_KEY,
Sarcina : {
tip: 'RecaptchaV2TaskProxyless'"RecaptchaV2TaskProxyless",
websiteURLwebsite-ulRUL : pageRl,
WebsiteKy : sitekey
}
})
});
Rezultatul contractului = aşteaptă răspunsul.json();
Dacă (rezultate.errorIderrorId ! == 0) aruncați o nouă eroare (rezult.erorDescharge);
retur rezultat.tatazid ;
};

Constt getToken = asinc (taskId) => {
pentru (letîncercare 0 0; încercare < 24 ; încercare++) {
așteaptă somnul (5000);
Răspunsul la contract = așteptați fetchfetch('https://api.2captcha.com/getTaskResult', {
Metoda : "POST",
headers : { 'Content-Type' : 'aplicaţie/json' },
corp : JSON.stringifystringify({ clientKeyclientKey : API_KEY, taskId })
});
Rezultatul contractului = aşteaptă răspunsul.json();
dacă (rezultat.stat status=== 'pregătit") retur results.gRecaptchaResponse solutiongRecaptchaResponse;
}
aruncați un nou timeout de soluție Error('Captcha (aproximativ 2 minute)]);
};

tokenul de rezervă = așteaptă getToken(așteptă creează Task();

let ResponseField = documentdocument.querySelector('[name="g-recaptcha-response"]);
Dacă (! ResponseField) {
răspunsField = documentdocument.creatElement'textarea'('textare');
răspunsField.name name= 'g-recaptare-răspuns' ;
răspunsField.style.display = 'niciunul' ;
documentdocument.bodybody.appendChild(resbionul pe copii);
}
răspunsField.valoare value= token;

forma constală = recaptcha.closest('form''forma);
dacă (forma) formular.submit();

})();