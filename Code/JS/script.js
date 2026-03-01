import { Task } from "./Task.js";
import { TaskManager } from "./TaskManager.js";
import * as helper from "./helper.js";
import { Testing } from "./Testing.js";
import { LOCALSTORAGE_KEY, SCREEN_SIZES, EMPTY_GROUP, PRIORITY_LOWEST, visabilityFlags, LOG_ON } from "./config.js";

const taskManager = new TaskManager();
let sortOrder = true;
let selectedAll = false;
let dropFilterBtnEnabled = true;

const responsiveDesign = {
    backgroundColor: "",
    myWidth: "",
    myModalWith: ""
};

const htmlRow = {
    rowEl: {},
    idEl: {},
    id: ""
};

const tableColumnsConfig = [
    { name: "select", colHeader: "select", isVisible: true },
    { name: "id", colHeader: "ID", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable },
    { name: "isDone", colHeader: "Done", isVisible: true },
    { name: "priority", colHeader: "Priority", isVisible: true },
    { name: "group", colHeader: "Group", isVisible: true },
    { name: "details", colHeader: "Task details", isVisible: true },
    { name: "deadline", colHeader: "Deadline", isVisible: true },
    { name: "deadlineTs", colHeader: "", isVisible: false },
    { name: "createdAt", colHeader: "Created At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "createdAtTs", colHeader: "", isVisible: false },
    { name: "updatedAt", colHeader: "Updated At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "updatedAtTs", colHeader: "", isVisible: false },
    { name: "changes", colHeader: "", isVisible: false },
    { name: "actions", colHeader: "Actions", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable }
];

const dom = {
    rows: document.querySelectorAll("tbody tr"),
    managingBlock: document.querySelectorAll("div.managing"),
    taskTable: document.getElementById("task-table"),
    groupsList: document.getElementById("groups"),
    headerWidth: document.getElementById("full-table-header-width"),
    hideOnNarrow: document.querySelectorAll(".hide-on-narrow-screen"),
    deactivated: document.querySelectorAll(".hide-if-no-tasks"),
    dropFilterToggle: document.querySelectorAll(".hide-if-no-filter"),

    modal: {
        modalWindow: document.getElementById("modalOverlay"),
        historyModalWindow: document.getElementById("historyModalOverlay"),
        filterModalWindow: document.getElementById("filterModalOverlay"),
        statisticModalWindow: document.getElementById("statisticModalOverlay"),
        introModalWindow: document.getElementById("introModalOverlay"),
        historyTable: document.getElementById("history-table"),
        submitBtn: document.getElementById("submitBtn"),
        isDone: document.getElementById("task-is-done"),
        group: document.getElementById("task-group"),
        priority: document.getElementById("task-priority"),
        details: document.getElementById("task-details"),
        deadline: document.getElementById("task-deadline"),
        legend: document.getElementById("modal-legend"),
        priorityOut: document.getElementById("priority-value"),
        finalFilterTextarea: document.getElementById("finalFilter"),
        filter: document.getElementById("finalFilter")
    },

    statistic: {
        totalTasks: document.getElementById("total-task"),
        done: document.getElementById("done"),
        p0: document.getElementById("p0"),
        p1: document.getElementById("p1"),
        p2: document.getElementById("p2"),
        p3: document.getElementById("p3"),
        p4: document.getElementById("p4"),
        p5: document.getElementById("p5"),
        p6: document.getElementById("p6"),
        p7: document.getElementById("p7"),
        p8: document.getElementById("p8"),
        p9: document.getElementById("p9"),
        p10: document.getElementById("p10"),
        groups: document.getElementById("groups-stat"),
        latestByD: document.getElementById("latest-dead"),
        closestByD: document.getElementById("closest-dead"),
        mostlyChanged: document.getElementById("mostly-changed")
    },

    test: {
        mainTable: document.getElementById("test-data-main-table"),
        mainTableHis: document.getElementById("test-data-main-table-his"),
        localSt: document.getElementById("test-data-locstor-table"),
        localStHis: document.getElementById("test-data-locstor-table-his"),
        startDate: document.getElementById("test-data-start"),
        endDate: document.getElementById("test-data-finish")
    }
};

// Redirect clicks in table
function handleTableClick(e) {
    if (e.target.closest("#openIntroModalButton")) {
        handlePictureClick();
    } else if (e.target.matches("button.editRow")) {
        handleEditTask(e);
    } else if (e.target.matches("button.hideRow")) {
        handleHideTask(e);
    } else if (e.target.matches("button.removeRow")) {
        handleRemoveTask(e);
    } else if (e.target.matches("button.showTaskHistory")) {
        handleShowTaskHistory(e);
    } else if (e.target.matches('input[type="checkbox"]')) {
        handleCheckbox(e);
    } else if (e.target.matches("th")) {
        const sortBy = e.target.dataset.colSorting;
        const sortParams = taskManager.detectSortFunction(sortBy);
        if (sortParams) {
            dom.taskTable.querySelectorAll("th[data-col-sorting]").forEach((th) => {
                th.removeAttribute("aria-sort");
            });
            e.target.setAttribute("aria-sort", sortOrder ? "ascending" : "descending");
            taskManager.sortBy(sortOrder, sortParams);
            sortOrder = !sortOrder;
            updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        }
    }
}

function handleCheckbox(e) {
    getHTMLEl(e);

    const checkboxType = e.target.dataset.taskChecked;
    if (checkboxType === "status") {
        const clickedTask = taskManager.getTaskById(htmlRow.id);
        updateTaskHistory();
        clickedTask.isDone = !clickedTask.isDone;
        clickedTask.updatedAt = helper.formatTime(null, helper.LOCAL_EN);
        clickedTask.changes[clickedTask.changes.length - 1].changes = [];
        updateRowOnScreen(clickedTask, dom.taskTable);
    } else {
        const clickedTask = taskManager.getTaskById(htmlRow.id);
        taskManager.toggleSelection(htmlRow.id);
        updateRowOnScreen(clickedTask, dom.taskTable);
    }
}

function handleShowTaskHistory(event) {
    getHTMLEl(event);
    visabilityFlags.isHistoryTable = true;
    const oldTask = taskManager.getTaskById(htmlRow.id);
    updateDataOnScreen(oldTask.changes, dom.modal.historyTable);
    openHistoryModal();
}

// Click on edit button in the table row
function handleEditTask(event) {
    getHTMLEl(event);
    prepareModal(true);
    openModal();
}

// Click on edit button in the table row
function handleHideTask(event) {
    getHTMLEl(event);
    taskManager.hideTaskById(htmlRow.id);
    disableBtnsForNoTasksTable();
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

// Click on remove button in the table row
function handleRemoveTask(event) {
    getHTMLEl(event);
    taskManager.removeTaskById(htmlRow.id);
    disableBtnsForNoTasksTable();
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

const managingActions = {
    ".filter": () => {
        openFilterModal();
    },

    ".add": () => {
        prepareModal(false);
        openModal();
    },

    ".all": () => {
        toggleMenu(".all-menu", ".all");
    },

    ".all-hide": () => {
        taskManager.hideTasks();
        updateDataOnScreen(taskManager.getAllTasksForDisplay(true), dom.taskTable);
        closeAllMenu();
    },

    ".all-rem": () => {
        taskManager.removeTasks();
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        closeAllMenu();
    },

    ".all-show": () => {
        taskManager.showAll();
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        closeAllMenu();
    },

    ".all-sel": () => {
        taskManager.toggleAllSelected(selectedAll);
        selectedAll = !selectedAll;
        updateDataOnScreen(taskManager.getAllTasksForDisplay(true), dom.taskTable);
        closeAllMenu();
    },

    ".all-stat": () => {
        prepareStatisticModal(false);
        openStatisticModal();
        closeAllMenu();
    },

    ".import-sub-btn": () => {
        toggleMenu(".import-sub-menu", ".import-sub-btn");
    },

    ".import-loc-add": () => {
        const tasksInLocalStorage = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY));
        taskManager.hydrateAndAppendTasks(tasksInLocalStorage);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        document.querySelector(".import-sub-menu").classList.toggle("open");
        closeAllMenu();
    },

    ".import-loc-rep": () => {
        const tasksInLocalStorage = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY));
        taskManager.removeTasks();
        taskManager.hydrateAndAppendTasks(tasksInLocalStorage);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        document.querySelector(".import-sub-menu").classList.toggle("open");
        closeAllMenu();
    },

    ".export-sub-btn": () => {
        toggleMenu(".export-sub-menu", ".export-sub-btn");
    },

    ".export-all-file": () => {
        taskManager.saveInFile();
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeAllMenu();
    },

    ".export-all-add": () => {
        const localStorageDta = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || [];
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(taskManager.getAllTasks().concat(localStorageDta)));
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeAllMenu();
    },

    ".export-all-rep": () => {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(taskManager.getAllTasks()));
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeAllMenu();
    },

    ".selected": () => {
        toggleMenu(".selected-menu", ".selected");
    },

    ".selected-hide": () => {
        taskManager.hideTasks(true);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(true), dom.taskTable);
        closeSelectedMenu();
    },

    ".selected-rem": () => {
        taskManager.removeTasks(true);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(true), dom.taskTable);
        closeSelectedMenu();
    },

    ".selected-show": () => {
        taskManager.showSelected();
        updateDataOnScreen(taskManager.getAllTasksForDisplay(true), dom.taskTable);
        closeSelectedMenu();
    },

    ".selected-stat": () => {
        prepareStatisticModal(true);
        openStatisticModal();
        closeSelectedMenu();
    },

    ".export-sel-file": () => {
        taskManager.saveInFile(true);
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeSelectedMenu();
    },

    ".export-sel-add": () => {
        const selectedTasks = taskManager.getAllTasks(true);
        const localStorageData = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || [];
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(selectedTasks.concat(localStorageData)));
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeSelectedMenu();
    },

    ".export-sel-rep": () => {
        const selectedTasks = taskManager.getAllTasks(true);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(selectedTasks));
        document.querySelector(".export-sub-menu").classList.toggle("open");
        closeSelectedMenu();
    }
};

