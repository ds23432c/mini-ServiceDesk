const mysql = require('mysql2/promise');

const TOTAL_ROWS = 100;

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'servicedesk',
  multipleStatements: true,
  charset: 'utf8mb4'
};

const companyPrefixes = [
  'Альфа', 'Бета', 'Гамма', 'Дельта', 'Орион', 'Вектор', 'Квант', 'Сигма', 'Пульс', 'Импульс'
];

const companyDomains = [
  'trade', 'soft', 'logistics', 'med', 'finance', 'service', 'energy', 'build', 'supply', 'digital'
];

const companySectors = [
  'Трейд', 'Софт', 'Логистик', 'Мед', 'Финанс', 'Сервис', 'Энерго', 'Строй', 'Снабжение', 'Диджитал'
];

const companyTypes = ['enterprise', 'smb', 'starter'];

const firstNames = [
  'Алексей', 'Андрей', 'Анна', 'Виктор', 'Галина',
  'Дмитрий', 'Елена', 'Игорь', 'Кирилл', 'Лариса',
  'Марина', 'Наталья', 'Олег', 'Павел', 'Роман',
  'Светлана', 'Татьяна', 'Юлия', 'Ярослав', 'Сергей'
];

const lastNames = [
  'Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов',
  'Волков', 'Соколов', 'Лебедев', 'Козлов', 'Новиков',
  'Морозов', 'Васильев', 'Зайцев', 'Мельник', 'Бондарь',
  'Коваль', 'Поляков', 'Федоров', 'Орлов', 'Тихонов'
];

const roles = ['agent', 'agent', 'agent', 'agent', 'manager', 'agent', 'agent', 'agent', 'agent', 'admin'];

const categories = [
  'Доступ',
  'Интеграция',
  'Биллинг',
  'Отчетность',
  'Инфраструктура',
  'Администрирование',
  'Настройки',
  'Обучение',
  'Безопасность',
  'Мобильное приложение',
  'Портал',
  'API',
  'Логистика',
  'CRM',
  'Документы'
];

const ticketTitles = [
  'Не работает вход',
  'Нужна настройка',
  'Сбой при отправке',
  'Ошибка синхронизации',
  'Не приходит уведомление',
  'Требуется консультация',
  'Некорректные данные',
  'Проблема с доступом',
  'Нужно увеличить лимит',
  'Не открывается форма',
  'Зависает интерфейс',
  'Сломан сценарий',
  'Не создаётся документ',
  'Нет ответа от сервиса',
  'Падает API-запрос',
  'Требуется доработка',
  'Не обновляется статус',
  'Не работает фильтр',
  'Проблема с выгрузкой',
  'Нужна интеграция'
];

const ticketDescriptions = [
  'Клиент сообщает о проблеме в рабочем процессе и просит срочно проверить причину.',
  'Запрос касается доработки бизнес-логики и согласования сроков с ответственными.',
  'Нужно проверить логи, повторить сценарий и дать клиенту понятный ответ по статусу.',
  'Система работает нестабильно, часть пользователей не может завершить операцию.',
  'Ожидается проверка на стороне клиента, затем потребуется повторная валидация результата.',
  'Есть жалоба на скорость обработки заявок и качество уведомлений по обновлению статуса.',
  'Запрос связан с согласованием доступа, правами пользователей и настройками SLA.',
  'Сервисный отдел просит проверить взаимодействие с внешним контуром и очередями сообщений.',
  'Требуется анализ нагрузки, корректировка конфигурации и проверка логирования.',
  'Пользователь отметил, что проблема повторяется несколько раз в день на разных устройствах.'
];

const internalNotes = [
  'Проверил журналы. Наблюдается повторяющаяся ошибка на этапе авторизации.',
  'Согласовал приоритет с ответственным менеджером. Держу на контроле.',
  'Пока ждем доступы от клиента для повторной проверки сценария.',
  'Перекинул задачу на профильного специалиста по интеграциям.',
  'Есть риск нарушения SLA, перевожу в повышенный приоритет.',
  'Проверяю зависимость от очереди сообщений и внешнего API.',
  'Похоже на проблему конфигурации. Сравниваю с рабочим стендом.',
  'Ожидаю подтверждение от клиента по воспроизведению ошибки.',
  'Решение уже готово, осталось согласовать финальный релиз.',
  'Нужно проверить, не связан ли инцидент с ночным регламентным заданием.'
];

const publicReplies = [
  'Заявка принята в работу. Проверяем причину и сообщим о результатах.',
  'Спасибо за уточнение. Сейчас анализируем данные и воспроизводим сценарий.',
  'Мы проверили часть логов и продолжаем диагностику на стороне сервиса.',
  'Проблема зафиксирована, ориентируемся на ближайшее окно исправления.',
  'Передали запрос профильной команде, ожидаем обновление статуса после проверки.',
  'Сотрудник сервиса подтвердил получение обращения и приступил к обработке.',
  'На текущем этапе собираем дополнительную информацию для финального решения.',
  'Похоже, что проблема связана с настройками доступа. Выполняем проверку.',
  'Спасибо за терпение, заявка находится в активной обработке.',
  'Ожидаем подтверждение от клиента по результатам повторного теста.'
];

const statuses = ['new', 'in_progress', 'waiting', 'resolved', 'closed'];
const priorities = ['critical', 'high', 'medium', 'low'];

