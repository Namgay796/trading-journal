/* =========================================
   GLOBAL DATA
========================================= */

let allTrades = [];
let allAccounts = [];
let editingTrade = null;
let editingLayers = [];


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    const accountFilter =
        document.getElementById(
            "accountFilter"
        );


    if (
        !accountFilter
    ) {

        return;

    }


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
            data ||
            [];


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


    catch (
        error
    ) {

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
            data ||
            [];


        applyFilters();

    }


    catch (
        error
    ) {

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
   FORMAT HISTORY PRICE
========================================= */

function formatHistoryPrice(
    value,
    symbol
) {

    const price =
        Number(
            value
        );


    if (
        !Number.isFinite(
            price
        ) ||
        price ===
        0
    ) {

        return "-";

    }


    const pair =
        String(
            symbol ||
            ""
        )
        .trim()
        .toUpperCase();


    if (
        pair.includes(
            "JPY"
        )
    ) {

        return price.toFixed(
            3
        );

    }


    if (
        /^[A-Z]{6}$/.test(
            pair
        ) &&
        !pair.startsWith(
            "XAU"
        ) &&
        !pair.startsWith(
            "XAG"
        )
    ) {

        return price.toFixed(
            5
        );

    }


    if (
        pair.startsWith(
            "XAU"
        ) ||
        pair.startsWith(
            "XAG"
        )
    ) {

        return price.toFixed(
            3
        );

    }


    return String(
        price
    );

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


    if (
        !table
    ) {

        return;

    }


    if (
        !trades ||
        trades.length ===
        0
    ) {

        table.innerHTML =
            `
            <tr>

                <td colspan="16">
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
                        pnl >=
                        0
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
                            ${formatHistoryPrice(
                                trade.average_entry ??
                                trade.entry_price,
                                trade.symbol
                            )}
                        </td>


                        <td>
                            ${formatHistoryPrice(
                                trade.average_exit ??
                                trade.exit_price,
                                trade.symbol
                            )}
                        </td>


                        <td>
                            ${formatHistoryPrice(
                                trade.stop_loss,
                                trade.symbol
                            )}
                        </td>


                        <td>
                            ${formatHistoryPrice(
                                trade.take_profit,
                                trade.symbol
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
                value ===
                true
        ).length;


    const score =
        total >
        0
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


    if (
        !confirmed
    ) {

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


        if (
            trade
        ) {

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


        alert(
            "Trade deleted."
        );


        await loadTrades();

    }


    catch (
        error
    ) {

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
   CONTRACT MULTIPLIER
========================================= */

function getContractMultiplier(
    symbol
) {

    symbol =
        String(
            symbol ||
            ""
        )
        .trim()
        .toUpperCase();


    if (
        symbol.includes(
            "XAU"
        )
    ) {

        return 100;

    }


    if (
        symbol.includes(
            "XAG"
        )
    ) {

        return 5000;

    }


    if (
        /^[A-Z]{6}$/.test(
            symbol
        )
    ) {

        return 100000;

    }


    return 1;

}



/* =========================================
   LOAD EDITABLE TRADE LAYERS
========================================= */

async function loadEditLayers(
    tradeId
) {

    const [
        entriesResult,
        exitsResult
    ] =
        await Promise.all(
            [

                db
                    .from(
                        "trade_entries"
                    )
                    .select("*")
                    .eq(
                        "trade_id",
                        tradeId
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    ),


                db
                    .from(
                        "trade_exits"
                    )
                    .select("*")
                    .eq(
                        "trade_id",
                        tradeId
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    )

            ]
        );


    if (
        entriesResult.error
    ) {

        throw new Error(
            "Unable to load entry layers: " +
            entriesResult.error.message
        );

    }


    if (
        exitsResult.error
    ) {

        throw new Error(
            "Unable to load exit layers: " +
            exitsResult.error.message
        );

    }


    const entries =
        entriesResult.data ||
        [];


    const exits =
        exitsResult.data ||
        [];


    const count =
        Math.max(
            entries.length,
            exits.length
        );


    editingLayers =
        [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const entry =
            entries[i] ||
            {};


        const exit =
            exits[i] ||
            {};


        editingLayers.push(
            {

                lot:
                    Number(
                        entry.lot_size ??
                        exit.lot_size ??
                        0
                    ),


                entry:
                    Number(
                        entry.entry_price ||
                        0
                    ),


                exit:
                    Number(
                        exit.exit_price ||
                        0
                    )

            }
        );

    }


    if (
        editingLayers.length ===
        0
    ) {

        editingLayers.push(
            {

                lot:
                    Number(
                        editingTrade?.lot_size ||
                        0.01
                    ),


                entry:
                    Number(
                        editingTrade?.average_entry ??
                        editingTrade?.entry_price ??
                        0
                    ),


                exit:
                    Number(
                        editingTrade?.average_exit ??
                        editingTrade?.exit_price ??
                        0
                    )

            }
        );

    }


    renderEditLayers();

}



/* =========================================
   RENDER EDITABLE LAYERS
========================================= */

function renderEditLayers() {

    const container =
        document.getElementById(
            "editTradeLayers"
        );


    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    editingLayers.forEach(
        (
            layer,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "layer-row edit-trade-layer";


            row.dataset.index =
                String(
                    index
                );


            row.innerHTML =
                `

                <label>

                    Lot Size

                    <input
                        class="edit-layer-lot-size"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value="${layer.lot || ""}"
                    >

                </label>


                <label>

                    Entry Price

                    <input
                        class="edit-layer-entry-price"
                        type="number"
                        step="any"
                        value="${layer.entry || ""}"
                    >

                </label>


                <label>

                    Exit Price

                    <input
                        class="edit-layer-exit-price"
                        type="number"
                        step="any"
                        value="${layer.exit || ""}"
                    >

                </label>


                <button
                    type="button"
                    class="remove-edit-layer"
                    title="Remove layer"
                >
                    ×
                </button>

                `;


            container.appendChild(
                row
            );

        }
    );


    attachEditLayerEvents();

}



/* =========================================
   GET EDITED LAYERS
========================================= */

function getEditLayers() {

    const rows =
        document.querySelectorAll(
            ".edit-trade-layer"
        );


    const layers =
        [];


    rows.forEach(
        row => {

            const lot =
                Number(
                    row
                        .querySelector(
                            ".edit-layer-lot-size"
                        )
                        ?.value ||
                    0
                );


            const entry =
                Number(
                    row
                        .querySelector(
                            ".edit-layer-entry-price"
                        )
                        ?.value ||
                    0
                );


            const exit =
                Number(
                    row
                        .querySelector(
                            ".edit-layer-exit-price"
                        )
                        ?.value ||
                    0
                );


            layers.push(
                {
                    lot,
                    entry,
                    exit
                }
            );

        }
    );


    return layers;

}



/* =========================================
   VALIDATE EDITED LAYERS
========================================= */

function validateEditLayers() {

    const layers =
        getEditLayers();


    if (
        layers.length ===
        0
    ) {

        showEditMessage(
            "At least one trade layer is required.",
            "error"
        );


        return false;

    }


    for (
        let i = 0;
        i < layers.length;
        i++
    ) {

        const layer =
            layers[i];


        if (
            !Number.isFinite(
                layer.lot
            ) ||
            layer.lot <=
            0
        ) {

            showEditMessage(
                "Layer " +
                (
                    i +
                    1
                ) +
                ": enter a valid lot size.",
                "error"
            );


            return false;

        }


        if (
            !Number.isFinite(
                layer.entry
            ) ||
            layer.entry <=
            0
        ) {

            showEditMessage(
                "Layer " +
                (
                    i +
                    1
                ) +
                ": enter a valid entry price.",
                "error"
            );


            return false;

        }


        if (
            !Number.isFinite(
                layer.exit
            ) ||
            layer.exit <=
            0
        ) {

            showEditMessage(
                "Layer " +
                (
                    i +
                    1
                ) +
                ": enter a valid exit price.",
                "error"
            );


            return false;

        }

    }


    return true;

}



/* =========================================
   WEIGHTED AVERAGE
========================================= */

function weightedAverage(
    layers,
    field
) {

    const valid =
        layers.filter(
            layer =>
                Number(
                    layer[field]
                ) >
                0 &&
                Number(
                    layer.lot
                ) >
                0
        );


    const totalLots =
        valid.reduce(
            (
                total,
                layer
            ) =>
                total +
                Number(
                    layer.lot
                ),
            0
        );


    if (
        totalLots <=
        0
    ) {

        return 0;

    }


    return valid.reduce(
        (
            total,
            layer
        ) =>
            total +
            (
                Number(
                    layer[field]
                ) *
                Number(
                    layer.lot
                )
            ),
        0
    ) /
    totalLots;

}



/* =========================================
   EDIT LAYER EVENTS
========================================= */

function attachEditLayerEvents() {

    document
        .querySelectorAll(
            ".edit-layer-lot-size, .edit-layer-entry-price, .edit-layer-exit-price"
        )
        .forEach(
            input => {

                input.oninput =
                    recalculateEditedPnL;

            }
        );


    document
        .querySelectorAll(
            ".remove-edit-layer"
        )
        .forEach(
            button => {

                button.onclick =
                    function() {

                        const rows =
                            document.querySelectorAll(
                                ".edit-trade-layer"
                            );


                        if (
                            rows.length <=
                            1
                        ) {

                            showEditMessage(
                                "At least one trade layer is required.",
                                "warning"
                            );


                            return;

                        }


                        button
                            .closest(
                                ".edit-trade-layer"
                            )
                            ?.remove();


                        editingLayers =
                            getEditLayers();


                        recalculateEditedPnL();

                    };

            }
        );

}



/* =========================================
   ADD EDIT LAYER
========================================= */

const addEditLayerButton =
    document.getElementById(
        "addEditLayer"
    );


if (
    addEditLayerButton
) {

    addEditLayerButton.addEventListener(
        "click",
        function() {

            editingLayers =
                getEditLayers();


            editingLayers.push(
                {

                    lot:
                        0.01,

                    entry:
                        0,

                    exit:
                        0

                }
            );


            renderEditLayers();


            recalculateEditedPnL();

        }
    );

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


    if (
        !trade
    ) {

        alert(
            "Trade not found."
        );


        return;

    }


    editingTrade =
        {
            ...trade
        };


    setValue(
        "editTradeId",
        trade.id
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
                trade.symbol ||
                "Trade"
            ) +
            " • " +
            (
                trade.trade_date ||
                ""
            );

    }


    setValue(
        "editTradeDate",
        trade.trade_date
    );


    setValue(
        "editSymbol",
        trade.symbol
    );


    setValue(
        "editDirection",
        trade.direction
    );


    setValue(
        "editStopLoss",
        trade.stop_loss
    );


    setValue(
        "editTakeProfit",
        trade.take_profit
    );


    setValue(
        "editSession",
        trade.session
    );


    setValue(
        "editSetup",
        trade.setup
    );


    setValue(
        "editRulesFollowed",
        String(
            trade.rules_followed
        )
    );


    setValue(
        "editCommissionFee",
        Number(
            trade.commission_fee ||
            0
        )
    );


    setValue(
        "editSwapFee",
        Number(
            trade.swap_fee ||
            0
        )
    );


    setValue(
        "editMistakes",
        trade.mistakes ||
        ""
    );


    setValue(
        "editNotes",
        trade.notes ||
        ""
    );


    /* LOAD INDIVIDUAL ENTRY / EXIT LAYERS */

    try {

        await loadEditLayers(
            trade.id
        );

    }


    catch (
        error
    ) {

        console.error(
            "Layer load error:",
            error
        );


        showEditMessage(
            error.message,
            "error"
        );

    }


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


    const beforeInput =
        document.getElementById(
            "editBeforeScreenshot"
        );


    const afterInput =
        document.getElementById(
            "editAfterScreenshot"
        );


    if (
        beforeInput
    ) {

        beforeInput.value =
            "";

    }


    if (
        afterInput
    ) {

        afterInput.value =
            "";

    }


    await showCurrentScreenshots(
        editingTrade
    );


    updateScreenshotDeleteButtons();


    const panel =
        document.getElementById(
            "editTradePanel"
        );


    if (
        panel
    ) {

        panel.hidden =
            false;


        panel.style.display =
            "block";


        panel.scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );

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


    if (
        element
    ) {

        element.value =
            value ??
            "";

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


    if (
        element
    ) {

        element.checked =
            value ===
            true;

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
   UPDATE EDIT CHECKLIST
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
        bar
    ) {

        bar.style.width =
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
   SCREENSHOT PREVIEW
========================================= */

async function showScreenshotPreview(
    elementId,
    path
) {

    const container =
        document.getElementById(
            elementId
        );


    if (
        !container
    ) {

        return;

    }


    if (
        !path
    ) {

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


    catch (
        error
    ) {

        console.error(
            "Screenshot preview error:",
            error
        );


        container.innerHTML =
            "Unable to load screenshot";

    }

}



/* =========================================
   SCREENSHOT DELETE BUTTON STATE
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


    if (
        beforeButton
    ) {

        beforeButton.disabled =
            !editingTrade ||
            !editingTrade.before_screenshot;

    }


    if (
        afterButton
    ) {

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

    if (
        !editingTrade
    ) {

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


    if (
        !path
    ) {

        showEditMessage(
            "No screenshot to delete.",
            "warning"
        );


        return;

    }


    if (
        !confirm(
            "Delete this screenshot permanently?"
        )
    ) {

        return;

    }


    try {

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


        if (
            storageError
        ) {

            throw storageError;

        }


        const update =
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
                    update
                )
                .eq(
                    "id",
                    editingTrade.id
                );


        if (
            updateError
        ) {

            throw updateError;

        }


        if (
            isBefore
        ) {

            editingTrade.before_screenshot =
                null;

        }


        else {

            editingTrade.after_screenshot =
                null;

        }


        await showCurrentScreenshots(
            editingTrade
        );


        updateScreenshotDeleteButtons();


        showEditMessage(
            "Screenshot deleted.",
            "success"
        );

    }


    catch (
        error
    ) {

        console.error(
            error
        );


        showEditMessage(
            "Screenshot delete failed: " +
            error.message,
            "error"
        );

    }

}



/* =========================================
   DELETE SCREENSHOT EVENTS
========================================= */

const deleteBeforeScreenshot =
    document.getElementById(
        "deleteBeforeScreenshot"
    );


if (
    deleteBeforeScreenshot
) {

    deleteBeforeScreenshot.addEventListener(
        "click",
        function() {

            deleteStoredScreenshot(
                "before"
            );

        }
    );

}


const deleteAfterScreenshot =
    document.getElementById(
        "deleteAfterScreenshot"
    );


if (
    deleteAfterScreenshot
) {

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

    if (
        !file
    ) {

        return null;

    }


    if (
        !file.size ||
        file.size <=
        0
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


    if (
        ![
            "jpg",
            "jpeg",
            "png",
            "webp",
            "heic",
            "heif"
        ].includes(
            extension
        )
    ) {

        extension =
            "jpg";

    }


    const arrayBuffer =
        await file.arrayBuffer();


    const fileBytes =
        new Uint8Array(
            arrayBuffer
        );


    const contentType =
        file.type ||
        "image/jpeg";


    const fileName =
        `${type}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`;


    const filePath =
        `${userId}/trades/${fileName}`;


    const {
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


    if (
        error
    ) {

        throw error;

    }


    return filePath;

}



/* =========================================
   REMOVE OLD SCREENSHOT
========================================= */

async function removeOldScreenshot(
    path
) {

    if (
        !path
    ) {

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


    if (
        error
    ) {

        console.warn(
            error
        );

    }

}



/* =========================================
   RECALCULATE EDITED TRADE
========================================= */

function recalculateEditedPnL() {

    if (
        !editingTrade
    ) {

        return null;

    }


    const layers =
        getEditLayers();


    const symbol =
        document
            .getElementById(
                "editSymbol"
            )
            ?.value ||
        editingTrade.symbol ||
        "";


    const direction =
        document
            .getElementById(
                "editDirection"
            )
            ?.value ||
        editingTrade.direction ||
        "BUY";


    const stopLoss =
        Number(
            document
                .getElementById(
                    "editStopLoss"
                )
                ?.value ||
            editingTrade.stop_loss ||
            0
        );


    const takeProfit =
        Number(
            document
                .getElementById(
                    "editTakeProfit"
                )
                ?.value ||
            editingTrade.take_profit ||
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


    const multiplier =
        getContractMultiplier(
            symbol
        );


    const averageEntry =
        weightedAverage(
            layers,
            "entry"
        );


    const averageExit =
        weightedAverage(
            layers,
            "exit"
        );


    let plannedRisk =
        0;


    if (
        stopLoss >
        0
    ) {

        layers.forEach(
            layer => {

                if (
                    layer.lot >
                    0 &&
                    layer.entry >
                    0
                ) {

                    plannedRisk +=
                        Math.abs(
                            layer.entry -
                            stopLoss
                        ) *
                        layer.lot *
                        multiplier;

                }

            }
        );

    }


    let plannedReward =
        0;


    if (
        takeProfit >
        0
    ) {

        layers.forEach(
            layer => {

                if (
                    layer.lot >
                    0 &&
                    layer.entry >
                    0
                ) {

                    plannedReward +=
                        Math.abs(
                            takeProfit -
                            layer.entry
                        ) *
                        layer.lot *
                        multiplier;

                }

            }
        );

    }


    const plannedRR =
        plannedRisk >
        0
            ?
            plannedReward /
            plannedRisk
            :
            0;


    let grossPnL =
        0;


    layers.forEach(
        layer => {

            if (
                layer.lot <=
                0 ||
                layer.entry <=
                0 ||
                layer.exit <=
                0
            ) {

                return;

            }


            const movement =
                direction ===
                "SELL"
                    ?
                    layer.entry -
                    layer.exit
                    :
                    layer.exit -
                    layer.entry;


            grossPnL +=
                movement *
                layer.lot *
                multiplier;

        }
    );


    const netPnL =
        grossPnL -
        commission -
        swap;


    const actualRR =
        plannedRisk >
        0
            ?
            netPnL /
            plannedRisk
            :
            0;


    setValue(
        "editAverageEntry",
        averageEntry >
        0
            ?
            formatHistoryPrice(
                averageEntry,
                symbol
            )
            :
            ""
    );


    setValue(
        "editAverageExit",
        averageExit >
        0
            ?
            formatHistoryPrice(
                averageExit,
                symbol
            )
            :
            ""
    );


    setValue(
        "editGrossPnL",
        grossPnL.toFixed(
            2
        )
    );


    setValue(
        "editProfitLoss",
        netPnL.toFixed(
            2
        )
    );


    setValue(
        "editPlannedRisk",
        plannedRisk.toFixed(
            2
        )
    );


    setValue(
        "editActualRR",
        actualRR.toFixed(
            2
        )
    );


    return {

        layers,
        multiplier,
        averageEntry,
        averageExit,
        plannedRisk,
        plannedReward,
        plannedRR,
        grossPnL,
        commission,
        swap,
        netPnL,
        actualRR,
        stopLoss,
        takeProfit

    };

}



/* =========================================
   EDIT CALCULATION EVENTS
========================================= */

[
    "editSymbol",
    "editDirection",
    "editStopLoss",
    "editTakeProfit",
    "editCommissionFee",
    "editSwapFee"
]
.forEach(
    id => {

        const input =
            document.getElementById(
                id
            );


        if (
            input
        ) {

            input.addEventListener(
                "input",
                recalculateEditedPnL
            );


            input.addEventListener(
                "change",
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


if (
    editTradeForm
) {

    editTradeForm.addEventListener(
        "submit",
        async function(
            event
        ) {

            event.preventDefault();


            if (
                !editingTrade
            ) {

                showEditMessage(
                    "No trade selected.",
                    "error"
                );


                return;

            }


            const saveButton =
                document.getElementById(
                    "saveEditTrade"
                );


            if (
                saveButton
            ) {

                saveButton.disabled =
                    true;


                saveButton.textContent =
                    "Saving...";

            }


            try {

                if (
                    !validateEditLayers()
                ) {

                    throw new Error(
                        "Please correct the trade layers before saving."
                    );

                }


                const calculation =
                    recalculateEditedPnL();


                if (
                    !calculation
                ) {

                    throw new Error(
                        "Unable to calculate the edited trade."
                    );

                }


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


                let beforePath =
                    editingTrade.before_screenshot ||
                    null;


                let afterPath =
                    editingTrade.after_screenshot ||
                    null;


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


                if (
                    beforeFile
                ) {

                    const newPath =
                        await uploadReplacementScreenshot(
                            beforeFile,
                            "before",
                            user.id
                        );


                    await removeOldScreenshot(
                        beforePath
                    );


                    beforePath =
                        newPath;

                }


                if (
                    afterFile
                ) {

                    const newPath =
                        await uploadReplacementScreenshot(
                            afterFile,
                            "after",
                            user.id
                        );


                    await removeOldScreenshot(
                        afterPath
                    );


                    afterPath =
                        newPath;

                }


                const checklist =
                    getEditedChecklist();


                const checklistStats =
                    getChecklistStats(
                        checklist
                    );


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


                const totalLots =
                    calculation.layers.reduce(
                        (
                            total,
                            layer
                        ) =>
                            total +
                            Number(
                                layer.lot ||
                                0
                            ),
                        0
                    );


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


                    entry_price:
                        calculation.averageEntry,


                    average_entry:
                        calculation.averageEntry,


                    exit_price:
                        calculation.averageExit,


                    average_exit:
                        calculation.averageExit,


                    lot_size:
                        totalLots,


                    stop_loss:
                        calculation.stopLoss,


                    take_profit:
                        calculation.takeProfit,


                    contract_size:
                        calculation.multiplier,


                    planned_risk:
                        calculation.plannedRisk,


                    planned_rr:
                        calculation.plannedRR,


                    gross_pnl:
                        calculation.grossPnL,


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


                if (
                    error
                ) {

                    throw error;

                }


                /* DELETE OLD ENTRY LAYERS */

                const {
                    error:
                        deleteEntriesError
                } =
                    await db
                        .from(
                            "trade_entries"
                        )
                        .delete()
                        .eq(
                            "trade_id",
                            editingTrade.id
                        );


                if (
                    deleteEntriesError
                ) {

                    throw new Error(
                        "Unable to clear old entry layers: " +
                        deleteEntriesError.message
                    );

                }


                /* DELETE OLD EXIT LAYERS */

                const {
                    error:
                        deleteExitsError
                } =
                    await db
                        .from(
                            "trade_exits"
                        )
                        .delete()
                        .eq(
                            "trade_id",
                            editingTrade.id
                        );


                if (
                    deleteExitsError
                ) {

                    throw new Error(
                        "Unable to clear old exit layers: " +
                        deleteExitsError.message
                    );

                }


                /* CREATE UPDATED ENTRY LAYERS */

                const entryRows =
                    calculation.layers.map(
                        layer =>
                            ({

                                trade_id:
                                    editingTrade.id,

                                user_id:
                                    user.id,

                                entry_price:
                                    layer.entry,

                                lot_size:
                                    layer.lot

                            })
                    );


                /* CREATE UPDATED EXIT LAYERS */

                const exitRows =
                    calculation.layers.map(
                        layer =>
                            ({

                                trade_id:
                                    editingTrade.id,

                                user_id:
                                    user.id,

                                exit_price:
                                    layer.exit,

                                lot_size:
                                    layer.lot

                            })
                    );


                const {
                    error:
                        entryInsertError
                } =
                    await db
                        .from(
                            "trade_entries"
                        )
                        .insert(
                            entryRows
                        );


                if (
                    entryInsertError
                ) {

                    throw new Error(
                        "Unable to save entry layers: " +
                        entryInsertError.message
                    );

                }


                const {
                    error:
                        exitInsertError
                } =
                    await db
                        .from(
                            "trade_exits"
                        )
                        .insert(
                            exitRows
                        );


                if (
                    exitInsertError
                ) {

                    throw new Error(
                        "Unable to save exit layers: " +
                        exitInsertError.message
                    );

                }


                editingTrade =
                    {
                        ...editingTrade,
                        ...updates
                    };


                editingLayers =
                    calculation.layers.map(
                        layer =>
                            ({
                                ...layer
                            })
                    );


                showEditMessage(
                    "Trade updated successfully.",
                    "success"
                );


                await loadTrades();


                setTimeout(
                    function() {

                        closeEditTrade();

                    },
                    700
                );

            }


            catch (
                error
            ) {

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

                if (
                    saveButton
                ) {

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

    const panel =
        document.getElementById(
            "editTradePanel"
        );


    if (
        panel
    ) {

        panel.hidden =
            true;


        panel.style.display =
            "none";

    }


    editingTrade =
        null;


    editingLayers =
        [];


    const beforeButton =
        document.getElementById(
            "deleteBeforeScreenshot"
        );


    const afterButton =
        document.getElementById(
            "deleteAfterScreenshot"
        );


    if (
        beforeButton
    ) {

        beforeButton.disabled =
            true;

    }


    if (
        afterButton
    ) {

        afterButton.disabled =
            true;

    }

}



/* =========================================
   CLOSE / CANCEL
========================================= */

const closeEditButton =
    document.getElementById(
        "closeEditTrade"
    );


if (
    closeEditButton
) {

    closeEditButton.addEventListener(
        "click",
        closeEditTrade
    );

}


const cancelEditButton =
    document.getElementById(
        "cancelEditTrade"
    );


if (
    cancelEditButton
) {

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
            "editTradeMessage"
        );


    if (
        !message
    ) {

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


    if (
        value >
        0
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
        value <
        0
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


if (
    accountFilter
) {

    accountFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (
    sessionFilter
) {

    sessionFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (
    resultFilter
) {

    resultFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (
    symbolFilter
) {

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