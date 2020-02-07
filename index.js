const fetch = require('node-fetch');
const { random, includes } = require('lodash');
// API "умных мыслей":
const api = `http://api.forismatic.com/api/1.0/?method=getQuote&format=json&key=${random(1, 999999)}&lang=ru`;
// Страница для донатов (установите свою; опционально):
const donateUrl = 'https://yasobe.ru/na/umnyemysli';
// Скриншот страницы для донатов (загрузите на Yandex Object Storage и получите URL; опционально):
const donateImgUrl = 'https://storage.yandexcloud.net/img-bucket/tg-bot-smart-thoughts/donate-min.png';
// Страница навыка Алисы в официальном каталоге навыков (установите свою; опционально):
const skillUrl = 'https://alice.ya.ru/s/f785af07-4578-4a6b-95ae-485bd803ae20';
// Скриншот страницы навыка Алисы (загрузите на Yandex Object Storage и получите URL; опционально):
const skillImgUrl = 'https://storage.yandexcloud.net/img-bucket/tg-bot-smart-thoughts/skill-min.png';

// Определение функции получения данных и возврат отформатированной цитаты:
async function getData(url) {
  try {
    const data = await fetch(url);
    const json = await data.json();
    const quote = json.quoteText;
    const author = json.quoteAuthor.length === 0 ? 'Автор не известен' : json.quoteAuthor;
    return `<b>${quote}</b>\n\u2014 <i>${author}</i>`;
  } catch (err) {
    console.error('Fail to fetch data: ' + err);
    return 'Мысль потеряна! Попробуй ещё раз.';
  }
}

// Определение функции поиска ключевых слов во фразе юзера:
function getTrigger(str) {
  const triggerWords = ['мысль', 'мысли', 'цитата', 'цитату', 'цитируй', 'процитируй', 'цитаты', 'цитирует',
    'цитировать', 'процитирует', 'процитировать', 'изречение', 'изречения', 'мудрость', 'мудрости', 'мудрые',
    'мудрую', 'мудрое', 'высказывание', 'высказывания'];
  for (let item of triggerWords) {
    if (includes(str, item.toLowerCase())) {
      return true;
    }
  }
  return false;
}

// Яндекс-функция:
module.exports.bot = async (event) => {
  const body = JSON.parse(event.body);
  const text = body.message.text;

  const userMsg = text.toLowerCase();
  let botMsg;
  let photoUrl;
  let redirectUrl;
  let inlineKeyText;
  let isPhoto = false;
  let msg = {};

  if (getTrigger(userMsg)) {
    botMsg = await getData(api);
  } else if (userMsg === '/start') {
    botMsg = 'Нажми на кнопку "Умная мысль", чтобы получить её бесплатно.';
  } else if (userMsg === '/help') {
    botMsg = 'Я поставляю умные мысли от умных людей! Нажимай на кнопку "Умная мысль", чтобы получать их бесплатно.';
  } else if (userMsg === 'навык алисы') {
    isPhoto = true;
    inlineKeyText = 'Послушай Умные Мысли от Алисы!';
    photoUrl = skillImgUrl;
    redirectUrl = skillUrl;
  } else if (userMsg === 'кинуть монетку') {
    isPhoto = true;
    inlineKeyText = 'Проспонсируй немного Умные Мысли!';
    photoUrl = donateImgUrl;
    redirectUrl = donateUrl;
  } else {
    botMsg = 'Давай не будем отвлекаться. Просто нажимай кнопку "Умная мысль", и получай эти мысли бесплатно.';
  }

  // Шлём скриншоты, с кнопкой перехода на заданный URL:
  if (isPhoto) {
    msg = {
      'method': 'sendPhoto',
      'photo': photoUrl,
      'chat_id': body.message.chat.id,
      'reply_markup': JSON.stringify({
        inline_keyboard: [
          [{ text: inlineKeyText, url: redirectUrl }]
        ]
      })
    };
  } else {
    // Шлём текстовое сообщение:
    msg = {
      'method': 'sendMessage',
      'parse_mode': 'HTML',
      'chat_id': body.message.chat.id,
      'text': botMsg,
      // Устанавливаем кнопки для быстрого ввода:
      'reply_markup': JSON.stringify({
        keyboard: [
          [{ text: 'Умная мысль' }],
          [{ text: 'Навык Алисы' }],
          [{ text: 'Кинуть монетку' }]
        ]
      })
    };
  }

  // Возвращаем результат в Telegram:
  return {
    'statusCode': 200,
    'headers': {
      'Content-Type': 'application/json; charset=utf-8'
    },
    'body': JSON.stringify(msg),
    'isBase64Encoded': false
  };
};
