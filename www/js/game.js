'use strict';

function __onLoggedIn(that, user) {
    if(!that.emit('loggedIn', that, user))
        return;
    console.log("Logged in");
    that.emit('start');
}
function __onRecieveQuestion(that, question) {
    if(!that.emit('recieveQuestion', question))
        return;
    // Scan with the QrCode Reader and return the result.
    cordova.plugins.barcodeScanner.scan(function(scan_result){
        if (scan_result.xmlhttp.responseText==result.text){
            reponse.appendChild(document.createTextNode(result.text));
            alert("Bonne reponse");
        }else
            alert("Mauvaise reponse");
    });
}
function __onAnswer(that, question, is_correct) {
    if(!that.emit('answer', question, is_correct))
        return;
    console.log("Answer :", is_correct);
}

/**
 * Class game will initiate and control the game interface
 */
class Game extends EventHandler{

    /**
     * Initiate the game in an HTMLElement
     * 
     * @param {URL} remote_url
     * @param {HTMLElement} html_element
     */
    constructor(remote_url, html_element, className='game'){
        super();

        this.className = className;

        /**
         * Define the local fields
         */
        this.html_element = html_element;
        this.remote_url = remote_url;

        if(!this.html_element.classList.contains(this.className))
            this.html_element.classList.add(this.className);
    }

