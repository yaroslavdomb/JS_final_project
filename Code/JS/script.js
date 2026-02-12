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

const htmlRow = {
    rowEl: {},
    idEl: {},
    id: ""
};

const singleTask = {
    id: "",
    isDone: false,
    priority: "",
    group: "",
    details: "",
    deadline: "",
    createdAt: "",
    lastChangedAt: "",
    changes: []
};

const existedTasksArr = [];

const dom = {
    rows: document.querySelectorAll("tbody tr"),
    managingBlock: document.querySelectorAll("div.managing"),
    body: document.querySelector("tbody"),
    groupsList: document.getElementById("groups"),
    modalWindow: document.getElementById("modalOverlay"),
    submitBtn: document.getElementById("submitBtn"),
    headerWidth: document.getElementById("full-table-header-width"),
    createdAt: document.querySelectorAll(".hide-on-small-screen"),
    deactivated: document.querySelectorAll(".hide-if-no-tasks"),

    modal: {
        isDone: document.getElementById("task-is-done"),
        group: document.getElementById("task-group"),
        priority: document.getElementById("task-priority"),
        details: document.getElementById("task-details"),
        deadline: document.getElementById("task-deadline"),
        legend: document.getElementById("modal-legend"),
        priorityOut: document.getElementById("priority-value")
    }
};

function handleTableClick(e) {
    if (e.target.matches("button.editRow")) {
        handleEditTaskBefore(e);
    } else if (e.target.matches("button.removeRow")) {
        removeRow(e);
    } else if (e.target.matches("button.showRow")) {
        //showRowHistory(e);
    }
}

function handleEditTaskBefore(event) {
    getHTMLEl(event);
    updateTasksStatistics(htmlRow.id, "edit");
    const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
    prepareModal(true, oldTask);
    openModal();
}

function handleEditTaskAfter() {
    const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
    extractIncomingData(false, oldTask);
    formatAndPopulateTime(oldTask, false, LOCAL_EN);
    updateDataOnScreen(false);
}

function prepareModal(isEditMode, oldTask) {
    if (isEditMode) {
        dom.submitBtn.dataset.action = "edit";
    } else {
        dom.submitBtn.dataset.action = "add";
    }

    if (!oldTask) {
        setModalFields();
        updateDomWithExistedGroups();
    } else {
        updateDomWithExistedGroups();
        setModalFields(oldTask);
    }
}

function setModalFields(oldTask = null) {
    if (oldTask !== null) {
        dom.modal.group.value = oldTask.group;
        dom.modal.details.value = oldTask.details;
        dom.modal.isDone.checked = oldTask.isDone;
        dom.modal.deadline.value = oldTask.deadline;
        dom.modal.priorityOut.textContent = oldTask.priority;
        dom.modal.priority.value = PRIORITY_LOWEST - oldTask.priority;
        dom.modal.legend.innerText = "Edit existing task";
        dom.submitBtn.innerText = "Edit task";
    } else {
        dom.modal.group.value = "";
        dom.modal.details.value = "";
        dom.modal.isDone.checked = "";
        dom.modal.deadline.value = "";
        dom.modal.priorityOut.textContent = "5";
        dom.modal.priority.value = "5";
        dom.modal.legend.innerText = "Add new task";
        dom.submitBtn.innerText = "Add task";
    }
}

