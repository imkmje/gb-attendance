// 공용 Supabase REST 목(mock) 헬퍼.
// **/rest/v1/** 로 가는 모든 요청을 가로채서, 프로덕션 DB에 전혀 접속하지
// 않고도 app.js/api.js의 실제 코드 경로를 그대로 실행시켜 테스트한다.
// PostgREST 쿼리스트링(eq./in./select=)을 아주 단순하게 흉내내는
// 인메모리 스토어이며, 이 앱이 실제로 쓰는 패턴만 지원한다(전체 스펙 X).

const DEFAULT_STUDENTS = [
  {
    id: 'stu-1', class_num: 2, student_num: 6, name: '김민준', study_room: '청운반',
    schedule: { mon: ['O', 'O', 'O'], tue: ['O', 'O', 'O'], wed: ['O', 'O', 'O'], thu: ['O', 'O', 'O'], fri: ['O', 'O', 'O'], sat: ['O', 'O'] },
  },
  {
    id: 'stu-2', class_num: 3, student_num: 11, name: '이서연', study_room: '청운반',
    schedule: { mon: ['O', 'O', 'O'], tue: ['O', 'O', 'O'], wed: ['O', 'O', 'O'], thu: ['O', 'O', 'O'], fri: ['O', 'O', 'O'], sat: ['O', 'O'] },
  },
  {
    id: 'stu-3', class_num: 5, student_num: 2, name: '박도윤', study_room: '백운 A반',
    schedule: { mon: ['O', 'O', 'O'], tue: ['O', 'O', 'O'], wed: ['O', 'O', 'O'], thu: ['O', 'O', 'O'], fri: ['O', 'O', 'O'], sat: ['O', 'O'] },
  },
];

const DEFAULT_FIXTURES = {
  students: DEFAULT_STUDENTS,
  attendance: [],
  violations: [],
  holidays: [],
  recurring_early_leave: [],
  activity_log: [],
  settings: [
    { key: 'reason_types', value: ['학원 보강', '병결(일회성 진료)', '병결(정기 진료)', '개인 사정', '청백지교'] },
    { key: 'violation_types', value: ['무단 지각', '무단 결석', '전자기기 무단 사용', '졸음', '취침', '자습 방해'] },
    { key: 'semester_config', value: { s1: '03-02', s2: '08-16' } },
    { key: 'activity_log_enabled', value: false },
  ],
};

function _parsePostgrestQuery(search) {
  const params = new URLSearchParams(search);
  const filters = [];
  let selectFields = null;
  for (const [key, value] of params.entries()) {
    if (key === 'select') { selectFields = value.split(','); continue; }
    if (['order', 'limit', 'offset'].includes(key)) continue;
    const m = value.match(/^(eq|neq|gt|gte|lt|lte|in)\.(.*)$/);
    if (!m) continue;
    filters.push({ field: key, op: m[1], raw: decodeURIComponent(m[2]) });
  }
  return { filters, selectFields };
}

function _applyFilters(rows, filters) {
  return rows.filter(row => filters.every(f => {
    const cell = row[f.field];
    if (f.op === 'eq') return String(cell) === f.raw;
    if (f.op === 'neq') return String(cell) !== f.raw;
    if (f.op === 'in') {
      const list = f.raw.replace(/^\(|\)$/g, '').split(',');
      return list.includes(String(cell));
    }
    const numCell = Number(cell), numRaw = Number(f.raw);
    if (f.op === 'gt') return numCell > numRaw;
    if (f.op === 'gte') return numCell >= numRaw;
    if (f.op === 'lt') return numCell < numRaw;
    if (f.op === 'lte') return numCell <= numRaw;
    return true;
  }));
}

function _pick(row, fields) {
  if (!fields) return row;
  const out = {};
  for (const f of fields) if (f in row) out[f] = row[f];
  return out;
}

/**
 * page에 Supabase REST 목을 설치한다. overrides로 테이블별 초기 데이터를
 * 덮어쓸 수 있다(예: { attendance: [...] }). 반환값은 그 테스트 동안
 * 살아있는 인메모리 스토어 — 테스트 안에서 store.attendance 등으로 직접
 * 들여다보며 저장 결과를 검증할 수 있다.
 */
async function installSupabaseMock(page, overrides = {}) {
  const store = {};
  for (const [table, rows] of Object.entries(DEFAULT_FIXTURES)) {
    store[table] = JSON.parse(JSON.stringify(overrides[table] ?? rows));
  }

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1]?.split('?')[0];
    const method = req.method();

    if (!table || !(table in store)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    const { filters, selectFields } = _parsePostgrestQuery(url.search);

    if (method === 'GET') {
      const rows = _applyFilters(store[table], filters).map(r => _pick(r, selectFields));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
    }
    if (method === 'POST') {
      let body;
      try { body = JSON.parse(req.postData() || '[]'); } catch { body = []; }
      const rows = Array.isArray(body) ? body : [body];
      const inserted = rows.map(r => ({ id: r.id || `mock-${table}-${Math.random().toString(36).slice(2, 9)}`, ...r }));
      store[table].push(...inserted);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(inserted) });
    }
    if (method === 'PATCH') {
      let body = {};
      try { body = JSON.parse(req.postData() || '{}'); } catch {}
      _applyFilters(store[table], filters).forEach(row => Object.assign(row, body));
      return route.fulfill({ status: 204, body: '' });
    }
    if (method === 'DELETE') {
      const toDelete = new Set(_applyFilters(store[table], filters));
      store[table] = store[table].filter(r => !toDelete.has(r));
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  return store;
}

module.exports = { installSupabaseMock, DEFAULT_FIXTURES, DEFAULT_STUDENTS };