    show_login(){
        // scope local this into that
        const that = this;

        let submitting = false;

        let login_modal = this.html_element.querySelector('.login.modal');
        // Create the login modal only if the modal window has been found in the DOM
        if(!login_modal){
            login_modal = this.create_panel("login", __LOGIN_FORM_HTML, function/*onClosed*/(event) {
                event.preventDefault();
                let modal = null;
                event.path.forEach(function(element) {
                    if(element.classList && element.classList.contains('login'))
                        modal = element;
                });
                modal.style.display='none';
                window.location.href = 'index.html';
            }).then(function/*onCreated*/(modal) {
                const form = modal.querySelector('form.modal-content');
                if(!form)
                    throw new Error("Form wasn't created");
                const signin_button = form.querySelector('span.signin');
                
                signin_button.addEventListener('click', function/*onClick*/(event){
                    modal.style.display = "none";
                    that.show_signin().then(function(modal) {
                        
                    });
                });

                form.addEventListener('submit', function/*onSubmit*/(event) {
                    // Prevent automatic send request by the form
                    event.preventDefault();
                    // Prevent submit another request
                    if(submitting)
                        return false;
                    const data = new FormData(form);

                    const credentials = data.get('pseudo')+':'+data.get('pass');
                    sessionStorage.setItem('login', credentials);
                    if(data.get('remember'))
                        localStorage.setItem('login', credentials);
                    
                    data.delete('remember');

                    submitting = true;
                    
                    that.show_loader();
                    request(that.remote_url.href +"v2/login", {
                        method: 'POST'
                    }).then(function(user){
                        return user.json();
                    }).then(function(user) {
                        modal.style.display='none';
                        __onLoggedIn(that, user);
                        that.hide_loader();
                        submitting = false;
                    }).catch(function(err) {
                        console.error(err);
                        that.hide_loader();
                        submitting = false;
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
        // scope local this into that
        const that = this;

        let submitting = false;

        let signin_modal = this.html_element.querySelector('.signin.modal');
        // Create the login modal only if the modal window has been found in the DOM
        if(!signin_modal){
            signin_modal = this.create_panel("signin", __SIGNIN_FORM_HTML, function/*onClosed*/(event) {
                event.preventDefault();
                let modal = null;
                event.path.forEach(function(element) {
                    if(element.classList && element.classList.contains('signin'))
                        modal = element;
                });
                console.log(event.path);
                modal.style.display='none';
                that.show_login();
            }).then(function/*onCreated*/(modal) {
                const form = modal.querySelector('form.modal-content');
                const pass_text = form.querySelector('#pass');
                const pass2_text = form.querySelector('#pass2');
                pass2_text.addEventListener('change', function/*onChange*/(event) {
                    if(pass_text.value == pass2_text.value)
                        pass2_text.setCustomValidity('');
                    else
                        pass2_text.setCustomValidity('Les mots de passes sont différents.');
                }); 
                    
                form.addEventListener('submit', function/*onSubmit*/(event) {
                    // Prevent automatic send request by the form
                    event.preventDefault();
                    // Prevent submit another request
                    if(submitting)
                        return false;
        
                    const data = new FormData(form);
                    const credentials = data.get('pseudo')+':'+data.get('pass');
                    
                    data.delete('pass2');
                    sessionStorage.setItem('login', credentials);

                    var object = {};
                    data.forEach((value, key) => {
                        if(!object.hasOwnProperty(key)){
                            object[key] = value;
                            return;
                        }
                        if(!Array.isArray(object[key])){
                            object[key] = [object[key]];    
                        }
                        object[key].push(value);
                    });

                    submitting = true;
                    
                    that.show_loader();

                    request(that.remote_url.href +"v2/signin", {
                        method: 'POST',
                        body: JSON.stringify(object)
                    }).then(function(user){
                        modal.style.display='none';
                        __onLoggedIn(that, user);
                        that.hide_loader();
                        submitting = false;
                    }).catch(function(err) {
                        console.error(err);
                        submitting = false;
                    });
                });
                return Promise.resolve(modal);
            });
        }else{
            // Transfom var to Promise
            signin_modal = Promise.resolve(signin_modal);
        }
        // Wait for the promise
        return signin_modal.then(function(modal) {
            modal.querySelector('form.modal-content').reset();
            modal.style.display='block';
            return modal;
        });
    }

    create_loader(){
        let loader_modal = document.querySelector(".loading");
        if(!loader_modal){
            loader_modal = document.createElement('div');
            loader_modal.classList.add('loading');
            loader_modal.innerHTML = __LOADING_HTML;
            const linearProgress = new mdc.linearProgress.MDCLinearProgress(loader_modal.querySelector('.mdc-linear-progress'));
            document.body.prepend(loader_modal);
        }
        return loader_modal;
    }

    show_loader(){
        const loader_modal = this.create_loader();
    }

    hide_loader(){
        let loader_modal = document.querySelector(".loading");
        if(loader_modal)
            loader_modal.remove();
    }

    create_panel(name, html, onClosed){
        const modal = document.createElement('div');
        modal.classList.add(name, 'modal');
        modal.innerHTML = html;
        this.html_element.appendChild(modal);
        modal.querySelectorAll('.close, button.cancel, .'+name+'.modal').forEach(function(el) {
            el.addEventListener('click', onClosed);
        });
        
        return Promise.resolve(modal);
    }

    start() {
        let login = sessionStorage.getItem('login');
        if(!login) login = localStorage.getItem('login');
        
        if(login){
            const that = this;
            this.show_loader();
            request(that.remote_url.href +"v2/login", {
                method: 'POST'
            }).then(function(response){
                return response.json();
            }).then(function(response) {
                that.hide_loader();
                __onLoggedIn(that, response);
                setInterval(() => {
                    that.emit('tick');
                }, 1000);
            }).catch(function(err) {
                that.hide_loader();
                that.show_login();
            });
        }else this.show_login();
    }

    open_home_panel(){
        
    }

    getNextQuestion(){
        const that = this;
        this.show_loader();
        return request(this.remote_url.href +'v2/question')
            .then(function(response) {
                that.hide_loader();
                return response.json();
            });
    }

    ask(question){
        
    }
};

/**
 * Override the default fetch to add the login arguments automaticaly
 * You doesn't need to care of it later in the game development.
 * 
 * @param {RequestInfo} path
 * @param {RequestInit} options
 */
const request = function(path, options) {
    console.log(path);
    options = Object.assign({}, options, {
        headers: {
            'Content-type': 'application/json', // json by default because I use it on my API
            Auth: sessionStorage.getItem('login') // the credential that are used.
        }
    });
    // Send the request with the real js fetch but with our modified arguments
    return fetch(path, options).then(function(response) {
        console.log(path);

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
        <input type="text" placeholder="Entrez votre nom d'utilisateur" name="pseudo" id="pseudo" required>

        <label for="pass"><b>Mot de passe</b></label>
        <input type="password" placeholder="Entrez votre mot de passe" name="pass" id="pass" required>
        
        <button type="submit">Login</button>
        <label>
            <input type="checkbox" name="remember" id="remember"> Connexion automatique
        </label>
    </div>

    <div class="container" style="background-color:#f1f1f1">
        <button type="button" class="cancel">Cancel</button>
        <span class="signin">Pas encore de compte ? <a href="#signin">Clique ici</a></span>
    </div>
</form>`

const __LOADING_HTML = `<div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate"><div class="mdc-linear-progress__buffering-dots"></div><div class="mdc-linear-progress__buffer"></div><div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"><span class="mdc-linear-progress__bar-inner"></span></div><div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar"><span class="mdc-linear-progress__bar-inner"></span></div></div>`

const __SIGNIN_FORM_HTML = `<form class="modal-content animate">
    <div class="imgcontainer">
        <span class="close" title="Fermer">&times;</span>
        <img src="img/default_avatar.png" alt="Avatar" class="avatar">
    </div>

    <div class="container">
        <label for="pseudo"><b>Pseudonyme</b></label>
        <input type="text" placeholder="Entrez votre nom d'utilisateur" name="pseudo" id="pseudo" required>
        
        <label for="email"><b>Adresse e-mail</b></label>
        <input type="email" placeholder="Entrez votre adresse e-mail" name="email" id="email" required>

        <label for="pass"><b>Mot de passe</b></label>
        <input type="password" placeholder="Entrez votre mot de passe" name="pass" id="pass" required>

        <label for="pass2"><b>Vérification</b></label>
        <input type="password" placeholder="Entrez à nouveau votre mot de passe" name="pass2" id="pass2" required>
        
        <button type="submit">Signin</button>
    </div>

    <div class="container" style="background-color:#f1f1f1">
        <button type="button" class="cancel">Cancel</button>
    </div>
</form>`