function handleManagingClick(event) {
    const entry = Object.entries(managingActions).find((entry) => event.target.matches(entry[0]));
    if (entry) entry[1](event);
}

async function handleImportFile(event) {
    const toAdd = event.target.matches(".lbl-file-import-add");
    const file = event.target.files[0];
    if (!file || file.type !== "application/json") {
        console.error(`${file.name} is not a JSON file.`);
        alert("Please select JSON file.");
        return;
    } else if (file.size === 0) {
        console.error(`File ${file.name} is empty!`);
        alert(`File ${file.name} is empty!`);
        return;
    }

    try {
        const text = await file.text();
        const taskArr = JSON.parse(text);
        if (!toAdd) {
            taskManager.removeTasks();
        }
        taskManager.hydrateAndAppendTasks(taskArr);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        enableBtnsForNoTasksTable();
        document.querySelector(".import-menu").classList.toggle("open");
    } catch (error) {
        console.error(`Error while processing ${file.name}: ` + error);
    } finally {
        document.querySelector(".import-sub-menu").classList.toggle("open");
        document.querySelector(".all-menu").classList.toggle("open");
    }
}

function handleSaveTask(isEditMode) {
    const incomingData = getChangeableFieldsFromModal();
    if (isEditMode) {
        const updatedTask = taskManager.updateTask(htmlRow.id, incomingData);
        if (updatedTask) {
            updateRowOnScreen(updatedTask, dom.taskTable);
        }
    } else {
        const newTask = Task.createTask(incomingData);
        taskManager.addTask(newTask);
        addRowToScreen(newTask, dom.taskTable);
        if (!taskManager.isEmpty()) {
            enableBtnsForNoTasksTable();
        }
    }
}

