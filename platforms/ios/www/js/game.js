'use strict';

/**
 * Class game will initiate and control the game interface
 */
class Game{

    /**
     * Initiate the game in an HTMLElement
     * 
     * @param {HTMLElement} html_element 
     */
    constructor(remote_url, html_element){
        // scope local this into that
        const that = this;
        /**
         * Define the local fields
         */
        this.html_element = html_element;
        this.remote_url = remote_url;
        /**
         * Define the differents listeners the user can override.
         */
        this.listeners = {
            /**
             * this will be triggered when the user has been logged successfully
             */
            onLoggedIn: function() {

            },
            /**
             * this will be triggered when the user recieve one question
             * @param {Question} question 
             */
            onRecieveQuestion: function(question) {
                // Scan with the QrCode Reader and return the result.
                cordova.plugins.barcodeScanner.scan(function(scan_result){
                    if (xmlhttp.responseText==result.text){
                        reponse.appendChild(document.createTextNode(result.text));
                        alert("Bonne reponse");
                      }else
                        alert("Mauvaise reponse");
                });
            },
            /**
             * this will be triggered when the user answer to the question
             * @param {boolean} is_correct 
             */
            onAnswer: function(is_correct) {}
        }

        if(!this.html_element.classList.contains('game'))
            this.html_element.classList.add('game');
    }

    show_login(){
        // scope local this into that
        const that = this;

        let submitting = false;

        let login_modal = this.html_element.querySelector('.login.modal');
        // Create the login modal only if the modal window has been found in the DOM
        if(!login_modal){
            login_modal = this.create_modal("login", __LOGIN_FORM_HTML, function/*onClosed*/(event) {
                event.preventDefault();
                let modal = null;
                event.path.forEach(function(element) {
                    if(element.classList && element.classList.contains('login'))
                        modal = element
                });
                modal.style.display='none';
                window.location.href = 'index.html';
            }).then(function(modal) {
                modal.querySelector('form.modal-content').addEventListener('submit', function/*onSubmit*/(event) {
                    // Prevent automatic send request by the form
                    event.preventDefault();
                    // Prevent submit another request
                    if(submitting)
                        return false;
        
                    const pseudo = 'pseudo';
                    const password = 'password';
                    const remember_me = false;
                    const credentials = pseudo+':'+password;
                    
                    sessionStorage.setItem('login', credentials);
                    if(remember_me)
                        localStorage.setItem('login', credentials);
                    submitting = true;
                    
                    that.create_modal("loading", __LOADING_HTML).then(function(modal) {
                        
                    });

                    fetch(that.remote_url.href +"/login", {
                        method: 'POST'
                    }).then(function(user){
                        login_modal.style.display='none';
                        that.listeners.onLoggedIn(user);
                    });
                });
                return Promise.resolve(modal);
            });
        }else{
            // Transfom var to Promise
            login_modal = Promise.resolve(login_modal);
        }
        // Wait for the promise
        login_modal.then(function(modal) {
            modal.querySelector('form.modal-content').reset();
            modal.style.display='block';
        });
    }

    show_signin(){

    }

    create_modal(name, html, onClosed){
        const modal = document.createElement('div');
        modal.classList.add('login', 'modal');
        modal.innerHTML = html;
        this.html_element.appendChild(modal);
        modal.querySelectorAll('.close, button.cancel, .login.modal').forEach(function(el) {
            el.addEventListener('click', onClosed);
        });
        
        return Promise.resolve(modal);
    }

    start() {
        let login = sessionStorage.getItem('login');
        if(!login) login = localStorage.getItem('login');
        
        if(login) this.listeners.onLoggedIn();
        else this.show_login();
    }

    getNextQuestion(){
        fetch(this.remote_url.href +'/question')
            .then();
    }

    ask(question){
        
    }
};

const __fetch = fetch;
fetch
/**
 * Override the default fetch to add the login arguments automaticaly
 * You doesn't need to care of it later in the game development.
 * 
 * @param {RequestInfo} path
 * @param {RequestInit} options
 */
fetch = function(path, options) {
    options = Object.assign({}, options, {
        headers: {
            'Content-type': 'application/json', // json by default because I use it on my API
            Auth: sessionStorage.getItem('login') // the credential that are used.
        }
    });
    // Send the request with the real js fetch but with our modified arguments
    return __fetch(path, options).then(function(response) {
        // if the server respond us that credentials are invalid, so we remove it from the storage
        if (!response.ok && (response.status==401 || response.status==403)) {
            sessionStorage.removeItem('login');
            localStorage.removeItem('login');
            throw new Error("Session closed by remote");
        }
        return response;
    });
};



const __LOGIN_FORM_HTML = `<form class="modal-content animate">
    <div class="imgcontainer">
        <span class="close" title="Fermer">&times;</span>
        <img src="img/default_avatar.png" alt="Avatar" class="avatar">
    </div>

    <div class="container">
        <label for="pseudo"><b>Pseudonyme</b></label>
        <input type="text" placeholder="Entrez votre nom d'utilisateur" name="pseudo" required>

        <label for="pass"><b>Mot de passe</b></label>
        <input type="password" placeholder="Entrez votre mot de passe" name="pass" required>
        
        <button type="submit">Login</button>
        <label>
            <input type="checkbox" checked="checked" name="remember"> Connexion automatique
        </label>
    </div>

    <div class="container" style="background-color:#f1f1f1">
        <button type="button" class="cancel">Cancel</button>
        <span class="signin">Pas encore de compte ? <a href="#signin">Clique ici</a></span>
    </div>
</form>`

const __LOADING_HTML = `<div class="loader"></div>`

const __SIGNIN_FORM_HTML = `<form class="modal-content animate">
    <div class="imgcontainer">
        <span class="close" title="Fermer">&times;</span>
        <img src="img/default_avatar.png" alt="Avatar" class="avatar">
    </div>

    <div class="container">
        <label for="pseudo"><b>Pseudonyme</b></label>
        <input type="text" placeholder="Entrez votre nom d'utilisateur" name="pseudo" required>
        
        <label for="email"><b></b></label>
        <input type="email" placeholder="Entrez votre adresse e-mail" name="email" required>

        <label for="pass"><b>Mot de passe</b></label>
        <input type="password" placeholder="Entrez votre mot de passe" name="pass" required>

        <label for="pass2"><b>Vérification</b></label>
        <input type="password" placeholder="Entrez à nouveau votre mot de passe" name="pass2" required>
        
        <button type="submit">Login</button>
        <label>
            <input type="checkbox" checked="checked" name="remember"> Connexion automatique
        </label>
    </div>

    <div class="container" style="background-color:#f1f1f1">
        <button type="button" class="cancel">Cancel</button>
        <span class="signin">Pas encore de compte ? <a>Clique ici</a></span>
    </div>
</form>`