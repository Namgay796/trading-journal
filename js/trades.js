let allTrades = [];

let allAccounts = [];

let selectedAccountId = "";

let editingTrade = null;

let editingTradeId = null;

let editingEntries = [];

let editingExits = [];

let editCurrentCapital = 0;



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
   FORMAT TRADE PRICE
========================================= */

function formatTradePrice(
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
        )
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
        )
        &&
        !pair.startsWith(
            "XAU"
        )
        &&
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
        )
        ||
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
   HISTORY CHECKLIST
========================================= */

function getChecklistStats(
    checklist
) {

    checklist =
        checklist ||
        {};


    const keys = [

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


    const checked =
        keys.filter(
            key =>
                checklist[key] ===
                true
        )
        .length;


    const total =
        keys.length;


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

        checked:
            checked,

        total:
            total,

        score:
            score

    };

}



/* =========================================
   SET CHECKLIST CHECKBOX
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
   UPDATE EDIT CHECKLIST DISPLAY
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
   CHECKLIST CHANGE EVENTS
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
            error
        );


        accountFilter.innerHTML =
            `
            <option value="">
                All Accounts
            </option>
            `;

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
            error
        );


        const table =
            document.getElementById(
                "tradeTable"
            );


        if (
            table
        ) {

            table.innerHTML =
                `
                <tr>
                    <td colspan="12">
                        Unable to load trades.
                    </td>
                </tr>
                `;

        }

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
                        pnl >=
                        0
                            ?
                            "profit"
                            :
                            "loss";


                    const checklistStats =
                        getChecklistStats(
                            trade.pretrade_checklist ||
                            {}
                        );


                    return `

                    <tr>

                        <td>
                            ${trade.trade_date || ""}
                        </td>


                        <td>
                            ${trade.symbol || ""}
                        </td>


                        <td>
                            ${trade.direction || ""}
                        </td>


                        <td>
                            ${trade.session || ""}
                        </td>


                        <td>
                            ${trade.setup || ""}
                        </td>


                        <td>
                            ${trade.result || ""}
                        </td>


                        <td class="${pnlClass}">
                            ${signedMoney(pnl)}
                        </td>


                        <td>
                            ${Number(
                                trade.r_multiple ||
                                trade.actual_rr ||
                                0
                            ).toFixed(2)}R
                        </td>


                        <td class="checklist-history-score">

                            <strong>
                                ${checklistStats.checked}/${checklistStats.total}
                            </strong>

                            <small>
                                ${checklistStats.score.toFixed(0)}%
                            </small>

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
        document
            .getElementById(
                "symbolFilter"
            )
            ?.value
            ?.trim()
            ?.toUpperCase() ||
        "";


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
   FILTER EVENTS
========================================= */

[
    "accountFilter",
    "sessionFilter",
    "resultFilter"
]
.forEach(
    id => {

        const element =
            document.getElementById(
                id
            );


        if (
            element
        ) {

            element.addEventListener(
                "change",
                applyFilters
            );

        }

    }
);


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


        alert(
            "Trade deleted."
        );


        await loadTrades();

    }


    catch (
        error
    ) {

        console.error(
            error
        );


        alert(
            "Delete failed: " +
            error.message
        );

    }

}



/* =========================================
   SET ELEMENT VALUE
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
            value ??
            "";

    }

}



/* =========================================
   EDIT TRADE
========================================= */

