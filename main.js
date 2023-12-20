'use strict';

let themes = {true:'dark', false:'light'}
let activeNotifs = {};
let duplicateToggleNotifCount = 0;
let source = ""
let held = false
let notifEndAnimDelay = 500
let notifEndAnim = null
let toggle = null
let added = false

function getCookies(){
    document.cookie.split(";").forEach(function(cookie){let intermediate=cookie.split("=");cookies[intermediate[0]]=intermediate[1];});
}

function setValueIfNotExists(object, key, value){
    if (! object[key]){
        object[key] = value
    }
}

function showToggleNotif(){
    getCookies();
    if (duplicateToggleNotifCount >= 3){
        return
    }
    //create local variable with current value of themes['toggle'] as it can change when spamming toggle
    let currentTheme = themes[toggle]
    //add "this will persist across sessions" if cookies are enabled
    if (cookies['accepted']){
        var crossSessionPersistence = "<div class=\"toast-subsection text-muted\" style=\"font-size:7.8pt\">This will persist across sessions.</div>"
    } else {
        var crossSessionPersistence = ""
    }
    if (activeNotifs['toggle-notif']){
        duplicateToggleNotifCount += 1 
        setTimeout(function(){showNotif('toggle-notif', false, 2300); document.getElementById('toggle-set').innerHTML = "Switched to <b>" + currentTheme + " theme</b>. " + crossSessionPersistence; duplicateToggleNotifCount -= 1;}, (3100*duplicateToggleNotifCount)+(100*duplicateToggleNotifCount))
    } else {
        document.getElementById('toggle-set').innerHTML = "Switched to <b>"+ themes[toggle] + " theme</b>. " + crossSessionPersistence
        showNotif('toggle-notif', false, 2300);
    }
}

function toggleTheme(){
    toggle = ! getCurrentTheme();
    initTheming(false);
    showToggleNotif();
}

function getCurrentTheme(){
    // true == dark theme, false == light theme
    if (toggle != null){
        return toggle
    } else {
        console.log("toggled not set!"); //toggled not set yet? check cookies
    }
    if (cookies['theme']){
        source = "cookie"
        console.log("cookie is set, setting theme to " + cookies['theme']);
        return cookies['theme'] == "dark" //true == dark, false == light
    }
    console.log("cookie not set!") //cookie not set? check system theme
    source = "system"
    try {
        return window.matchMedia("(prefers-color-scheme:dark)").matches;
    } catch (error){
        //browser doesn't support this? default to dark theme
        return true;
    }
}

function swapComponents(OLD_THEME, NEW_THEME, componentName, inverted){
    if (inverted){
        let oldThemeCopy = OLD_THEME;
        OLD_THEME = NEW_THEME;
        NEW_THEME = oldThemeCopy;
    }
    let components = document.querySelectorAll("." + componentName + "-" + OLD_THEME);
    let oldName = componentName + "-" + OLD_THEME;
    let newName = componentName + "-" + NEW_THEME;
    for (const each of components){
        each.className = each.className.replace(oldName, newName);
    }
}

function applyStylingForTag(OLD_THEME, NEW_THEME, target, inverted){
    if (inverted){
        let oldThemeCopy = OLD_THEME;
        OLD_THEME = NEW_THEME;
        NEW_THEME = oldThemeCopy;
    }
    let newColor = "";
    let newBackgroundColor = "";
    if (NEW_THEME == "light"){
        newColor = "#36393f";
        newBackgroundColor = "white";
    } else {
        newColor = "white";
        newBackgroundColor = "#36393f";
    }
    for (const elem of document.querySelectorAll(target)){
        //Don't theme navigation elements for now.
        if (elem.className.includes("nav")){
            continue
        };
        elem.style.color = newColor;
        elem.style.backgroundColor = newBackgroundColor;
    }
}

