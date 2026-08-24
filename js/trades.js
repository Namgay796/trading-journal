let allTrades = [];

let allAccounts = [];

let editingTrade = null;


/* =========================================
   ELEMENTS
========================================= */

const tradeTable =
    document.getElementById(
        "tradeTable"
    );


const historyMessage =
    document.getElementById(
        "historyMessage"
    );


const editTradePanel =
    document.getElementById(
        "editTradePanel"
    );


const editTradeForm =
    document.getElementById(
        "editTradeForm"
    );


const saveEditTrade =
    document.getElementById(
        "saveEditTrade"
    );


const accountFilter =
    document.getElementById(
        "accountFilter"
    );



/* =========================================
   HISTORY MESSAGE
========================================= */

function showHistoryMessage(
    text,
    type = "error"
) {

    if (
        !historyMessage
    ) {

        return;

    }


    historyMessage.textContent =
        text;


    historyMessage.className =
        "form-message show " +
        type;

}



function clearHistoryMessage() {

    if (
        !historyMessage
    ) {

        return;

    }


    historyMessage.textContent =
        "";


    historyMessage.className =
        "form-message";

}



/* =========================================
   EDIT MESSAGE
========================================= */

function showEditMessage(
    text,
    type = "error"
) {

    const box =
        document.getElementById(
            "editTradeMessage"
        );


    if (
        !box
    ) {

        return;

    }


    box.textContent =
        text;


    box.className =
        "form-message full show " +
        type;

}



function clearEditMessage() {

    const box =
        document.getElementById(
            "editTradeMessage"
        );


    if (
        !box
    ) {

        return;

    }


    box.textContent =
        "";


    box.className =
        "form-message full";

}



/* =========================================
   SAFE FIELD SETTER
========================================= */

function setElementValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.value =
            value ?? "";

    }

}



/* =========================================
   WAIT FOR LOGIN
========================================= */

async function waitForSession() {

    const {
        data: {
            session
        },
        error
    } =
        await db.auth
            .getSession();


    if (
        error
    ) {

        throw error;

    }


    if (
        session &&
        session.user
    ) {

        return session;

    }


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            let finished =
                false;


            const timeout =
                setTimeout(
                    function() {

                        if (
                            finished
                        ) {

                            return;

                        }


                        finished =
                            true;


                        reject(
                            new Error(
                                "Login session could not be loaded."
                            )
                        );

                    },
                    8000
                );


            const {
                data:
                    authData
            } =
                db.auth
                    .onAuthStateChange(
                        (
                            event,
                            newSession
                        ) => {

                            if (
                                finished
                            ) {

                                return;

                            }


                            if (
                                newSession &&
                                newSession.user
                            ) {

                                finished =
                                    true;


                                clearTimeout(
                                    timeout
                                );


                                authData
                                    .subscription
                                    .unsubscribe();


                                resolve(
                                    newSession
                                );

                            }

                        }
                    );

        }
    );

}



