// I wish I could say yes  = хотел бы я сказать что да
// Almost = ну почти
// Just a tiny bit more, and yes = еще совсем немножечко и да

const TEST_MODE_ON = true;

const test_data = {
    outer_data_size: 5,
    inner_data_size: 6
};

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
    body: document.getElementById("table-body"),
    groupsList: document.getElementById("groups"),
    headerWidth: document.getElementById("full-table-header-width"),
    hideOnNarrow: document.querySelectorAll(".hide-on-narrow-screen"),
    deactivated: document.querySelectorAll(".hide-if-no-tasks"),

    modal: {
        modalWindow: document.getElementById("modalOverlay"),
        historyModalWindow: document.getElementById("historyModalOverlay"),
        historyBody: document.getElementById("history-body"),
        submitBtn: document.getElementById("submitBtn"),
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
        handleShowTaskHistory(e);
    }
}

function handleShowTaskHistory(event) {
    getHTMLEl(event);
    const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
    updateDataOnScreen(true, oldTask.changes, dom.modal.historyBody);
    openHistoryModal();
}

// Click on edit button in the table row
function handleEditTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "edit");
    updateTaskHistory();
    prepareModal(true);
    openModal();
}

function updateTaskHistory() {
    const currentTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
    const historyCopyOfTask = structuredClone(currentTask);
    currentTask.changes.push(historyCopyOfTask);
}

//Click in the modal window to save the data after adding or editing a task
function handleSaveTask(isEditMode) {
    if (isEditMode) {
        const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
        extractIncomingData(false, oldTask);
        const taskChanged = isTaskChanged(oldTask);
        if (taskChanged) {
            oldTask.updatedAt = formatTime(LOCAL_EN);
            updateDataOnScreen(true, existedTasksArr, dom.body);
        } else {
            //remove last task image from its history
            oldTask.changes.pop();
        }
    } else {
        const newTask = structuredClone(singleTask);
        extractIncomingData(true, newTask);
        newTask.createdAt = formatTime(LOCAL_EN);

        existedTasksArr.push(newTask);
        if (existedTasksArr.length === 1) {
            enableActivity();
        }
        addObjToTableBody(newTask, dom.body, true);
    }
}