function applyStyling(foreground, background){
    let NEW_THEME = "";
    let OLD_THEME = "";
    //Set our master background and foreground colors.
    document.body.style.color = foreground;
    document.body.style.backgroundColor = background;
    if (background == "white"){ //TODO: Replace with module-level constants for colors.
        NEW_THEME = "light"; //light theme
        OLD_THEME = "dark";
    } else {
        NEW_THEME = "dark";
        OLD_THEME = "light";
    }
    applyStylingForTag(OLD_THEME, NEW_THEME, 'input', false);
    //Swap out our Bootstrap components for ones that match the new theme.
    swapComponents(OLD_THEME, NEW_THEME, 'btn-outline', true);
    swapComponents(OLD_THEME, NEW_THEME, 'link', true);
    //Then apply theme-specific styling to other elements.
    applyStylingForTag(OLD_THEME, NEW_THEME, 'li', false);
    applyStylingForTag(OLD_THEME, NEW_THEME, 'ul', false);
    applyStylingForTag(OLD_THEME, NEW_THEME, 'ol', false);
    //TODO: page-specific styling things? maybe pages could register callbacks
    //Toast close buttons are special.
    for (const elem of document.getElementsByClassName('btn-close')){
        if (NEW_THEME == "dark" && (! elem.className.includes("btn-close-white"))){
            elem.className += "btn-close-white";
        } else {
            elem.className = elem.className.replace("btn-close-white", "");
        }
    }
    //Toasts are special too.
    for (const elem of document.getElementsByClassName("toast")){
        elem.style.color = foreground;
        elem.style.backgroundColor = background;
    }
}

function applyLightStyling(){
    console.log("switching to light theme");
    if (cookies['accepted']){
        document.cookie = "theme=light";
    }
    applyStyling("#36393f", "white");
}

function applyDarkStyling(){
    console.log("switching to dark theme");
    if (cookies['accepted']){
        document.cookie = "theme=dark";
    }
    applyStyling("white", "#36393f")
}

function addCloseButton(name){
    try{
        if (added){
            return
        }
    } catch(error){
        added = true
    }
    if (('ontouchstart' in window)||(navigator.maxTouchPoints>0)||(navigator.msMaxTouchPoints>0)){
        return
    }
    console.log("adding close button")
    document.getElementById(name+'-close').style.transform = "scale(1, 1)";
    document.getElementById(name+'-close').style.marginLeft = "-1em";
    document.getElementById(name+'-close').style.left = "calc(30em + 0.3vmin)";
    document.getElementById(name+'-main').style.marginRight = "calc(0.9em + 0.1vmin)";
    added = true
}

function removeCloseButton(name){
    if (! added){
        return
    }
    console.log("removing close button")
    document.getElementById(name+'-close').style.transform = "scale(0.01, 0.01)";
    document.getElementById(name+'-main').style.marginRight = "0";
    added = false
}

function getNotifRef(name){
    return bootstrap.Toast.getOrCreateInstance(document.getElementById(name))
}

function hideNotif(name){
    if (held){
        console.log("Attempted to hide notif when it was held!")
        return
    }
    console.log("Hiding notif '" + name + "'")
    document.getElementById(name).style.marginBottom = "1.5%";
    setTimeout(activeNotifs[name].hide(), 700);
    console.log("hid notif");
    document.getElementById(name).style.marginBottom = "0%";
    activeNotifs[name] = null;
}

function holdNotif(name){
    if (held){
        console.log("Notif already held!")
        return //event handler may have gone off twice
    }
    if (('ontouchstart' in window)||(navigator.maxTouchPoints>0)||(navigator.msMaxTouchPoints>0)){
        held = false
        hideNotif(name);
    }
    console.log('Holding notif')
    clearTimeout(notifEndAnim);
    held = true
}

function releaseNotif(name){
    if (! held){
        return
    }
    console.log("Releasing notif, hiding after " + String(notifEndAnimDelay) + "ms")
    held = false;
    notifEndAnim = setTimeout(function(){hideNotif(name)}, notifEndAnimDelay);
}

