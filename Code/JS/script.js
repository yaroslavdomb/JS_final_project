// I wish I could say yes  = хотел бы я сказать что да
// Almost = ну почти
// Just a tiny bit more, and yes = еще совсем немножечко и да

const MOB_SCREEN_SIZE = 340;
const TABLET_SCREEN_SIZE = 750;
const LARGE_SCREEN_SIZE = 1280;
const LOCAL_EN = "en-US";
const EMPTY_GROUP = "---";
const PRIORITY_LOWEST = 10;

let isMobScreen = true;
let isTabScreen = false;
let isDescScreen = false;

const singleTask = {
    id: "",
    isDone: false,
    priority: "",
    group: "",
    details: "",
    deadline: "",
    createdAt: "",
    changes: []
};
const tasksArr = [];

const domSelection = {
    rows: document.querySelectorAll("tbody tr"),
    managingBlock: document.querySelectorAll("div.managing"),
    body: document.querySelector("tbody"),
    groupsList: document.getElementById("groups"),
    modalWindow: document.getElementById("modalOverlay"),
    headerWidth: document.getElementById("full-table-header-width"),
    createdAt: document.querySelectorAll(".hide-on-small-screen"),
    deactivated: document.querySelectorAll(".hide-if-no-tasks")
};

function handleTableClick(e) {
    if (e.target.matches("button.editRow")) {
        editRow(e);
    } else if (e.target.matches("button.removeRow")) {
        removeRow(e);
    } else if (e.target.matches("button.showRow")) {
        showRowHistory(e);
    }
}

function handleManagingClick(e) {
    if (e.target.matches(".add")) {
        openModal();
    } else if (e.target.matches(".remove")) {
        removeTask(e);
    } else if (e.target.matches(".edit")) {
        editTask(e);
    }
}

function handleModalClick(e) {
    if (e.target.matches("#submitBtn")) {
        const form = e.target.closest("form");
        if (form.checkValidity()) {
            e.preventDefault();
            addNewTask(e);
            closeModal();
        }
    } else if (e.target.matches("#closeBtn")) {
        closeModal();
    }
}

function updateResponsiveStyles(isForOneElem = false, elem = null) {
    let backgroundColor;
    let myWidth;

    detectScreenSize();
    if (isMobScreen) {
        backgroundColor = "yellow";
        myWidth = "100%";
    } else if (isTabScreen) {
        backgroundColor = "aqua";
        myWidth = "90%";
    } else if (isDescScreen) {
        backgroundColor = "lightblue";
        myWidth = "80%";
    }

    if (!isForOneElem) {
        document
            .querySelectorAll("tbody tr")
            .forEach((currentRow) => currentRow.setAttribute("style", `background-color:${backgroundColor}`));
    } else {
        elem.setAttribute("style", `background-color:${backgroundColor}`);
    }
    document.documentElement.style.setProperty("--my-width", myWidth);
}

function detectScreenSize() {
    const width = window.innerWidth;
    if (width >= MOB_SCREEN_SIZE && width < TABLET_SCREEN_SIZE) {
        isMobScreen = true;
        isTabScreen = false;
        isDescScreen = false;
    } else if (width >= TABLET_SCREEN_SIZE && width < LARGE_SCREEN_SIZE) {
        isMobScreen = false;
        isTabScreen = true;
        isDescScreen = false;
    } else if (width >= LARGE_SCREEN_SIZE) {
        isMobScreen = false;
        isTabScreen = false;
        isDescScreen = true;
    }
}

// function searchDone() {
//     const doneTasks = Array.from(domSelection.rows).filter((currentRow) => isRowDone(currentRow));
//     doneTasks.forEach((currenTask) => updateDesignForDone(currenTask));
// }

// function updateDesignForDone(currenTask) {
//     const thirdTh = currentTask.querySelector("th")[2];
//     thirdTh.style.textDecoration = "line-through";
//     thirdTh.style.textAlign = "center";
// }

// function isRowDone(currentRow) {
//     const done = currentRow.querySelector("th > input");
//     return done?.checked ?? false;
// }

// function setRowDone(currentRow) {
//     const done = currentRow.querySelector("th > input");
//     done.checked = true;
//     done.setAttribute("checked", "checked");
//     done.classList.add("checked");
// }

/*
isNewElemExist: If there is no new element, 
the function is called due to screen resize, and 
all elements should be added to the table with new styles.

Otherwise, it adds just a single element, so no redesign is needed.
*/
function updateDataOnScreen(isNewElemExist = false) {
    if (!isNewElemExist) {
        domSelection.body.innerHTML = "";
    }
    tasksArr.forEach((currentTask) => addObjToTableBody(currentTask));
    updateResponsiveStyles();
}

