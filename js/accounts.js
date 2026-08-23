const accountForm =
    document.getElementById(
        "accountForm"
    );


const accountId =
    document.getElementById(
        "accountId"
    );


const accountName =
    document.getElementById(
        "accountName"
    );


const startingBalance =
    document.getElementById(
        "startingBalance"
    );


const profitTarget =
    document.getElementById(
        "profitTarget"
    );


const dailyLossLimit =
    document.getElementById(
        "dailyLossLimit"
    );


const maxLossLimit =
    document.getElementById(
        "maxLossLimit"
    );


const consistencyLimit =
    document.getElementById(
        "consistencyLimit"
    );


const accountStatus =
    document.getElementById(
        "accountStatus"
    );


const leverageMetals =
    document.getElementById(
        "leverageMetals"
    );


const leverageForex =
    document.getElementById(
        "leverageForex"
    );


const leverageIndices =
    document.getElementById(
        "leverageIndices"
    );


const leverageCrypto =
    document.getElementById(
        "leverageCrypto"
    );


const accountsList =
    document.getElementById(
        "accountsList"
    );


const accountMessage =
    document.getElementById(
        "accountMessage"
    );


const accountFormTitle =
    document.getElementById(
        "accountFormTitle"
    );


const saveAccountButton =
    document.getElementById(
        "saveAccountButton"
    );


const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );


let accounts = [];


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    accountsList.innerHTML =
        "<p>Loading accounts...</p>";


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

        console.error(
            error
        );


        accountsList.innerHTML =
            "<p>Unable to load accounts.</p>";


        accountMessage.textContent =
            "ERROR: " +
            error.message;


        return;

    }


    accounts =
        data || [];


    renderAccounts();

}


/* =========================================
   RENDER ACCOUNTS
========================================= */

function renderAccounts() {

    accountsList.innerHTML =
        "";


    if (
        accounts.length ===
        0
    ) {

        accountsList.innerHTML =
            `
            <p style="color:#8b949e;">
                No trading accounts yet.
                Add your first account above.
            </p>
            `;


        return;

    }


    accounts.forEach(
        account => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "account-card";


            card.innerHTML =
                `

                <div class="account-card-top">

                    <div>

                        <h3>
                            ${escapeHtml(
                                account.name ||
                                "Trading Account"
                            )}
                        </h3>

                        <small>
                            Status:
                            ${escapeHtml(
                                account.status ||
                                "Active"
                            )}
                        </small>

                    </div>


                    <div>

                        <button
                            type="button"
                            class="small-button edit-account-button"
                            data-id="${account.id}"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="small-button danger-button delete-account-button"
                            data-id="${account.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>



                <div
                    class="account-leverage-grid"
                    style="margin-top:16px;"
                >

                    <div>

                        <span>
                            Initial Balance
                        </span>

                        <strong>
                            ${money(
                                account.starting_balance
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Profit Target
                        </span>

                        <strong>
                            ${percentage(
                                account.profit_target
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Daily Loss
                        </span>

                        <strong>
                            ${percentage(
                                account.daily_loss_limit
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Max Loss
                        </span>

                        <strong>
                            ${percentage(
                                account.max_loss_limit
                            )}
                        </strong>

                    </div>

                </div>



                <h4
                    style="
                        margin-top:18px;
                        margin-bottom:10px;
                    "
                >
                    Leverage
                </h4>


                <div class="account-leverage-grid">


                    <div>

                        <span>
                            Metals
                        </span>

                        <strong>
                            1:${numberOrDefault(
                                account.leverage_metals,
                                20
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Forex
                        </span>

                        <strong>
                            1:${numberOrDefault(
                                account.leverage_forex,
                                30
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Indices
                        </span>

                        <strong>
                            1:${numberOrDefault(
                                account.leverage_indices,
                                20
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Crypto
                        </span>

                        <strong>
                            1:${numberOrDefault(
                                account.leverage_crypto,
                                2
                            )}
                        </strong>

                    </div>


                </div>


                <div
                    style="
                        margin-top:14px;
                        color:#8b949e;
                        font-size:13px;
                    "
                >

                    Consistency:
                    ${percentage(
                        account.consistency_limit
                    )}

                </div>

            `;


            accountsList.appendChild(
                card
            );

        }
    );


    attachAccountButtons();

}


/* =========================================
   SAVE ACCOUNT
========================================= */

