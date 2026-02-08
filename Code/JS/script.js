// I wish I could say yes  = хотел бы я сказать что да
// Almost = ну почти
// Just a tiny bit more, and yes = еще совсем немножечко и да

const mobileScreenSize = 340;
const tabletScreenSize = 750;
const largeScreenSize = 1280;

function updateResponsiveStyles() {
    const width = window.innerWidth;
    const rows = document.querySelectorAll("tbody tr");
    let backgroundColor;
    let myWidth;

    if (width >= mobileScreenSize && width < tabletScreenSize) {
        backgroundColor = "yellow";
        myWidth = "100%";
    } else if (width >= tabletScreenSize && width < largeScreenSize) {
        backgroundColor = "aqua";
        myWidth = "90%";
    } else if (width >= largeScreenSize) {
        backgroundColor = "lightblue";
        myWidth = "80%";
    }

    rows.forEach((currentRow) => currentRow.setAttribute("style", `background-color:${backgroundColor}`));
    document.documentElement.style.setProperty("--my-width", myWidth);
}

window.addEventListener("resize", updateResponsiveStyles);
updateResponsiveStyles();
