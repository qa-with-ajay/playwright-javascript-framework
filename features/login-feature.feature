Feature: Google Search

  @smoke
  Scenario: Search for Playwright
    Given the user is on the Google homepage
    When the user enters "Playwright" in the search field
    Then results related to "Playwright" should be displayed
