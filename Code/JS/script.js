// I wish I could say yes  = хотел бы я сказать что да
// Almost = ну почти
// Just a tiny bit more, and yes = еще совсем немножечко и да

const mobileScreenSize = 340;
const tabletScreenSize = 750;
const largeScreenSize = 1280;
const singleTask = {
    id: "",
    isDone: false,
    details: "",
    deadline: ""
};
const tasksArr = [];

const domSelection = {
    rows: document.querySelectorAll("tbody tr"),
    addBtn: document.querySelectorAll("div.managing .add"),
    removeBtn: document.querySelectorAll("div.managing .remove"),
    editBtn: document.querySelectorAll("div.managing .edit"),
    body: document.querySelector("tbody")
};

function updateResponsiveStyles() {
    const width = window.innerWidth;
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

    domSelection.rows.forEach((currentRow) => currentRow.setAttribute("style", `background-color:${backgroundColor}`));
    document.documentElement.style.setProperty("--my-width", myWidth);
}

function searchDone() {
    const doneTasks = Array.from(domSelection.rows).filter((currentRow) => isRowDone(currentRow));
    doneTasks.forEach((currenTask) => updateDesignForDone(currenTask));
}

function updateDesignForDone(currenTask) {
    const thirdTh = currentTask.querySelector("th")[2];
    thirdTh.style.textDecoration = "line-through";
    thirdTh.style.textAlign = "center";
}

function isRowDone(currentRow) {
    const done = currentRow.querySelector("th > input");
    return done?.checked ?? false;
}

function setRowDone(currentRow) {
    const done = currentRow.querySelector("th > input");
    done.checked = true;
    done.setAttribute("checked", "checked");
    done.classList.add("checked");
}

function buildTable() {
    tasksArr.forEach((currentTask) => mapObj2HTML(currentTask));
}

function mapObj2HTML(currentTask) {
    const trElem = document.createElement("tr");
    trElem.innerHTML = `
        <td>${currentTask.id}</td>
        <td><input type="checkbox" ${currentTask.status ? "checked" : ""} > </td>
        <td>${currentTask.details}</td>
        <td>${currentTask.deadline}</td>
        <td></td>`;

    domSelection.body.appendChild(trElem);
}

function handleManagingClick(e) {
    if (e.target.matches("div.managing .remove")) {
        removeTask(e);
    } else if (e.target.matches("div.managing .add")) {
        openModal(e);
    } else if (e.target.matches("div.managing .edit")) {
        editTask(e);
    } else if (e.target.matches("#submitBtn")) {
        addNewTask(e);
        closeModal(e);
    }
}

function addNewTask(event) {
    const modalForm = event.target.closest(".modal");

    const newTask = { ...singleTask };
    newTask.id = modalForm.querySelector("#task-id").value;
    newTask.isDone = modalForm.querySelector("#task-is-done").checked;
    newTask.details = modalForm.querySelector("#task-details").value;
    newTask.deadline = modalForm.querySelector("#task-deadline").value;

    tasksArr.push(newTask);
}

function closeModal(event) {
    const modalWindow = event.target.closest(".modal-overlay");
    modalWindow.classList.add("hidden");
}

function openModal(event) {
    const modalWindow = event.target.closest(".modal-overlay");
    modalWindow.classList.remove("hidden");
}

window.addEventListener("resize", updateResponsiveStyles);
updateResponsiveStyles();

document.addEventListener("click", (e) => handleManagingClick(e));

// function addNewTask(event) {
//     const newTask = new singleTask();
//     newTask.id = event.
// }