accountForm.addEventListener(
    "submit",
    async function(
        event
    ) {

        event.preventDefault();


        accountMessage.textContent =
            "Saving account...";


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


            const payload = {

                user_id:
                    user.id,


                name:
                    accountName
                        .value
                        .trim(),


                starting_balance:
                    Number(
                        startingBalance
                            .value
                    ),


                profit_target:
                    numberOrNull(
                        profitTarget
                            .value
                    ),


                daily_loss_limit:
                    numberOrNull(
                        dailyLossLimit
                            .value
                    ),


                max_loss_limit:
                    numberOrNull(
                        maxLossLimit
                            .value
                    ),


                consistency_limit:
                    numberOrNull(
                        consistencyLimit
                            .value
                    ),


                status:
                    accountStatus
                        .value,


                leverage_metals:
                    Number(
                        leverageMetals
                            .value
                    ),


                leverage_forex:
                    Number(
                        leverageForex
                            .value
                    ),


                leverage_indices:
                    Number(
                        leverageIndices
                            .value
                    ),


                leverage_crypto:
                    Number(
                        leverageCrypto
                            .value
                    )

            };


            /* =====================================
               BASIC VALIDATION
            ===================================== */

            if (
                !payload.name
            ) {

                throw new Error(
                    "Account name is required."
                );

            }


            if (
                payload.starting_balance <=
                0
            ) {

                throw new Error(
                    "Initial balance must be greater than zero."
                );

            }


            if (
                payload.leverage_metals <
                1 ||
                payload.leverage_forex <
                1 ||
                payload.leverage_indices <
                1 ||
                payload.leverage_crypto <
                1
            ) {

                throw new Error(
                    "Leverage must be at least 1."
                );

            }


            const editingId =
                Number(
                    accountId.value
                );


            /* =====================================
               EDIT ACCOUNT
            ===================================== */

            if (
                editingId
            ) {

                const {
                    error
                } =
                    await db
                        .from(
                            "accounts"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            editingId
                        );


                if (
                    error
                ) {

                    throw error;

                }


                accountMessage.textContent =
                    "Account updated successfully!";

            }


            /* =====================================
               CREATE ACCOUNT
            ===================================== */

            else {

                const {
                    error
                } =
                    await db
                        .from(
                            "accounts"
                        )
                        .insert(
                            [
                                payload
                            ]
                        );


                if (
                    error
                ) {

                    throw error;

                }


                accountMessage.textContent =
                    "Account added successfully!";

            }


            resetAccountForm();


            await loadAccounts();

        }


        catch (
            error
        ) {

            console.error(
                error
            );


            accountMessage.textContent =
                "ERROR: " +
                error.message;

        }

    }
);


/* =========================================
   ACCOUNT BUTTONS
========================================= */

function attachAccountButtons() {

    /* EDIT */

    document
        .querySelectorAll(
            ".edit-account-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const id =
                            Number(
                                button
                                    .dataset
                                    .id
                            );


                        editAccount(
                            id
                        );

                    }
                );

            }
        );


    /* DELETE */

    document
        .querySelectorAll(
            ".delete-account-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const id =
                            Number(
                                button
                                    .dataset
                                    .id
                            );


                        deleteAccount(
                            id
                        );

                    }
                );

            }
        );

}


/* =========================================
   EDIT ACCOUNT
========================================= */

function editAccount(
    id
) {

    const account =
        accounts.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
        );


    if (
        !account
    ) {

        return;

    }


    accountId.value =
        account.id;


    accountName.value =
        account.name ||
        "";


    startingBalance.value =
        account.starting_balance ??
        "";


    profitTarget.value =
        account.profit_target ??
        "";


    dailyLossLimit.value =
        account.daily_loss_limit ??
        "";


    maxLossLimit.value =
        account.max_loss_limit ??
        "";


    consistencyLimit.value =
        account.consistency_limit ??
        "";


    accountStatus.value =
        account.status ||
        "Active";


    leverageMetals.value =
        numberOrDefault(
            account.leverage_metals,
            20
        );


    leverageForex.value =
        numberOrDefault(
            account.leverage_forex,
            30
        );


    leverageIndices.value =
        numberOrDefault(
            account.leverage_indices,
            20
        );


    leverageCrypto.value =
        numberOrDefault(
            account.leverage_crypto,
            2
        );


    accountFormTitle.textContent =
        "Edit Trading Account";


    saveAccountButton.textContent =
        "Update Account";


    cancelEditButton.style.display =
        "inline-block";


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );

}