function isTaskChanged(currentTask) {
    const historyTaskCopy = currentTask.changes[currentTask.changes.length - 1];
    if (
        currentTask.isDone !== historyTaskCopy.isDone ||
        currentTask.priority !== historyTaskCopy.priority ||
        currentTask.group !== historyTaskCopy.group ||
        currentTask.details !== historyTaskCopy.details ||
        currentTask.deadline !== historyTaskCopy.deadline
    ) {
        return true;
    }

    return false;
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
        dom.modal.submitBtn.dataset.action = "edit";
        const oldTask = existedTasksArr.find((task) => Number(htmlRow.id) === Number(task.id));
        updateDomWithExistedGroups();
        setModalFields(oldTask);
    } else {
        dom.modal.submitBtn.dataset.action = "add";
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
        dom.modal.submitBtn.innerText = "Edit task";
    } else {
        dom.modal.group.value = "";
        dom.modal.details.value = "";
        dom.modal.isDone.checked = "";
        dom.modal.deadline.value = "";
        dom.modal.priorityOut.textContent = "5";
        dom.modal.priority.value = "5";
        dom.modal.legend.innerText = "Add new task";
        dom.modal.submitBtn.innerText = "Add task";
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
    disableActivity();
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
function updateDataOnScreen(buildTableFromScratch, tasksSource, htmlTarget) {
    if (buildTableFromScratch) {
        htmlTarget.innerHTML = "";
    }
    calculateColumnCount();
    setResponsiveColumnVisibility();
    tasksSource.forEach((currentTask) => addObjToTableBody(currentTask, htmlTarget));
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

function addObjToTableBody(task, htmlTarget, shouldCallResponsiveStyle = false) {
    const isHistoryTable = htmlTarget === dom.modal.historyBody ? true : false;
    const trElem = mapObj2HTML(task, isHistoryTable);
    if (shouldCallResponsiveStyle) {
        updateResponsiveStyles(true, trElem);
    }
    htmlTarget.appendChild(trElem);
}

function mapObj2HTML(task, isHistoryTable) {
    const trElem = document.createElement("tr");

    trElem.innerHTML = ``;
    if (!isHistoryTable) {
        trElem.innerHTML += `<td class="task-id">${task.id}</td>`;
    }

    trElem.innerHTML += `
        <td><input type="checkbox" ${task.isDone ? "checked" : ""} ></td>
        <td>${task.group}</td>
        <td>${task.priority}</td>
        <td>${task.details}</td>
        <td>${task.deadline}</td>`;

    //Display/hide columns depend on screen size
    if (isDescScreen) {
        trElem.innerHTML += `<td>${task.createdAt}</td>`;
        trElem.innerHTML += `<td>${task.updatedAt}</td>`;
    }

    //Add available actions
    if (!isHistoryTable) {
        trElem.innerHTML += `<td>
                <button class="activity editRow">+</button>
                <button class="activity removeRow">-</button>
                <button class="activity showRow">...</button>
            </td>`;
    }

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

//If it's marked as newTask, the field "createdAt" will be updated; otherwise, "updatedAt" will be updated.
function formatTime(local = LOCAL_EN) {
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

    return `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
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

function closeHistoryModal() {
    dom.modal.historyModalWindow.classList.add("hidden");
}

function closeModal() {
    dom.modal.modalWindow.classList.add("hidden");
}

function openHistoryModal() {
    dom.modal.historyModalWindow.classList.remove("hidden");
}

function openModal() {
    dom.modal.modalWindow.classList.remove("hidden");
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
    if (existedTasksArr.length === 0) {
        dom.deactivated.forEach((el) => {
            el.setAttribute("disabled", "");
        });
    }
}

function enableActivity() {
    dom.deactivated.forEach((el) => {
        el.removeAttribute("disabled");
    });
}

function calculateColumnCount() {
    tableFieldsCount = Object.keys(singleTask).length;
}

function handleHistoryModalClick(e) {
    if (e.target.matches("#historySubmitBtn") || e.target.matches("#historyCloseBtn")) {
        e.preventDefault();
        closeHistoryModal();
    }
}

updateResponsiveStyles();

window.addEventListener("resize", () => updateDataOnScreen(true, existedTasksArr, dom.body));

//Update selected priority value in the middle window
document.addEventListener("DOMContentLoaded", () => {
    if (TEST_MODE_ON) {
        populateWithTestData();
    }

    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));
    disableActivity();
    updateDataOnScreen(true, existedTasksArr, dom.body);
    closeModal();
    closeHistoryModal();
});

//Add click listeners
dom.body.addEventListener("click", handleTableClick);
dom.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
});
dom.modal.modalWindow.addEventListener("click", handleModalClick);
dom.modal.historyModalWindow.addEventListener("click", handleHistoryModalClick);

//************************************************************************
//TEST SECTION
function populateWithTestData() {
    existedTasksArr.push(...createTestTasks(test_data.outer_data_size, null));
    for (let i = 0; i < test_data.outer_data_size; i++) {
        existedTasksArr[i].changes.push(...createTestTasks(test_data.inner_data_size, existedTasksArr[i].details));
    }
}

function createTestTasks(taskLimit, keepTaskDetails) {
    const testTaskArr = [];
    for (let i = 0; i < taskLimit; i++) {
        const newTestTask = structuredClone(singleTask);
        newTestTask.id = i + 1;
        newTestTask.isDone = Math.floor(Math.random() * 10) >= 5;
        newTestTask.group = "test group" + Math.floor(Math.random() * 10);
        newTestTask.priority = Math.floor(Math.random() * 10);
        if (keepTaskDetails !== null) {
            newTestTask.details = keepTaskDetails;
        } else {
            newTestTask.details = "task details for " + i;
        }

        newTestTask.deadline = formatTime(LOCAL_EN);
        newTestTask.createdAt = formatTime(LOCAL_EN);
        newTestTask.updatedAt = formatTime(LOCAL_EN);
        testTaskArr.push(newTestTask);
    }
    return testTaskArr;
}
//************************************************************************

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