async function editTrade(
    id
) {

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

        alert(
            "Trade not found."
        );


        return;

    }


    editingTradeId =
        editingTrade.id;


    setElementValue(
        "editTradeId",
        editingTrade.id
    );


    setElementValue(
        "editTradeDate",
        editingTrade.trade_date
    );


    setElementValue(
        "editSymbol",
        editingTrade.symbol
    );


    setElementValue(
        "editDirection",
        editingTrade.direction
    );


    setElementValue(
        "editStopLoss",
        editingTrade.stop_loss
    );


    setElementValue(
        "editTakeProfit",
        editingTrade.take_profit
    );


    setElementValue(
        "editSession",
        editingTrade.session
    );


    setElementValue(
        "editSetup",
        editingTrade.setup ||
        "A"
    );


    setElementValue(
        "editRulesFollowed",
        editingTrade.rules_followed
            ?
            "true"
            :
            "false"
    );


    setElementValue(
        "editCommissionFee",
        Number(
            editingTrade.commission_fee ||
            0
        )
    );


    setElementValue(
        "editSwapFee",
        Number(
            editingTrade.swap_fee ||
            0
        )
    );


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
       LOAD PRE-TRADE CHECKLIST
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
       LOAD ENTRY LAYERS
    ===================================== */

    try {

        const {
            data:
                entries,
            error:
                entryError
        } =
            await db
                .from(
                    "trade_entries"
                )
                .select("*")
                .eq(
                    "trade_id",
                    id
                )
                .order(
                    "id"
                );


        if (
            entryError
        ) {

            throw entryError;

        }


        editingEntries =
            entries ||
            [];


        const {
            data:
                exits,
            error:
                exitError
        } =
            await db
                .from(
                    "trade_exits"
                )
                .select("*")
                .eq(
                    "trade_id",
                    id
                )
                .order(
                    "id"
                );


        if (
            exitError
        ) {

            throw exitError;

        }


        editingExits =
            exits ||
            [];


        renderEditLayers();

    }


    catch (
        error
    ) {

        console.error(
            error
        );

    }


    /* =====================================
       CURRENT CAPITAL
    ===================================== */

    const account =
        allAccounts.find(
            account =>
                Number(
                    account.id
                ) ===
                Number(
                    editingTrade.account_id
                )
        );


    if (
        account
    ) {

        const previousPnL =
            allTrades
                .filter(
                    trade =>
                        Number(
                            trade.account_id
                        ) ===
                            Number(
                                editingTrade.account_id
                            )
                        &&
                        Number(
                            trade.id
                        ) !==
                            Number(
                                editingTrade.id
                            )
                )
                .reduce(
                    (
                        total,
                        trade
                    ) =>
                        total +
                        Number(
                            trade.profit_loss ||
                            0
                        ),
                    0
                );


        editCurrentCapital =
            Number(
                account.starting_balance ||
                0
            )
            +
            previousPnL;

    }


    const capitalDisplay =
        document.getElementById(
            "editCurrentCapital"
        );


    if (
        capitalDisplay
    ) {

        capitalDisplay.textContent =
            money(
                editCurrentCapital
            );

    }


    calculateEditTrade();


    const editSection =
        document.getElementById(
            "editTradeSection"
        );


    if (
        editSection
    ) {

        editSection.style.display =
            "block";


        editSection.scrollIntoView(
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
   RENDER EDIT LAYERS
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


    const count =
        Math.max(
            editingEntries.length,
            editingExits.length,
            1
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const entry =
            editingEntries[i] ||
            {};


        const exit =
            editingExits[i] ||
            {};


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "layer-row edit-trade-layer";


        row.innerHTML =
            `

            <label>

                Lot Size

                <input
                    class="edit-layer-lot-size"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value="${Number(
                        entry.lot_size ||
                        exit.lot_size ||
                        0
                    ) || ""}"
                >

            </label>


            <label>

                Entry Price

                <input
                    class="edit-layer-entry-price"
                    type="number"
                    step="any"
                    value="${entry.entry_price ?? ""}"
                >

            </label>


            <label>

                Exit Price

                <input
                    class="edit-layer-exit-price"
                    type="number"
                    step="any"
                    value="${exit.exit_price ?? ""}"
                >

            </label>


            <button
                type="button"
                class="remove-edit-layer"
            >
                ×
            </button>

            `;


        container.appendChild(
            row
        );

    }


    attachEditLayerEvents();

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

            const container =
                document.getElementById(
                    "editTradeLayers"
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "layer-row edit-trade-layer";


            row.innerHTML =
                `

                <label>

                    Lot Size

                    <input
                        class="edit-layer-lot-size"
                        type="number"
                        min="0.01"
                        step="0.01"
                    >

                </label>


                <label>

                    Entry Price

                    <input
                        class="edit-layer-entry-price"
                        type="number"
                        step="any"
                    >

                </label>


                <label>

                    Exit Price

                    <input
                        class="edit-layer-exit-price"
                        type="number"
                        step="any"
                    >

                </label>


                <button
                    type="button"
                    class="remove-edit-layer"
                >
                    ×
                </button>

                `;


            container.appendChild(
                row
            );


            attachEditLayerEvents();

        }
    );

}



