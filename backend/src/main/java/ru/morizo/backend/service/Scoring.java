package ru.morizo.backend.service;

import org.springframework.stereotype.Component;

/** Правила начисления очков (ТЗ 3.5) и античит-лайт лимиты. */
@Component
public class Scoring {

    /** очки за каждый пройденный чекпоинт */
    public static final int PER_CHECKPOINT = 10;

    /** бонус за завершение квеста */
    public static final int COMPLETION_BONUS = 30;

    /** множитель бонуса за сложность: difficulty * DIFFICULTY_BONUS */
    public static final int DIFFICULTY_BONUS = 10;

    /** бонус за скорость: если пройден быстрее половины заявленного времени */
    public static final int SPEED_BONUS = 20;

    /** античит: квест засчитывается в рейтинг не чаще 1 раза в этот период (часы) */
    public static final int ANTI_CHEAT_COOLDOWN_HOURS = 24;

    /** античит-лайт: максимум неверных попыток на чекпоинт */
    public static final int MAX_ATTEMPTS = 10;

    /** античит-лайт: пауза после неверной попытки, сек */
    public static final int RETRY_DELAY_SECONDS = 3;

    /** сколько очков = 1 уровень профиля */
    public static final int XP_PER_LEVEL = 300;

    /** итоговые очки за завершённый квест */
    public int questCompletionScore(int checkpointsDone, int difficulty, boolean fastEnough, double transportMultiplier) {
        int base = checkpointsDone * PER_CHECKPOINT
                + COMPLETION_BONUS
                + difficulty * DIFFICULTY_BONUS
                + (fastEnough ? SPEED_BONUS : 0);
        return (int) Math.round(base * transportMultiplier);
    }
}
