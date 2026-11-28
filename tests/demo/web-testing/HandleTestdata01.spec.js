import { test } from '@playwright/test';
import {getJsonData} from '../../utils/FileHelper'

let data;
test.beforeEach(async ({ }, testInfo) => {
    const path = testInfo.titlePath[0].split(".")[0].trim();//extracting path from test title ex: HandleTestdata01 from "HandleTestdata01-TC01-Valid User"
    const testid = testInfo.title.split("-")[0].trim();//extracting test id from test title ex: TC01 from "TC01-Valid User"
    data = await getJsonData(path, testid);//loading test data based on path and test id

});

test("TC01-Valid User", async () => {
    console.log(response[0]);
    //playwroght steps
});

test("TC02-Invalid User", async () => {
    for (let record of data) {
        console.log(record);
        //playwroght steps
    }
})


