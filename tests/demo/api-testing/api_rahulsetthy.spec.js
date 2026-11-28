import { test, expect, request } from '@playwright/test'

test('create place', async ({ request }) => {
    const response = await request.post('https://rahulshettyacademy.com/maps/api/place/add/json?key=qaclick123', {
        data: {
            "location": {
                "lat": -38.383494,
                "lng": 33.427362
            },
            "accuracy": 50,
            "name": "Frontline house",
            "phone_number": "(+91) 983 893 3937",
            "address": "29, side layout, cohen 09",
            "types": [
                "shoe park",
                "shop"
            ],
            "website": "http://google.com",
            "language": "French-IN"
        }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const place_id = data.place_id;
    console.log(place_id)
});



test("get place", async ({ request }) => {
    const response = await request.get('http://rahulshettyacademy.com/maps/api/place/get/json?place_id=6c65160b32e68f899e1d7bf9b97343a0&key=qaclick123');
    expect(response.status()).toBe(200);
    const data = await response.json();
    console.log(data)
    expect(data.location.longitude).toEqual('33.427362')

})
