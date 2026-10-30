/* Payment methods for the Payment section.
   Real card numbers and links are NOT written here: they come from env variables at build time.
     local:  copy .env.example to .env.local and fill it in (git-ignored)
     GitHub: Settings -> Secrets and variables -> Actions -> Variables, same names (see deploy.yml)
   An empty value, or one still holding the X placeholder, shows "I'll send the details on Telegram"
   instead of a number, so the site never shows a fake card.
   Note: whatever you fill in is printed on the public page (that is the point), so use receiving
   details only: card number, holder name, payment links. Never a PIN, CVV, SMS code or login. */
const env = import.meta.env;
const read = (key) => String(env[key] ?? "").trim();
/** true when the value is real, not empty and not the XXXX placeholder from .env.example */
export const filled = (v) => !!v && !/x{3,}|your[_-]|placeholder/i.test(v);

export const payConfig = {
  holder: read("VITE_PAY_HOLDER"),               // name on the cards, e.g. AKBAR K.
  amount: read("VITE_PAY_AMOUNT"),               // optional default amount; a link with ?amount=…&cur=… overrides it
  currency: read("VITE_PAY_CURRENCY") || "UZS",
};

/*
  id       radio value, also used in the Telegram message
  group    "uz" | "abroad"
  kind     "link" (payment page) | "card" (card-to-card transfer)
  card     card number (env), shown with a copy button
  link     payment page (env), shown as a button
  currency what the amount field switches to when this method is picked
*/
export const methods = [
  {
    id: "click", group: "uz", kind: "link", currency: "UZS",
    name: { ru: "Click", en: "Click" },
    link: read("VITE_PAY_CLICK_URL"),
    steps: {
      ru: ["Нажмите «Оплатить» — откроется Click.", "Проверьте сумму и подтвердите оплату в приложении.", "Сделайте скриншот чека или скопируйте ID платежа."],
      en: ["Tap “Pay”: Click opens.", "Check the amount and confirm the payment in the app.", "Take a screenshot of the receipt or copy the payment ID."],
    },
    note: { ru: "Оплата проходит внутри Click: данные вашей карты этот сайт не видит.", en: "The payment happens inside Click: this site never sees your card details." },
  },
  {
    id: "payme", group: "uz", kind: "link", currency: "UZS",
    name: { ru: "Payme", en: "Payme" },
    link: read("VITE_PAY_PAYME_URL"),
    steps: {
      ru: ["Нажмите «Оплатить» — откроется Payme.", "Введите сумму, если она не подставилась, и подтвердите.", "Сохраните чек: скриншот или номер транзакции."],
      en: ["Tap “Pay”: Payme opens.", "Enter the amount if it isn't filled in, then confirm.", "Keep the receipt: a screenshot or the transaction number."],
    },
    note: { ru: "Подходит любая карта Uzcard или Humo, привязанная к Payme.", en: "Any Uzcard or Humo card linked to Payme works." },
  },
  {
    id: "uzum", group: "uz", kind: "link", currency: "UZS",
    name: { ru: "Uzum", en: "Uzum" },
    link: read("VITE_PAY_UZUM_URL"),
    steps: {
      ru: ["Нажмите «Оплатить» — откроется Uzum Bank.", "Подтвердите сумму.", "Сделайте скриншот успешной оплаты."],
      en: ["Tap “Pay”: Uzum Bank opens.", "Confirm the amount.", "Take a screenshot of the successful payment."],
    },
    note: { ru: "Если ссылка не открывается, переведите на карту Uzcard или Humo.", en: "If the link doesn't open, transfer to the Uzcard or Humo card instead." },
  },
  {
    id: "uzcard", group: "uz", kind: "card", currency: "UZS",
    name: { ru: "Uzcard", en: "Uzcard" },
    card: read("VITE_PAY_UZCARD"),
    steps: {
      ru: ["Откройте приложение банка, Click или Payme → «Перевод на карту».", "Вставьте номер карты ниже и проверьте имя получателя.", "Укажите сумму и сохраните чек."],
      en: ["Open your bank app, Click or Payme → “Transfer to card”.", "Paste the card number below and check the recipient's name.", "Enter the amount and keep the receipt."],
    },
    note: { ru: "Перевод с карты на карту внутри Узбекистана обычно приходит сразу.", en: "Card-to-card transfers inside Uzbekistan usually arrive instantly." },
  },
  {
    id: "humo", group: "uz", kind: "card", currency: "UZS",
    name: { ru: "Humo", en: "Humo" },
    card: read("VITE_PAY_HUMO"),
    steps: {
      ru: ["Откройте приложение банка, Click или Payme → «Перевод на карту».", "Вставьте номер карты Humo ниже и проверьте имя получателя.", "Укажите сумму и сохраните чек."],
      en: ["Open your bank app, Click or Payme → “Transfer to card”.", "Paste the Humo card number below and check the recipient's name.", "Enter the amount and keep the receipt."],
    },
    note: { ru: "Перевод с карты на карту внутри Узбекистана обычно приходит сразу.", en: "Card-to-card transfers inside Uzbekistan usually arrive instantly." },
  },
  {
    id: "ru", group: "abroad", kind: "card", currency: "RUB",
    name: { ru: "Россия", en: "Russia" },
    card: read("VITE_PAY_ABROAD_CARD") || read("VITE_PAY_HUMO") || read("VITE_PAY_UZCARD"),
    link: read("VITE_PAY_RU_URL"),
    steps: {
      ru: ["В приложении своего банка выберите перевод за рубеж → Узбекистан → по номеру карты.", "Вставьте номер карты ниже. Сумму можно указать в рублях: банк покажет, сколько придёт в сумах.", "Сохраните чек или контрольный номер перевода."],
      en: ["In your bank app choose an international transfer → Uzbekistan → by card number.", "Paste the card number below. You can enter the amount in roubles: the bank shows how much arrives in sum.", "Keep the receipt or the transfer control number."],
    },
    note: {
      ru: "Карты «Мир» и российские Visa/Mastercard не платят напрямую на узбекских сайтах — поэтому только перевод по номеру карты. Подходят приложения банков, где есть переводы в Узбекистан, и сервисы денежных переводов. Курс и комиссию банк показывает до подтверждения.",
      en: "Mir cards and Russian-issued Visa/Mastercard can't pay on Uzbek sites directly, so use a transfer by card number. Bank apps with transfers to Uzbekistan and money-transfer services work. Your bank shows the rate and fee before you confirm.",
    },
  },
  {
    id: "kz", group: "abroad", kind: "card", currency: "KZT",
    name: { ru: "Казахстан", en: "Kazakhstan" },
    card: read("VITE_PAY_ABROAD_CARD") || read("VITE_PAY_HUMO") || read("VITE_PAY_UZCARD"),
    link: read("VITE_PAY_KZ_URL"),
    steps: {
      ru: ["В приложении своего банка откройте переводы за рубеж → Узбекистан → по номеру карты.", "Вставьте номер карты ниже и укажите сумму.", "Сохраните чек перевода."],
      en: ["In your bank app open international transfers → Uzbekistan → by card number.", "Paste the card number below and enter the amount.", "Keep the transfer receipt."],
    },
    note: {
      ru: "Переводы на карты Узбекистана есть в приложениях многих банков Казахстана. Если ваш банк так не умеет, напишите — предложу другой способ.",
      en: "Many Kazakh bank apps can send to Uzbek cards. If yours can't, message me and I'll suggest another way.",
    },
  },
  {
    id: "intl", group: "abroad", kind: "card", currency: "USD",
    name: { ru: "Visa / Mastercard", en: "Visa / Mastercard" },
    card: read("VITE_PAY_VISA"),
    link: read("VITE_PAY_INTL_URL"),
    steps: {
      ru: ["Оплатите по ссылке картой Visa или Mastercard любой страны,", "или переведите на карту ниже через перевод «с карты на карту» в приложении своего банка.", "Сохраните чек или ID транзакции."],
      en: ["Pay by link with a Visa or Mastercard from any country,", "or send a card-to-card transfer to the card below from your bank app.", "Keep the receipt or the transaction ID."],
    },
    note: {
      ru: "Деньги зачисляются на счёт в узбекском банке. Банк-отправитель может взять комиссию за конвертацию. Для крупных сумм пришлю реквизиты для SWIFT в Telegram.",
      en: "The money lands in an account at an Uzbek bank. Your bank may charge a conversion fee. For large amounts I'll send SWIFT details on Telegram.",
    },
  },
];
