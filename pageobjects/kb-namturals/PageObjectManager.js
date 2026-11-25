import { HomePage } from '../kb-namturals/HomePage';


class PageObjectManager {

    constructor(page) {
        this.page = page;
        this.HomePage = new HomePage(page);
        
    }

    getHomePage() {
        return this.HomePage;
    }
    
}

export { PageObjectManager };