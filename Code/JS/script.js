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
let tableFieldsCount;

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
    updatedAt: "",
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
    hideOnNarrow: document.querySelectorAll(".hide-on-narrow-screen"),
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

// Redirect clicks in table
function handleTableClick(e) {
    if (e.target.matches("button.editRow")) {
        handleEditTask(e);
    } else if (e.target.matches("button.removeRow")) {
        handleRemoveTask(e);
    } else if (e.target.matches("button.showRow")) {
        //showRowHistory(e);
    }
}

// Click on edit button in the table row
function handleEditTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "edit");
    //TODO: updateTaskHistory(htmlRow.id);
    prepareModal(true);
    openModal();
}

//Click in the modal window to save the data after adding or editing a task
function handleSaveTask(isEditMode) {
    if (isEditMode) {
        const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
        extractIncomingData(false, oldTask);
        formatAndPopulateTime(oldTask, false, LOCAL_EN);
        updateDataOnScreen(true);
    } else {
        const newTask = { ...singleTask };
        extractIncomingData(true, newTask);
        formatAndPopulateTime(newTask, true, LOCAL_EN);

        existedTasksArr.push(newTask);
        if (existedTasksArr.length === 1) {
            enableActivity();
        }
        addObjToTableBody(newTask, true);
    }
}

// Click on remove button in the table row
function handleRemoveTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "remove");
    removeTaskFromExistedTaskArr(htmlRow.id);
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

function prepareModal(isEditMode) {
    if (isEditMode) {
        dom.submitBtn.dataset.action = "edit";
        const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
        updateDomWithExistedGroups();
        setModalFields(oldTask);
    } else {
        dom.submitBtn.dataset.action = "add";
        setModalFields();
        updateDomWithExistedGroups();
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

//Redirect clicks in managing section
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

//Redirect clicks in modal window
function handleModalClick(e) {
    if (e.target.matches("#submitBtn")) {
        const form = e.target.closest("form");
        if (!form.checkValidity()) {
            return;
        }

        e.preventDefault();
        const action = e.target.dataset.action;
        const editModeFlag = action === "edit";
        handleSaveTask(editModeFlag);
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

/*
isNewElemExist: If there is no new element, 
the function is called due to screen resize, and 
all elements should be added to the table with new styles.

Otherwise, it adds just a single element, so no redesign is needed.
*/
function updateDataOnScreen(buildTableFromScratch) {
    if (buildTableFromScratch) {
        dom.body.innerHTML = "";
    }
    calculateColumnCount();
    setResponsiveColumnVisibility();
    existedTasksArr.forEach((currentTask) => addObjToTableBody(currentTask));
    updateResponsiveStyles();
}

function setResponsiveColumnVisibility() {
    if (isDescScreen) {
        dom.hideOnNarrow?.forEach((x) => x.classList.remove("hide-on-narrow-screen"));
        dom.headerWidth.setAttribute("colspan", tableFieldsCount);
    } else {
        dom.hideOnNarrow?.forEach((x) => x.classList.add("hide-on-narrow-screen"));
        dom.headerWidth.setAttribute("colspan", tableFieldsCount - 1);
    }
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

    //Display/hide columns depend on screen size
    if (isDescScreen) {
        trElem.innerHTML += `<td>${currentTask.createdAt}</td>`;
        trElem.innerHTML += `<td>${currentTask.updatedAt}</td>`;
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

function formatAndPopulateTime(task, isNewTask = true, local = LOCAL_EN) {
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
    if (isNewTask) {
        task.createdAt = `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
    }
    task.updatedAt = `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
}

//Create and return map of type {group_name : num_of_tasks_in_the_group}
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

function calculateColumnCount() {
    tableFieldsCount = Object.keys(singleTask).length;
}

updateResponsiveStyles();

window.addEventListener("resize", () => updateDataOnScreen(true));

//Update selected priority value in the middle window
document.addEventListener("DOMContentLoaded", () => {
    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));
    disableActivity();
    updateDataOnScreen(true);
    closeModal();
});

//Add click listeners
dom.body.addEventListener("click", handleTableClick);
dom.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
});
dom.modalWindow.addEventListener("click", handleModalClick);

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
