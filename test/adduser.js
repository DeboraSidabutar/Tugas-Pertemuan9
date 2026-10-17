const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("node:assert/strict");

const BASE_URL = "https://belajar-bareng.onrender.com/";
const PAUSE_MS = 3000;

const USERNAME_INPUT = By.css('[data-testid="username-input"]');
const PASSWORD_INPUT = By.css('[data-testid="password-input"]');
const LOGIN_BUTTON = By.css('[data-testid="login-button"]');
const AGE_INPUT = By.css('[data-testid="age-input"]');
const LIST_TITLE = By.xpath("//*[contains(text(),'List Users')]");

function randomLetters(n) {
  const abc = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < n; i++) {
    result += abc[Math.floor(Math.random() * abc.length)];
  }
  return result;
}

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

async function login(driver) {
  await driver.get(BASE_URL);
  await driver.findElement(USERNAME_INPUT).sendKeys("admin");
  await driver.findElement(PASSWORD_INPUT).sendKeys("admin");
  await driver.findElement(LOGIN_BUTTON).click();
  await driver.wait(until.urlContains("/users"), 60000);
}

async function backToList(driver) {
  const url = await driver.getCurrentUrl();
  if (!url.includes("/users")) {
    try {
      await driver.findElement(By.xpath("//button[contains(.,'List')]")).click();
    } catch (e) {
      await driver.navigate().back();
    }
  }
  await driver.wait(until.urlContains("/users"), 20000);
  await driver.wait(until.elementLocated(LIST_TITLE), 20000);
}

async function addUser(driver, username, age) {
  await driver.findElement(By.xpath("//button[contains(.,'Add')]")).click();
  await driver.wait(until.urlContains("/add"), 10000);
  await driver.wait(until.elementLocated(USERNAME_INPUT), 10000);

  const usernameField = await driver.findElement(USERNAME_INPUT);
  await usernameField.sendKeys(username);
  await driver.findElement(AGE_INPUT).sendKeys(String(age));
  const typed = await usernameField.getAttribute("value");

  await driver.findElement(By.css("button[type='submit']")).click();
  await driver.sleep(1500);
  return typed;
}

async function findUserCard(driver, name, timeoutMs) {
  const end = Date.now() + timeoutMs;
  const pattern = new RegExp(name + "\\s+Age:\\s*\\d+");
  while (Date.now() < end) {
    const text = await driver.executeScript("return document.body.innerText;");
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ");
    await driver.sleep(500);
  }
  return null;
}

describe("Tugas Pertemuan 9 - Add User", function () {
  this.timeout(90000);
  let driver;

  beforeEach(async function () {
    driver = await createDriver();
    await login(driver);
  });

  afterEach(async function () {
    await driver.sleep(PAUSE_MS);
    await driver.quit();
  });

  it("Add User - data valid, user baru ada di list", async function () {
    const username = `Deb${randomLetters(7)}`;

    const savedName = await addUser(driver, username, 34);
    await backToList(driver);

    let card = await findUserCard(driver, savedName, 8000);
    if (!card) {
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(LIST_TITLE), 20000);
      card = await findUserCard(driver, savedName, 12000);
    }

    const nameElements = await driver.findElements(
      By.xpath(`//*[normalize-space(text())='${savedName}']`)
    );
    if (nameElements.length > 0) {
      await driver.executeScript(
        "arguments[0].scrollIntoView({block: 'center'});",
        nameElements[0]
      );
    }

    // Assert 1: User baru ada di list
    assert.ok(card !== null, `User "${savedName}" harus ada di list`);

    // Assert 2: Umur yang tersimpan benar
    assert.ok(card.includes("Age: 34"), `Kartu harus berisi Age: 34, diterima: "${card}"`);
  });

  it("Add User - data kosong tidak ditambahkan", async function () {
    const before = await driver.findElements(By.xpath("//*[contains(text(),'ID:')]"));

    await addUser(driver, "", "");
    const urlAfterSubmit = await driver.getCurrentUrl();

    // Assert 1: Form kosong ditolak, halaman tetap di /add
    assert.ok(urlAfterSubmit.includes("/add"), `Harus tetap di /add, diterima ${urlAfterSubmit}`);

    await backToList(driver);
    const after = await driver.findElements(By.xpath("//*[contains(text(),'ID:')]"));

    // Assert 2: Jumlah user di list tidak bertambah
    assert.equal(after.length, before.length, "User kosong tidak boleh ditambahkan");
  });
});