function addObjToTableBody(task, shouldCallResponsiveStyle = false) {
    const trElem = mapObj2HTML(task);
    if (shouldCallResponsiveStyle) {
        updateResponsiveStyles(true, trElem);
    }
    domSelection.body.appendChild(trElem);
}

function mapObj2HTML(currentTask) {
    const trElem = document.createElement("tr");

    trElem.innerHTML = `
        <td>${currentTask.id}</td>
        <td><input type="checkbox" ${currentTask.isDone ? "checked" : ""} ></td>
        <td>${currentTask.group}</td>
        <td>${currentTask.priority}</td>
        <td>${currentTask.details}</td>
        <td>${currentTask.deadline}</td>`;
    
    //Hide on narrow screen    
    if (isDescScreen) {
        domSelection.createdAt?.forEach((x) => x.classList.remove("hide-on-small-screen"));
        domSelection.headerWidth.setAttribute("colspan", "8");
        trElem.innerHTML += `<td>${currentTask.createdAt}</td>`;
    } else {
        domSelection.createdAt?.forEach((x) => x.classList.add("hide-on-small-screen"));
        domSelection.headerWidth.setAttribute("colspan", "7");
    }

    //Add available actions
    trElem.innerHTML += `
    <td>
        <button class="activity editRow">+</button>
        <button class="activity removeRow">-</button>
        <button class="activity showRow">...</button>
    </td>`;

    return trElem;
}

function addNewTask(event) {
    const modalForm = event.target.closest(".modal");
    const newTask = { ...singleTask };
    newTask.id = tasksArr.length === 0 ? 1 : Math.max(...tasksArr.map((task) => task.id)) + 1;
    newTask.isDone = modalForm.querySelector("#task-is-done").checked;
    newTask.group = modalForm.querySelector("#task-group").value.trim() || EMPTY_GROUP;
    newTask.priority = PRIORITY_LOWEST - modalForm.querySelector("#task-priority").value.trim() || PRIORITY_LOWEST;
    newTask.details = modalForm.querySelector("#task-details").value;
    newTask.deadline = modalForm.querySelector("#task-deadline").value;
    populateCreatedAt(newTask, LOCAL_EN);

    tasksArr.push(newTask);
    if (tasksArr.length === 1) {
        enableActivity();
    }
    addObjToTableBody(newTask, true);
}

function populateCreatedAt(newTask, local = LOCAL_EN) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mo = new Intl.DateTimeFormat(local, { month: "short" }).format(now);
    const yyyy = String(now.getFullYear());

    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

    newTask.createdAt = `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
}

/*
Create and return map of type
  group_name : num_of_tasks_in_the_group
*/
function getExistedGroupsAndTasksNum() {
    const groupsMap = {};
    tasksArr.forEach((currentTask) => {
        groupsMap[currentTask.group] = (groupsMap[currentTask.group] || 0) + 1;
    });

    return groupsMap;
}

function getExistedGroups() {
    return new Set(tasksArr.map((task) => task.group));
}

function closeModal() {
    domSelection.modalWindow.classList.add("hidden");
}

function openModal() {
    domSelection.modalWindow.classList.remove("hidden");
    clearPreviousModalData();
    updateDomWithExistedGroups();
}

function clearPreviousModalData() {
    const groupInput = document.querySelector("#task-group");
    groupInput.value = "";

    const detailsInput = document.querySelector("#task-details");
    detailsInput.value = "";

    const doneInput = document.querySelector("#task-is-done");
    doneInput.checked = false;

    const deadlineInput = document.querySelector("#task-deadline");
    deadlineInput.value = "";

    //slider
    const priorityOut = document.getElementById("priority-value");
    priorityOut.textContent = "5";
    const defaultTaskPriority = document.getElementById("task-priority");
    defaultTaskPriority.value = "5";
}

function updateDomWithExistedGroups() {
    const existedGroups = getExistedGroups();
    let htmlStr = "";

    existedGroups.forEach((group) => {
        htmlStr += `<option value="${group}"></option>`;
    });

    domSelection.groupsList.innerHTML = htmlStr;
}

function updatePriorityValue(priorityIn, priorityOut) {
    priorityOut.textContent = PRIORITY_LOWEST - priorityIn.value;
}

function disableActivity() {
    domSelection.deactivated.forEach((el) => {
        el.setAttribute("disabled", "");
    });
}

function enableActivity() {
    domSelection.deactivated.forEach((el) => {
        el.removeAttribute("disabled");
    });
}

updateResponsiveStyles();

window.addEventListener("resize", () => updateDataOnScreen());

/*
Update selected priority value in the middle window
*/
document.addEventListener("DOMContentLoaded", () => {
    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));
    disableActivity();
    updateDataOnScreen();
    closeModal();
});

/*
Add click listeners
*/
domSelection.body.addEventListener("click", handleTableClick);
domSelection.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
});
domSelection.modalWindow.addEventListener("click", handleModalClick);
