require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Seeding IRAGI v4.0 database...');
    const hash = await bcrypt.hash('iragi2025', 10);

    // 1. Camps (DRC locations)
    await pool.query(`
      INSERT INTO camps (name, region, territory, country, latitude, longitude, capacity, current_occupancy, description)
      VALUES
        ('Camp Mugunga',   'Nord-Kivu',  'Goma',    'République Démocratique du Congo', -1.5833, 29.1167, 45000, 38000, 'Camp principal près de Goma'),
        ('Camp Kanyaruchinya','Nord-Kivu','Goma',   'République Démocratique du Congo', -1.6167, 29.1500, 25000, 22000, 'Camp secondaire Nord-Kivu'),
        ('Camp Bulengo',   'Nord-Kivu',  'Goma',    'République Démocratique du Congo', -1.5500, 29.0833, 30000, 27000, 'Camp Bulengo Goma'),
        ('Camp Nyarugusu', 'Katanga',    'Kalemie', 'République Démocratique du Congo', -5.9333, 29.1833, 15000, 13500, 'Camp du Katanga'),
        ('Centre Uvira',   'Sud-Kivu',   'Uvira',   'République Démocratique du Congo', -3.3833, 29.1333, 12000, 10000, 'Centre d''accueil Uvira')
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Camps DRC seeded');

    // 2. Admin user (active)
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_active, email_verified, status, phone, country)
      VALUES ('Alice Iragi Bunani', 'alicebunani5@gmail.com', $1, 'admin', true, true, 'approved', '+250791431851', 'Rwanda')
      ON CONFLICT (email) DO UPDATE SET password_hash=$1, is_active=true, status='approved', role='admin'
    `, [hash]);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_active, email_verified, status)
      VALUES
        ('Admin IRAGI',    'admin@iragi.org',      $1, 'admin',     true, true, 'approved'),
        ('Jean Mutombo',   'volunteer@iragi.org',  $1, 'volunteer', true, true, 'approved'),
        ('Dr Marie Kabu',  'donor@iragi.org',      $1, 'donor',     true, true, 'approved'),
        ('UNHCR Partner',  'partner@iragi.org',    $1, 'partner',   true, true, 'approved'),
        ('Amina Refugee',  'refugee@iragi.org',    $1, 'refugee',   true, true, 'approved')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);
    console.log('  ✅ Users seeded');

    // 3. Refugees
    const refsResult = await pool.query(`
      INSERT INTO refugees (rid, first_name, last_name, date_of_birth, gender, nationality, origin_province, origin_territory, current_camp_id, status, flags, education_level, arrival_date)
      VALUES
        ('IRAGI-2025-00001','Amina',   'Kabila',    '1990-03-12','female','Congolaise','Nord-Kivu', 'Goma',    1,'verified',   '{}',                     'primaire',    '2024-01-15'),
        ('IRAGI-2025-00002','Hassan',  'Mwangi',    '1985-07-22','male',  'Congolaise','Sud-Kivu',  'Uvira',   1,'registered', '{medical_need}',          'secondaire',  '2024-02-20'),
        ('IRAGI-2025-00003','Fatima',  'Okonkwo',   '2012-11-05','female','Congolaise','Nord-Kivu', 'Rutshuru',2,'under_review','{unaccompanied_minor}',  'primaire',    '2024-03-01'),
        ('IRAGI-2025-00004','Ibrahim', 'Diallo',    '1978-05-18','male',  'Congolaise','Ituri',     'Bunia',   1,'registered', '{}',                     'universite',  '2024-04-10'),
        ('IRAGI-2025-00005','Grace',   'Mutoni',    '1995-09-30','female','Congolaise','Sud-Kivu',  'Bukavu',  3,'verified',   '{survivor_of_violence}', 'secondaire',  '2024-05-05'),
        ('IRAGI-2025-00006','Espoir',  'Kalinda',   '2008-02-14','male',  'Congolaise','Nord-Kivu', 'Beni',    1,'registered', '{}',                     'primaire',    '2024-06-12'),
        ('IRAGI-2025-00007','Marie',   'Bisimwa',   '2001-08-20','female','Congolaise','Nord-Kivu', 'Goma',    2,'verified',   '{medical_need}',          'secondaire',  '2024-07-03'),
        ('IRAGI-2025-00008','Joseph',  'Kabongo',   '1970-12-01','male',  'Congolaise','Katanga',   'Kalemie', 4,'registered', '{}',                     'primaire',    '2024-08-19')
      ON CONFLICT (rid) DO NOTHING
      RETURNING id
    `);
    console.log('  ✅ Refugees seeded');

    const refIds = refsResult.rows.map(r => r.id);

    // 4. Courses
    await pool.query(`
      INSERT INTO courses (title, description, subject, level, target_age_min, target_age_max, language, is_published, duration_hours)
      VALUES
        ('Apprendre à Lire — Niveau 1',       'Cours de lecture pour débutants',          'literacy',     'beginner',     5,  10, 'fr', true,  20),
        ('Mathématiques de Base',              'Addition, soustraction, multiplication',    'mathematics',  'beginner',     6,  12, 'fr', true,  30),
        ('Français — Conversation',            'Apprendre le français oral et écrit',       'language',     'intermediate', 8,  16, 'fr', true,  40),
        ('Kiswahili pour Débutants',           'Bases du swahili pour les enfants',         'language',     'beginner',     6,  14, 'sw', true,  25),
        ('Compétences Numériques',             'Introduction à l''informatique et internet','digital',      'beginner',     10, 18, 'fr', true,  15),
        ('Sciences de la Nature',              'Biologie, environnement et santé',          'science',      'intermediate', 9,  15, 'fr', false, 20),
        ('Compétences de Vie',                 'Hygiène, nutrition, droits des enfants',    'life_skills',  'all',          5,  18, 'fr', true,  10)
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Courses seeded');

    // 5. Stories
    await pool.query(`
      INSERT INTO stories (title, content, author_name, author_age, origin, category, is_anonymous, is_published, language, media_type)
      VALUES
        ('Mon chemin vers l''école',
         'Je m''appelle Fatima. J''ai dû fuir ma maison à Rutshuru à l''âge de 9 ans. Pendant deux ans, je n''avais pas accès à l''école. Grâce à IRAGI, j''ai appris à lire et écrire. Aujourd''hui, je rêve de devenir médecin pour soigner les enfants de mon village.',
         'Fatima O.', 13, 'Rutshuru, Nord-Kivu', 'education', false, true, 'fr', 'none'),
        ('Je ne suis plus invisible',
         'On m''a écoutée pour la première fois depuis que j''ai fui Bukavu. Les équipes d''IRAGI ont documenté mon histoire, ont reconnu ma douleur. Je ne suis plus un numéro. Je suis une personne avec une histoire, des rêves, et un avenir.',
         'Marie B.', 24, 'Bukavu, Sud-Kivu', 'women', false, true, 'fr', 'none'),
        ('La technologie m''a donné un futur',
         'Dans le camp, on nous avait dit que nous n''avions pas d''avenir. Mais le cours d''informatique d''IRAGI m''a montré le contraire. J''ai appris à utiliser un ordinateur, internet, et maintenant je veux étudier l''ingénierie.',
         'Espoir K.', 17, 'Beni, Nord-Kivu', 'youth', false, true, 'fr', 'none'),
        ('Construire ensemble une communauté',
         'Nous sommes venus de différents villages du Kivu, chassés par la violence. Dans le camp, IRAGI nous a aidés à nous retrouver, à reconstruire des liens. Aujourd''hui, nous organisons des activités ensemble. L''espoir renaît.',
         'Témoignage collectif', NULL, 'Nord-Kivu, DRC', 'community', false, true, 'fr', 'none'),
        ('Mwangu safari ya elimu',
         'Nilianza masomo katika kambi baada ya miaka miwili bila shule. IRAGI ilituwezesha kupata elimu bora. Sasa nasoma vizuri na nataka kuwa mwalimu.',
         'Hassan M.', 15, 'Uvira, Kivu Kusini', 'education', false, true, 'sw', 'none')
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Stories seeded');

    // 6. Financings
    await pool.query(`
      INSERT INTO financings (type, title, description, amount, currency, donor_name, donor_country, purpose, program, status, receipt_date)
      VALUES
        ('grant',       'Subvention UNICEF 2025',      'Financement pour l''éducation des enfants réfugiés',  25000, 'EUR', 'UNICEF',        'France',    'Éducation primaire dans les camps',     'education',  'received',  '2025-01-15'),
        ('donation',    'Don Fondation Ubuntu',        'Don annuel de la Fondation Ubuntu',                    8500, 'EUR', 'Fondation Ubuntu','Belgique', 'Soutien aux femmes déplacées',          'women',      'allocated', '2025-02-20'),
        ('donation',    'Collecte diaspora congolaise','Collecte organisée par la diaspora',                   3200, 'EUR', 'Diaspora DRC',  'Belgique',  'Matériaux pédagogiques',                'education',  'received',  '2025-03-01'),
        ('partnership', 'Partenariat UNHCR',           'Ressources logistiques et formations',                12000, 'EUR', 'UNHCR',         'Suisse',    'Coordination humanitaire générale',     'general',    'received',  '2025-01-01'),
        ('fundraising', 'Campagne GoFundMe',           'Campagne en ligne pour les cours digitaux',            1800, 'EUR', 'Communauté web','International','Cours numériques pour les jeunes',   'education',  'received',  '2025-03-10')
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Financings seeded');

    // 7. Cases
    await pool.query(`
      INSERT INTO cases (refugee_id, case_type, priority, status, title, description, due_date)
      SELECT id, 'medical', 'high', 'open', 'Suivi médical urgent', 'Besoin de soins médicaux réguliers', CURRENT_DATE + 7
      FROM refugees WHERE rid='IRAGI-2025-00002' LIMIT 1
      ON CONFLICT DO NOTHING
    `);
    await pool.query(`
      INSERT INTO cases (refugee_id, case_type, priority, status, title, description, due_date)
      SELECT id, 'psychosocial', 'critical', 'in_progress', 'Support psychosocial', 'Trauma sévère - suivi hebdomadaire requis', CURRENT_DATE + 3
      FROM refugees WHERE rid='IRAGI-2025-00005' LIMIT 1
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Cases seeded');

    // 8. Homepage content defaults
    await pool.query(`
      INSERT INTO homepage_content (section, key, value_fr, value_en, value_sw) VALUES
        ('hero', 'tag',      'Afrique de l''Est · Enfants & Femmes Réfugiés',  'East Africa · Refugee Children & Women',  'Afrika Mashariki · Watoto na Wanawake Wakimbizi'),
        ('hero', 'title1',   'Ensemble,',                                       'Together,',                               'Pamoja,'),
        ('hero', 'title2',   'nous bâtissons l''espoir.',                       'we build hope.',                          'tunajenga tumaini.'),
        ('hero', 'subtitle', 'IRAGI éduque les enfants réfugiés, soutient les femmes déplacées et documente des vies réelles avec dignité et espoir.', 'IRAGI educates refugee children, supports displaced women and documents real lives with dignity and hope.', 'IRAGI inasomesha watoto wakimbizi, inasaidia wanawake na kuandika maisha ya kweli kwa heshima na tumaini.'),
        ('mission', 'title1', 'Notre mission', 'Our Mission', 'Dhamira Yetu'),
        ('mission', 'title2', 'Dignité avant tout.', 'Dignity above all.', 'Heshima zaidi ya yote.'),
        ('mission', 'text1',  'IRAGI lutte pour que chaque enfant réfugié de la République Démocratique du Congo accède à une éducation de qualité, que chaque femme déplacée soit entendue et soutenue, et que chaque communauté retrouve sa dignité.', 'IRAGI fights for every Congolese refugee child to access quality education, every displaced woman to be heard and supported, and every community to regain its dignity.', 'IRAGI inafanya kazi kwa kila mtoto mkimbizi wa DRC apate elimu bora, kila mwanamke aliyehamishwa asikiwe na kusaidiwa.'),
        ('mission', 'text2',  'Nous croyons que le financement suit la preuve d''impact. C''est pourquoi nous documentons tout, nous embauchons localement, et nous plaçons toujours la dignité avant la charité.', 'We believe funding follows proof of impact. That is why we document everything, hire locally, and always place dignity before charity.', 'Tunaamini ufadhili unafuata uthibitisho wa athari. Ndiyo maana tunaandika kila kitu na kuweka heshima kwanza.')
      ON CONFLICT (section, key) DO NOTHING
    `);
    console.log('  ✅ Homepage content seeded');

    // 9. Distributions
    if (refIds.length > 0) {
      await pool.query(`
        INSERT INTO distributions (refugee_id, camp_id, item_type, item_name, quantity, unit, distribution_date)
        VALUES ($1, 1, 'food', 'Riz', 5, 'kg', CURRENT_DATE - 1),
               ($1, 1, 'hygiene', 'Kit hygiène', 1, 'kit', CURRENT_DATE - 1)
        ON CONFLICT DO NOTHING
      `, [refIds[0]]);
    }
    console.log('  ✅ Distributions seeded');

    console.log('\n✅ IRAGI v4.0 database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin principal: alicebunani5@gmail.com / iragi2025');
    console.log('   Admin IRAGI:     admin@iragi.org / iragi2025');
    console.log('   Volontaire:      volunteer@iragi.org / iragi2025');
    console.log('   Donateur:        donor@iragi.org / iragi2025');
    console.log('   Partenaire:      partner@iragi.org / iragi2025');
    console.log('   Réfugié:         refugee@iragi.org / iragi2025');

    pool.end();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    pool.end();
    process.exit(1);
  }
}

seed();