function pad(value, size = 3) {
  return String(value).padStart(size, '0');
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function pick(list, index) {
  return list[index % list.length];
}

function buildClients() {
  return Array.from({ length: TOTAL_ROWS }, (_, index) => {
    const number = pad(index + 1);
    const prefix = companyPrefixes[index % companyPrefixes.length];
    const sector = companySectors[Math.floor(index / companyPrefixes.length) % companySectors.length];
    const domain = companyDomains[index % companyDomains.length];
    const companyType = companyTypes[index % companyTypes.length];
    const slaHours = companyType === 'enterprise' ? 4 : companyType === 'smb' ? 24 : 48;

    return [
      `ООО "${prefix} ${sector} ${number}"`,
      `support${number}@${domain}.ru`,
      `+7(9${pad((index % 90) + 10, 2)})${pad(100 + index, 3)}-${pad(10 + (index % 90), 2)}-${pad(20 + (index % 80), 2)}`,
      companyType,
      slaHours
    ];
  });
}

function buildUsers() {
  return Array.from({ length: TOTAL_ROWS }, (_, index) => {
    const number = pad(index + 1);
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const role = roles[index % roles.length];

    return [
      `${firstName} ${lastName}`,
      `user${number}@servicedesk.ru`,
      role
    ];
  });
}

function buildTickets() {
  return Array.from({ length: TOTAL_ROWS }, (_, index) => {
    const number = pad(index + 1);
    const status = statuses[index % statuses.length];
    const priority = priorities[(index * 2) % priorities.length];
    const category = categories[index % categories.length];
    const title = `${pick(ticketTitles, index)} — ${category.toLowerCase()}`;
    const description = `${pick(ticketDescriptions, index)} Категория: ${category}. Заявка №${number}.`;
    const createdAt = hoursAgo(3 + ((index * 11) % 720));
    const resolvedAt = ['resolved', 'closed'].includes(status)
      ? addHours(createdAt, 4 + (index % 36))
      : null;
    const assignedTo = index % 8 === 0 ? null : ((index * 7) % TOTAL_ROWS) + 1;
    const clientId = ((index * 3) % TOTAL_ROWS) + 1;

    return [
      title,
      description,
      status,
      priority,
      category,
      clientId,
      assignedTo,
      createdAt,
      resolvedAt
    ];
  });
}

function buildComments() {
  return Array.from({ length: TOTAL_ROWS }, (_, index) => {
    const ticketId = index + 1;
    const authorName = index % 2 === 0
      ? `${firstNames[(index + 3) % firstNames.length]} ${lastNames[(index + 7) % lastNames.length]}`
      : `${firstNames[(index + 8) % firstNames.length]} ${lastNames[(index + 11) % lastNames.length]}`;
    const body = index % 2 === 0
      ? pick(internalNotes, index)
      : pick(publicReplies, index);
    const isInternal = index % 2 === 0 ? 1 : 0;
    const createdAt = hoursAgo(1 + (index % 240));

    return [ticketId, authorName, body, isInternal, createdAt];
  });
}

async function clearTables(connection) {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
  await connection.query('TRUNCATE TABLE comments;');
  await connection.query('TRUNCATE TABLE tickets;');
  await connection.query('TRUNCATE TABLE users;');
  await connection.query('TRUNCATE TABLE clients;');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
}

async function insertRows(connection, tableName, columns, rows) {
  const columnList = columns.join(', ');
  await connection.query(`INSERT INTO ${tableName} (${columnList}) VALUES ?`, [rows]);
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  await clearTables(connection);

  const clientRows = buildClients();
  const userRows = buildUsers();
  const ticketRows = buildTickets();
  const commentRows = buildComments();

  await insertRows(connection, 'clients', ['name', 'email', 'phone', 'company_type', 'sla_hours'], clientRows);
  await insertRows(connection, 'users', ['name', 'email', 'role'], userRows);
  await insertRows(connection, 'tickets', ['title', 'description', 'status', 'priority', 'category', 'client_id', 'assigned_to', 'created_at', 'resolved_at'], ticketRows);
  await insertRows(connection, 'comments', ['ticket_id', 'author_name', 'body', 'is_internal', 'created_at'], commentRows);

  const [[clientsCount]] = await connection.query('SELECT COUNT(*) AS count FROM clients');
  const [[usersCount]] = await connection.query('SELECT COUNT(*) AS count FROM users');
  const [[ticketsCount]] = await connection.query('SELECT COUNT(*) AS count FROM tickets');
  const [[commentsCount]] = await connection.query('SELECT COUNT(*) AS count FROM comments');
  const [[openCount]] = await connection.query("SELECT COUNT(*) AS count FROM tickets WHERE status IN ('new','in_progress','waiting')");
  const [[resolvedCount]] = await connection.query("SELECT COUNT(*) AS count FROM tickets WHERE status IN ('resolved','closed')");

  console.log('Demo data seeded successfully');
  console.log({
    clients: clientsCount.count,
    users: usersCount.count,
    tickets: ticketsCount.count,
    comments: commentsCount.count,
    openTickets: openCount.count,
    closedTickets: resolvedCount.count
  });

  await connection.end();
}

main().catch((error) => {
  console.error('Failed to seed demo data');
  console.error(error);
  process.exit(1);
});
