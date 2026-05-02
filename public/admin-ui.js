(() => {
  const STORAGE_TOKEN = 'mini-service-desk.adminToken';
  const STORAGE_LOGIN = 'mini-service-desk.adminLogin';
  const API_PREFIX = '/api';
  const AUTH_HEADER = 'x-admin-token';

  const state = {
    token: localStorage.getItem(STORAGE_TOKEN) || '',
    login: localStorage.getItem(STORAGE_LOGIN) || ''
  };

  const baseNav = window.nav?.bind(window);
  const baseRenderAdmin = window.renderAdmin?.bind(window);
  const baseOpenCreateTicket = window.openCreateTicket?.bind(window);
  const baseOpenCreateClient = window.openCreateClient?.bind(window);
  const baseOpenCreateAgent = window.openCreateAgent?.bind(window);
  const baseGet = window.get?.bind(window);
  const basePost = window.post?.bind(window);
  const basePut = window.put?.bind(window);
  const baseDel = window.del?.bind(window);

  function setSession(login, token) {
    state.login = login;
    state.token = token;
    localStorage.setItem(STORAGE_LOGIN, login);
    localStorage.setItem(STORAGE_TOKEN, token);
  }

  function clearSession() {
    state.login = '';
    state.token = '';
    localStorage.removeItem(STORAGE_LOGIN);
    localStorage.removeItem(STORAGE_TOKEN);
  }

  function syncAdminVisibility() {
    const adminNode = document.querySelector('.nav-item[data-page="admin"]');
    const ticketNode = document.querySelector('.nav-item[onclick="openCreateTicket()"]');
    const clientNode = document.querySelector('.nav-item[onclick="openCreateClient()"]');
    const agentNode = document.querySelector('.nav-item[onclick="openCreateAgent()"]');
    const topbarTicketButton = document.querySelector('.topbar-actions .btn.btn-primary');
    const authButton = document.getElementById('admin-auth-btn');

    const visible = isAuthed();

    [ticketNode, clientNode, agentNode, topbarTicketButton].forEach(node => {
      if (node) {
        node.style.display = visible ? '' : 'none';
      }
    });

    if (adminNode) {
      adminNode.style.display = visible ? '' : 'none';
    }

    if (authButton) {
      authButton.textContent = visible ? 'Выйти' : 'Вход администратора';
    }
  }

  function isAuthed() {
    return Boolean(state.token);
  }

  function authHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (state.token) {
      headers[AUTH_HEADER] = state.token;
    }
    return headers;
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(`${API_PREFIX}${path}`, {
      ...options,
      headers: authHeaders(options.headers || {})
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }

    if (!response.ok) {
      const error = new Error(payload.error || 'Не удалось выполнить запрос');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  window.get = async function get(url) {
    return requestJson(url, { method: 'GET' });
  };

  window.post = async function post(url, data) {
    return requestJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  window.put = async function put(url, data) {
    return requestJson(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  window.del = async function del(url) {
    return requestJson(url, { method: 'DELETE' });
  };

  async function loginAdmin(login, password) {
    const response = await fetch(`${API_PREFIX}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Неверный логин или пароль');
    }

    setSession(payload.login, payload.token);
    return payload;
  }

  async function validateSession() {
    if (!state.token) {
      return false;
    }

    try {
      const payload = await requestJson('/admin/me', { method: 'GET' });
      if (payload.login) {
        state.login = payload.login;
        localStorage.setItem(STORAGE_LOGIN, payload.login);
      }
      return true;
    } catch (error) {
      clearSession();
      return false;
    }
  }

  async function logoutAdmin() {
    if (state.token) {
      try {
        await requestJson('/admin/logout', { method: 'POST' });
      } catch (error) {
        // очищаем локальную сессию в любом случае
      }
    }

    clearSession();
    syncAdminVisibility();
    toast('Выход из администрирования выполнен');
    if (baseNav) {
      baseNav('dashboard');
    }
  }

  function ensureAdminLogin(onSuccess) {
    showModal(
      'Вход в администрирование',
      `
        <div class="form-group">
          <label>Логин</label>
          <input id="admin-login" autocomplete="username" placeholder="Введите логин">
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input id="admin-password" type="password" autocomplete="current-password" placeholder="Введите пароль">
        </div>
        <div style="font-size:12px;color:#9ca3af;line-height:1.5">
          После входа откроется раздел администрирования с клиентами, агентами и отчётами.
        </div>
      `,
      async () => {
        const login = document.getElementById('admin-login').value.trim();
        const password = document.getElementById('admin-password').value;

        if (!login || !password) {
          toast('Введите логин и пароль', false);
          return;
        }

        try {
          await loginAdmin(login, password);
          closeModal();
          syncAdminVisibility();
          toast('Вход в администрирование выполнен');
          if (typeof onSuccess === 'function') {
            onSuccess();
          } else if (baseNav) {
            baseNav('admin');
          }
        } catch (error) {
          toast(error.message || 'Не удалось войти', false);
        }
      }
    );

    setTimeout(() => {
      const input = document.getElementById('admin-login');
      if (input) input.focus();
    }, 0);
  }

  function injectTopbarAuthButton() {
    const topbarActions = document.querySelector('.topbar-actions');
    if (!topbarActions) return;

    let authButton = document.getElementById('admin-auth-btn');
    if (!authButton) {
      authButton = document.createElement('button');
      authButton.className = 'btn btn-secondary';
      authButton.id = 'admin-auth-btn';
      topbarActions.appendChild(authButton);
      authButton.addEventListener('click', () => {
        if (isAuthed()) {
          logoutAdmin();
          return;
        }

        ensureAdminLogin(() => {
          syncAdminVisibility();
          if (baseNav) {
            baseNav('admin');
          }
        });
      });
    }

    syncAdminVisibility();
  }

  function injectAdminToolbar() {
    const page = document.getElementById('page');
    if (!page) return;

    const existing = document.getElementById('admin-toolbar-card');
    if (existing) {
      existing.remove();
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'admin-toolbar-card';
    card.style.marginBottom = '14px';
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">Администрирование</div>
          <div class="card-subtitle">Доступ разрешён: ${state.login || 'администратор'}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="admin-logout-btn">Выйти</button>
      </div>
      <div class="export-actions">
        <button class="btn btn-primary" onclick="openCreateTicket()">Новая заявка</button>
        <button class="btn btn-secondary" onclick="openCreateClient()">Новый клиент</button>
        <button class="btn btn-secondary" onclick="openCreateAgent()">Новый агент</button>
      </div>
    `;

    page.prepend(card);

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutAdmin);
    }
  }

  function protectAdminNavigation(page, el) {
    if (page !== 'admin') {
      return baseNav ? baseNav(page, el) : undefined;
    }

    if (!isAuthed()) {
      ensureAdminLogin(() => {
        if (baseNav) baseNav(page, el);
      });
      return;
    }

    validateSession().then(valid => {
      if (!valid) {
        ensureAdminLogin(() => {
          if (baseNav) baseNav(page, el);
        });
        return;
      }

      if (baseNav) {
        baseNav(page, el);
      }
    });
  }

  async function protectedRenderAdmin() {
    const valid = await validateSession();
    if (!valid) {
      ensureAdminLogin(() => {
        if (baseNav) baseNav('admin');
      });
      return;
    }

    if (baseRenderAdmin) {
      await baseRenderAdmin();
      injectAdminToolbar();
    }
  }

  function protectCreateTicket() {
    if (!isAuthed()) {
      ensureAdminLogin(() => {
        if (baseOpenCreateTicket) {
          baseOpenCreateTicket();
        }
      });
      return;
    }

    if (baseOpenCreateTicket) {
      return baseOpenCreateTicket();
    }
  }

  function protectCreateClient() {
    if (!isAuthed()) {
      ensureAdminLogin(() => {
        if (baseOpenCreateClient) {
          baseOpenCreateClient();
        }
      });
      return;
    }

    if (baseOpenCreateClient) {
      return baseOpenCreateClient();
    }
  }

  function protectCreateAgent() {
    if (!isAuthed()) {
      ensureAdminLogin(() => {
        if (baseOpenCreateAgent) {
          baseOpenCreateAgent();
        }
      });
      return;
    }

    if (baseOpenCreateAgent) {
      return baseOpenCreateAgent();
    }
  }

  async function boot() {
    await validateSession();

    if (baseNav) {
      window.nav = protectAdminNavigation;
    }

    if (baseRenderAdmin) {
      window.renderAdmin = protectedRenderAdmin;
    }

    if (baseOpenCreateTicket) {
      window.openCreateTicket = protectCreateTicket;
    }

    if (baseOpenCreateClient) {
      window.openCreateClient = protectCreateClient;
    }

    if (baseOpenCreateAgent) {
      window.openCreateAgent = protectCreateAgent;
    }

    injectTopbarAuthButton();

    if (state.token) {
      window.setTimeout(() => {
        if (window.currentPage === 'admin') {
          protectedRenderAdmin();
        }
      }, 0);
    }
  }

  boot();
})();
