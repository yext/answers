import UniversalPage from './pageobjects/universalpage';
import VerticalPage from './pageobjects/verticalpage';
import { setupServer, shutdownServer } from './server';
import FacetsPage from './pageobjects/facetspage';
import { Selector } from 'testcafe';

/**
 * This file contains acceptance tests for a universal search page.
 * Note that before any tests are run, a local HTTP server is spun
 * up to serve the search page and the dist directory of Answers.
 * This server is closed once all tests have completed.
 */
fixture`Universal search page works as expected`
  .before(setupServer)
  .after(shutdownServer)
  .page`http://localhost:9999/tests/acceptance/fixtures/html/universal`;

test('Basic universal flow', async t => {
  const searchComponent = UniversalPage.getSearchComponent();

  await searchComponent.enterQuery('Tom');
  await searchComponent.clearQuery();

  await searchComponent.enterQuery('ama');
  await searchComponent.getAutoComplete().selectOption('amani farooque phone number');

  const sections =
        await UniversalPage.getUniversalResultsComponent().getSections();
  await t.expect(sections.length).eql(2);

  const faqsSectionTitle = await sections[1].getTitle();
  await t.expect(faqsSectionTitle).contains('FAQ');
});

fixture`Vertical search page works as expected`
  .before(setupServer)
  .after(shutdownServer)
  .page`http://localhost:9999/tests/acceptance/fixtures/html/vertical`;

test('pagination flow', async t => {
  const searchComponent = VerticalPage.getSearchComponent();
  await searchComponent.enterQuery('Virginia');
  await searchComponent.submitQuery();
  const paginationComponent = VerticalPage.getPaginationComponent();
  await paginationComponent.clickNextButton();
  const pageNum = await paginationComponent.getActivePageLabelAndNumber();
  await t.expect(pageNum).eql('Page 2');
});

fixture`Facets page`
  .before(setupServer)
  .after(shutdownServer)
  .page`http://localhost:9999/tests/acceptance/fixtures/html/facets`;

test(`Facets load on the page, and can affect the search`, async t => {
  const searchComponent = FacetsPage.getSearchComponent();
  await searchComponent.submitQuery();

  const facets = FacetsPage.getFacetsComponent();
  const filterBox = facets.getFilterBox();

  // Record the amount of results with no facets
  const verticalResultsComponent = FacetsPage.getVerticalResultsComponent();
  const initialResultsCount = await verticalResultsComponent.getResultsCountTotal();

  // Select the first option in the first FilterOptions
  const employeeDepartment = await filterBox.getFilterOptions('Employee Department');
  await employeeDepartment.toggleOption('Client Delivery');
  let expectedResultsCount = await employeeDepartment.getOptionCount('Client Delivery');

  await filterBox.applyFilters();

  // Get the actual number of results and check that it equals the expected amount
  let actualResultsCount = await verticalResultsComponent.getResultsCountTotal();
  await t.expect(actualResultsCount).eql(expectedResultsCount);

  // Reset the filters, and check that the number of results
  // is the same as the initial amount
  await filterBox.reset();
  await filterBox.applyFilters();
  actualResultsCount = await verticalResultsComponent.getResultsCountTotal();
  await t.expect(actualResultsCount).eql(initialResultsCount);

  // Select the first option and second option in the first FilterOptions
  await employeeDepartment.toggleOption('Client Delivery');
  await employeeDepartment.toggleOption('Technology');
  const clientDeliveryCount = await employeeDepartment.getOptionCount('Client Delivery');
  const technologyCount = await employeeDepartment.getOptionCount('Technology');
  expectedResultsCount = clientDeliveryCount + technologyCount;
  await filterBox.applyFilters();
  actualResultsCount = await verticalResultsComponent.getResultsCountTotal();
  await t.expect(actualResultsCount).eql(expectedResultsCount);

  // Check that selecting multiple FilterOptions works
  const brands = await filterBox.getFilterOptions('Brands');
  await brands.toggleOption('E');
  expectedResultsCount = await brands.getOptionCount('E');
  await filterBox.applyFilters();
  actualResultsCount = await verticalResultsComponent.getResultsCountTotal();
  await t.expect(actualResultsCount).eql(expectedResultsCount);

  // Reset the filters, and check that the number of results
  // is the same as the initial amount
  await filterBox.reset();
  await filterBox.applyFilters();
  actualResultsCount = await verticalResultsComponent.getResultsCountTotal();
  await t.expect(actualResultsCount).eql(initialResultsCount);
});

fixture`Experience links work as expected`
  .before(setupServer)
  .after(shutdownServer)
  .page`http://localhost:9999/tests/acceptance/fixtures/html/facets`;

test('Facets, pagination, and filters do not persist accross experience links', async t => {
  const verifyCleanLink = async (link) => {
    await t.expect(universalUrl).notContains('Facets');
    await t.expect(universalUrl).notContains('filter');
    await t.expect(universalUrl).notContains('search-offset');
  };

  // When you land, nav links should not have the Facets/filter/pagination parameters
  let universalUrl = await Selector('.js-yxt-navItem').nth(0).getAttribute('href');
  await t.expect(universalUrl).contains('universal');
  await t.expect(universalUrl).contains('referrerPageUrl');
  await verifyCleanLink(universalUrl);

  // When you search, nav links should not have the Facets/filter/pagination parameters
  const searchComponent = FacetsPage.getSearchComponent();
  await searchComponent.submitQuery();

  const facets = FacetsPage.getFacetsComponent();
  const filterBox = facets.getFilterBox();
  const employeeDepartment = await filterBox.getFilterOptions('Employee Department');
  await employeeDepartment.toggleOption('Client Delivery');
  await filterBox.applyFilters();

  universalUrl = await Selector('.js-yxt-navItem').nth(0).getAttribute('href');
  await t.expect(universalUrl).contains('referrerPageUrl');
  await verifyCleanLink(universalUrl);

  // When you navigate with pagination, nav links should not have the
  // Facets/filter/pagination parameters
  await searchComponent.enterQuery('all');
  await searchComponent.submitQuery();

  await t.click(await Selector('.js-yxt-navItem').nth(2)); // Go to vertical page
  await t.click(await Selector('.js-yxt-Pagination-next').nth(0)); // Page forward
  universalUrl = await Selector('.js-yxt-navItem').nth(0).getAttribute('href');
  await t.expect(universalUrl).contains('referrerPageUrl');
  await verifyCleanLink(universalUrl);

  // View All links AND Change Filters links should not have
  // Facets/filter/pagination parameters (though those components are not
  // allowed on universal currently)
  await t.click(await Selector('.js-yxt-navItem').nth(0)); // Go to universal page
  await searchComponent.clearQuery();
  await searchComponent.enterQuery('virginia');
  await searchComponent.submitQuery();

  const changeFiltersLink = await Selector('.yxt-ResultsHeader-changeFilters')
    .nth(0).getAttribute('href');
  await t.expect(changeFiltersLink).contains('referrerPageUrl');
  await verifyCleanLink(changeFiltersLink);

  const viewAllLink = await Selector('.yxt-ResultsHeader-changeFilters')
    .nth(0).getAttribute('href');
  await t.expect(viewAllLink).contains('referrerPageUrl');
  await verifyCleanLink(viewAllLink);
});