function removeRow(event) {
    getHTMLEl(event);
    updateTasksStatistics(htmlRow.id, "remove");
    removeTaskFromExistedTaskArr(htmlRow.id);
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

function getHTMLEl(event) {
    htmlRow.rowEl = event.target.closest("tr");
    htmlRow.idEl = htmlRow.rowEl.querySelector(".task-id");
    htmlRow.id = htmlRow.idEl.innerText;
}

function updateTasksStatistics(id, action) {
    //TODO
}

function removeTaskFromExistedTaskArr(idToBeRemoved) {
    const remainingTasks = existedTasksArr.filter((task) => Number(task.id) !== Number(idToBeRemoved));
    existedTasksArr.length = 0;
    existedTasksArr.push(...remainingTasks);
    if (existedTasksArr.length === 0) {
        disableActivity();
    }
}

function handleManagingClick(e) {
    if (e.target.matches(".add")) {
        prepareModal(false);
        openModal();
    } else if (e.target.matches(".remove")) {
        //removeTask(e);
    } else if (e.target.matches(".edit")) {
        //editTask(e);
    }
}

function handleModalClick(e) {
    if (e.target.matches("#submitBtn")) {
        const form = e.target.closest("form");
        if (!form.checkValidity()) {
            return;
        }

        e.preventDefault();
        const action = e.target.dataset.action;
        if (action === "add") {
            handleAddNewTask(e);
        } else {
            handleEditTaskAfter(e);
        }

        closeModal();
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
        dom.body.innerHTML = "";
    }
    existedTasksArr.forEach((currentTask) => addObjToTableBody(currentTask));
    updateResponsiveStyles();
}

function addObjToTableBody(task, shouldCallResponsiveStyle = false) {
    const trElem = mapObj2HTML(task);
    if (shouldCallResponsiveStyle) {
        updateResponsiveStyles(true, trElem);
    }
    dom.body.appendChild(trElem);
}

function mapObj2HTML(currentTask) {
    const trElem = document.createElement("tr");

    trElem.innerHTML = `
        <td class="task-id">${currentTask.id}</td>
        <td><input type="checkbox" ${currentTask.isDone ? "checked" : ""} ></td>
        <td>${currentTask.group}</td>
        <td>${currentTask.priority}</td>
        <td>${currentTask.details}</td>
        <td>${currentTask.deadline}</td>`;

    //Hide on narrow screen
    if (isDescScreen) {
        dom.createdAt?.forEach((x) => x.classList.remove("hide-on-small-screen"));
        dom.headerWidth.setAttribute("colspan", "8");
        trElem.innerHTML += `<td>${currentTask.createdAt}</td>`;
    } else {
        dom.createdAt?.forEach((x) => x.classList.add("hide-on-small-screen"));
        dom.headerWidth.setAttribute("colspan", "7");
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

function handleAddNewTask(event) {
    const newTask = { ...singleTask };
    extractIncomingData(true, newTask);
    formatAndPopulateTime(newTask, true, LOCAL_EN);

    existedTasksArr.push(newTask);
    if (existedTasksArr.length === 1) {
        enableActivity();
    }
    addObjToTableBody(newTask, true);
}

function extractIncomingData(shouldCreateNewId, task) {
    if (shouldCreateNewId) {
        task.id = existedTasksArr.length === 0 ? 1 : Math.max(...existedTasksArr.map((t) => t.id)) + 1;
    }
    task.isDone = dom.modal.isDone.checked;
    task.group = dom.modal.group.value.trim() || EMPTY_GROUP;
    task.priority = PRIORITY_LOWEST - dom.modal.priority.value.trim();
    task.details = dom.modal.details.value;
    task.deadline = dom.modal.deadline.value;
}

function formatAndPopulateTime(task, isNew = true, local = LOCAL_EN) {
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
    if (isNew) {
        task.createdAt = `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
    } else {
        task.lastChangedAt = `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
    }
}

/*
Create and return map of type
  group_name : num_of_tasks_in_the_group
*/
function getExistedGroupsAndTasksNum() {
    const groupsMap = {};
    existedTasksArr.forEach((currentTask) => {
        groupsMap[currentTask.group] = (groupsMap[currentTask.group] || 0) + 1;
    });

    return groupsMap;
}

function getExistedGroups() {
    return new Set(existedTasksArr.map((task) => task.group));
}

function closeModal() {
    dom.modalWindow.classList.add("hidden");
}

function openModal() {
    dom.modalWindow.classList.remove("hidden");
}

function updateDomWithExistedGroups() {
    const existingGroups = getExistedGroups();
    let htmlStr = "";

    existingGroups.forEach((group) => {
        htmlStr += `<option value="${group}"></option>`;
    });

    dom.groupsList.innerHTML = htmlStr;
}

function updatePriorityValue(priorityIn, priorityOut) {
    priorityOut.textContent = PRIORITY_LOWEST - priorityIn.value;
}

function disableActivity() {
    dom.deactivated.forEach((el) => {
        el.setAttribute("disabled", "");
    });
}

function enableActivity() {
    dom.deactivated.forEach((el) => {
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
dom.body.addEventListener("click", handleTableClick);
dom.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
});
dom.modalWindow.addEventListener("click", handleModalClick);