function handlePictureClick() {
    openIntroModal();
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

function handleHistoryModalClick(e) {
    if (e.target.matches("#historySubmitBtn") || e.target.matches("#historyCloseBtn")) {
        e.preventDefault();
        closeHistoryModal();
    }
}

function handleFilterModalClick(e) {
    if (e.target.matches("#filterSubmitBtn")) {
        e.preventDefault();
        const preformatedFilter = dom.modal.filter.value;
        const formatedFilter = formatFilter(preformatedFilter);
        const tasksAfterFiltering = filterTasks(formatedFilter);
        updateDataOnScreen(tasksAfterFiltering, dom.taskTable);
        enableDropFilterBtn();
        closeFilterModal();
    } else if (e.target.matches("#filterCloseBtn")) {
        e.preventDefault();
        closeFilterModal();
    } else if (e.target.matches("#clearFilter")) {
        dom.modal.filter.value = "";
    } else if (e.target.matches("#dropFilter")) {
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
    }
}

function handleStatisticModalClick(e) {
    if (e.target.matches("#statisticSubmitBtn") || e.target.matches("#statisticCloseBtn")) {
        closeStatisticModal();
    }
}

function handleIntroModalClick(e) {
    if (e.target.matches("#introSubmitBtn")) {
        e.preventDefault();
        const testModule = new Testing(
            dom.test.mainTable.value ? Number(dom.test.mainTable.value) : null,
            dom.test.mainTableHis.value ? Number(dom.test.mainTableHis.value) : null,
            dom.test.localSt.value ? Number(dom.test.localSt.value) : null,
            dom.test.localStHis.value ? Number(dom.test.localStHis.value) : null,
            dom.test.startDate.value ? dom.test.startDate.value : null,
            dom.test.endDate.value ? dom.test.endDate.value : null
        );

        if (testModule.mainTableTaskCount !== 0 || testModule.localStorageTasksCount !== 0) {
            testModule.populateWithTestData(taskManager);
            updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
            enableBtnsForNoTasksTable();
        } else {
            if (LOG_ON) console.warn("No test data generated");
        }
        closeIntroModal();
        clearTestConfiguration();
        e.stopPropagation();
    } else if (e.target.matches("#introCloseBtn")) {
        e.preventDefault();
        closeIntroModal();
        clearTestConfiguration();
        e.stopPropagation();
    }
}

function closeAllMenu() {
    document.querySelector(".all-menu").classList.remove("open");
    document.querySelector(".all").setAttribute("aria-expanded", "false");
}

function closeSelectedMenu() {
    document.querySelector(".selected-menu").classList.remove("open");
    document.querySelector(".selected").setAttribute("aria-expanded", "false");
}


function toggleMenu(menuSelector, triggerSelector) {
    const menu = document.querySelector(menuSelector);
    const isOpen = menu.classList.toggle("open");
    const trigger = document.querySelector(triggerSelector);
    if (trigger) trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}


function clearTestConfiguration() {
    dom.test.mainTable.value = "";
    dom.test.mainTableHis.value = "";
    dom.test.localSt.value = "";
    dom.test.localStHis.value = "";
    dom.test.startDate.value = "";
    dom.test.endDate.value = "";
}

function prepareStatisticModal(selectedOnly = false) {
    dom.statistic.totalTasks.textContent = taskManager.getTasksCount(selectedOnly);
    dom.statistic.done.textContent = taskManager.getExecutedTasksCount(selectedOnly);

    //priority
    const priorityMap = taskManager.getExistingPrioritiesAndCount(selectedOnly);
    dom.statistic.p0.textContent = priorityMap[0] ?? 0;
    dom.statistic.p1.textContent = priorityMap[1] ?? 0;
    dom.statistic.p2.textContent = priorityMap[2] ?? 0;
    dom.statistic.p3.textContent = priorityMap[3] ?? 0;
    dom.statistic.p4.textContent = priorityMap[4] ?? 0;
    dom.statistic.p5.textContent = priorityMap[5] ?? 0;
    dom.statistic.p6.textContent = priorityMap[6] ?? 0;
    dom.statistic.p7.textContent = priorityMap[7] ?? 0;
    dom.statistic.p8.textContent = priorityMap[8] ?? 0;
    dom.statistic.p9.textContent = priorityMap[9] ?? 0;
    dom.statistic.p10.textContent = priorityMap[10] ?? 0;

    dom.statistic.groups.textContent = taskManager.getExistingGroups(selectedOnly).size;
    const maxDeadLine = taskManager.getMaxDeadline(selectedOnly);
    dom.statistic.latestByD.textContent = `TaskID = ${maxDeadLine.id} (${maxDeadLine.maxDate})`;

    const closestDeadLine = taskManager.getClosestDeadline(selectedOnly);
    const closestByDeadline =
        closestDeadLine.id === undefined
            ? `No future tasks found`
            : `TaskID = ${closestDeadLine.id} (${closestDeadLine.closest})`;
    dom.statistic.closestByD.textContent = closestByDeadline;

    const response = taskManager.getMostlyChanged(selectedOnly);
    dom.statistic.mostlyChanged.textContent = `TaskID = ${response.id}(${response.changesCount} changes)`;
}

function formatFilter(preformatedFilter) {
    const afterFormat = preformatedFilter
        .replace(/AND/g, "&&")
        .replace(/OR/g, "||")
        .replace(/equalTo/g, "===")
        .replace(/\s+startsWith\s+"(\w+)"/g, (match, p1) => {
            return `.startsWith("${p1}")`;
        })
        .replace(/\s+endsWith\s+"(\w+)"/g, (match, p1) => {
            return `.endsWith("${p1}")`;
        })
        .replace(/\s+includes\s+"(\w+)"/g, (match, p1) => {
            return `.includes("${p1}")`;
        })

        .replace(/task-select/g, "task.select")
        .replace(/task-id/g, "task.id")
        .replace(/task-isDone/g, "task.isDone")
        .replace(/task-group/g, "task.group")
        .replace(/task-priority/g, "task.priority")
        .replace(/task-details/g, "task.details")
        .replace(/task-deadline/g, "new Date(task.deadline).getTime()")
        .replace(/task-created/g, "new Date(task.createdAt).getTime()")
        .replace(/task-updated/g, "new Date(task.updatedAt).getTime()")
        .replace(/'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})'/g, (match) => {
            const dateStr = match.slice(1, -1);
            const date = new Date(dateStr + ":00Z");
            return `new Date('${date.toISOString()}').getTime()`;
        });
    if (LOG_ON) {
        console.warn("filter before format = " + preformatedFilter);
        console.warn("filter after format = " + afterFormat);
    }

    return afterFormat;
}

function filterTasks(filterExpression) {
    const filterFunction = new Function("task", `return ${filterExpression};`);
    const tasksAfterFilter = taskManager.getAllTasksForDisplay().filter((task) => filterFunction(task));
    taskManager.setVisibleOnScreen(tasksAfterFilter);
    return tasksAfterFilter;
}

function updateTaskHistory() {
    const currentTask = taskManager.getTaskById(htmlRow.id);
    const historyCopyOfTask = currentTask.deepClone();
    currentTask.changes.push(historyCopyOfTask);
}

function updateRowOnScreen(task, table) {
    const existingRow = table.querySelector(`tr[data-id="${task.id}"]`);
    const columnsToShow = getColumnsToShow();
    buildRowFromTask(task, columnsToShow, existingRow);
}

//order of updateDomWithExistedGroups and setModalFields is important
// as otherwise existed groups will be loosed in modal window
function prepareModal(isEditMode) {
    if (isEditMode) {
        dom.modal.submitBtn.dataset.action = "edit";
        const oldTask = taskManager.getTaskById(htmlRow.id);
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
        dom.modal.deadline.value = formatForInputDatetime(oldTask.deadline);
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

function formatForInputDatetime(taskDate) {
    const d = new Date(taskDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

function getHTMLEl(event) {
    htmlRow.rowEl = event.target.closest("tr");
    htmlRow.id = htmlRow.rowEl.dataset.id;
}

function detectScreenSize() {
    const width = window.innerWidth;
    if (width >= SCREEN_SIZES.MOBILE && width < SCREEN_SIZES.TABLET) {
        visabilityFlags.isMobScreen = true;
        visabilityFlags.isTabScreen = false;
        visabilityFlags.isDescScreen = false;
    } else if (width >= SCREEN_SIZES.TABLET && width < SCREEN_SIZES.DESKTOP) {
        visabilityFlags.isMobScreen = false;
        visabilityFlags.isTabScreen = true;
        visabilityFlags.isDescScreen = false;
    } else if (width >= SCREEN_SIZES.DESKTOP) {
        visabilityFlags.isMobScreen = false;
        visabilityFlags.isTabScreen = false;
        visabilityFlags.isDescScreen = true;
    }
}

/**
 * @dataSource = array of tasks to be displayed on the screen
 * @tableForUpdate = wich table should be updated.
 *  Currently it can be table on main screen or table of history modal.
 */
function updateDataOnScreen(dataSource, tableForUpdate) {
    const columnsToShow = getColumnsToShow();

    //header
    const newTHeader = buildHeader(columnsToShow);
    const oldThead = tableForUpdate.querySelector("thead");
    if (oldThead) {
        oldThead.replaceWith(newTHeader);
    }

    //body
    const newTBody = buildBody(columnsToShow, dataSource);
    setBodyDesign(newTBody, true);
    const oldTbody = tableForUpdate.querySelector("tbody");
    if (oldTbody) {
        oldTbody.replaceWith(newTBody);
    }
}

function getColumnsToShow() {
    return tableColumnsConfig.filter((col) =>
        typeof col.isVisible === "function" ? col.isVisible(visabilityFlags) : col.isVisible
    );
}

function addRowToScreen(dataSource, tableForUpdate) {
    const columnsToShow = getColumnsToShow();
    const oldTbody = tableForUpdate.querySelector("tbody");
    const newTBody = buildBody(columnsToShow, [dataSource], oldTbody);
    setBodyDesign(newTBody, false);
    if (oldTbody) {
        oldTbody.replaceWith(newTBody);
    }
}

function buildHeader(columnsToShow) {
    const thead = document.createElement("thead");

    //Header of the table
    if (!visabilityFlags.isHistoryTable) {
        const headerRow_mainHeader = thead.insertRow();
        headerRow_mainHeader.setAttribute("class", "full-table-header");

        const th_main = document.createElement("th");
        th_main.setAttribute("colspan", `${columnsToShow.length}`);
        th_main.setAttribute("id", `full-table-header-width`);

        const button = document.createElement("button");
        button.setAttribute("id", "openIntroModalButton");

        const img = document.createElement("img");
        img.setAttribute("src", "../Data/I_in_circle.png");
        img.setAttribute("alt", "Open Modal");
        button.appendChild(img);
        th_main.textContent = "Things to do";
        th_main.insertBefore(button, th_main.firstChild);
        headerRow_mainHeader.appendChild(th_main);
    }

    //Columns headers
    const headerRow_headers = thead.insertRow();
    columnsToShow.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.colHeader;
        if (!visabilityFlags.isHistoryTable) {
            const sorting = helper.mapColumnName2Dataset(col.colHeader);
            if (sorting) th.dataset.colSorting = sorting;
        }
        headerRow_headers.appendChild(th);
    });

    return thead;
}

//If existingBody != null it means we are going to add a new row to existing table
function buildBody(columnsToShow, tasksSource, existingBody = null) {
    const tbody = existingBody ?? document.createElement("tbody");
    tasksSource.forEach((task) => {
        const row = buildRowFromTask(task, columnsToShow, null);
        tbody.appendChild(row);
    });
    return tbody;
}

function buildRowFromTask(task, columnsToShow, existingRow = null) {
    const row = existingRow ?? document.createElement("tr");
    row.innerHTML = "";
    row.dataset.id = task.id;

    columnsToShow.forEach((col) => {
        const cell = row.insertCell();
        if (col.name === "actions") {
            const editBtn = document.createElement("button");
            editBtn.className = "activity editRow";
            editBtn.setAttribute("title", "Edit the task");
            editBtn.setAttribute("aria-label", "Edit the task");
            editBtn.textContent = "+";
            cell.appendChild(editBtn);

            const hideBtn = document.createElement("button");
            hideBtn.className = "activity hideRow";
            hideBtn.setAttribute("title", "Hide the task from display");
            hideBtn.setAttribute("aria-label", "Hide the task from display");
            hideBtn.textContent = "-";
            cell.appendChild(hideBtn);

            const removeBtn = document.createElement("button");
            removeBtn.className = "activity removeRow";
            removeBtn.setAttribute("title", "Remove totally the task");
            removeBtn.setAttribute("aria-label", "Remove totally the task");
            removeBtn.textContent = "x";
            cell.appendChild(removeBtn);

            const showBtn = document.createElement("button");
            showBtn.className = "activity showTaskHistory";
            showBtn.setAttribute("title", "Show task changes history");
            showBtn.setAttribute("aria-label", "Show task changes history");
            showBtn.textContent = "...";
            cell.appendChild(showBtn);
        } else if (col.name === "isDone" || col.name === "select") {
            const checkbox = document.createElement("input");
            const dataType = col.name === "isDone" ? "status" : "selection";
            checkbox.setAttribute("aria-label", col.name === "isDone" ? "Mark as done" : "Select task");
            checkbox.dataset.taskChecked = dataType;
            checkbox.type = "checkbox";
            checkbox.checked = !!task[col.name];
            if (visabilityFlags.isHistoryTable) checkbox.disabled = true;
            cell.appendChild(checkbox);
        } else {
            cell.textContent = task[col.name];
        }
    });

    return row;
}

function setBodyDesign(element, isScreenChanged) {
    if (isScreenChanged) {
        detectScreenSize();
        if (visabilityFlags.isMobScreen) {
            responsiveDesign.backgroundColor = "yellow";
            responsiveDesign.myWidth = "100%";
            responsiveDesign.myModalWith = "100%";
        } else if (visabilityFlags.isTabScreen) {
            responsiveDesign.backgroundColor = "aqua";
            responsiveDesign.myWidth = "85%";
            responsiveDesign.myModalWith = "85%";
        } else if (visabilityFlags.isDescScreen) {
            responsiveDesign.backgroundColor = "lightblue";
            responsiveDesign.myWidth = "85%";
            responsiveDesign.myModalWith = "75%";
        }
    }

    element.setAttribute("style", `background-color:${responsiveDesign.backgroundColor}`);
    document.documentElement.style.setProperty("--my-width", responsiveDesign.myWidth);
    document.documentElement.style.setProperty("--my-modal-width", responsiveDesign.myModalWith);
}

function getChangeableFieldsFromModal() {
    return {
        isDone: dom.modal.isDone.checked,
        group: dom.modal.group.value.trim() || EMPTY_GROUP,
        priority: PRIORITY_LOWEST - Number(dom.modal.priority.value.trim()),
        details: dom.modal.details.value,
        deadline: helper.formatTime(dom.modal.deadline.value, helper.LOCAL_EN)
    };
}

//Intro modal
function closeIntroModal() {
    dom.modal.introModalWindow.classList.add("hidden");
}
function openIntroModal() {
    console.trace("openIntroModal called");
    dom.modal.introModalWindow.classList.remove("hidden");
    dom.modal.introModalWindow.querySelector("input, button, details, summary").focus();
}

//Statistical modal
function closeStatisticModal() {
    dom.modal.statisticModalWindow.classList.add("hidden");
}
function openStatisticModal() {
    dom.modal.statisticModalWindow.classList.remove("hidden");
    dom.modal.statisticModalWindow.querySelector("input, button").focus();
}

//Filter modal
function closeFilterModal() {
    dom.modal.filterModalWindow.classList.add("hidden");
}
function openFilterModal() {
    dom.modal.filterModalWindow.classList.remove("hidden");
    dom.modal.filterModalWindow.querySelector("input, button").focus();
}

//History modal
function closeHistoryModal() {
    visabilityFlags.isHistoryTable = false;
    dom.modal.historyModalWindow.classList.add("hidden");
}
function openHistoryModal() {
    dom.modal.historyModalWindow.classList.remove("hidden");
    dom.modal.historyModalWindow.querySelector("button").focus();
}

//Add modal
function closeModal() {
    dom.modal.modalWindow.classList.add("hidden");
}
function openModal() {
    dom.modal.modalWindow.classList.remove("hidden");
    dom.modal.modalWindow.querySelector("input, button").focus();
}

function updateDomWithExistedGroups() {
    const existingGroups = taskManager.getExistingGroups();
    let htmlStr = "";

    existingGroups.forEach((group) => {
        htmlStr += `<option value="${group}"></option>`;
    });

    dom.groupsList.innerHTML = htmlStr;
}

function updatePriorityValue(priorityIn, priorityOut) {
    priorityOut.textContent = PRIORITY_LOWEST - priorityIn.value;
}

function disableDropFilterBtn() {
    if (dropFilterBtnEnabled) {
        dom.dropFilterToggle.forEach((x) => {
            x.classList.remove("btn-is-active");
        });
        dropFilterBtnEnabled = false;
    }
}

function disableBtnsForNoTasksTable() {
    if (taskManager.isEmpty()) {
        dom.deactivated.forEach((el) => {
            el.classList.remove("btn-is-active");
            el.setAttribute("aria-disabled", "true");
        });
    }
}

function enableDropFilterBtn() {
    if (!dropFilterBtnEnabled) {
        dom.dropFilterToggle.forEach((x) => {
            x.classList.add("btn-is-active");
        });
        dropFilterBtnEnabled = true;
    }
}

function enableBtnsForNoTasksTable() {
    if (!taskManager.isEmpty()) {
        dom.deactivated.forEach((el) => {
            el.classList.add("btn-is-active");
            el.setAttribute("aria-disabled", "false");
        });
    }
}

/**
 * Initialization block
 *
 *
 */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".export-sub-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            document.querySelectorAll(".export-sub-menu").forEach((m) => {
                if (m !== menu) m.classList.remove("open");
            });
            document.querySelectorAll(".import-sub-menu").forEach((m) => {
                m.classList.remove("open");
            });
            menu.classList.toggle("open");
        });
    });

    document.querySelectorAll(".import-sub-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            document.querySelectorAll(".import-sub-menu").forEach((m) => {
                if (m !== menu) m.classList.remove("open");
            });
            document.querySelectorAll(".export-sub-menu").forEach((m) => {
                m.classList.remove("open");
            });
            menu.classList.toggle("open");
        });
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".export-sub-menu").forEach((m) => m.classList.remove("open"));
        document.querySelectorAll(".import-sub-menu").forEach((m) => m.classList.remove("open"));
    });

    //Add click listeners in managing block
    window.addEventListener("resize", () => updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable));
    dom.taskTable.addEventListener("click", handleTableClick);
    dom.managingBlock.forEach((block) => {
        block.addEventListener("click", handleManagingClick);
        const fileInputs = block.querySelectorAll('input[type="file"]');
        fileInputs.forEach((fileInput) => {
            fileInput.addEventListener("change", handleImportFile);
            fileInput.removeEventListener("click", handleManagingClick);
        });
    });

    //Add click listeners inside modals
    dom.modal.modalWindow.addEventListener("click", handleModalClick);
    dom.modal.historyModalWindow.addEventListener("click", handleHistoryModalClick);
    dom.modal.filterModalWindow.addEventListener("click", handleFilterModalClick);
    dom.modal.statisticModalWindow.addEventListener("click", handleStatisticModalClick);
    dom.modal.introModalWindow.addEventListener("click", handleIntroModalClick);

    //Init - slider need first time to be run automatically
    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));

    //Init - main window preparations
    disableBtnsForNoTasksTable();
    disableDropFilterBtn();
    detectScreenSize();
    updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
    closeModal();
    closeHistoryModal();
    closeFilterModal();
    closeStatisticModal();
    openIntroModal();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
            closeHistoryModal();
            closeFilterModal();
            closeStatisticModal();
            closeIntroModal();
        }
    });

    //filter builder functionality
    const applyFilterBtn = document.getElementById("filterSubmitBtn");
    const finalFilterTextarea = document.getElementById("finalFilter");
    const dragBtns = document.querySelectorAll(".drag-btn");
    const fieldSelect = document.querySelector(".field");
    const operationSelect = document.querySelector(".operation");
    const valueContainer = document.querySelector(".value-container");
    const filterRow = document.querySelector(".filter-row");

    const fieldOperations = {
        bool: ["==="],
        number: [">", ">=", "===", "<", "<="],
        string: ["equalTo", "startsWith", "endsWith", "includes"],
        "date-time": [">", ">=", "===", "<", "<="]
    };

    const fieldValues = {
        bool: () => {
            valueContainer.innerHTML = `<label><input type="radio" name="bool" value="true">true</label>
            <label><input type="radio" name="bool" value="false">false</label>`;
        },
        number: () => {
            valueContainer.innerHTML = `<input type="text" class="value-input num" placeholder="012..." />`;
        },
        string: () => {
            valueContainer.innerHTML = `<input type="text" class="value-input txt" placeholder="ABC..." />`;
        },
        "date-time": () => {
            valueContainer.innerHTML = `<input type="datetime-local" class="value-input" />`;
        }
    };

    function getCurrentValue() {
        const checked = document.querySelector('input[name="bool"]:checked');
        if (checked) return { val: checked.value, type: checked.type };
        const input = document.querySelector(".value-input");
        if (input.type === "text") {
            if (input.classList.contains("txt")) {
                return { val: input.value, type: "txt" };
            } else {
                return { val: input.value, type: "num" };
            }
        }
        if (input) return { val: input.value, type: input.type };
    }

    dragBtns.forEach((btn) => {
        btn.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text", e.target.innerText);
        });
    });

    filterRow.addEventListener("dragstart", (e) => {
        const field = fieldSelect.value;
        const operation = operationSelect.value;
        const value = getCurrentValue();
        let finalValue = value.val;
        if (value.type === "txt") {
            finalValue = `"${value.val}"`;
        } else if (value.type === "num") {
            finalValue = Number(`${value.val}`);
        } else if (value.type === "datetime-local") {
            finalValue = `'${value.val}'`;
        }
        const filterString = `${field} ${operation} ${finalValue}`;
        e.dataTransfer.setData("text", filterString);
    });

    finalFilterTextarea.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    finalFilterTextarea.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedText = e.dataTransfer.getData("text");
        finalFilterTextarea.value += draggedText + " ";
    });

    applyFilterBtn.addEventListener("click", () => {
        //TODO: use finalFilterTextarea.value ;
    });

    fieldSelect.addEventListener("change", (e) => {
        const fieldType = e.target.selectedOptions[0].getAttribute("data-type");
        updateOperations(fieldType);
        updateValues(fieldType);
    });

    function updateOperations(fieldType) {
        operationSelect.innerHTML = "";
        fieldOperations[fieldType].forEach((op) => {
            const option = document.createElement("option");
            option.value = op;
            option.textContent = op;
            operationSelect.appendChild(option);
        });
    }

    function updateValues(fieldType) {
        fieldValues[fieldType]();
    }

    const defaultFieldType = fieldSelect.selectedOptions[0].getAttribute("data-type");
    updateOperations(defaultFieldType);
    updateValues(defaultFieldType);

    //************************************************************************************** */

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".all-container")) {
            document.querySelector(".all-menu").classList.remove("open");
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".selected-container")) {
            document.querySelector(".selected-menu").classList.remove("open");
        }
    });
});

//document.getElementById("saveDataBtn").addEventListener("click", () => );