/* =========================================
   EDIT LAYER EVENTS
========================================= */

function attachEditLayerEvents() {

    document
        .querySelectorAll(
            ".remove-edit-layer"
        )
        .forEach(
            button => {

                button.onclick =
                    function() {

                        const rows =
                            document
                                .querySelectorAll(
                                    ".edit-trade-layer"
                                );


                        if (
                            rows.length <=
                            1
                        ) {

                            alert(
                                "At least one layer is required."
                            );


                            return;

                        }


                        button
                            .closest(
                                ".edit-trade-layer"
                            )
                            .remove();


                        calculateEditTrade();

                    };

            }
        );


    document
        .querySelectorAll(
            ".edit-layer-lot-size, " +
            ".edit-layer-entry-price, " +
            ".edit-layer-exit-price"
        )
        .forEach(
            input => {

                input.oninput =
                    calculateEditTrade;

            }
        );

}



/* =========================================
   GET EDIT LAYERS
========================================= */

function getEditLayers() {

    const layers =
        [];


    document
        .querySelectorAll(
            ".edit-trade-layer"
        )
        .forEach(
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


                if (
                    lot >
                    0 &&
                    entry >
                    0
                ) {

                    layers.push(
                        {

                            lot:
                                lot,

                            entry:
                                entry,

                            exit:
                                exit >
                                0
                                    ?
                                    exit
                                    :
                                    null

                        }
                    );

                }

            }
        );


    return layers;

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
                )
                *
                Number(
                    layer.lot
                )
            ),
        0
    ) /
    totalLots;

}



/* =========================================
   CALCULATE EDIT TRADE
========================================= */

