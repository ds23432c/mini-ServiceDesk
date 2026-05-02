-- ============================================================
--  mini-ServiceDesk | MySQL-схема + тестовые данные
--  Запуск: mysql -u root -proot < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS servicedesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE servicedesk;

-- ----------------------------
-- Таблица: клиенты (B2B)
-- ----------------------------
CREATE TABLE IF NOT EXISTS clients (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  company_type  ENUM('enterprise','smb','starter') DEFAULT 'smb',
  sla_hours     INT DEFAULT 24,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Таблица: сотрудники / агенты
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  role       ENUM('admin','manager','agent') DEFAULT 'agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Таблица: заявки
-- ----------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  status      ENUM('new','in_progress','waiting','resolved','closed') DEFAULT 'new',
  priority    ENUM('critical','high','medium','low') DEFAULT 'medium',
  category    VARCHAR(100),
  client_id   INT,
  assigned_to INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (client_id)   REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE SET NULL
);

-- ----------------------------
-- Таблица: комментарии
-- ----------------------------
CREATE TABLE IF NOT EXISTS comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT NOT NULL,
  author_name VARCHAR(255) DEFAULT 'Агент',
  body        TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ============================================================
--  ТЕСТОВЫЕ ДАННЫЕ
-- ============================================================

INSERT INTO clients (name, email, phone, company_type, sla_hours) VALUES
  ('ООО "Альфа-Трейд"',      'support@alpha.ua',   '+380441234567', 'enterprise', 4),
  ('ИП Петренко И.В.',       'petrenk@gmail.com',  '+380671234567', 'starter',    48),
  ('ООО "БетаСофт"',         'info@betasoft.ua',   '+380501234567', 'smb',        24),
  ('АО "ГаммаЛогистик"',     'help@gamma.ua',      '+380991234567', 'enterprise', 8),
  ('ООО "ДельтаМед"',        'delta@deltamed.ua',  '+380631234567', 'smb',        24);

INSERT INTO users (name, email, role) VALUES
  ('Администратор системы', 'admin@servicedesk.ua',   'admin'),
  ('Елена Коваль',          'o.koval@servicedesk.ua', 'manager'),
  ('Дмитрий Сыч',           'd.sych@servicedesk.ua',  'agent'),
  ('Мария Бондарь',         'm.bondar@servicedesk.ua','agent'),
  ('Игорь Мельник',         'i.melnyk@servicedesk.ua','agent');

INSERT INTO tickets (title, description, status, priority, category, client_id, assigned_to, created_at) VALUES
  ('Не работает вход в личный кабинет','Клиент не может авторизоваться — ошибка 403','in_progress','critical','Доступ',1,3, NOW() - INTERVAL 2 HOUR),
  ('Нужна интеграция с 1С','Настроить обмен данными с бухгалтерией','new','high','Интеграция',3,2, NOW() - INTERVAL 1 DAY),
  ('Ошибка при формировании отчета','PDF-отчет не генерируется, белый экран','waiting','medium','Отчетность',4,4, NOW() - INTERVAL 3 DAY),
  ('Обновление тарифного плана','Перейти с SMB на Enterprise','resolved','low','Биллинг',2,5, NOW() - INTERVAL 5 DAY),
  ('Сервер не отвечает после 22:00','Каждую ночь падает API-сервер в 22:15','in_progress','critical','Инфраструктура',1,3, NOW() - INTERVAL 4 HOUR),
  ('Добавить нового пользователя','Создать аккаунт для нового менеджера','new','medium','Администрирование',5,4, NOW() - INTERVAL 6 HOUR),
  ('Некорректный расчет суммы','Система считает сумму без НДС','waiting','high','Биллинг',3,2, NOW() - INTERVAL 2 DAY),
  ('Обучение новых сотрудников','Провести онбординг для 3 новых пользователей','closed','low','Обучение',4,5, NOW() - INTERVAL 10 DAY),
  ('Ошибка синхронизации данных','Данные обновляются с задержкой 2 часа','in_progress','high','Интеграция',1,3, NOW() - INTERVAL 30 MINUTE),
  ('Настройка автоматических уведомлений','Email-уведомления не приходят','new','medium','Настройки',5,NULL, NOW() - INTERVAL 1 HOUR);

INSERT INTO comments (ticket_id, author_name, body, is_internal) VALUES
  (1,'Дмитрий Сыч','Проверил логи — проблема в JWT-токене. Обновляю конфигурацию.',TRUE),
  (1,'Елена Коваль','Клиент подтвердил проблему. Приоритет критический — решить до 18:00.',FALSE),
  (3,'Мария Бондарь','Ждем ответ от клиента по версии браузера.',FALSE),
  (5,'Дмитрий Сыч','Нашел проблему — cron job конфликтует с бэкапом. Исправляю.',TRUE),
  (9,'Дмитрий Сыч','Задержка из-за очереди сообщений. Масштабирую воркеры.',TRUE);
