import { test, expect, request } from '@playwright/test';


const api_context = await request.newContext({
    baseURL: "https://api.github.com",
    extraHTTPHeaders: {
        'Authorization': '',
        'Content-Type': 'application/vnd.github+json'
    }
})

test.beforeAll(async () => {
    global.testdata = {};
    global.apiContext = await request.newContext({
        baseURL: "https://api.github.com",

    })
})

test.afterAll(async () => {
    global.apiContext.dispose();
})

test.only('get repos', async ({ request }) => {
    // const response  = await global.apiContext.get('/users/qa-academy-ajay/repos');
    const response = await request.get('https://api.github.com/users/qa-academy-ajay/repos');
    await expect(response.status()).toEqual(200);
    const resJson = await response.json();
    console.log(resJson);
    console.log(await resJson[0].owner.login)
})

test.only("create issue", async ({ request }) => {
    const response = await request.post('https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues', {
        headers: {
            'Authorization': 'Bearer ',
            'Accept': 'application/vnd.github+json'
        },
        data:
        {
            "title": "issue created from playwright",
            "body": "I am having a problem with thiscreating issue through api. this is demo issue created",
            "assignees": [
                "qa-academy-ajay"
            ],
            "labels": [
                "bug",
                "CreatedByApiplaywright test class"
            ]
        }
    })
    await expect(response.status()).toEqual(201);

    // const response = await api_context.post('/repos/qa-academy-ajay/playwright-demo-1/issues', {
    //     data:
    //     {
    //         "title": "issue created from playwright",
    //         "body": "I am having a problem with thiscreating issue through api.",
    //         "assignees": [
    //             "qa-academy-ajay"
    //         ],
    //         "labels": [
    //             "bug",
    //             "CreateByApiplaywright"
    //         ]
    //     }
    // });
    // expect(response.status()).toBe(201);
    // const json = await response.json();
    // //print and store issue number, i can use this issue number in next test case to update the issue and get the issue details

    // global.testdata.issueNumber = await json.number;// ?

    // console.log("Issue Number:", global.testdata.issueNumber);
    // //validate title
    // expect(json.title).toBe("issue created from playwright");
    // //validate body    
    // expect(json.body).toBe("I am having a problem with thiscreating issue through api.");
    // //validate assignee
    // expect(json.assignees[0].login).toBe("qa-academy-ajay");
    // //validate labels
    // expect(json.labels[0].name).toBe("bug");
    // expect(json.labels[1].name).toBe("CreateByApiplaywright");
    // //print complete response
    // console.log(json)
})

test("update issue", async ({ request }) => {
    const response = await request.patch('https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues/24', {
        headers: {
            'Authorization': 'Bearer ',
            'Accept': 'application/vnd.github+json'
        },
        data: {
            "title": "Found a bug",
            "body": "I' am having a problem with this.",
            "assignees": [
                "qa-academy-ajay"
            ],
            "state": "close",
            "labels": [
                "bug"
            ]
        }
    })
    await expect(response.statusText()).toContain("OK");

})


test.only("get issues", async ({ request }) => {
    const response = await request.get('https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues');
    expect(response.status()).toBe(200);
    console.log(await response.json())
})

test.only("get issue", async ({ request }) => {
    const response = await request.get(`https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues/${global.testdata.issueNumber}`);
    expect(response.status()).toBe(200);
    console.log(await response.body())
})

test("create comment", async ({ request }) => {
    const response = await request.post('https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues/9/comments', {
        headers: {
            'Authorization': 'Bearer ',
            'Content-Type': 'application/vnd.github+json'
        },
        data: {
            "body": "this comment provided through api"
        }
    })

    expect(response.status()).toBe(201);
})

test("update comments", async ({ request }) => {
    await request.patch('https://api.github.com/repos/qa-academy-ajay/playwright-demo-1/issues/comments/{{comment_id}}', {
        headers: {
            'Authorization': 'Bearer ',
            'Content-Type': 'application/vnd.github+json'
        },
        data: {
            "body": "this comment provided through api and updated 2nd time"
        }
    });
})

test("get comments", async ({ request }) => {
    await request.get('');
})