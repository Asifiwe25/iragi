require('dotenv').config();
const pool = require('./db');

const schema = `
-- ══════════════════════════════════════════════════
--  IRAGI DATABASE SCHEMA v4.0
--  Organisation: IRAGI - Enfants & Femmes Réfugiés
--  Localisation: République Démocratique du Congo
-- ══════════════════════════════════════════════════

-- 1. CAMPS / CENTRES
CREATE TABLE IF NOT EXISTS camps (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  region            VARCHAR(255),
  territory         VARCHAR(255),
  country           VARCHAR(100) DEFAULT 'République Démocratique du Congo',
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  capacity          INTEGER DEFAULT 0,
  current_occupancy INTEGER DEFAULT 0,
  admin_id          INTEGER,
  is_active         BOOLEAN DEFAULT true,
  description       TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- 2. USERS (5 roles)
CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255),
  role              VARCHAR(50) DEFAULT 'volunteer'
                    CHECK (role IN ('admin','refugee','donor','volunteer','partner')),
  camp_id           INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  phone             VARCHAR(50),
  country           VARCHAR(100),
  bio               TEXT,
  avatar_url        VARCHAR(500),
  is_active         BOOLEAN DEFAULT false,
  email_verified    BOOLEAN DEFAULT false,
  verification_code VARCHAR(10),
  verification_expires TIMESTAMP,
  status            VARCHAR(50) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','suspended')),
  last_login        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

ALTER TABLE camps ADD CONSTRAINT fk_camp_admin
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL NOT VALID;

-- 3. PUBLIC REGISTRATIONS (from homepage)
CREATE TABLE IF NOT EXISTS public_registrations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  role        VARCHAR(50) DEFAULT 'volunteer',
  country     VARCHAR(100),
  message     TEXT,
  status      VARCHAR(50) DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 4. REFUGEES
CREATE TABLE IF NOT EXISTS refugees (
  id              SERIAL PRIMARY KEY,
  rid             VARCHAR(30) UNIQUE NOT NULL,
  first_name      VARCHAR(255) NOT NULL,
  last_name       VARCHAR(255) NOT NULL,
  date_of_birth   DATE,
  gender          VARCHAR(20) CHECK (gender IN ('male','female','other','unknown')),
  nationality     VARCHAR(100),
  origin_province VARCHAR(255),
  origin_territory VARCHAR(255),
  origin_village  VARCHAR(255),
  current_camp_id INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  languages       TEXT[],
  arrival_date    DATE DEFAULT CURRENT_DATE,
  photo_url       VARCHAR(500),
  status          VARCHAR(50) DEFAULT 'registered'
                  CHECK (status IN ('registered','under_review','verified','resettled','returned')),
  flags           TEXT[] DEFAULT '{}',
  health_notes    TEXT,
  education_level VARCHAR(100),
  registered_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 5. FAMILY GROUPS
CREATE TABLE IF NOT EXISTS family_groups (
  id                   SERIAL PRIMARY KEY,
  head_refugee_id      INTEGER REFERENCES refugees(id) ON DELETE SET NULL,
  size                 INTEGER DEFAULT 1,
  notes                TEXT,
  created_at           TIMESTAMP DEFAULT NOW()
);

-- 6. CASES
CREATE TABLE IF NOT EXISTS cases (
  id            SERIAL PRIMARY KEY,
  refugee_id    INTEGER NOT NULL REFERENCES refugees(id) ON DELETE CASCADE,
  case_type     VARCHAR(50) CHECK (case_type IN ('medical','legal','psychosocial','family_tracing','resettlement','education','protection','nutrition')),
  priority      VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status        VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open','in_progress','pending_review','closed')),
  title         VARCHAR(255),
  description   TEXT,
  assigned_to   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date      DATE,
  closed_at     TIMESTAMP,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 7. CASE NOTES
CREATE TABLE IF NOT EXISTS case_notes (
  id          SERIAL PRIMARY KEY,
  case_id     INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 8. COURSES (Cours pour enfants)
CREATE TABLE IF NOT EXISTS courses (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  subject       VARCHAR(100) CHECK (subject IN ('literacy','mathematics','language','science','life_skills','digital','arts','other')),
  level         VARCHAR(50) CHECK (level IN ('beginner','intermediate','advanced','all')),
  target_age_min INTEGER DEFAULT 5,
  target_age_max INTEGER DEFAULT 18,
  language      VARCHAR(50) DEFAULT 'fr',
  instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cover_url     VARCHAR(500),
  is_published  BOOLEAN DEFAULT false,
  duration_hours INTEGER DEFAULT 1,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 9. COURSE LESSONS
CREATE TABLE IF NOT EXISTS course_lessons (
  id            SERIAL PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  content_type  VARCHAR(50) CHECK (content_type IN ('video','document','audio','text','quiz')),
  content_url   VARCHAR(500),
  content_text  TEXT,
  order_index   INTEGER DEFAULT 0,
  duration_min  INTEGER DEFAULT 30,
  is_free       BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 10. COURSE ENROLLMENTS
CREATE TABLE IF NOT EXISTS course_enrollments (
  id            SERIAL PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  refugee_id    INTEGER NOT NULL REFERENCES refugees(id) ON DELETE CASCADE,
  enrolled_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  progress_pct  INTEGER DEFAULT 0,
  completed_at  TIMESTAMP,
  enrolled_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, refugee_id)
);

-- 11. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
  id          SERIAL PRIMARY KEY,
  camp_id     INTEGER NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  item_type   VARCHAR(100) NOT NULL,
  item_name   VARCHAR(255),
  quantity    INTEGER DEFAULT 0,
  unit        VARCHAR(50),
  min_quantity INTEGER DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 12. DISTRIBUTIONS
CREATE TABLE IF NOT EXISTS distributions (
  id                SERIAL PRIMARY KEY,
  refugee_id        INTEGER NOT NULL REFERENCES refugees(id) ON DELETE CASCADE,
  camp_id           INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  item_type         VARCHAR(100) NOT NULL,
  item_name         VARCHAR(255),
  quantity          DECIMAL(10,2),
  unit              VARCHAR(50),
  distributed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  distribution_date DATE DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- 13. FINANCING / DONATIONS
CREATE TABLE IF NOT EXISTS financings (
  id              SERIAL PRIMARY KEY,
  type            VARCHAR(50) DEFAULT 'donation'
                  CHECK (type IN ('donation','grant','partnership','fundraising','other')),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  amount          DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'EUR',
  amount_usd      DECIMAL(15,2),
  donor_name      VARCHAR(255),
  donor_email     VARCHAR(255),
  donor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  donor_country   VARCHAR(100),
  purpose         TEXT,
  program         VARCHAR(100) CHECK (program IN ('education','women','community','health','nutrition','general','other')),
  status          VARCHAR(50) DEFAULT 'received'
                  CHECK (status IN ('pending','received','allocated','spent','cancelled')),
  receipt_date    DATE DEFAULT CURRENT_DATE,
  allocated_date  DATE,
  notes           TEXT,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 14. BUDGET ALLOCATIONS
CREATE TABLE IF NOT EXISTS budget_allocations (
  id            SERIAL PRIMARY KEY,
  financing_id  INTEGER NOT NULL REFERENCES financings(id) ON DELETE CASCADE,
  program       VARCHAR(100),
  description   TEXT,
  amount        DECIMAL(15,2) NOT NULL,
  currency      VARCHAR(10) DEFAULT 'EUR',
  spent         DECIMAL(15,2) DEFAULT 0,
  allocated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 15. MESSAGES (Internal + from homepage)
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  from_user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  to_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  from_email      VARCHAR(255),
  from_name       VARCHAR(255),
  subject         VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  reply_body      TEXT,
  replied_at      TIMESTAMP,
  is_public       BOOLEAN DEFAULT false,
  read_at         TIMESTAMP,
  deleted_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 16. HOMEPAGE CONTENT (editable by admin)
CREATE TABLE IF NOT EXISTS homepage_content (
  id          SERIAL PRIMARY KEY,
  section     VARCHAR(100) NOT NULL,
  key         VARCHAR(100) NOT NULL,
  value_fr    TEXT,
  value_en    TEXT,
  value_sw    TEXT,
  updated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(section, key)
);

-- 17. STORIES / TESTIMONIES
CREATE TABLE IF NOT EXISTS stories (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255),
  content       TEXT NOT NULL,
  author_name   VARCHAR(255),
  author_age    INTEGER,
  origin        VARCHAR(255),
  category      VARCHAR(100) CHECK (category IN ('education','women','displacement','community','youth','hope','other')),
  media_url     VARCHAR(500),
  media_type    VARCHAR(50) CHECK (media_type IN ('image','video','audio','none')),
  is_anonymous  BOOLEAN DEFAULT false,
  is_published  BOOLEAN DEFAULT false,
  language      VARCHAR(20) DEFAULT 'fr',
  approved_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 18. VOLUNTEERS
CREATE TABLE IF NOT EXISTS volunteers (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skills        TEXT[],
  availability  VARCHAR(100),
  languages     TEXT[],
  experience    TEXT,
  camp_id       INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  status        VARCHAR(50) DEFAULT 'active',
  hours_logged  INTEGER DEFAULT 0,
  joined_at     TIMESTAMP DEFAULT NOW()
);

-- 19. PARTNERS
CREATE TABLE IF NOT EXISTS partners (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization  VARCHAR(255),
  website       VARCHAR(255),
  partnership_type VARCHAR(100),
  description   TEXT,
  start_date    DATE,
  status        VARCHAR(50) DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 20. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100),
  target_id     INTEGER,
  details       JSONB,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_refugees_rid      ON refugees(rid);
CREATE INDEX IF NOT EXISTS idx_refugees_camp     ON refugees(current_camp_id);
CREATE INDEX IF NOT EXISTS idx_refugees_status   ON refugees(status);
CREATE INDEX IF NOT EXISTS idx_cases_refugee     ON cases(refugee_id);
CREATE INDEX IF NOT EXISTS idx_cases_status      ON cases(status);
CREATE INDEX IF NOT EXISTS idx_financings_type   ON financings(type);
CREATE INDEX IF NOT EXISTS idx_financings_status ON financings(status);
CREATE INDEX IF NOT EXISTS idx_messages_to       ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_from     ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject   ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status      ON users(status);
`;

async function migrate() {
  try {
    console.log('🚀 Running IRAGI v4.0 database migrations...');
    await pool.query(schema);
    console.log('✅ All tables created successfully!');
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' ORDER BY table_name
    `);
    console.log('\nTables:');
    res.rows.forEach(r => console.log('  →', r.table_name));
    pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    pool.end();
    process.exit(1);
  }
}

migrate();
