package ru.morizo.backend.service;

import org.springframework.stereotype.Service;
import ru.morizo.backend.entity.Checkpoint;

import java.util.List;

/**
 * Гео-вычисления (ТЗ: «поиск квестов рядом — PostGIS или расчёт расстояния в коде»).
 * Расстояние считается в коде по формуле гаверсинусов.
 */
@Service
public class GeoService {

    private static final double EARTH_RADIUS_KM = 6371.0088;

    /** Расстояние между двумя точками, км. */
    public double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1.0, Math.sqrt(a)));
    }

    /** Расстояние от точки до ближайшего чекпоинта квеста, км. */
    public double distanceToQuestKm(double lat, double lng, List<Checkpoint> points) {
        if (points.isEmpty()) {
            return Double.MAX_VALUE;
        }
        return points.stream()
                .mapToDouble(p -> distanceKm(lat, lng, p.getLat(), p.getLng()))
                .min().orElse(Double.MAX_VALUE);
    }

    /** Длина маршрута по чекпоинтам (сумма соседних отрезков), км. */
    public double routeLengthKm(List<Checkpoint> points) {
        double sum = 0;
        for (int i = 1; i < points.size(); i++) {
            Checkpoint a = points.get(i - 1);
            Checkpoint b = points.get(i);
            sum += distanceKm(a.getLat(), a.getLng(), b.getLat(), b.getLng());
        }
        return Math.round(sum * 10) / 10.0;
    }
}
