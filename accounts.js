const accountForm =
    document.getElementById(
        "accountForm"
    );


const accountMessage =
    document.getElementById(
        "accountMessage"
    );


const accountsList =
    document.getElementById(
        "accountsList"
    );



/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccountList() {

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
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(error);

        accountsList.innerHTML =
            "ERROR: " +
            error.message;

        return;

    }


    document
        .getElementById(
            "accountCount"
        )
        .textContent =
        `${data.length} account${data.length === 1 ? "" : "s"}`;


    if (
        data.length === 0
    ) {

        accountsList.innerHTML =
            '<p class="empty">No accounts yet.</p>';

        return;

    }


    accountsList.innerHTML =
        data
            .map(
                account =>
                    createAccountCard(
                        account
                    )
            )
            .join("");

}



/* =========================================
   ACCOUNT CARD
========================================= */

function createAccountCard(
    account
) {

    const startingBalance =
        Number(
            account.starting_balance ||
            0
        );


    return `

        <div class="account-card">

            <div class="account-card-top">

                <div>

                    <h3>
                        ${escapeHtml(
                            account.name
                        )}
                    </h3>

                    <span>

                        ${escapeHtml(
                            account.firm ||
                            "Personal"
                        )}

                        •

                        ${escapeHtml(
                            account.account_type ||
                            "Personal"
                        )}

                    </span>

                </div>


                <span class="account-status">

                    ${escapeHtml(
                        account.status ||
                        "Active"
                    )}

                </span>

            </div>


            <div class="account-balance">

                <small>
                    Starting Balance
                </small>

                <strong>
                    ${money(
                        startingBalance
                    )}
                </strong>

            </div>


            <div class="account-rules">

                <div>

                    <small>
                        Profit Target
                    </small>

                    <strong>

                        ${Number(
                            account.profit_target ||
                            0
                        ).toFixed(2)}%

                    </strong>

                </div>


                <div>

                    <small>
                        Daily Loss
                    </small>

                    <strong>

                        ${Number(
                            account.daily_loss_limit ||
                            0
                        ).toFixed(2)}%

                    </strong>

                </div>


                <div>

                    <small>
                        Max Loss
                    </small>

                    <strong>

                        ${Number(
                            account.max_loss_limit ||
                            0
                        ).toFixed(2)}%

                    </strong>

                </div>


                <div>

                    <small>
                        Consistency
                    </small>

                    <strong>

                        ${Number(
                            account.consistency_rule ||
                            0
                        ).toFixed(2)}%

                    </strong>

                </div>

            </div>


            <div class="account-actions">

                <button
                    type="button"
                    class="small-button"
                    onclick="viewAccount(${account.id})"
                >
                    View
                </button>


                <button
                    type="button"
                    class="small-button danger-button"
                    onclick="deleteAccount(${account.id})"
                >
                    Delete
                </button>

            </div>

        </div>

    `;

}



/* =========================================
   ADD ACCOUNT
========================================= */

accountForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        accountMessage.textContent =
            "Checking login...";


        /* ---------------------------------
           GET CURRENT USER
        --------------------------------- */

        const {
            data: {
                user
            },
            error: userError
        } =
            await db.auth
                .getUser();


        if (
            userError ||
            !user
        ) {

            console.error(
                userError
            );


            accountMessage.textContent =
                "You are not logged in.";

            return;

        }



        accountMessage.textContent =
            "Creating account...";



        /* ---------------------------------
           ACCOUNT OBJECT
        --------------------------------- */

        const account = {

            user_id:
                user.id,


            name:
                document
                    .getElementById(
                        "accountName"
                    )
                    .value
                    .trim(),


            firm:
                document
                    .getElementById(
                        "firm"
                    )
                    .value
                    .trim(),


            account_type:
                document
                    .getElementById(
                        "accountType"
                    )
                    .value,


            starting_balance:
                Number(
                    document
                        .getElementById(
                            "startingBalance"
                        )
                        .value
                ),


            profit_target:
                Number(
                    document
                        .getElementById(
                            "profitTarget"
                        )
                        .value || 0
                ),


            daily_loss_limit:
                Number(
                    document
                        .getElementById(
                            "dailyLossLimit"
                        )
                        .value || 0
                ),


            max_loss_limit:
                Number(
                    document
                        .getElementById(
                            "maxLossLimit"
                        )
                        .value || 0
                ),


            consistency_rule:
                Number(
                    document
                        .getElementById(
                            "consistencyRule"
                        )
                        .value || 0
                ),


            status:
                document
                    .getElementById(
                        "accountStatus"
                    )
                    .value

        };



        /* ---------------------------------
           SAVE ACCOUNT
        --------------------------------- */

        const { error } =
            await db
                .from("accounts")
                .insert([
                    account
                ]);


        if (error) {

            console.error(error);

            accountMessage.textContent =
                "ERROR: " +
                error.message;

            return;

        }


        accountMessage.textContent =
            "Account created successfully!";


        accountForm.reset();


        document
            .getElementById(
                "profitTarget"
            )
            .value =
            10;


        document
            .getElementById(
                "dailyLossLimit"
            )
            .value =
            5;


        document
            .getElementById(
                "maxLossLimit"
            )
            .value =
            10;


        document
            .getElementById(
                "consistencyRule"
            )
            .value =
            0;


        loadAccountList();

    }
);



/* =========================================
   DELETE ACCOUNT
========================================= */

async function deleteAccount(
    id
) {

    const confirmed =
        confirm(
            "Delete this account?\n\n" +
            "Only delete an account if it has no trades."
        );


    if (!confirmed) {

        return;

    }


    const {
        data: trades,
        error: tradeError
    } =
        await db
            .from("trades")
            .select("id")
            .eq(
                "account_id",
                id
            )
            .limit(1);


    if (tradeError) {

        alert(
            tradeError.message
        );

        return;

    }


    if (
        trades &&
        trades.length > 0
    ) {

        alert(
            "This account contains trades and cannot be deleted."
        );

        return;

    }


    const { error } =
        await db
            .from("accounts")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "Delete failed: " +
            error.message
        );

        return;

    }


    loadAccountList();

}



/* =========================================
   VIEW ACCOUNT
========================================= */

function viewAccount(
    id
) {

    window.location.href =
        "index.html?account=" +
        id;

}



/* =========================================
   HELPERS
========================================= */

function money(
    value
) {

    return "$" +
        Number(value)
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



function escapeHtml(
    value
) {

    return String(value)
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
   START
========================================= */

loadAccountList();