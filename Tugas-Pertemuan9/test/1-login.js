const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("node:assert/strict");

const BASE_URL = "https://belajar-bareng.onrender.com/";
const PAUSE_MS = 3000;

const USERNAME_INPUT = By.css('[data-testid="username-input"]');
const PASSWORD_INPUT = By.css('[data-testid="password-input"]');
const LOGIN_BUTTON = By.css('[data-testid="login-button"]');

function createDriver() {
  const options = new chrome.Options();
  options.setPageLoadStrategy("eager");
  options.excludeSwitches("enable-logging");
  options.addArguments("--log-level=3");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

describe("Tugas Pertemuan 9 - Login", function () {
  this.timeout(60000);
  let driver;

  beforeEach(async function () {
    driver = await createDriver();
    await driver.get(BASE_URL);
  });

  afterEach(async function () {
    await driver.sleep(PAUSE_MS);
    await driver.quit();
  });

  it("Login - data valid", async function () {
    await driver.findElement(USERNAME_INPUT).sendKeys("admin");
    await driver.findElement(PASSWORD_INPUT).sendKeys("admin");
    await driver.findElement(LOGIN_BUTTON).click();

    await driver.wait(until.urlContains("/users"), 60000);
    const currentUrl = await driver.getCurrentUrl();

    // Assert 1: URL pindah ke halaman users
    assert.ok(currentUrl.includes("/users"), `URL harus berisi /users, diterima ${currentUrl}`);

    const heading = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'List Users')]")),
      20000
    );

    // Assert 2: Judul List Users tampil
    assert.equal(await heading.isDisplayed(), true, "Judul List Users harus tampil");
  });

  it("Login - password salah", async function () {
    await driver.findElement(USERNAME_INPUT).sendKeys("admin");
    await driver.findElement(PASSWORD_INPUT).sendKeys("salah123");
    await driver.findElement(LOGIN_BUTTON).click();

    const errorMessage = await driver.findElement(By.css("p.error"));
    await driver.wait(async () => (await errorMessage.getText()).length > 0, 10000);
    const currentUrl = await driver.getCurrentUrl();

    // Assert 1: Tetap di halaman login
    assert.ok(!currentUrl.includes("/users"), "User tidak boleh masuk ke /users");

    // Assert 2: Pesan error tampil
    assert.ok((await errorMessage.getText()).length > 0, "Pesan error harus muncul");
  });
});