/* =========================================
   CANCEL EDIT
========================================= */

cancelEditButton.addEventListener(
    "click",
    function() {

        resetAccountForm();


        accountMessage.textContent =
            "";

    }
);


/* =========================================
   RESET FORM
========================================= */

function resetAccountForm() {

    accountForm.reset();


    accountId.value =
        "";


    accountFormTitle.textContent =
        "Add Trading Account";


    saveAccountButton.textContent =
        "Save Account";


    cancelEditButton.style.display =
        "none";


    /* DEFAULT LEVERAGE */

    leverageMetals.value =
        20;


    leverageForex.value =
        30;


    leverageIndices.value =
        20;


    leverageCrypto.value =
        2;


    accountStatus.value =
        "Active";

}


/* =========================================
   DELETE ACCOUNT + ALL ACCOUNT DATA
========================================= */

async function deleteAccount(id) {

    const account =
        accounts.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!account) {

        accountMessage.textContent =
            "ERROR: Account not found.";

        return;
    }


    const confirmed =
        confirm(
            'Delete account "' +
            account.name +
            '"?\n\n' +
            "WARNING:\n" +
            "This will permanently delete:\n" +
            "• The trading account\n" +
            "• All trades\n" +
            "• All trade entries\n" +
            "• All trade exits\n" +
            "• All trade screenshots\n\n" +
            "This cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    accountMessage.textContent =
        "Deleting account and all its data...";


    try {

        /* =====================================
           GET ALL TRADES FOR THIS ACCOUNT
        ===================================== */

        const {
            data: trades,
            error: tradesError
        } =
            await db
                .from("trades")
                .select(
                    `
                    id,
                    before_screenshot,
                    after_screenshot
                    `
                )
                .eq(
                    "account_id",
                    id
                );


        if (tradesError) {
            throw tradesError;
        }


        const accountTrades =
            trades || [];


        /* =====================================
           COLLECT SCREENSHOT PATHS
        ===================================== */

        const screenshotPaths = [];


        accountTrades.forEach(
            trade => {

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

            }
        );


        /* =====================================
           DELETE SCREENSHOTS FROM STORAGE
        ===================================== */

        if (
            screenshotPaths.length >
            0
        ) {

            const {
                error: storageError
            } =
                await db.storage
                    .from(
                        "trade-screenshots"
                    )
                    .remove(
                        screenshotPaths
                    );


            if (storageError) {

                console.error(
                    "Screenshot deletion error:",
                    storageError
                );

                throw new Error(
                    "Could not delete trade screenshots: " +
                    storageError.message
                );

            }

        }


        /* =====================================
           DELETE ACCOUNT

           IMPORTANT:

           Supabase ON DELETE CASCADE will
           automatically delete:

           accounts
                ↓
           trades
                ↓
           trade_entries
           trade_exits
        ===================================== */

        const {
            error: accountError
        } =
            await db
                .from(
                    "accounts"
                )
                .delete()
                .eq(
                    "id",
                    id
                );


        if (accountError) {
            throw accountError;
        }


        /* =====================================
           SUCCESS
        ===================================== */

        accountMessage.textContent =
            'Account "' +
            account.name +
            '" and all associated data were deleted.';


        await loadAccounts();

    }


    catch (error) {

        console.error(
            "Delete account error:",
            error
        );


        accountMessage.textContent =
            "ERROR: " +
            (
                error.message ||
                "Unable to delete account."
            );

    }

}

/* =========================================
   HELPERS
========================================= */

function numberOrNull(
    value
) {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {

        return null;

    }


    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ?
        number
        :
        null;

}


/* =========================================
   NUMBER DEFAULT
========================================= */

function numberOrDefault(
    value,
    fallback
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        ) ||
        number <=
        0
    ) {

        return fallback;

    }


    return number;

}


/* =========================================
   MONEY FORMAT
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
   PERCENT FORMAT
========================================= */

function percentage(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined ||
        value ===
        ""
    ) {

        return "-";

    }


    return (
        Number(
            value
        )
        .toFixed(
            2
        )
        .replace(
            /\.00$/,
            ""
        ) +
        "%"
    );

}


/* =========================================
   SAFE HTML
========================================= */

function escapeHtml(
    value
) {

    return String(
        value ||
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

loadAccounts();