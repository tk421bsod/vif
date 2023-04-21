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
        showNotif('toggle-notif', false, 2300)
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
        console.log("toggled not set!") //toggled not set yet? check cookies
    }
    if (cookies['theme']){
        source = "cookie"
        console.log("cookie is set, setting theme to " + cookies['theme'])
        return cookies['theme'] == "dark" //true == dark, false == light
    }
    console.log("cookie not set!") //cookie not set? check system theme
    source = "system"
    try {
        return window.matchMedia("(prefers-color-scheme:dark)").matches;
    } catch (error){
        //browser doesn't support this? default to dark theme
        return true
    }
}

function applyLightStyling(){
    console.log("switching to light theme")
    if (cookies['accepted']){
        document.cookie = "theme=light"
    }
    document.body.style.color = "#36393f"; document.body.style.backgroundColor = "white"; for (const each of document.getElementsByClassName('btn')){each.className = each.className.replace('btn-outline-light', 'btn-outline-dark')}; for (const each of document.getElementsByTagName('a')){each.className = each.className.replace('link-light', 'link-dark')}; for (const each of document.getElementsByTagName('li')){if (each.className.includes("nav")){continue}; each.style.backgroundColor="white"; each.style.color="#36393f";}; for (const each of document.getElementsByTagName('ul')){if (each.className.includes("nav")){continue};each.style.backgroundColor="white"; each.style.color="#36393f";};if (document.getElementsByClassName("commit-link")){for (const link of document.getElementsByClassName("commit-link")){link.style.color = "#36393f"}}; for (const elem of document.getElementsByTagName("input")){elem.style.backgroundColor = "white"; elem.style.color = "#36393f";}for (const elem of document.getElementsByClassName("toast")){elem.style.color = "black"; elem.style.backgroundColor = "white";} for (const elem of document.getElementsByClassName('btn-close')){elem.className = elem.className.replace("btn-close-white", "")}
}

function applyDarkStyling(){
    console.log("switching to dark theme")
    if (cookies['accepted']){
        document.cookie = "theme=dark"
    }
     document.body.style.color = "white"; document.body.style.backgroundColor = "#36393f"; for (const each of document.getElementsByClassName('btn')){each.className = each.className.replace('btn-outline-dark', 'btn-outline-light')}; for (const each of document.getElementsByTagName('a')){each.className = each.className.replace('link-dark', 'link-light')}; for (const each of document.getElementsByTagName('li')){if (each.className.includes("nav")){continue}; each.style.backgroundColor="#36393f"; each.style.color="white";}; for (const each of document.getElementsByTagName('ul')){if (each.className.includes("nav")){continue};each.style.backgroundColor="#36393f"; each.style.color="white";}; if (document.getElementsByClassName("commit-link")){for (const link of document.getElementsByClassName("commit-link")){link.style.color = "white"}}for (const elem of document.getElementsByTagName("input")){elem.style.backgroundColor = "#36393f"; elem.style.color = "white";} for (const elem of document.getElementsByClassName("toast")){elem.style.color = "white"; elem.style.backgroundColor = "#36393f";} for (const elem of document.getElementsByClassName('btn-close')){if (! elem.className.includes("btn-close-white")){elem.className += " btn-close-white"}} for (const each of document.getElementsByClassName('modal')){each.style.color = "white"} for (const each of document.getElementsByClassName('modal-content')){each.style.backgroundColor="#36393f"}
}

function addCloseButton(name){
    try{
        if (added){
            return
        }
    } catch(error){
        added = true
    }
    console.log("adding close button")
    document.getElementById(name+'-close').style.transform = "scale(1, 1)";
    document.getElementById(name).style.width = "33em";
    document.getElementById(name+'-main').style.marginRight = "1em";
    added = true
}

function removeCloseButton(name){
    if (! added){
        return
    }
    console.log("removing close button")
    document.getElementById(name+'-close').style.transform = "scale(0.01, 0.01)";
    document.getElementById(name).style.width = "440px";
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

function holdNotif(){
    if (held){
        console.log("Notif already held!")
        return //event handler may have gone off twice
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
        notifElem.addEventListener("mouseover", holdNotif);
        notifElem.addEventListener("mouseout", function(){removeCloseButton(name)});
        notifElem.addEventListener("mouseout", function(){releaseNotif(name)});
        //focus events e.g tab key
        notifElem.addEventListener("focusin", function(){addCloseButton(name)});
        notifElem.addEventListener("focusin", holdNotif);
        notifElem.addEventListener("focusout", function(){removeCloseButton(name)});
        notifElem.addEventListener("focusout", function(){releaseNotif(name)});
        //touch events
        notifElem.addEventListener("touchstart", function(){addCloseButton(name)});
        notifElem.addEventListener("touchstart", holdNotif);
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
    if (source == "system"){
        document.getElementById("theme-set").innerHTML = "Automatically enabled <b> " + theme + " theme</b> based on your system theme." + document.getElementById("theme-set").innerHTML;
    } else {
        document.getElementById("theme-set").style.fontSize = ".85rem";
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
            getCookies()
            showThemeNotif("dark")
        }
        themeToggle.innerHTML = "<i class=\"fas fa-sun fa-xs\"></i>";
        themeToggle.title = "Switch to light theme.";
        themeToggle.style.marginBottom = "0";
    } else {
        applyLightStyling();
        document.body.style.opacity = "1";
        applyLightStyling();
        document.body.style.opacity = "1";
        if (show){
            getCookies()
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

function changeOpacity(){
    console.log("changing opacity");
    document.body.style.opacity = 0
}

window.addEventListener("DOMContentLoaded", changeOpacity())
