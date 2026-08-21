let allTrades = [];

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



/* =========================================
   MESSAGE SYSTEM
========================================= */

function showHistoryMessage(
    text,
    type = "error"
) {

    historyMessage.textContent =
        text;


    historyMessage.className =
        "form-message show " +
        type;

}


function clearHistoryMessage() {

    historyMessage.textContent =
        "";


    historyMessage.className =
        "form-message";

}


function showEditMessage(
    text,
    type = "error"
) {

    const box =
        document.getElementById(
            "editTradeMessage"
        );


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


    box.textContent =
        "";


    box.className =
        "form-message full";

}



/* =========================================
   LOAD TRADES
========================================= */

async function loadTrades() {

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

        console.error(
            error
        );


        showHistoryMessage(
            "Unable to load trades: " +
            error.message,
            "error"
        );


        return;

    }


    allTrades =
        data ||
        [];


    displayTrades(
        allTrades
    );

}



/* =========================================
   DISPLAY
========================================= */

function displayTrades(
    trades
) {

    if (
        trades.length ===
        0
    ) {

        tradeTable.innerHTML =
            `

            <tr>

                <td colspan="11">
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
                        pnl >=
                        0
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
   FILTER
========================================= */

function applyFilters() {

    const session =
        document
            .getElementById(
                "sessionFilter"
            )
            .value;


    const result =
        document
            .getElementById(
                "resultFilter"
            )
            .value;


    const symbol =
        document
            .getElementById(
                "symbolFilter"
            )
            .value
            .trim()
            .toUpperCase();


    const filtered =
        allTrades.filter(
            trade => {

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

document
    .getElementById(
        "sessionFilter"
    )
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById(
        "resultFilter"
    )
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById(
        "symbolFilter"
    )
    .addEventListener(
        "input",
        applyFilters
    );



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


    /*
       OLD TRADES:

       If gross_pnl did not exist when
       the trade was saved, reconstruct it:

       gross =
       old net + commission + swap
    */

    let grossPnL =
        Number(
            editingTrade.gross_pnl
        );


    if (
        !Number.isFinite(
            grossPnL
        ) ||
        (
            grossPnL ===
            0 &&
            Number(
                editingTrade.profit_loss ||
                0
            ) !==
            0
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


    document
        .getElementById(
            "editTradeId"
        )
        .value =
        editingTrade.id;


    document
        .getElementById(
            "editTradeTitle"
        )
        .textContent =
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


    document
        .getElementById(
            "editTradeDate"
        )
        .value =
        editingTrade.trade_date ||
        "";


    document
        .getElementById(
            "editSymbol"
        )
        .value =
        editingTrade.symbol ||
        "";


    document
        .getElementById(
            "editDirection"
        )
        .value =
        editingTrade.direction ||
        "BUY";


    document
        .getElementById(
            "editSession"
        )
        .value =
        editingTrade.session ||
        "Asian";


    document
        .getElementById(
            "editSetup"
        )
        .value =
        normalizeSetup(
            editingTrade.setup
        );


    document
        .getElementById(
            "editRulesFollowed"
        )
        .value =
        editingTrade.rules_followed
            ?
            "true"
            :
            "false";


    document
        .getElementById(
            "editGrossPnL"
        )
        .value =
        grossPnL.toFixed(
            2
        );


    document
        .getElementById(
            "editCommissionFee"
        )
        .value =
        commission.toFixed(
            2
        );


    document
        .getElementById(
            "editSwapFee"
        )
        .value =
        swap.toFixed(
            2
        );


    document
        .getElementById(
            "editPlannedRisk"
        )
        .value =
        Number(
            editingTrade.planned_risk ||
            0
        ).toFixed(
            2
        );


    document
        .getElementById(
            "editMistakes"
        )
        .value =
        editingTrade.mistakes ||
        "";


    document
        .getElementById(
            "editNotes"
        )
        .value =
        editingTrade.notes ||
        "";


    document
        .getElementById(
            "editBeforeScreenshot"
        )
        .value =
        "";


    document
        .getElementById(
            "editAfterScreenshot"
        )
        .value =
        "";


    recalculateEditedPnL();


    showCurrentScreenshots(
        editingTrade
    );


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



/* =========================================
   SETUP NORMALIZER
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
   AUTOMATIC NET P&L
========================================= */

function recalculateEditedPnL() {

    if (
        !editingTrade
    ) {

        return;

    }


    const grossPnL =
        Number(
            document
                .getElementById(
                    "editGrossPnL"
                )
                .value ||
            0
        );


    const commission =
        Number(
            document
                .getElementById(
                    "editCommissionFee"
                )
                .value ||
            0
        );


    const swap =
        Number(
            document
                .getElementById(
                    "editSwapFee"
                )
                .value ||
            0
        );


    const netPnL =
        grossPnL
        -
        commission
        -
        swap;


    document
        .getElementById(
            "editProfitLoss"
        )
        .value =
        netPnL.toFixed(
            2
        );


    recalculateEditedRR(
        netPnL
    );

}



/* =========================================
   AUTOMATIC RR
========================================= */

function recalculateEditedRR(
    netPnL
) {

    const plannedRisk =
        Number(
            document
                .getElementById(
                    "editPlannedRisk"
                )
                .value ||
            0
        );


    const actualRR =
        plannedRisk >
        0
            ?
            netPnL /
            plannedRisk
            :
            0;


    document
        .getElementById(
            "editActualRR"
        )
        .value =
        actualRR.toFixed(
            2
        );

}



/* =========================================
   LIVE FEE RECALCULATION
========================================= */

document
    .getElementById(
        "editCommissionFee"
    )
    .addEventListener(
        "input",
        recalculateEditedPnL
    );


document
    .getElementById(
        "editSwapFee"
    )
    .addEventListener(
        "input",
        recalculateEditedPnL
    );



/* =========================================
   SCREENSHOT PREVIEW
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



async function showScreenshotPreview(
    elementId,
    path
) {

    const box =
        document.getElementById(
            elementId
        );


    if (
        !path
    ) {

        box.innerHTML =
            "No screenshot";


        return;

    }


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

        console.error(
            error
        );


        box.innerHTML =
            "Unable to load screenshot.";


        return;

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



/* =========================================
   CLOSE PANEL
========================================= */

function closeEditPanel() {

    editTradePanel.hidden =
        true;


    editingTrade =
        null;


    clearEditMessage();

}


document
    .getElementById(
        "closeEditTrade"
    )
    .addEventListener(
        "click",
        closeEditPanel
    );


document
    .getElementById(
        "cancelEditTrade"
    )
    .addEventListener(
        "click",
        closeEditPanel
    );



/* =========================================
   SCREENSHOT UPLOAD
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
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "Screenshot must be an image file."
        );

    }


    if (
        file.size >
        10 *
        1024 *
        1024
    ) {

        throw new Error(
            "Screenshot is too large. Maximum size is 10 MB."
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


    const path =
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
                path,
                file
            );


    if (
        error
    ) {

        throw new Error(
            "Screenshot upload failed: " +
            error.message
        );

    }


    return path;

}



/* =========================================
   SAVE EDIT
========================================= */

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
                .value;


        const symbol =
            document
                .getElementById(
                    "editSymbol"
                )
                .value
                .trim()
                .toUpperCase();


        const commission =
            Number(
                document
                    .getElementById(
                        "editCommissionFee"
                    )
                    .value ||
                0
            );


        const swap =
            Number(
                document
                    .getElementById(
                        "editSwapFee"
                    )
                    .value ||
                0
            );


        const grossPnL =
            Number(
                document
                    .getElementById(
                        "editGrossPnL"
                    )
                    .value ||
                0
            );


        const plannedRisk =
            Number(
                document
                    .getElementById(
                        "editPlannedRisk"
                    )
                    .value ||
                0
            );


        const netPnL =
            grossPnL
            -
            commission
            -
            swap;


        const actualRR =
            plannedRisk >
            0
                ?
                netPnL /
                plannedRisk
                :
                0;


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
            commission <
            0
        ) {

            showEditMessage(
                "Commission Fee cannot be negative.",
                "error"
            );


            return;

        }


        if (
            swap <
            0
        ) {

            showEditMessage(
                "Swap Fee cannot be negative.",
                "error"
            );


            return;

        }


        saveEditTrade.disabled =
            true;


        saveEditTrade.textContent =
            "Saving...";


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


            let beforePath =
                editingTrade.before_screenshot;


            let afterPath =
                editingTrade.after_screenshot;


            const newBefore =
                document
                    .getElementById(
                        "editBeforeScreenshot"
                    )
                    .files[0];


            const newAfter =
                document
                    .getElementById(
                        "editAfterScreenshot"
                    )
                    .files[0];


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


            let result =
                "BE";


            if (
                netPnL >
                0
            ) {

                result =
                    "Win";

            }


            if (
                netPnL <
                0
            ) {

                result =
                    "Loss";

            }


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
                        .value,


                session:
                    document
                        .getElementById(
                            "editSession"
                        )
                        .value,


                setup:
                    document
                        .getElementById(
                            "editSetup"
                        )
                        .value,


                rules_followed:
                    document
                        .getElementById(
                            "editRulesFollowed"
                        )
                        .value ===
                    "true",


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


                mistakes:
                    document
                        .getElementById(
                            "editMistakes"
                        )
                        .value
                        .trim(),


                notes:
                    document
                        .getElementById(
                            "editNotes"
                        )
                        .value
                        .trim(),


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


            showEditMessage(
                "Trade updated successfully.",
                "success"
            );


            saveEditTrade.textContent =
                "Saved ✓";


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

            saveEditTrade.disabled =
                false;


            saveEditTrade.textContent =
                "Save Changes";

        }

    }
);



/* =========================================
   DELETE
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

        console.error(
            error
        );


        showHistoryMessage(
            "Delete failed: " +
            error.message,
            "error"
        );


        return;

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
   START
========================================= */

loadTrades();