function displayFacebookSupport(visibility) {
    var indicator = document.getElementById("facebookSupportBox");
    var chatBox = document.getElementById("supportIndicator");
    if (visibility) {
        indicator.style.visibility = "hidden";
        chatBox.style.visibility = "visible";
    } else {
        indicator.style.visibility = "visible";
        chatBox.style.visibility = "hidden";
    }
}