/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    if (
        !accountFilter
    ) {

        console.error(
            "accountFilter not found."
        );


        return;

    }


    accountFilter.innerHTML =
        `
        <option value="">
            Loading accounts...
        </option>
        `;


    try {

        const {
            data,
            error
        } =
            await db
                .from(
                    "accounts"
                )
                .select("*")
                .order(
                    "id",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

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
                    String(
                        account.id
                    );


                option.textContent =
                    account.name ||
                    (
                        "Account " +
                        account.id
                    );


                accountFilter.appendChild(
                    option
                );

            }
        );

    }


    catch (
        error
    ) {

        console.error(
            "Account load error:",
            error
        );


        accountFilter.innerHTML =
            `
            <option value="">
                Unable to load accounts
            </option>
            `;


        showHistoryMessage(
            "Unable to load accounts: " +
            error.message,
            "error"
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
                .from(
                    "trades"
                )
                .select("*")
                .order(
                    "trade_date",
                    {
                        ascending:
                            false
                    }
                )
                .order(
                    "id",
                    {
                        ascending:
                            false
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        allTrades =
            data || [];


        applyFilters();

    }


    catch (
        error
    ) {

        console.error(
            "Trade load error:",
            error
        );


        showHistoryMessage(
            "Unable to load trade history: " +
            error.message,
            "error"
        );

    }

}



/* =========================================
   CHECKLIST KEYS
========================================= */

const checklistKeys = [

    "htf_bias",

    "news_checked",

    "asian_sweep",

    "choch_1m_close",

    "bos_formed",

    "bos_ob_fvg_marked",

    "no_fomo",

    "no_revenge",

    "plan_reviewed"

];



/* =========================================
   CHECKLIST STATS
========================================= */

function getChecklistStats(
    checklist
) {

    checklist =
        checklist ||
        {};


    const checked =
        checklistKeys.filter(
            key =>
                checklist[key] ===
                true
        )
        .length;


    const total =
        checklistKeys.length;


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

        checked:
            checked,

        total:
            total,

        score:
            score

    };

}



/* =========================================
   CHECKLIST TABLE DISPLAY
========================================= */

function checklistDisplay(
    trade
) {

    const stats =
        getChecklistStats(
            trade.pretrade_checklist ||
            {}
        );


    /*
       Old trades created before the checklist
       will display 0/9.
    */

    return `

        <div class="checklist-history-score">

            <strong>
                ${stats.checked}/${stats.total}
            </strong>

            <small>
                ${stats.score.toFixed(0)}%
            </small>

        </div>

    `;

}



/* =========================================
   DISPLAY TRADES
========================================= */

function displayTrades(
    trades
) {

    if (
        !tradeTable
    ) {

        return;

    }


    if (
        !trades ||
        trades.length ===
        0
    ) {

        tradeTable.innerHTML =
            `

            <tr>

                <td colspan="12">
                    No trades found.
                </td>

            </tr>

            `;


        return;

    }


    tradeTable.innerHTML =
        trades
            .map(
                trade => {

                    const pnl =
                        Number(
                            trade.profit_loss ||
                            0
                        );


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


                    const pnlClass =
                        pnl >= 0
                            ?
                            "profit"
                            :
                            "loss";


                    return `

                    <tr>

                        <td>

                            ${escapeHtml(
                                trade.trade_date ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                trade.symbol ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                trade.direction ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                trade.session ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                trade.setup ||
                                ""
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                trade.result ||
                                ""
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
   APPLY FILTERS
========================================= */

function applyFilters() {

    const selectedAccount =
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
                    !selectedAccount ||
                    String(
                        trade.account_id
                    ) ===
                    String(
                        selectedAccount
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
   FILTER EVENTS
========================================= */

if (
    accountFilter
) {

    accountFilter.addEventListener(
        "change",
        applyFilters
    );

}


const sessionFilter =
    document.getElementById(
        "sessionFilter"
    );


if (
    sessionFilter
) {

    sessionFilter.addEventListener(
        "change",
        applyFilters
    );

}


const resultFilter =
    document.getElementById(
        "resultFilter"
    );


if (
    resultFilter
) {

    resultFilter.addEventListener(
        "change",
        applyFilters
    );

}


const symbolFilter =
    document.getElementById(
        "symbolFilter"
    );


if (
    symbolFilter
) {

    symbolFilter.addEventListener(
        "input",
        applyFilters
    );

}



/* =========================================
   SET CHECKLIST BOX
========================================= */

function setChecklistCheckbox(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.checked =
            value === true;

    }

}



/* =========================================
   GET EDIT CHECKLIST
========================================= */

function getEditChecklist() {

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
        getEditChecklist();


    const stats =
        getChecklistStats(
            checklist
        );


    const score =
        document.getElementById(
            "editChecklistScore"
        );


    const progressBar =
        document.getElementById(
            "editChecklistProgressBar"
        );


    if (
        score
    ) {

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


    if (
        progressBar
    ) {

        progressBar.style.width =
            stats.score +
            "%";

    }

}



/* =========================================
   CHECKLIST EVENTS
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
   NORMALIZE SETUP
========================================= */

function normalizeSetup(
    setup
) {

    const allowed =
        [
            "A++",
            "A+",
            "A"
        ];


    if (
        allowed.includes(
            setup
        )
    ) {

        return setup;

    }


    return "A";

}



/* =========================================
   EDIT TRADE
========================================= */

function editTrade(
    id
) {

    clearEditMessage();


    editingTrade =
        allTrades.find(
            trade =>
                Number(
                    trade.id
                ) ===
                Number(
                    id
                )
        );


    if (
        !editingTrade
    ) {

        showHistoryMessage(
            "Trade not found.",
            "error"
        );


        return;

    }


    const commission =
        Number(
            editingTrade.commission_fee ||
            0
        );


    const swap =
        Number(
            editingTrade.swap_fee ||
            0
        );


    let grossPnL =
        Number(
            editingTrade.gross_pnl
        );


    /*
       Support older trades where gross_pnl
       may not have been stored.
    */

    if (
        !Number.isFinite(
            grossPnL
        ) ||
        (
            grossPnL === 0 &&
            Number(
                editingTrade.profit_loss ||
                0
            ) !== 0
        )
    ) {

        grossPnL =
            Number(
                editingTrade.profit_loss ||
                0
            )
            +
            commission
            +
            swap;

    }


    /* =====================================
       BASIC FIELDS
    ===================================== */

    setElementValue(
        "editTradeId",
        editingTrade.id
    );


    const title =
        document.getElementById(
            "editTradeTitle"
        );


    if (
        title
    ) {

        title.textContent =
            (
                editingTrade.symbol ||
                "Trade"
            )
            +
            " • "
            +
            (
                editingTrade.trade_date ||
                ""
            );

    }


    setElementValue(
        "editTradeDate",
        editingTrade.trade_date ||
        ""
    );


    setElementValue(
        "editSymbol",
        editingTrade.symbol ||
        ""
    );


    setElementValue(
        "editDirection",
        editingTrade.direction ||
        "BUY"
    );


    setElementValue(
        "editSession",
        editingTrade.session ||
        "Asian"
    );


    setElementValue(
        "editSetup",
        normalizeSetup(
            editingTrade.setup
        )
    );


    setElementValue(
        "editRulesFollowed",
        editingTrade.rules_followed
            ?
            "true"
            :
            "false"
    );


    /* =====================================
       P&L / FEES
    ===================================== */

    setElementValue(
        "editGrossPnL",
        grossPnL.toFixed(
            2
        )
    );


    setElementValue(
        "editCommissionFee",
        commission.toFixed(
            2
        )
    );


    setElementValue(
        "editSwapFee",
        swap.toFixed(
            2
        )
    );


    setElementValue(
        "editPlannedRisk",
        Number(
            editingTrade.planned_risk ||
            0
        ).toFixed(
            2
        )
    );


    /* =====================================
       MISTAKES / NOTES
    ===================================== */

    setElementValue(
        "editMistakes",
        editingTrade.mistakes ||
        ""
    );


    setElementValue(
        "editNotes",
        editingTrade.notes ||
        ""
    );


    /* =====================================
       LOAD CHECKLIST
    ===================================== */

    const checklist =
        editingTrade.pretrade_checklist ||
        {};


    setChecklistCheckbox(
        "editCheckHtfBias",
        checklist.htf_bias
    );


    setChecklistCheckbox(
        "editCheckNews",
        checklist.news_checked
    );


    setChecklistCheckbox(
        "editCheckAsianSweep",
        checklist.asian_sweep
    );


    setChecklistCheckbox(
        "editCheckChoch",
        checklist.choch_1m_close
    );


    setChecklistCheckbox(
        "editCheckBos",
        checklist.bos_formed
    );


    setChecklistCheckbox(
        "editCheckBosObFvg",
        checklist.bos_ob_fvg_marked
    );


    setChecklistCheckbox(
        "editCheckNoFomo",
        checklist.no_fomo
    );


    setChecklistCheckbox(
        "editCheckNoRevenge",
        checklist.no_revenge
    );


    setChecklistCheckbox(
        "editCheckPlanReviewed",
        checklist.plan_reviewed
    );


    updateEditChecklistDisplay();


    /* =====================================
       RESET NEW SCREENSHOT INPUTS
    ===================================== */

    const beforeInput =
        document.getElementById(
            "editBeforeScreenshot"
        );


    if (
        beforeInput
    ) {

        beforeInput.value =
            "";

    }


    const afterInput =
        document.getElementById(
            "editAfterScreenshot"
        );


    if (
        afterInput
    ) {

        afterInput.value =
            "";

    }


    /* =====================================
       RECALCULATE NET P&L / RR
    ===================================== */

    recalculateEditedPnL();


    /* =====================================
       SCREENSHOT PREVIEW
    ===================================== */

    showCurrentScreenshots(
        editingTrade
    );


    /* =====================================
       OPEN CORRECT EDIT PANEL
    ===================================== */

    if (
        editTradePanel
    ) {

        editTradePanel.hidden =
            false;


        editTradePanel.scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );

    }

}



/* =========================================
   RECALCULATE EDITED P&L
========================================= */

function recalculateEditedPnL() {

    if (
        !editingTrade
    ) {

        return;

    }


    const grossField =
        document.getElementById(
            "editGrossPnL"
        );


    const commissionField =
        document.getElementById(
            "editCommissionFee"
        );


    const swapField =
        document.getElementById(
            "editSwapFee"
        );


    const netField =
        document.getElementById(
            "editProfitLoss"
        );


    if (
        !grossField ||
        !commissionField ||
        !swapField ||
        !netField
    ) {

        return;

    }


    const grossPnL =
        Number(
            grossField.value ||
            0
        );


    const commission =
        Number(
            commissionField.value ||
            0
        );


    const swap =
        Number(
            swapField.value ||
            0
        );


    const netPnL =
        grossPnL
        -
        commission
        -
        swap;


    netField.value =
        netPnL.toFixed(
            2
        );


    recalculateEditedRR(
        netPnL
    );

}



/* =========================================
   RECALCULATE EDITED RR
========================================= */

function recalculateEditedRR(
    netPnL
) {

    const plannedRiskField =
        document.getElementById(
            "editPlannedRisk"
        );


    const actualRRField =
        document.getElementById(
            "editActualRR"
        );


    if (
        !plannedRiskField ||
        !actualRRField
    ) {

        return;

    }


    const plannedRisk =
        Number(
            plannedRiskField.value ||
            0
        );


    const actualRR =
        plannedRisk > 0
            ?
            netPnL /
            plannedRisk
            :
            0;


    actualRRField.value =
        actualRR.toFixed(
            2
        );

}



/* =========================================
   COMMISSION CHANGE
========================================= */

const editCommissionFee =
    document.getElementById(
        "editCommissionFee"
    );


if (
    editCommissionFee
) {

    editCommissionFee.addEventListener(
        "input",
        recalculateEditedPnL
    );

}



/* =========================================
   SWAP CHANGE
========================================= */

const editSwapFee =
    document.getElementById(
        "editSwapFee"
    );


if (
    editSwapFee
) {

    editSwapFee.addEventListener(
        "input",
        recalculateEditedPnL
    );

}



/* =========================================
   CURRENT SCREENSHOTS
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
   SCREENSHOT PREVIEW
========================================= */

async function showScreenshotPreview(
    elementId,
    path
) {

    const box =
        document.getElementById(
            elementId
        );


    if (
        !box
    ) {

        return;

    }


    if (
        !path
    ) {

        box.innerHTML =
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
            error
        ) {

            throw error;

        }


        if (
            !data?.signedUrl
        ) {

            throw new Error(
                "Signed URL unavailable."
            );

        }


        box.innerHTML =
            `

            <a
                href="${data.signedUrl}"
                target="_blank"
                rel="noopener"
            >

                <img
                    src="${data.signedUrl}"
                    alt="Trade Screenshot"
                >

            </a>

            `;

    }


    catch (
        error
    ) {

        console.error(
            "Screenshot preview error:",
            error
        );


        box.innerHTML =
            "Unable to load screenshot.";

    }

}



/* =========================================
   REPLACEMENT SCREENSHOT UPLOAD
========================================= */

async function uploadReplacementScreenshot(
    file,
    type,
    userId
) {

    if (
        !file
    ) {

        return null;

    }


    const extension =
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


    const validMimeType =
        file.type &&
        file.type.startsWith(
            "image/"
        );


    const validExtension =
        allowedExtensions.includes(
            extension
        );


    if (
        !validMimeType &&
        !validExtension
    ) {

        throw new Error(
            "Please select a valid image file."
        );

    }


    const maxSize =
        15 *
        1024 *
        1024;


    if (
        file.size >
        maxSize
    ) {

        throw new Error(
            "Screenshot is too large. Maximum size is 15 MB."
        );

    }


    const safeExtension =
        validExtension
            ?
            extension
            :
            "jpg";


    const fileName =
        `${type}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.${safeExtension}`;


    const path =
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
                path,
                file,
                {

                    cacheControl:
                        "3600",

                    upsert:
                        false

                }
            );


    if (
        error
    ) {

        console.error(
            "Replacement screenshot error:",
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


    return path;

}


/* =========================================
   CLOSE EDIT PANEL
========================================= */

function closeEditPanel() {

    if (
        editTradePanel
    ) {

        editTradePanel.hidden =
            true;

    }


    editingTrade =
        null;


    clearEditMessage();

}



/* =========================================
   CLOSE BUTTON
========================================= */

const closeEditTrade =
    document.getElementById(
        "closeEditTrade"
    );


if (
    closeEditTrade
) {

    closeEditTrade.addEventListener(
        "click",
        closeEditPanel
    );

}



/* =========================================
   CANCEL BUTTON
========================================= */

const cancelEditTrade =
    document.getElementById(
        "cancelEditTrade"
    );


if (
    cancelEditTrade
) {

    cancelEditTrade.addEventListener(
        "click",
        closeEditPanel
    );

}



/* =========================================
   SAVE EDITED TRADE
========================================= */

if (
    editTradeForm
) {

    editTradeForm.addEventListener(
        "submit",
        async function(
            event
        ) {

            event.preventDefault();


            clearEditMessage();


            if (
                !editingTrade
            ) {

                showEditMessage(
                    "No trade selected.",
                    "error"
                );


                return;

            }


            const date =
                document
                    .getElementById(
                        "editTradeDate"
                    )
                    ?.value ||
                "";


            const symbol =
                (
                    document
                        .getElementById(
                            "editSymbol"
                        )
                        ?.value ||
                    ""
                )
                .trim()
                .toUpperCase();


            const grossPnL =
                Number(
                    document
                        .getElementById(
                            "editGrossPnL"
                        )
                        ?.value ||
                    0
                );


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


            const plannedRisk =
                Number(
                    document
                        .getElementById(
                            "editPlannedRisk"
                        )
                        ?.value ||
                    0
                );


            /* =====================================
               VALIDATION
            ===================================== */

            if (
                !date
            ) {

                showEditMessage(
                    "Please select the trade date.",
                    "error"
                );


                return;

            }


            if (
                !symbol
            ) {

                showEditMessage(
                    "Please enter a symbol.",
                    "error"
                );


                return;

            }


            if (
                commission < 0
            ) {

                showEditMessage(
                    "Commission Fee cannot be negative.",
                    "error"
                );


                return;

            }


            if (
                swap < 0
            ) {

                showEditMessage(
                    "Swap Fee cannot be negative.",
                    "error"
                );


                return;

            }


            /* =====================================
               CALCULATE NET
            ===================================== */

            const netPnL =
                grossPnL
                -
                commission
                -
                swap;


            const actualRR =
                plannedRisk > 0
                    ?
                    netPnL /
                    plannedRisk
                    :
                    0;


            /* =====================================
               CHECKLIST
            ===================================== */

            const editedChecklist =
                getEditChecklist();


            const checklistStats =
                getChecklistStats(
                    editedChecklist
                );


            if (
                saveEditTrade
            ) {

                saveEditTrade.disabled =
                    true;


                saveEditTrade.textContent =
                    "Saving...";

            }


            showEditMessage(
                "Saving changes...",
                "warning"
            );


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


                /* =================================
                   EXISTING SCREENSHOT PATHS
                ================================= */

                let beforePath =
                    editingTrade
                        .before_screenshot;


                let afterPath =
                    editingTrade
                        .after_screenshot;


                const newBefore =
                    document
                        .getElementById(
                            "editBeforeScreenshot"
                        )
                        ?.files[0];


                const newAfter =
                    document
                        .getElementById(
                            "editAfterScreenshot"
                        )
                        ?.files[0];


                /* =================================
                   NEW BEFORE SCREENSHOT
                ================================= */

                if (
                    newBefore
                ) {

                    beforePath =
                        await uploadReplacementScreenshot(
                            newBefore,
                            "before",
                            user.id
                        );

                }


                /* =================================
                   NEW AFTER SCREENSHOT
                ================================= */

                if (
                    newAfter
                ) {

                    afterPath =
                        await uploadReplacementScreenshot(
                            newAfter,
                            "after",
                            user.id
                        );

                }


                /* =================================
                   RESULT
                ================================= */

                let result =
                    "BE";


                if (
                    netPnL > 0
                ) {

                    result =
                        "Win";

                }


                if (
                    netPnL < 0
                ) {

                    result =
                        "Loss";

                }


                /* =================================
                   UPDATE OBJECT
                ================================= */

                const updates = {

                    trade_date:
                        date,


                    symbol:
                        symbol,


                    direction:
                        document
                            .getElementById(
                                "editDirection"
                            )
                            ?.value ||
                        "BUY",


                    session:
                        document
                            .getElementById(
                                "editSession"
                            )
                            ?.value ||
                        "",


                    setup:
                        document
                            .getElementById(
                                "editSetup"
                            )
                            ?.value ||
                        "A",


                    rules_followed:
                        (
                            document
                                .getElementById(
                                    "editRulesFollowed"
                                )
                                ?.value ||
                            "false"
                        ) ===
                        "true",


                    /* =================================
                       CHECKLIST
                    ================================= */

                    pretrade_checklist:
                        editedChecklist,


                    checklist_score:
                        checklistStats
                            .score,


                    /* =================================
                       MONEY
                    ================================= */

                    gross_pnl:
                        grossPnL,


                    commission_fee:
                        commission,


                    swap_fee:
                        swap,


                    profit_loss:
                        netPnL,


                    actual_rr:
                        actualRR,


                    r_multiple:
                        actualRR,


                    result:
                        result,


                    /* =================================
                       NOTES
                    ================================= */

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


                    /* =================================
                       SCREENSHOTS
                    ================================= */

                    before_screenshot:
                        beforePath,


                    after_screenshot:
                        afterPath

                };


                /* =================================
                   SAVE TO SUPABASE
                ================================= */

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


                if (
                    error
                ) {

                    throw error;

                }


                showEditMessage(
                    "Trade updated successfully.",
                    "success"
                );


                if (
                    saveEditTrade
                ) {

                    saveEditTrade.textContent =
                        "Saved ✓";

                }


                await loadTrades();


                setTimeout(
                    function() {

                        closeEditPanel();

                    },
                    900
                );

            }


            catch (
                error
            ) {

                console.error(
                    "Update trade error:",
                    error
                );


                showEditMessage(
                    "ERROR: " +
                    (
                        error.message ||
                        "Unable to update trade."
                    ),
                    "error"
                );

            }


            finally {

                if (
                    saveEditTrade
                ) {

                    saveEditTrade.disabled =
                        false;


                    saveEditTrade.textContent =
                        "Save Changes";

                }

            }

        }
    );

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


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await db
                .from(
                    "trades"
                )
                .delete()
                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            throw error;

        }


        showHistoryMessage(
            "Trade deleted successfully.",
            "success"
        );


        if (
            editingTrade &&
            Number(
                editingTrade.id
            ) ===
            Number(
                id
            )
        ) {

            closeEditPanel();

        }


        await loadTrades();

    }


    catch (
        error
    ) {

        console.error(
            "Delete trade error:",
            error
        );


        showHistoryMessage(
            "Delete failed: " +
            error.message,
            "error"
        );

    }

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


    if (
        value > 0
    ) {

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


    if (
        value < 0
    ) {

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
        value ??
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}



/* =========================================
   START HISTORY PAGE
========================================= */

async function startHistoryPage() {

    console.log(
        "Starting History page..."
    );


    try {

        const session =
            await waitForSession();


        console.log(
            "History session ready:",
            session.user.id
        );


        await loadAccounts();


        await loadTrades();


        console.log(
            "History page loaded."
        );

    }


    catch (
        error
    ) {

        console.error(
            "History startup error:",
            error
        );


        showHistoryMessage(
            "Unable to start History page: " +
            (
                error.message ||
                "Unknown error."
            ),
            "error"
        );

    }

}


startHistoryPage();