function calculateEditTrade() {

    const layers =
        getEditLayers();


    const symbol =
        document
            .getElementById(
                "editSymbol"
            )
            ?.value ||
        "";


    const direction =
        document
            .getElementById(
                "editDirection"
            )
            ?.value ||
        "BUY";


    const stopLoss =
        Number(
            document
                .getElementById(
                    "editStopLoss"
                )
                ?.value ||
            0
        );


    const takeProfit =
        Number(
            document
                .getElementById(
                    "editTakeProfit"
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

                plannedRisk +=
                    Math.abs(
                        layer.entry -
                        stopLoss
                    )
                    *
                    layer.lot
                    *
                    multiplier;

            }
        );

    }


    const riskPercent =
        editCurrentCapital >
        0
            ?
            (
                plannedRisk /
                editCurrentCapital
            ) *
            100
            :
            0;


    let plannedReward =
        0;


    if (
        takeProfit >
        0
    ) {

        layers.forEach(
            layer => {

                plannedReward +=
                    Math.abs(
                        takeProfit -
                        layer.entry
                    )
                    *
                    layer.lot
                    *
                    multiplier;

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
                !layer.exit
            ) {

                return;

            }


            let movement =
                0;


            if (
                direction ===
                "BUY"
            ) {

                movement =
                    layer.exit -
                    layer.entry;

            }


            else {

                movement =
                    layer.entry -
                    layer.exit;

            }


            grossPnL +=
                movement *
                layer.lot *
                multiplier;

        }
    );


    const totalFees =
        commission +
        swap;


    const netPnL =
        grossPnL -
        totalFees;


    const actualRR =
        plannedRisk >
        0
            ?
            netPnL /
            plannedRisk
            :
            0;


    const plannedRiskDisplay =
        document.getElementById(
            "editPlannedRisk"
        );


    if (
        plannedRiskDisplay
    ) {

        plannedRiskDisplay.value =
            plannedRisk.toFixed(
                2
            );

    }


    const riskPercentDisplay =
        document.getElementById(
            "editRiskPercent"
        );


    if (
        riskPercentDisplay
    ) {

        riskPercentDisplay.value =
            riskPercent.toFixed(
                2
            );

    }


    const plannedRRDisplay =
        document.getElementById(
            "editPlannedRR"
        );


    if (
        plannedRRDisplay
    ) {

        plannedRRDisplay.value =
            plannedRR.toFixed(
                2
            );

    }


    const averageEntryDisplay =
        document.getElementById(
            "editAverageEntry"
        );


    if (
        averageEntryDisplay
    ) {

        averageEntryDisplay.value =
            averageEntry >
            0
                ?
                formatTradePrice(
                    averageEntry,
                    symbol
                )
                :
                "";

    }


    const averageExitDisplay =
        document.getElementById(
            "editAverageExit"
        );


    if (
        averageExitDisplay
    ) {

        averageExitDisplay.value =
            averageExit >
            0
                ?
                formatTradePrice(
                    averageExit,
                    symbol
                )
                :
                "";

    }


    const grossDisplay =
        document.getElementById(
            "editGrossPnL"
        );


    if (
        grossDisplay
    ) {

        grossDisplay.value =
            grossPnL.toFixed(
                2
            );

    }


    const feesDisplay =
        document.getElementById(
            "editTotalFees"
        );


    if (
        feesDisplay
    ) {

        feesDisplay.value =
            totalFees.toFixed(
                2
            );

    }


    const netDisplay =
        document.getElementById(
            "editNetPnL"
        );


    if (
        netDisplay
    ) {

        netDisplay.value =
            netPnL.toFixed(
                2
            );

    }


    const actualRRDisplay =
        document.getElementById(
            "editActualRR"
        );


    if (
        actualRRDisplay
    ) {

        actualRRDisplay.value =
            actualRR.toFixed(
                2
            );

    }


    return {

        layers:
            layers,

        multiplier:
            multiplier,

        averageEntry:
            averageEntry,

        averageExit:
            averageExit,

        plannedRisk:
            plannedRisk,

        riskPercent:
            riskPercent,

        plannedRR:
            plannedRR,

        grossPnL:
            grossPnL,

        commission:
            commission,

        swap:
            swap,

        totalFees:
            totalFees,

        netPnL:
            netPnL,

        actualRR:
            actualRR

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

        const element =
            document.getElementById(
                id
            );


        if (
            element
        ) {

            element.addEventListener(
                "input",
                calculateEditTrade
            );


            element.addEventListener(
                "change",
                calculateEditTrade
            );

        }

    }
);



/* =========================================
   SCREENSHOT UPLOAD
========================================= */

