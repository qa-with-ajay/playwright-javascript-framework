import { test } from '@playwright/test';
import {getJsonData} from '../../utils/FileHelper'


test.only("TC02-how to handle test data for data driven test", { tag: [ "@Smoke"] }, async ({ page }) => {
    const testid = test.info().title.split("-")[0].trim();
    const records = getJsonData[testid];
    for (const record of records) {
        console.log(record.firstname);
        //playwroght steps
    }

})

test("TC03-how to handle test data for indivisual test", { tag: "@TC03" }, async ({ page }) => {
    const testid = test.info().title.split("-")[0].trim();
    console.log(testdata[testid].firstname);
    console.log(testdata[testid].lastname);
    // console.log(testdata[test.info().tags])
    //step 

})