function showNotif(name, closable, delay){
    console.log("Showing notif '" + name + "'")
    held = false
    if (! delay){
        notifEndAnimDelay = 5400;
    } else {
        notifEndAnimDelay = delay;
    }
    if (activeNotifs[name]){
        console.error("Attempted to show notif '" + name + "' while it was active!!")
        return
    }
    setValueIfNotExists(activeNotifs, name, getNotifRef(name))
    let notifRef = activeNotifs[name];
    let notifElem = document.getElementById(name);
    if (! notifElem || ! notifRef){
        throw new Error('Invalid name passed to showNotif!')
    }
    if (closable){
        //notification closable?? add the respective listeners...
        //mouse events
        notifElem.addEventListener("mouseover", function(){addCloseButton(name)});
        notifElem.addEventListener("mouseover", function(){holdNotif(name)});
        notifElem.addEventListener("mouseout", function(){removeCloseButton(name)});
        notifElem.addEventListener("mouseout", function(){releaseNotif(name)});
        //focus events e.g tab key
        notifElem.addEventListener("focusin", function(){addCloseButton(name)});
        notifElem.addEventListener("focusin", function(){holdNotif(name)});
        notifElem.addEventListener("focusout", function(){removeCloseButton(name)});
        notifElem.addEventListener("focusout", function(){releaseNotif(name)});
        //touch events
        notifElem.addEventListener("touchstart", function(){addCloseButton(name)});
        notifElem.addEventListener("touchstart", function(){holdNotif(name)});
        notifElem.addEventListener("touchend", function(){removeCloseButton(name)});
        notifElem.addEventListener("touchend", function(){releaseNotif(name)});
    }
    notifRef.show();
    setTimeout(function(){notifElem.style.marginBottom = "1%";}, 500);
    notifEndAnim = setTimeout(function(){hideNotif(name)}, notifEndAnimDelay);
}

function showThemeNotif(theme){
    console.log("Showing theme notif");
    held = false
    let themeNotif = document.getElementById("theme-notif");
    document.getElementById("theme-set").style.fontSize = "calc(.70rem + 0.3vmin)";
    if (source == "system"){
        document.getElementById("theme-set").innerHTML = "Automatically enabled <b> " + theme + " theme</b> based on your system theme." + document.getElementById("theme-set").innerHTML;
    } else {
        document.getElementById("theme-set").innerHTML = "Automatically enabled <b> " + theme + " theme</b> based on your previous session." + document.getElementById("theme-set").innerHTML;
    }
    showNotif('theme-notif', true);
}

function initTheming(show){
    document.getElementById('theme-button').addEventListener("click", toggleTheme);
    let loading = document.getElementById("loading");
    if (loading){
        loading.remove();
    }
    cookies = {};
    getCookies();
    console.log("initializing theming")
    let theme = getCurrentTheme();
    let themeToggle = document.getElementById('theme-toggle');
    let themeButton = document.getElementById('theme-button');
    if (theme == true){
        if (toggle != true) {
            toggle = true;
        } 
        applyDarkStyling();
        document.body.style.opacity = "1";
        if (show){
            getCookies();
            showThemeNotif("dark");
        }
        themeToggle.innerHTML = "<i class=\"fas fa-sun fa-xs\"></i>";
        themeToggle.title = "Switch to light theme.";
        themeToggle.style.marginBottom = "0";
    } else {
        applyLightStyling();
        document.body.style.opacity = "1";
        if (show){
            getCookies();
            showThemeNotif("light");
        }
        themeToggle.innerHTML = "<i class=\"fas fa-moon fa-xs\"></i>";
        themeToggle.title = "Switch to dark theme.";
        themeToggle.style.marginBottom = "0";
    }
    //apply theme transitions
    //TODO remove i hate this
    if (typeof toggle !== 'undefined'){
        document.body.style.transition = "background-color 0.6s ease-in-out, color 0.6s ease-in-out, transform 0.6s ease-in-out !important";
    }
}

//sometimes the page will scroll a bit too far when using the 'Skip to content' link
//this is an attempt to fix that
if(window.location.href.includes('#main-content')){
    setTimeout(function(){window.scrollTo(0,0);}, 50);
}