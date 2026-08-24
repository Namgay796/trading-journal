/* =========================================
   GLOBAL DATA
========================================= */

let allTrades = [];
let allAccounts = [];
let editingTrade = null;


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    const accountFilter =
        document.getElementById(
            "accountFilter"
        );

    if (!accountFilter) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await db
                .from("accounts")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        allAccounts =
            data || [];

        accountFilter.innerHTML =
            `
            <option value="">
                All Accounts
            </option>
            `;

        allAccounts.forEach(
            account => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    account.id;

                option.textContent =
                    account.name;

                accountFilter.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Account load error:",
            error
        );

    }

}


/* =========================================
   LOAD TRADES
========================================= */

async function loadTrades() {

    try {

        const {
            data,
            error
        } =
            await db
                .from("trades")
                .select("*")
                .order(
                    "trade_date",
                    {
                        ascending: false
                    }
                )
                .order(
                    "id",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        allTrades =
            data || [];

        applyFilters();

    }

    catch (error) {

        console.error(
            "Trade load error:",
            error
        );

        alert(
            "Unable to load trades: " +
            error.message
        );

    }

}


/* =========================================
   DISPLAY TRADES
========================================= */

function displayTrades(
    trades
) {

    const table =
        document.getElementById(
            "tradeTable"
        );

    if (!table) {
        return;
    }

    if (
        !trades ||
        trades.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="12">
                    No trades found.
                </td>
            </tr>
            `;

        return;
    }


    table.innerHTML =
        trades
            .map(
                trade => {

                    const pnl =
                        Number(
                            trade.profit_loss ||
                            0
                        );

                    const pnlClass =
                        pnl >= 0
                            ?
                            "profit"
                            :
                            "loss";

                    const commission =
                        Number(
                            trade.commission_fee ||
                            0
                        );

                    const swap =
                        Number(
                            trade.swap_fee ||
                            0
                        );

                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    trade.trade_date || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.symbol || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.direction || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.session || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.setup || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.result || ""
                                )}
                            </td>

                            <td>
                                ${money(
                                    commission
                                )}
                            </td>

                            <td>
                                ${money(
                                    swap
                                )}
                            </td>

                            <td class="${pnlClass}">
                                ${signedMoney(
                                    pnl
                                )}
                            </td>

                            <td>
                                ${Number(
                                    trade.actual_rr ??
                                    trade.r_multiple ??
                                    0
                                ).toFixed(2)}R
                            </td>

                            <td>
                                ${checklistDisplay(
                                    trade
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="small-button"
                                    onclick="editTrade(${Number(
                                        trade.id
                                    )})"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="small-button danger-button"
                                    onclick="deleteTrade(${Number(
                                        trade.id
                                    )})"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================
   FILTERS
========================================= */

function applyFilters() {

    const account =
        document
            .getElementById(
                "accountFilter"
            )
            ?.value ||
        "";

    const session =
        document
            .getElementById(
                "sessionFilter"
            )
            ?.value ||
        "";

    const result =
        document
            .getElementById(
                "resultFilter"
            )
            ?.value ||
        "";

    const symbol =
        (
            document
                .getElementById(
                    "symbolFilter"
                )
                ?.value ||
            ""
        )
        .trim()
        .toUpperCase();


    const filtered =
        allTrades.filter(
            trade => {

                const accountMatch =
                    !account ||
                    Number(
                        trade.account_id
                    ) ===
                    Number(
                        account
                    );

                const sessionMatch =
                    !session ||
                    trade.session ===
                    session;

                const resultMatch =
                    !result ||
                    trade.result ===
                    result;

                const symbolMatch =
                    !symbol ||
                    String(
                        trade.symbol ||
                        ""
                    )
                    .toUpperCase()
                    .includes(
                        symbol
                    );

                return (
                    accountMatch &&
                    sessionMatch &&
                    resultMatch &&
                    symbolMatch
                );

            }
        );

    displayTrades(
        filtered
    );

}


/* =========================================
   CHECKLIST DATA
========================================= */

function getChecklistStats(
    checklist
) {

    checklist =
        checklist ||
        {};

    const values = [

        checklist.htf_bias,
        checklist.news_checked,
        checklist.asian_sweep,
        checklist.choch_1m_close,
        checklist.bos_formed,
        checklist.bos_ob_fvg_marked,
        checklist.no_fomo,
        checklist.no_revenge,
        checklist.plan_reviewed

    ];

    const total =
        values.length;

    const checked =
        values.filter(
            value =>
                value === true
        ).length;

    const score =
        total > 0
            ?
            (
                checked /
                total
            ) *
            100
            :
            0;

    return {
        checked,
        total,
        score
    };

}


/* =========================================
   CHECKLIST DISPLAY
========================================= */

function checklistDisplay(
    trade
) {

    const stats =
        getChecklistStats(
            trade.pretrade_checklist ||
            {}
        );

    return `
        <span class="checklist-history-inline">
            ${stats.checked}/${stats.total}

            <small>
                ${stats.score.toFixed(0)}%
            </small>
        </span>
    `;

}


/* =========================================
   DELETE TRADE
========================================= */

async function deleteTrade(
    id
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this trade?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const trade =
            allTrades.find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        id
                    )
            );

        /*
         * Delete screenshots first if they exist.
         */

        if (trade) {

            const screenshotPaths =
                [];

            if (
                trade.before_screenshot
            ) {

                screenshotPaths.push(
                    trade.before_screenshot
                );

            }

            if (
                trade.after_screenshot
            ) {

                screenshotPaths.push(
                    trade.after_screenshot
                );

            }

            if (
                screenshotPaths.length >
                0
            ) {

                const {
                    error:
                        storageError
                } =
                    await db
                        .storage
                        .from(
                            "trade-screenshots"
                        )
                        .remove(
                            screenshotPaths
                        );

                if (
                    storageError
                ) {

                    console.warn(
                        "Screenshot cleanup warning:",
                        storageError
                    );

                }

            }

        }


        const {
            error
        } =
            await db
                .from("trades")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        alert(
            "Trade deleted."
        );

        await loadTrades();

    }

    catch (error) {

        console.error(
            "Trade delete error:",
            error
        );

        alert(
            "Delete failed: " +
            error.message
        );

    }

}


/* =========================================
   OPEN EDIT TRADE
========================================= */

async function editTrade(
    id
) {

    const trade =
        allTrades.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
        );

    if (!trade) {

        alert(
            "Trade not found."
        );

        return;

    }

    editingTrade =
        {
            ...trade
        };


    /* DATE */

    setValue(
        "editTradeDate",
        trade.trade_date
    );


    /* SYMBOL */

    setValue(
        "editSymbol",
        trade.symbol
    );


    /* DIRECTION */

    setValue(
        "editDirection",
        trade.direction
    );


    /* STOP LOSS */

    setValue(
        "editStopLoss",
        trade.stop_loss
    );


    /* TAKE PROFIT */

    setValue(
        "editTakeProfit",
        trade.take_profit
    );


    /* SESSION */

    setValue(
        "editSession",
        trade.session
    );


    /* SETUP */

    setValue(
        "editSetup",
        trade.setup
    );


    /* RULES */

    setValue(
        "editRulesFollowed",
        String(
            trade.rules_followed
        )
    );


    /* COMMISSION */

    setValue(
        "editCommissionFee",
        Number(
            trade.commission_fee ||
            0
        )
    );


    /* SWAP */

    setValue(
        "editSwapFee",
        Number(
            trade.swap_fee ||
            0
        )
    );


    /* MISTAKES */

    setValue(
        "editMistakes",
        trade.mistakes ||
        ""
    );


    /* NOTES */

    setValue(
        "editNotes",
        trade.notes ||
        ""
    );


    /* CHECKLIST */

    const checklist =
        trade.pretrade_checklist ||
        {};

    setChecked(
        "editCheckHtfBias",
        checklist.htf_bias
    );

    setChecked(
        "editCheckNews",
        checklist.news_checked
    );

    setChecked(
        "editCheckAsianSweep",
        checklist.asian_sweep
    );

    setChecked(
        "editCheckChoch",
        checklist.choch_1m_close
    );

    setChecked(
        "editCheckBos",
        checklist.bos_formed
    );

    setChecked(
        "editCheckBosObFvg",
        checklist.bos_ob_fvg_marked
    );

    setChecked(
        "editCheckNoFomo",
        checklist.no_fomo
    );

    setChecked(
        "editCheckNoRevenge",
        checklist.no_revenge
    );

    setChecked(
        "editCheckPlanReviewed",
        checklist.plan_reviewed
    );


    updateEditChecklistDisplay();


    /* CLEAR NEW SCREENSHOT INPUTS */

    const beforeInput =
        document.getElementById(
            "editBeforeScreenshot"
        );

    const afterInput =
        document.getElementById(
            "editAfterScreenshot"
        );

    if (beforeInput) {
        beforeInput.value = "";
    }

    if (afterInput) {
        afterInput.value = "";
    }


    /* SHOW CURRENT SCREENSHOTS */

    await showCurrentScreenshots(
        editingTrade
    );


    updateScreenshotDeleteButtons();


    /* OPEN EDIT PANEL */

    const modal =
        document.getElementById(
            "editTradeModal"
        );

    const panel =
        document.getElementById(
            "editTradePanel"
        );

    if (modal) {

        modal.classList.add(
            "show"
        );

        modal.style.display =
            "flex";

    }

    if (panel) {

        panel.classList.add(
            "show"
        );

        panel.style.display =
            "block";

    }


    recalculateEditedPnL();

}


/* =========================================
   SET INPUT VALUE
========================================= */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.value =
            value ?? "";

    }

}


/* =========================================
   SET CHECKBOX
========================================= */

function setChecked(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.checked =
            value === true;

    }

}


/* =========================================
   EDIT CHECKLIST
========================================= */

function getEditedChecklist() {

    return {

        htf_bias:
            document
                .getElementById(
                    "editCheckHtfBias"
                )
                ?.checked ||
            false,

        news_checked:
            document
                .getElementById(
                    "editCheckNews"
                )
                ?.checked ||
            false,

        asian_sweep:
            document
                .getElementById(
                    "editCheckAsianSweep"
                )
                ?.checked ||
            false,

        choch_1m_close:
            document
                .getElementById(
                    "editCheckChoch"
                )
                ?.checked ||
            false,

        bos_formed:
            document
                .getElementById(
                    "editCheckBos"
                )
                ?.checked ||
            false,

        bos_ob_fvg_marked:
            document
                .getElementById(
                    "editCheckBosObFvg"
                )
                ?.checked ||
            false,

        no_fomo:
            document
                .getElementById(
                    "editCheckNoFomo"
                )
                ?.checked ||
            false,

        no_revenge:
            document
                .getElementById(
                    "editCheckNoRevenge"
                )
                ?.checked ||
            false,

        plan_reviewed:
            document
                .getElementById(
                    "editCheckPlanReviewed"
                )
                ?.checked ||
            false

    };

}


/* =========================================
   UPDATE EDIT CHECKLIST SCORE
========================================= */

function updateEditChecklistDisplay() {

    const checklist =
        getEditedChecklist();

    const stats =
        getChecklistStats(
            checklist
        );

    const score =
        document.getElementById(
            "editChecklistScore"
        );

    const bar =
        document.getElementById(
            "editChecklistProgressBar"
        );

    if (score) {

        score.textContent =
            stats.checked +
            "/" +
            stats.total +
            " — " +
            stats.score.toFixed(
                0
            ) +
            "%";

    }

    if (bar) {

        bar.style.width =
            stats.score +
            "%";

    }

}


/* =========================================
   EDIT CHECKLIST EVENTS
========================================= */

document
    .querySelectorAll(
        ".edit-pretrade-check"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                updateEditChecklistDisplay
            );

        }
    );


/* =========================================
   SHOW CURRENT SCREENSHOTS
========================================= */

async function showCurrentScreenshots(
    trade
) {

    await showScreenshotPreview(
        "currentBeforeScreenshot",
        trade.before_screenshot
    );

    await showScreenshotPreview(
        "currentAfterScreenshot",
        trade.after_screenshot
    );

}


/* =========================================
   SHOW SCREENSHOT PREVIEW
========================================= */

async function showScreenshotPreview(
    elementId,
    path
) {

    const container =
        document.getElementById(
            elementId
        );

    if (!container) {
        return;
    }

    if (!path) {

        container.innerHTML =
            "No screenshot";

        return;
    }

    try {

        const {
            data,
            error
        } =
            await db
                .storage
                .from(
                    "trade-screenshots"
                )
                .createSignedUrl(
                    path,
                    3600
                );

        if (
            error ||
            !data?.signedUrl
        ) {

            throw error ||
            new Error(
                "Unable to create screenshot URL."
            );

        }

        container.innerHTML =
            `
            <a
                href="${data.signedUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src="${data.signedUrl}"
                    alt="Trade screenshot"
                    class="history-screenshot-image"
                >
            </a>
            `;

    }

    catch (error) {

        console.error(
            "Screenshot preview error:",
            error
        );

        container.innerHTML =
            "Unable to load screenshot";

    }

}


/* =========================================
   UPDATE SCREENSHOT DELETE BUTTONS
========================================= */

function updateScreenshotDeleteButtons() {

    const beforeButton =
        document.getElementById(
            "deleteBeforeScreenshot"
        );

    const afterButton =
        document.getElementById(
            "deleteAfterScreenshot"
        );


    if (beforeButton) {

        beforeButton.disabled =
            !editingTrade ||
            !editingTrade.before_screenshot;

    }


    if (afterButton) {

        afterButton.disabled =
            !editingTrade ||
            !editingTrade.after_screenshot;

    }

}


/* =========================================
   DELETE STORED SCREENSHOT
========================================= */

async function deleteStoredScreenshot(
    type
) {

    if (!editingTrade) {

        showEditMessage(
            "No trade selected.",
            "error"
        );

        return;
    }


    const isBefore =
        type ===
        "before";


    const path =
        isBefore
            ?
            editingTrade.before_screenshot
            :
            editingTrade.after_screenshot;


    if (!path) {

        showEditMessage(
            "No " +
            (
                isBefore
                    ?
                    "before"
                    :
                    "after"
            ) +
            " screenshot to delete.",
            "warning"
        );

        updateScreenshotDeleteButtons();

        return;
    }


    const confirmed =
        confirm(
            "Delete this " +
            (
                isBefore
                    ?
                    "before"
                    :
                    "after"
            ) +
            " screenshot permanently?"
        );


    if (!confirmed) {
        return;
    }


    const deleteButton =
        document.getElementById(
            isBefore
                ?
                "deleteBeforeScreenshot"
                :
                "deleteAfterScreenshot"
        );


    if (deleteButton) {

        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Deleting...";

    }


    try {

        /* DELETE FILE FROM STORAGE */

        const {
            error:
                storageError
        } =
            await db
                .storage
                .from(
                    "trade-screenshots"
                )
                .remove(
                    [
                        path
                    ]
                );


        if (storageError) {

            throw new Error(
                "Storage delete failed: " +
                storageError.message
            );

        }


        /* CLEAR DATABASE FIELD */

        const updates =
            isBefore
                ?
                {
                    before_screenshot:
                        null
                }
                :
                {
                    after_screenshot:
                        null
                };


        const {
            error:
                updateError
        } =
            await db
                .from(
                    "trades"
                )
                .update(
                    updates
                )
                .eq(
                    "id",
                    editingTrade.id
                );


        if (updateError) {
            throw updateError;
        }


        /* UPDATE LOCAL EDITING TRADE */

        if (isBefore) {

            editingTrade.before_screenshot =
                null;

            const input =
                document.getElementById(
                    "editBeforeScreenshot"
                );

            if (input) {
                input.value = "";
            }

        }

        else {

            editingTrade.after_screenshot =
                null;

            const input =
                document.getElementById(
                    "editAfterScreenshot"
                );

            if (input) {
                input.value = "";
            }

        }


        /* UPDATE CACHE */

        const cachedTrade =
            allTrades.find(
                trade =>
                    Number(
                        trade.id
                    ) ===
                    Number(
                        editingTrade.id
                    )
            );


        if (cachedTrade) {

            if (isBefore) {

                cachedTrade.before_screenshot =
                    null;

            }

            else {

                cachedTrade.after_screenshot =
                    null;

            }

        }


        /* REFRESH SCREENSHOT DISPLAY */

        await showCurrentScreenshots(
            editingTrade
        );


        updateScreenshotDeleteButtons();


        showEditMessage(
            (
                isBefore
                    ?
                    "Before"
                    :
                    "After"
            ) +
            " screenshot deleted.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Screenshot delete error:",
            error
        );


        showEditMessage(
            "ERROR: " +
            (
                error.message ||
                "Unable to delete screenshot."
            ),
            "error"
        );


        updateScreenshotDeleteButtons();

    }

    finally {

        if (deleteButton) {

            deleteButton.textContent =
                "Delete Screenshot";

        }

    }

}


/* =========================================
   DELETE BEFORE SCREENSHOT BUTTON
========================================= */

const deleteBeforeScreenshot =
    document.getElementById(
        "deleteBeforeScreenshot"
    );


if (deleteBeforeScreenshot) {

    deleteBeforeScreenshot.addEventListener(
        "click",
        function() {

            deleteStoredScreenshot(
                "before"
            );

        }
    );

}


/* =========================================
   DELETE AFTER SCREENSHOT BUTTON
========================================= */

const deleteAfterScreenshot =
    document.getElementById(
        "deleteAfterScreenshot"
    );


if (deleteAfterScreenshot) {

    deleteAfterScreenshot.addEventListener(
        "click",
        function() {

            deleteStoredScreenshot(
                "after"
            );

        }
    );

}


/* =========================================
   REPLACEMENT SCREENSHOT UPLOAD
========================================= */

async function uploadReplacementScreenshot(
    file,
    type,
    userId
) {

    if (!file) {
        return null;
    }


    if (
        !file.size ||
        file.size <= 0
    ) {

        throw new Error(
            "Selected image contains no data."
        );

    }


    let extension =
        String(
            file.name ||
            ""
        )
        .split(".")
        .pop()
        .toLowerCase();


    const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "heic",
        "heif"
    ];


    if (
        !allowedExtensions.includes(
            extension
        )
    ) {

        if (
            file.type ===
            "image/png"
        ) {

            extension =
                "png";

        }

        else if (
            file.type ===
            "image/webp"
        ) {

            extension =
                "webp";

        }

        else if (
            file.type ===
            "image/heic"
        ) {

            extension =
                "heic";

        }

        else if (
            file.type ===
            "image/heif"
        ) {

            extension =
                "heif";

        }

        else {

            extension =
                "jpg";

        }

    }


    const maxSize =
        20 *
        1024 *
        1024;


    if (
        file.size >
        maxSize
    ) {

        throw new Error(
            "Screenshot is too large. Maximum size is 20 MB."
        );

    }


    let arrayBuffer;


    try {

        arrayBuffer =
            await file.arrayBuffer();

    }

    catch (error) {

        console.error(
            "Screenshot read error:",
            error
        );

        throw new Error(
            "Unable to read the selected screenshot."
        );

    }


    if (
        !arrayBuffer ||
        arrayBuffer.byteLength <= 0
    ) {

        throw new Error(
            "The selected screenshot has no readable content."
        );

    }


    const fileBytes =
        new Uint8Array(
            arrayBuffer
        );


    const contentType =
        file.type &&
        file.type.startsWith(
            "image/"
        )
            ?
            file.type
            :
            (
                extension === "png"
                    ?
                    "image/png"
                    :
                    extension === "webp"
                        ?
                        "image/webp"
                        :
                        extension === "heic"
                            ?
                            "image/heic"
                            :
                            extension === "heif"
                                ?
                                "image/heif"
                                :
                                "image/jpeg"
            );


    const fileName =
        `${type}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`;


    const filePath =
        `${userId}/trades/${fileName}`;


    const {
        data,
        error
    } =
        await db
            .storage
            .from(
                "trade-screenshots"
            )
            .upload(
                filePath,
                fileBytes,
                {
                    contentType:
                        contentType,

                    cacheControl:
                        "3600",

                    upsert:
                        false
                }
            );


    if (error) {

        console.error(
            "Replacement screenshot upload error:",
            error
        );

        throw new Error(
            "Screenshot upload failed: " +
            error.message
        );

    }


    console.log(
        "Replacement screenshot uploaded:",
        data
    );


    return filePath;

}


/* =========================================
   DELETE OLD SCREENSHOT FILE
========================================= */

async function removeOldScreenshot(
    path
) {

    if (!path) {
        return;
    }


    const {
        error
    } =
        await db
            .storage
            .from(
                "trade-screenshots"
            )
            .remove(
                [
                    path
                ]
            );


    if (error) {

        console.warn(
            "Old screenshot cleanup failed:",
            error
        );

    }

}


/* =========================================
   RECALCULATE EDITED P&L
========================================= */

function recalculateEditedPnL() {

    if (!editingTrade) {
        return;
    }


    const commission =
        Number(
            document
                .getElementById(
                    "editCommissionFee"
                )
                ?.value ||
            0
        );


    const swap =
        Number(
            document
                .getElementById(
                    "editSwapFee"
                )
                ?.value ||
            0
        );


    const grossPnL =
        Number(
            editingTrade.gross_pnl ??
            (
                Number(
                    editingTrade.profit_loss ||
                    0
                )
                +
                Number(
                    editingTrade.commission_fee ||
                    0
                )
                +
                Number(
                    editingTrade.swap_fee ||
                    0
                )
            )
        );


    const netPnL =
        grossPnL -
        commission -
        swap;


    const plannedRisk =
        Number(
            editingTrade.planned_risk ||
            0
        );


    const actualRR =
        plannedRisk > 0
            ?
            netPnL /
            plannedRisk
            :
            Number(
                editingTrade.actual_rr ??
                editingTrade.r_multiple ??
                0
            );


    const pnlDisplay =
        document.getElementById(
            "editCalculatedPnL"
        );


    const rrDisplay =
        document.getElementById(
            "editActualRR"
        );


    if (pnlDisplay) {

        pnlDisplay.textContent =
            signedMoney(
                netPnL
            );

    }


    if (rrDisplay) {

        rrDisplay.textContent =
            actualRR.toFixed(
                2
            ) +
            "R";

    }


    return {
        grossPnL,
        commission,
        swap,
        netPnL,
        actualRR
    };

}


/* =========================================
   EDIT FEE EVENTS
========================================= */

[
    "editCommissionFee",
    "editSwapFee"
]
.forEach(
    id => {

        const input =
            document.getElementById(
                id
            );

        if (input) {

            input.addEventListener(
                "input",
                recalculateEditedPnL
            );

        }

    }
);


/* =========================================
   SAVE EDITED TRADE
========================================= */

const editTradeForm =
    document.getElementById(
        "editTradeForm"
    );


if (editTradeForm) {

    editTradeForm.addEventListener(
        "submit",
        async function(
            event
        ) {

            event.preventDefault();


            if (!editingTrade) {

                showEditMessage(
                    "No trade selected.",
                    "error"
                );

                return;

            }


            const saveButton =
                document.getElementById(
                    "saveEditTradeButton"
                );


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Saving...";

            }


            try {

                const {
                    data: {
                        user
                    },
                    error:
                        userError
                } =
                    await db.auth
                        .getUser();


                if (
                    userError ||
                    !user
                ) {

                    throw new Error(
                        "You are not logged in."
                    );

                }


                const beforeFile =
                    document
                        .getElementById(
                            "editBeforeScreenshot"
                        )
                        ?.files?.[0];


                const afterFile =
                    document
                        .getElementById(
                            "editAfterScreenshot"
                        )
                        ?.files?.[0];


                let beforePath =
                    editingTrade
                        .before_screenshot ||
                    null;


                let afterPath =
                    editingTrade
                        .after_screenshot ||
                    null;


                /* REPLACE BEFORE SCREENSHOT */

                if (beforeFile) {

                    const newPath =
                        await uploadReplacementScreenshot(
                            beforeFile,
                            "before",
                            user.id
                        );


                    if (
                        editingTrade
                            .before_screenshot
                    ) {

                        await removeOldScreenshot(
                            editingTrade
                                .before_screenshot
                        );

                    }


                    beforePath =
                        newPath;

                }


                /* REPLACE AFTER SCREENSHOT */

                if (afterFile) {

                    const newPath =
                        await uploadReplacementScreenshot(
                            afterFile,
                            "after",
                            user.id
                        );


                    if (
                        editingTrade
                            .after_screenshot
                    ) {

                        await removeOldScreenshot(
                            editingTrade
                                .after_screenshot
                        );

                    }


                    afterPath =
                        newPath;

                }


                const checklist =
                    getEditedChecklist();


                const checklistStats =
                    getChecklistStats(
                        checklist
                    );


                const calculation =
                    recalculateEditedPnL();


                let result =
                    "BE";


                if (
                    calculation.netPnL >
                    0
                ) {

                    result =
                        "Win";

                }


                if (
                    calculation.netPnL <
                    0
                ) {

                    result =
                        "Loss";

                }


                const updates = {

                    trade_date:
                        document
                            .getElementById(
                                "editTradeDate"
                            )
                            ?.value,

                    symbol:
                        document
                            .getElementById(
                                "editSymbol"
                            )
                            ?.value
                            .trim()
                            .toUpperCase(),

                    direction:
                        document
                            .getElementById(
                                "editDirection"
                            )
                            ?.value,

                    stop_loss:
                        Number(
                            document
                                .getElementById(
                                    "editStopLoss"
                                )
                                ?.value ||
                            0
                        ),

                    take_profit:
                        Number(
                            document
                                .getElementById(
                                    "editTakeProfit"
                                )
                                ?.value ||
                            0
                        ),

                    session:
                        document
                            .getElementById(
                                "editSession"
                            )
                            ?.value,

                    setup:
                        document
                            .getElementById(
                                "editSetup"
                            )
                            ?.value,

                    rules_followed:
                        document
                            .getElementById(
                                "editRulesFollowed"
                            )
                            ?.value ===
                        "true",

                    commission_fee:
                        calculation.commission,

                    swap_fee:
                        calculation.swap,

                    profit_loss:
                        calculation.netPnL,

                    actual_rr:
                        calculation.actualRR,

                    r_multiple:
                        calculation.actualRR,

                    result:
                        result,

                    mistakes:
                        document
                            .getElementById(
                                "editMistakes"
                            )
                            ?.value
                            .trim() ||
                        "",

                    notes:
                        document
                            .getElementById(
                                "editNotes"
                            )
                            ?.value
                            .trim() ||
                        "",

                    pretrade_checklist:
                        checklist,

                    checklist_score:
                        checklistStats.score,

                    before_screenshot:
                        beforePath,

                    after_screenshot:
                        afterPath

                };


                const {
                    error
                } =
                    await db
                        .from(
                            "trades"
                        )
                        .update(
                            updates
                        )
                        .eq(
                            "id",
                            editingTrade.id
                        );


                if (error) {
                    throw error;
                }


                editingTrade =
                    {
                        ...editingTrade,
                        ...updates
                    };


                showEditMessage(
                    "Trade updated successfully.",
                    "success"
                );


                await loadTrades();


                setTimeout(
                    function() {

                        closeEditTrade();

                    },
                    600
                );

            }

            catch (error) {

                console.error(
                    "Trade update error:",
                    error
                );


                showEditMessage(
                    "ERROR: " +
                    error.message,
                    "error"
                );

            }

            finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Save Changes";

                }

            }

        }
    );

}


/* =========================================
   CLOSE EDIT TRADE
========================================= */

function closeEditTrade() {

    const modal =
        document.getElementById(
            "editTradeModal"
        );

    const panel =
        document.getElementById(
            "editTradePanel"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.style.display =
            "none";

    }


    if (panel) {

        panel.classList.remove(
            "show"
        );

        panel.style.display =
            "none";

    }


    editingTrade =
        null;


    const beforeButton =
        document.getElementById(
            "deleteBeforeScreenshot"
        );

    const afterButton =
        document.getElementById(
            "deleteAfterScreenshot"
        );


    if (beforeButton) {
        beforeButton.disabled = true;
    }

    if (afterButton) {
        afterButton.disabled = true;
    }

}


/* =========================================
   CLOSE BUTTON
========================================= */

const closeEditButton =
    document.getElementById(
        "closeEditTrade"
    );


if (closeEditButton) {

    closeEditButton.addEventListener(
        "click",
        closeEditTrade
    );

}


/* =========================================
   CANCEL BUTTON
========================================= */

const cancelEditButton =
    document.getElementById(
        "cancelEditTrade"
    );


if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        closeEditTrade
    );

}


/* =========================================
   EDIT MESSAGE
========================================= */

function showEditMessage(
    text,
    type = "error"
) {

    const message =
        document.getElementById(
            "editMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "form-message full show " +
        type;

}


/* =========================================
   MONEY
========================================= */

function money(
    value
) {

    return "$" +
        Number(
            value ||
            0
        )
        .toLocaleString(
            "en-AU",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );

}


/* =========================================
   SIGNED MONEY
========================================= */

function signedMoney(
    value
) {

    value =
        Number(
            value ||
            0
        );


    if (value > 0) {

        return "+$" +
            value
                .toLocaleString(
                    "en-AU",
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
                );

    }


    if (value < 0) {

        return "-$" +
            Math.abs(
                value
            )
            .toLocaleString(
                "en-AU",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );

    }


    return "$0.00";

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


/* =========================================
   FILTER EVENTS
========================================= */

const accountFilter =
    document.getElementById(
        "accountFilter"
    );

const sessionFilter =
    document.getElementById(
        "sessionFilter"
    );

const resultFilter =
    document.getElementById(
        "resultFilter"
    );

const symbolFilter =
    document.getElementById(
        "symbolFilter"
    );


if (accountFilter) {

    accountFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (sessionFilter) {

    sessionFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (resultFilter) {

    resultFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (symbolFilter) {

    symbolFilter.addEventListener(
        "input",
        applyFilters
    );

}


/* =========================================
   START
========================================= */

async function startHistoryPage() {

    await loadAccounts();

    await loadTrades();

}


startHistoryPage();