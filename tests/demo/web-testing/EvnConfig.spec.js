import { test, expect, config, logger } from '../../../fixtures/test-fixtures';


test("How to handle env config", async({})=>{
    console.log(config.baseURL)
    logger.info('this is logger implementation')
})