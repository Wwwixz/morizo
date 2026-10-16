package ru.morizo.backend.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.AgeGroup;
import ru.morizo.backend.entity.Achievement;
import ru.morizo.backend.entity.Checkpoint;
import ru.morizo.backend.entity.Complaint;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.entity.Team;
import ru.morizo.backend.entity.TeamMember;
import ru.morizo.backend.entity.UserAchievement;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.AchievementRepository;
import ru.morizo.backend.repo.CheckpointResultRepository;
import ru.morizo.backend.repo.ComplaintRepository;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.QuestRepository;
import ru.morizo.backend.repo.TeamMemberRepository;
import ru.morizo.backend.repo.TeamRepository;
import ru.morizo.backend.repo.UserAchievementRepository;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.service.AchievementService;
import ru.morizo.backend.service.GeoService;
import ru.morizo.backend.service.Scoring;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Тестовые данные (ТЗ «SEED — ОБЯЗАТЕЛЬНО»):
 * 10 квестов по Нижнему Новгороду (3–7 чекпоинтов), 6–10 пользователей,
 * 3–5 команд, 10–20 прохождений (часть завершена, часть брошено), 1 модератор.
 * Демо-аккаунт модератора: moderator / demo123.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final QuestRepository quests;
    private final PlaySessionRepository sessions;
    private final CheckpointResultRepository results;
    private final ComplaintRepository complaints;
    private final AchievementRepository achievements;
    private final UserAchievementRepository userAchievements;
    private final AchievementService achievementService;
    private final GeoService geo;
    private final Scoring scoring;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, TeamRepository teams, TeamMemberRepository members,
                      QuestRepository quests, PlaySessionRepository sessions,
                      CheckpointResultRepository results, ComplaintRepository complaints,
                      AchievementRepository achievements, UserAchievementRepository userAchievements,
                      AchievementService achievementService, GeoService geo, Scoring scoring,
                      PasswordEncoder encoder) {
        this.users = users;
        this.teams = teams;
        this.members = members;
        this.quests = quests;
        this.sessions = sessions;
        this.results = results;
        this.complaints = complaints;
        this.achievements = achievements;
        this.userAchievements = userAchievements;
        this.achievementService = achievementService;
        this.geo = geo;
        this.scoring = scoring;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }
        seed();
    }

    private void seed() {
        achievementService.ensureDefaults();

        // ===== Пользователи (8 игроков + модератор) =====
        UserEntity moderator = user("moderator@morizo.ru", "Модератор", UserEntity.Role.MODERATOR, "u8");
        UserEntity artem = user("artem@morizo.ru", "Артём К.", UserEntity.Role.USER, "u1");
        UserEntity kirill = user("kirill@morizo.ru", "Кирилл М.", UserEntity.Role.USER, "u2");
        UserEntity nastya = user("nastya@morizo.ru", "Настя В.", UserEntity.Role.USER, "u3");
        UserEntity lera = user("lera@morizo.ru", "Лера П.", UserEntity.Role.USER, "u4");
        UserEntity dima = user("dima@morizo.ru", "Дима С.", UserEntity.Role.USER, "u5");
        UserEntity polina = user("polina@morizo.ru", "Полина Ж.", UserEntity.Role.USER, "u6");
        UserEntity ivan = user("ivan@morizo.ru", "Иван Т.", UserEntity.Role.USER, "u7");
        artem.setAgeGroup(AgeGroup.AGE_16_17);
        nastya.setAgeGroup(AgeGroup.AGE_14_15);
        users.saveAll(List.of(moderator, artem, kirill, nastya, lera, dima, polina, ivan));

        // ===== Команды (4) =====
        Team friends = team("Друзья", "Гуляем и разгадываем вместе", "FRIEND1", artem, "u1");
        Team coders = team("Кодеры", "Ломаем шифры точек", "CODERS2", kirill, "u2");
        Team liga = team("Лига НН", "Знаем каждый двор", "LIGANN3", nastya, "u3");
        Team adventure = team("В поисках приключений", "Никогда не стоим на месте", "ADVENT4", dima, "u4");
        addMember(friends, artem, lera, polina);
        addMember(coders, kirill, ivan, dima);
        addMember(liga, nastya, polina);
        addMember(adventure, dima, lera, artem);

        // ===== Квесты (10) =====
        Quest q1 = quest(artem, "Тайны старого города",
                "Погрузитесь в историю Нижнего Новгорода, пройдите по старинным улицам и узнайте город с новой стороны. Этот квест — интеллектуальное приключение, где каждая точка хранит свою тайну: находите подсказки, разгадывайте загадки и открывайте места, мимо которых вы проходили сотни раз.",
                "Нижегородский район", 2, 90, "/img/quest-street.jpg", Quest.TransportMode.FOOT,
                "Маршрут по центру: переходите дорогу только по переходам, будьте внимательны на лестницах.",
                word("Кремль", 56.3314, 44.0067, "Найдите старую башню и введите надпись на мемориальной табличке.", "дмитриевская", "Обратите внимание на надписи на стене."),
                word("Чкаловская лестница", 56.3299, 44.0137, "Сосчитайте количество пролётов лестницы и введите число.", "2", "Лестница состоит из двух огромных спиралей."),
                word("Ивановская башня", 56.3286, 44.0030, "Найдите год постройки башни на информационной табличке.", "1552", "Год указан рядом с описанием башни."),
                word("Большая Покровская", 56.3247, 44.0094, "Найдите бронзовую скульптуру и введите имя героя.", "щепс", "Ищите скульптуру кота у театра."),
                word("Стрелка Волги и Оки", 56.3235, 44.0253, "Введите название собора, который виден со стрелки.", "александра невского", "Собор назван в честь известного русского князя."));
        publish(q1, 40);

        Quest q2 = quest(kirill, "Легенды Кремля",
                "Пройдите по всем башням Кремля и узнайте их легенды: от подземных ходов до часовой ветряной мельницы. Исторический квест для тех, кто хочет узнать город изнутри и проверить свою наблюдательность.",
                "Нижегородский район", 2, 120, "/img/gallery-1.jpg", Quest.TransportMode.FOOT,
                "Кремль — охраняемая территория: не заходите за ограждения, не залезайте на стены.",
                word("Дмитриевская башня", 56.3314, 44.0067, "Найдите барельеф князя и введите его имя.", "дмитрий", "Барельеф находится над аркой входа."),
                choice("Часовая башня", 56.3324, 44.0042, "Во сколько бьют часы? Выберите время цифрами.", "12",
                        List.of("6", "9", "12", "15"), "Легенда о ветряной мельнице подскажет."),
                word("Зачатьевская башня", 56.3295, 44.0018, "Введите название разрушенной и заново построенной башни.", "зачатьевская", "Она находится у нижнего яруса Кремля."),
                word("Памятник Минину", 56.3305, 44.0098, "Введите имя героя, в честь которого названа площадь.", "минин", "Внимательно посмотрите на название площади."));
        publish(q2, 35);

        Quest q3 = quest(nastya, "Вдоль по Волге",
                "Прогулочный квест вдоль набережной: Чкаловская лестница, Стрелка, канатная дорога и лучшие виды на Волгу. Идеально для первого знакомства с городом и спокойной прогулки большой компанией.",
                "Нижегородский район", 1, 150, "/img/quest-volga.jpg", Quest.TransportMode.FOOT,
                "На набережной бывает ветрено; не подходите к краю воды.",
                word("Верхняя набережная", 56.3299, 44.0137, "Введите количество ступеней Чкаловской лестницы (округлите до сотен).", "500", "Ступеней почти полтысячи."),
                word("Стрелка", 56.3235, 44.0253, "Введите название стадиона на стрелке.", "стадион", "Здесь проходил чемпионат мира по футболу."),
                choice("Канатная дорога", 56.3210, 44.0110, "Сколько станций у нижегородской канатной дороги через Оку? Выберите вариант.", "2",
                        List.of("1", "2", "3", "4"), "Дорога соединяет два берега Оки."),
                word("Парк Победы", 56.3180, 44.0180, "Найдите танк у входа и введите номер на борту.", "газ", "Нижегородский автозавод."));
        publish(q3, 30);

        Quest q4 = quest(lera, "Загадки улиц",
                "Пеший маршрут по Большой Покровской и прилегающим улочкам: скульптуры, дворы-колодцы и вывески прошлого. Разгадывайте загадки и собирайте баллы вместе с командой.",
                "Нижегородский район", 3, 110, "/img/quest-street.jpg", Quest.TransportMode.FOOT, null,
                word("Покровка", 56.3247, 44.0094, "Найдите скульптуру фотографа и введите его профессию.", "фотограф", "Он стоит прямо на пешеходной улице."),
                choice("Театральная площадь", 56.3262, 44.0072, "Сколько театров на Театральной площади? Выберите число.", "2",
                        List.of("1", "2", "3", "4"), "Драмтеатр и театр кукол."),
                word("Двор-колодец", 56.3258, 44.0062, "Сосчитайте этажи дома во дворе-колодце и введите число.", "5", "Ищите арку с вывеской."),
                word("Домик Карабаса", 56.3240, 44.0101, "Введите имя персонажа на табличке у входа.", "карабас", "Он держит ключи от всех дверей."),
                word("Улица Большая", 56.3233, 44.0113, "Найдите год основания города на здании администрации.", "1221", "Город старше Москвы."));
        publish(q4, 28);

        Quest q5 = quest(polina, "Сказочный маршрут",
                "Семейный квест по местам сказок Нижнего: от парка «Швейцария» до Городка аттракционов. Собирайте сказочные подсказки и зарабатывайте достижения вместе с младшими друзьями.",
                "Советский район", 1, 70, "/img/quest-skaz.jpg", Quest.TransportMode.PUBLIC_TRANSPORT,
                "Только в светлое время суток, проходить с родителями.",
                word("Парк «Швейцария»", 56.3152, 44.0165, "Найдите сказочную скульптуру и введите её героя.", "айболит", "Добрый доктор из известной сказки."),
                choice("Городок аттракционов", 56.3140, 44.0152, "Какое животное встречает у входа в парк? Выберите вариант.", "слон",
                        List.of("лев", "слон", "медведь", "жираф"), "Он весит слона... то есть много."),
                word("Детская железная дорога", 56.3125, 44.0140, "Введите название станции на табличке.", "имени чайкина", "Носит имя героя-лётчика."));
        publish(q5, 25);

        Quest q6 = quest(dima, "Квест по Сормову",
                "Индустриальное прошлое и зелёное настоящее Сормовского района: завод, парк и старые улочки. Узнайте, чем жил рабочий город и как он стал частью Нижнего.",
                "Сормовский район", 3, 130, "/img/quest-ivan.jpg", Quest.TransportMode.CAR,
                "Двигайтесь пешком по тротуарам, переходите пути только по переходам.",
                word("Сормовский парк", 56.3305, 43.8560, "Введите год открытия парка у центральной арки.", "1904", "Парк старше века."),
                choice("Заводское кольцо", 56.3260, 43.8620, "Что выпускал завод «Красное Сормово» в военные годы? Выберите вариант.", "танки",
                        List.of("самолёты", "танки", "корабли только", "велосипеды"), "Знаменитая модель Т-34."),
                word("Пляж Оки", 56.3350, 43.8720, "Введите название острова напротив пляжа.", "подновье", "Туда ходит паром."));
        publish(q6, 22);

        Quest q7 = quest(ivan, "Автозаводские истории",
                "Прогулка по району ГАЗа: соцгородок, дворцы культуры и дома-палубы. Маршрут для тех, кто хочет понять, как строился Автозавод.",
                "Автозаводский район", 4, 140, "/img/quest-cathedral.jpg", Quest.TransportMode.PUBLIC_TRANSPORT,
                "Используйте наземный транспорт и метро, не выходите на проезжую часть.",
                word("Дворец культуры ГАЗа", 56.2610, 43.8260, "Введите год открытия Дворца культуры.", "1932", "Год постройки ищите на фасаде."),
                word("Дом-палуба", 56.2555, 43.8320, "Сосчитайте подъезды дома-корабля и введите число.", "6", "Длинный дом — как палуба."),
                word("Площадь Ленина", 56.2590, 43.8345, "Введите фамилию на гранитной стеле площади.", "ленин", "Главный памятник района."));
        // q7 остаётся на модерации (в quest() по умолчанию PUBLISHED)
        q7.setStatus(Quest.Status.ON_MODERATION);

        Quest q8 = quest(artem, "Высотки и виды",
                "Квест по самым высоким точкам города: смотровые площадки, канатка и панорамы Стрелки. Не забудьте фотоаппарат — виды открываются невероятные!",
                "Нижегородский район", 3, 140, "/img/quest-cathedral.jpg", Quest.TransportMode.FOOT,
                "Смотровые площадки имеют ограждения — не перелезайте через них.",
                word("Смотровая у Кремля", 56.3310, 44.0050, "Сколько рек видно со смотровой? Введите число.", "2", "Волга и её приток."),
                word("Федоровского", 56.3320, 44.0140, "Введите название элеватора, видимого с улицы.", "окский", "Огромное здание на противоположном берегу."),
                word("Панорама Стрелки", 56.3235, 44.0253, "Сосчитайте количество башен стадиона и введите число.", "8", "Стадион к ЧМ-2018."));
        q8.setStatus(Quest.Status.ON_MODERATION);

        Quest q9 = quest(kirill, "Легенды Стрелки",
                "Исторический квест в районе слияния Оки и Волги: от памятника петровским времён до современного стадиона. Пройдите путь от купеческой Стрелки до футбольной.",
                "Канавинский район", 2, 100, "/img/quest-zagadka.jpg", Quest.TransportMode.FOOT, null,
                word("Петровский парк", 56.3200, 44.0180, "В честь какого царя назван парк? Введите имя.", "пётр", "Первый император России."),
                word("Собор Александра Невского", 56.3228, 44.0225, "Введите год окончания строительства собора.", "1880", " XIX век."),
                word("Стадион", 56.3232, 44.0245, "Введите название реки, на берегу которой стоит стадион.", "волга", "Главная река региона."));
        q9.setStatus(Quest.Status.ON_MODERATION);

        Quest q10 = quest(nastya, "Тропа канатчиков",
                "Утоптанный маршрут вдоль Оки: паромные переправы, яхт-клубы и закаты над Канавино. Спокойный вечерний маршрут для компании.",
                "Канавинский район", 2, 120, "/img/quest-stairs.jpg", Quest.TransportMode.DIRT_ROADS,
                "Тропа идёт по грунтовке — в дождь обувь не жалеть, после заката не гулять.",
                word("Яхт-клуб", 56.3215, 44.0080, "Введите количество причалов, видимых с пирса.", "5", "Считайте белые мостики."),
                word("Паромная переправа", 56.3200, 44.0120, "Введите название конечной остановки парома.", "подновье", "Остров на другом берегу."),
                choice("Набережная Оки", 56.3190, 44.0150, "Какая лодочная станция ближе к переправе? Выберите вариант.", "гребной канал",
                        List.of("гребной канал", "верхневолжская", "озеро", "ленинский слобода"), "Там тренируются гребцы."));

        quests.saveAll(List.of(q1, q2, q3, q4, q5, q6, q7, q8, q9, q10));

        // ===== Прохождения (15: 9 завершено, 3 брошено, 3 в процессе) =====
        completed(friends, q1, artem, 3, 20);   // 20 дней назад
        completed(friends, q2, artem, 14, 20);
        completed(coders, q1, kirill, 12, 20);
        completed(coders, q4, kirill, 9, 20);
        completed(liga, q3, nastya, 8, 20);
        completed(friends, q4, lera, 6, 20);
        completed(adventure, q2, dima, 5, 20);
        completed(coders, q3, ivan, 4, 20);
        completed(liga, q5, nastya, 2, 20);     // недавние — попадут в «за неделю»
        abandoned(artem, q6, 1, 7);
        abandoned(dima, q4, 2, 5);
        abandoned(polina, q1, 0, 3);
        active(lera, q5);
        active(ivan, q4);
        active(polina, q2);

        // ===== Жалобы (2) =====
        complaint(lera, q1, "Точка недоступна, ворота закрыты на ремонт");
        complaint(kirill, q4, "Ошибка в ответе на 3-й точке");

        // ===== Достижения игрокам =====
        award(artem, AchievementService.FIRST_STEPS);
        award(artem, AchievementService.SPRINTER);
        award(artem, AchievementService.EXPLORER);
        award(kirill, AchievementService.FIRST_STEPS);
        award(kirill, AchievementService.NO_HINTS);
        award(nastya, AchievementService.FIRST_STEPS);
        award(dima, AchievementService.FIRST_STEPS);
    }

    // ============ helpers ============

    private UserEntity user(String email, String nickname, UserEntity.Role role, String avatar) {
        UserEntity u = new UserEntity();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode("demo123"));
        u.setNickname(nickname);
        u.setRole(role);
        u.setAgeGroup(AgeGroup.AGE_16_17);
        u.setAvatar("/img/avatars/" + avatar + ".jpg");
        u.setCreatedAt(Instant.now().minus(60, ChronoUnit.DAYS));
        return users.save(u);
    }

    private Team team(String name, String description, String code, UserEntity creator, String avatar) {
        Team t = new Team();
        t.setName(name);
        t.setDescription(description);
        t.setInviteCode(code);
        t.setCreator(creator);
        t.setAvatar("/img/avatars/" + avatar + ".jpg");
        t.setCreatedAt(Instant.now().minus(50, ChronoUnit.DAYS));
        teams.save(t);
        return t;
    }

    private void addMember(Team team, UserEntity... list) {
        for (UserEntity u : list) {
            if (!members.isMember(team, u)) {
                TeamMember m = new TeamMember();
                m.setTeam(team);
                m.setUser(u);
                members.save(m);
            }
        }
    }

    private Quest quest(UserEntity author, String title, String description, String district,
                        int difficulty, int durationMin, String image, Quest.TransportMode transport,
                        String rules, CheckpointCreator... points) {
        Quest q = new Quest();
        q.setAuthor(author);
        q.setTitle(title);
        q.setDescription(description);
        q.setDistrict(district);
        q.setDifficulty(difficulty);
        q.setDurationMin(durationMin);
        q.setImage(image);
        q.setTransportMode(transport);
        q.setRules(rules);
        q.setStatus(Quest.Status.PUBLISHED);
        q.setCreatedAt(Instant.now().minus(45, ChronoUnit.DAYS));
        for (CheckpointCreator c : points) {
            q.addCheckpoint(c.create());
        }
        q.setDistanceKm(geo.routeLengthKm(q.orderedCheckpoints()));
        return q;
    }

    private interface CheckpointCreator {
        Checkpoint create();
    }

    private CheckpointCreator word(String title, double lat, double lng, String task, String answer, String hint) {
        return () -> {
            Checkpoint c = base(title, lat, lng, task, Checkpoint.TaskType.WORD, answer, hint);
            c.setPointRules("Соблюдайте правила территории и будьте аккуратны.");
            return c;
        };
    }

    private CheckpointCreator choice(String title, double lat, double lng, String task, String answer,
                                     List<String> options, String hint) {
        return () -> {
            Checkpoint c = base(title, lat, lng, task, Checkpoint.TaskType.CHOICE, answer, hint);
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < options.size(); i++) {
                if (i > 0) json.append(',');
                json.append('"').append(options.get(i).replace("\"", "\\\"")).append('"');
            }
            json.append(']');
            c.setOptionsJson(json.toString());
            c.setPointRules("Соблюдайте правила территории и будьте аккуратны.");
            return c;
        };
    }

    private Checkpoint base(String title, double lat, double lng, String task,
                            Checkpoint.TaskType type, String answer, String hint) {
        Checkpoint c = new Checkpoint();
        c.setTitle(title);
        c.setLat(lat);
        c.setLng(lng);
        c.setTask(task);
        c.setType(type);
        c.setAnswer(answer);
        c.setHint(hint);
        return c;
    }

    private void publish(Quest q, int daysAgo) {
        q.setStatus(Quest.Status.PUBLISHED);
        q.setPublishedAt(Instant.now().minus(daysAgo, ChronoUnit.DAYS));
    }

    private void completed(Team team, Quest q, UserEntity starter, int daysAgo, int minutes) {
        PlaySession s = new PlaySession();
        s.setQuest(q);
        s.setTeam(team);
        s.setUser(starter);
        s.setStatus(PlaySession.Status.COMPLETED);
        s.setStartedAt(Instant.now().minus(daysAgo, ChronoUnit.DAYS));
        s.setFinishedAt(s.getStartedAt().plus(minutes, ChronoUnit.MINUTES));
        s.setCountedForRating(true);
        int total = q.getCheckpoints().size();
        s.setCompletedCount(total);
        s.setCurrentPosition(total);
        s.setScore(scoring.questCompletionScore(total, q.getDifficulty(),
                minutes < q.getDurationMin() / 2, q.getTransportMode().getScoreMultiplier()));
        sessions.save(s);
        for (Checkpoint c : q.orderedCheckpoints()) {
            var r = new ru.morizo.backend.entity.CheckpointResult();
            r.setSession(s);
            r.setCheckpoint(c);
            r.setCorrect(true);
            r.setCompletedAt(s.getFinishedAt());
            results.save(r);
        }
    }

    private void abandoned(UserEntity u, Quest q, int donePoints, int daysAgo) {
        PlaySession s = new PlaySession();
        s.setQuest(q);
        s.setUser(u);
        s.setStatus(PlaySession.Status.ABANDONED);
        s.setStartedAt(Instant.now().minus(daysAgo, ChronoUnit.DAYS));
        s.setFinishedAt(s.getStartedAt().plus(25, ChronoUnit.MINUTES));
        s.setCountedForRating(true);
        s.setCompletedCount(donePoints);
        s.setCurrentPosition(donePoints);
        sessions.save(s);
        List<Checkpoint> ordered = q.orderedCheckpoints();
        for (int i = 0; i < Math.min(donePoints, ordered.size()); i++) {
            var r = new ru.morizo.backend.entity.CheckpointResult();
            r.setSession(s);
            r.setCheckpoint(ordered.get(i));
            r.setCorrect(true);
            r.setCompletedAt(s.getFinishedAt());
            results.save(r);
        }
    }

    private void active(UserEntity u, Quest q) {
        PlaySession s = new PlaySession();
        s.setQuest(q);
        s.setUser(u);
        s.setStatus(PlaySession.Status.IN_PROGRESS);
        s.setStartedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        s.setCountedForRating(true);
        sessions.save(s);
    }

    private void complaint(UserEntity author, Quest q, String reason) {
        Complaint c = new Complaint();
        c.setQuest(q);
        c.setAuthor(author);
        c.setReason(reason);
        c.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        complaints.save(c);
    }

    private void award(UserEntity u, String code) {
        Achievement a = achievements.findByCode(code).orElse(null);
        if (a == null || userAchievements.existsByUserIdAndAchievementCode(u.getId(), code)) {
            return;
        }
        UserAchievement ua = new UserAchievement();
        ua.setUser(u);
        ua.setAchievement(a);
        userAchievements.save(ua);
    }
}
