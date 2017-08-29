import { CanvasPage } from './app.po';

describe('canvas App', () => {
  let page: CanvasPage;

  beforeEach(() => {
    page = new CanvasPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
