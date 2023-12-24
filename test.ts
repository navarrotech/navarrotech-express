// Copyright © 2023 Navarrotech

import express from './index'
const app = express({
    store: "memory",
    storeSettings: {},
});

app.listen(64123, () => console.log("Test successful and running."))