async function uploadEditScreenshot(
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
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "Screenshot must be an image."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop();


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
                file
            );


    if (
        error
    ) {

        throw error;

    }


    return filePath;

}



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

                return;

            }


            try {

                const calculations =
                    calculateEditTrade();


                const editedChecklist =
                    getEditChecklist();


                const editedChecklistStats =
                    getChecklistStats(
                        editedChecklist
                    );


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


                const beforeInput =
                    document.getElementById(
                        "editBeforeScreenshot"
                    );


                const afterInput =
                    document.getElementById(
                        "editAfterScreenshot"
                    );


                let beforePath =
                    editingTrade.before_screenshot ||
                    null;


                let afterPath =
                    editingTrade.after_screenshot ||
                    null;


                if (
                    beforeInput?.files?.[0]
                ) {

                    beforePath =
                        await uploadEditScreenshot(
                            beforeInput.files[0],
                            "before",
                            user.id
                        );

                }


                if (
                    afterInput?.files?.[0]
                ) {

                    afterPath =
                        await uploadEditScreenshot(
                            afterInput.files[0],
                            "after",
                            user.id
                        );

                }


                let result =
                    "BE";


                if (
                    calculations.netPnL >
                    0
                ) {

                    result =
                        "Win";

                }


                if (
                    calculations.netPnL <
                    0
                ) {

                    result =
                        "Loss";

                }


                const totalLots =
                    calculations.layers
                        .reduce(
                            (
                                total,
                                layer
                            ) =>
                                total +
                                layer.lot,
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
                            ?.trim()
                            ?.toUpperCase(),


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
                            ?.value ||
                        "A",


                    /* =================================
                       PRE-TRADE CHECKLIST
                    ================================= */

                    pretrade_checklist:
                        editedChecklist,


                    checklist_score:
                        editedChecklistStats
                            .score,


                    rules_followed:
                        document
                            .getElementById(
                                "editRulesFollowed"
                            )
                            ?.value ===
                        "true",


                    mistakes:
                        document
                            .getElementById(
                                "editMistakes"
                            )
                            ?.value
                            ?.trim() ||
                        "",


                    notes:
                        document
                            .getElementById(
                                "editNotes"
                            )
                            ?.value
                            ?.trim() ||
                        "",


                    entry_price:
                        calculations
                            .averageEntry,


                    average_entry:
                        calculations
                            .averageEntry,


                    exit_price:
                        calculations
                            .averageExit,


                    average_exit:
                        calculations
                            .averageExit,


                    lot_size:
                        totalLots,


                    contract_size:
                        calculations
                            .multiplier,


                    risk_percent:
                        calculations
                            .riskPercent,


                    planned_risk:
                        calculations
                            .plannedRisk,


                    planned_rr:
                        calculations
                            .plannedRR,


                    gross_pnl:
                        calculations
                            .grossPnL,


                    commission_fee:
                        calculations
                            .commission,


                    swap_fee:
                        calculations
                            .swap,


                    profit_loss:
                        calculations
                            .netPnL,


                    r_multiple:
                        calculations
                            .actualRR,


                    actual_rr:
                        calculations
                            .actualRR,


                    result:
                        result,


                    before_screenshot:
                        beforePath,


                    after_screenshot:
                        afterPath

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


                if (
                    updateError
                ) {

                    throw updateError;

                }


                /* =====================================
                   REPLACE ENTRY LAYERS
                ===================================== */

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

                    throw deleteEntriesError;

                }


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

                    throw deleteExitsError;

                }


                const entryRows =
                    calculations.layers
                        .map(
                            layer => (
                                {

                                    trade_id:
                                        editingTrade.id,

                                    user_id:
                                        user.id,

                                    entry_price:
                                        layer.entry,

                                    lot_size:
                                        layer.lot

                                }
                            )
                        );


                if (
                    entryRows.length >
                    0
                ) {

                    const {
                        error
                    } =
                        await db
                            .from(
                                "trade_entries"
                            )
                            .insert(
                                entryRows
                            );


                    if (
                        error
                    ) {

                        throw error;

                    }

                }


                const exitRows =
                    calculations.layers
                        .filter(
                            layer =>
                                layer.exit >
                                0
                        )
                        .map(
                            layer => (
                                {

                                    trade_id:
                                        editingTrade.id,

                                    user_id:
                                        user.id,

                                    exit_price:
                                        layer.exit,

                                    lot_size:
                                        layer.lot

                                }
                            )
                        );


                if (
                    exitRows.length >
                    0
                ) {

                    const {
                        error
                    } =
                        await db
                            .from(
                                "trade_exits"
                            )
                            .insert(
                                exitRows
                            );


                    if (
                        error
                    ) {

                        throw error;

                    }

                }


                alert(
                    "Trade updated successfully."
                );


                editingTrade =
                    null;


                editingTradeId =
                    null;


                const editSection =
                    document.getElementById(
                        "editTradeSection"
                    );


                if (
                    editSection
                ) {

                    editSection.style.display =
                        "none";

                }


                await loadTrades();

            }


            catch (
                error
            ) {

                console.error(
                    error
                );


                alert(
                    "Update failed: " +
                    error.message
                );

            }

        }
    );

}



/* =========================================
   CANCEL EDIT
========================================= */

const cancelEditButton =
    document.getElementById(
        "cancelEditTrade"
    );


if (
    cancelEditButton
) {

    cancelEditButton.addEventListener(
        "click",
        function() {

            editingTrade =
                null;


            editingTradeId =
                null;


            const section =
                document.getElementById(
                    "editTradeSection"
                );


            if (
                section
            ) {

                section.style.display =
                    "none";

            }

        }
    );

}



/* =========================================
   START
========================================= */

async function startHistory() {

    await loadAccounts();

    await loadTrades();


    updateEditChecklistDisplay();

}


startHistory();